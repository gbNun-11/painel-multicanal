import "server-only";

import { createDistributionExcelReport } from "./create-distribution-excel-report";
import {
  createDistributionEmailHtml,
  createDistributionEmailText,
} from "./distribution-email-template";
import { getSmtpConfig } from "./config";
import { runControlledSmtpSend } from "./smtp-delivery-queue";
import { createEmailTransporter } from "./transporter";
import type { SendDistributionEmailInput } from "./types";

export interface DistributionCopyRecipient {
  name: string;
  email: string;
}

/**
 * O SMTP aceitou pelo menos parte dos destinatários.
 * Não reenviar automaticamente: isso duplicaria a entrega para quem recebeu.
 */
export class DistributionPartialDeliveryError extends Error {
  constructor(
    message: string,
    public readonly messageId: string,
    public readonly accepted: string[],
    public readonly rejected: string[],
  ) {
    super(message);
    this.name = "DistributionPartialDeliveryError";
  }
}

const sanitizeFilename = (value: string) => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
};

const createReportFilename = (enterpriseName: string) => {
  const enterprise = sanitizeFilename(enterpriseName);

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll("/", "-");

  return `clientes-distribuidos-${enterprise}-${date}.xlsx`;
};

const normalizedEmail = (email: string) => email.trim().toLowerCase();

export const sendDistributionEmail = async (
  input: SendDistributionEmailInput,
  additionalCopies: DistributionCopyRecipient[] = [],
) => {
  if (input.clients.length === 0) {
    throw new Error("Nenhum cliente informado para envio por e-mail.");
  }

  const recipientEmail = normalizedEmail(input.recipient.email);
  if (!recipientEmail) {
    throw new Error("O usuário comercial não possui e-mail cadastrado.");
  }

  const senderEmail = normalizedEmail(input.sender.email);
  if (!senderEmail) {
    throw new Error(
      "O usuário responsável pela distribuição não possui e-mail cadastrado.",
    );
  }

  const smtpConfig = getSmtpConfig(input.smtpAccount);
  const subject = `Novos clientes distribuídos - ${input.enterpriseName}`;
  const excelBuffer = await createDistributionExcelReport(input);
  const reportFilename = createReportFilename(input.enterpriseName);

  const copies = new Map<string, DistributionCopyRecipient>();
  for (const person of [input.sender, ...additionalCopies]) {
    const email = normalizedEmail(person.email);
    if (!email || email === recipientEmail || copies.has(email)) continue;
    copies.set(email, { name: person.name, email });
  }

  const cc = [...copies.values()].map((person) => ({
    name: person.name,
    address: person.email,
  }));

  const { result: info, attempts } = await runControlledSmtpSend(async () => {
    const transporter = createEmailTransporter(input.smtpAccount);
    return transporter.sendMail({
      from: {
        name: input.sender.name,
        address: smtpConfig.auth.user,
      },
      replyTo: {
        name: input.sender.name,
        address: senderEmail,
      },
      to: {
        name: input.recipient.name,
        address: recipientEmail,
      },
      ...(cc.length ? { cc } : {}),
      subject,
      text: createDistributionEmailText(input),
      html: createDistributionEmailHtml(input),
      attachments: [
        {
          filename: reportFilename,
          content: excelBuffer,
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ],
    });
  }, "E-mail de distribuição");

  const accepted = (info.accepted ?? []).map(normalizedEmail);
  const rejected = (info.rejected ?? []).map(normalizedEmail);
  const expected = [recipientEmail, ...copies.keys()];
  const missing = expected.filter((email) => !accepted.includes(email));

  if (missing.length > 0 || rejected.length > 0) {
    throw new DistributionPartialDeliveryError(
      `O SMTP aceitou ${accepted.length} de ${expected.length} destinatário(s); ` +
        `${missing.length} destinatário(s) requer(em) conferência. Não reenviar automaticamente.`,
      info.messageId,
      accepted,
      rejected,
    );
  }

  return {
    messageId: info.messageId,
    accepted,
    rejected,
    attempts,
    reportFilename,
  };
};
