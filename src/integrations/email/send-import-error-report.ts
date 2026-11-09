import "server-only";

import { getSmtpConfig } from "./config";
import { createImportErrorExcelReport } from "./create-import-error-excel-report";
import {
  createImportErrorEmailHtml,
  createImportErrorEmailText,
} from "./import-error-email-template";
import type { SendImportErrorReportInput } from "./import-error-report-types";
import { createEmailTransporter } from "./transporter";

const sanitizeFilename = (value: string) => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();
};

export const sendImportErrorReport = async (
  input: SendImportErrorReportInput,
) => {
  if (input.failures.length === 0) {
    throw new Error("Nenhuma falha informada para o relatório.");
  }

  const smtpConfig = getSmtpConfig(input.smtpAccount);

  const transporter = createEmailTransporter(input.smtpAccount);

  const excel = await createImportErrorExcelReport(input);

  const recipients = Array.from(
    new Set([
      input.sender.email.trim().toLowerCase(),
      smtpConfig.auth.user.trim().toLowerCase(),
    ]),
  );

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  const filename = `erros-importacao-${sanitizeFilename(
    input.enterpriseName,
  )}-${date}.xlsx`;

  const info = await transporter.sendMail({
    from: {
      name: "Painel Multicanal",
      address: smtpConfig.auth.user,
    },

    replyTo: {
      name: input.sender.name,
      address: input.sender.email,
    },

    to: recipients,

    subject: `Relatório de erros da importação - ${input.enterpriseName}`,

    text: createImportErrorEmailText(input),

    html: createImportErrorEmailHtml(input),

    attachments: [
      {
        filename,
        content: excel,
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
  });

  return {
    messageId: info.messageId,
    filename,
    recipients,
  };
};
