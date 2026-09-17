import "server-only";

import { createDistributionExcelReport } from "./create-distribution-excel-report";
import {
  createDistributionEmailHtml,
  createDistributionEmailText,
} from "./distribution-email-template";
import { getSmtpConfig } from "./config";
import { createEmailTransporter } from "./transporter";
import type { SendDistributionEmailInput } from "./types";

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

export const sendDistributionEmail = async (
  input: SendDistributionEmailInput,
) => {
  if (input.clients.length === 0) {
    throw new Error("Nenhum cliente informado para envio por e-mail.");
  }

  const recipientEmail = input.recipient.email.trim().toLowerCase();

  if (!recipientEmail) {
    throw new Error("O usuário comercial não possui e-mail cadastrado.");
  }

  const senderEmail = input.sender.email.trim().toLowerCase();

  if (!senderEmail) {
    throw new Error(
      "O usuário responsável pela distribuição não possui e-mail cadastrado.",
    );
  }

  const smtpConfig = getSmtpConfig(input.smtpAccount);

  const transporter = createEmailTransporter(input.smtpAccount);

  const subject = `Novos clientes distribuídos - ${input.enterpriseName}`;

  /*
   * Gera o Excel somente no momento
   * do envio. Nenhum arquivo temporário
   * precisa ser salvo no servidor.
   */
  const excelBuffer = await createDistributionExcelReport(input);

  const reportFilename = createReportFilename(input.enterpriseName);

  const info = await transporter.sendMail({
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

  return {
    messageId: info.messageId,

    accepted: info.accepted,

    rejected: info.rejected,

    reportFilename,
  };
};
