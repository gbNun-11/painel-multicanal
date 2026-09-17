import "server-only";

import type { SendImportErrorReportInput } from "./import-error-report-types";

const escapeHtml = (value: string) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

export const createImportErrorEmailHtml = (
  input: SendImportErrorReportInput,
) => {
  const enterprise = escapeHtml(input.enterpriseName);

  const senderName = escapeHtml(input.sender.name);

  const goalfyFailures = input.failures.filter(
    (failure) => failure.stage === "goalfy",
  ).length;

  const databaseFailures = input.failures.filter(
    (failure) => failure.stage === "database",
  ).length;

  const whatsappFailures = input.failures.filter(
    (failure) => failure.stage === "whatsapp",
  ).length;

  const emailFailures = input.failures.filter(
    (failure) => failure.stage === "email",
  ).length;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
  <body
    style="
      margin:0;
      padding:0;
      background:#CBCDD1;
      font-family:Arial,Helvetica,sans-serif;
      color:#111827;
    "
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      style="
        background:#CBCDD1;
        padding:36px 12px;
      "
    >
      <tr>
        <td align="center">

          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            role="presentation"
            style="
              max-width:680px;
              background:#ffffff;
              border-radius:16px;
              overflow:hidden;
            "
          >
            <tr>
              <td
                style="
                  padding:30px 32px;
                  background:#7f1d1d;
                "
              >
                <div
                  style="
                    color:#fecaca;
                    font-size:12px;
                    font-weight:700;
                    letter-spacing:1.4px;
                    text-transform:uppercase;
                  "
                >
                  Painel Multicanal
                </div>

                <div
                  style="
                    margin-top:8px;
                    color:#ffffff;
                    font-size:25px;
                    font-weight:700;
                  "
                >
                  Relatório de erros da importação
                </div>

                <div
                  style="
                    margin-top:8px;
                    color:#fecaca;
                    font-size:14px;
                  "
                >
                  Foram identificadas falhas durante o processamento.
                </div>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:32px;
                "
              >
                <p
                  style="
                    margin:0;
                    font-size:15px;
                    line-height:1.7;
                  "
                >
                  A importação executada por
                  <strong>${senderName}</strong>
                  apresentou uma ou mais ocorrências que precisam de acompanhamento.
                </p>

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  role="presentation"
                  style="
                    margin-top:24px;
                    background:#f9fafb;
                    border:1px solid #e5e7eb;
                    border-radius:12px;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding:18px;
                      "
                    >
                      <div
                        style="
                          color:#6b7280;
                          font-size:11px;
                          font-weight:700;
                          text-transform:uppercase;
                        "
                      >
                        Empresa
                      </div>

                      <div
                        style="
                          margin-top:6px;
                          font-size:16px;
                          font-weight:700;
                        "
                      >
                        ${enterprise}
                      </div>
                    </td>

                    <td
                      style="
                        padding:18px;
                        text-align:right;
                      "
                    >
                      <div
                        style="
                          color:#6b7280;
                          font-size:11px;
                          font-weight:700;
                          text-transform:uppercase;
                        "
                      >
                        Total de falhas
                      </div>

                      <div
                        style="
                          margin-top:6px;
                          color:#991b1b;
                          font-size:26px;
                          font-weight:700;
                        "
                      >
                        ${input.failures.length}
                      </div>
                    </td>
                  </tr>
                </table>

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  role="presentation"
                  style="
                    margin-top:18px;
                    border-collapse:collapse;
                  "
                >
                  <tr>
                    <td style="padding:10px;background:#fef2f2;">
                      Goalfy:
                      <strong>${goalfyFailures}</strong>
                    </td>

                    <td style="padding:10px;background:#fef2f2;">
                      Banco:
                      <strong>${databaseFailures}</strong>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:10px;background:#fff7ed;">
                      WhatsApp:
                      <strong>${whatsappFailures}</strong>
                    </td>

                    <td style="padding:10px;background:#fff7ed;">
                      E-mail:
                      <strong>${emailFailures}</strong>
                    </td>
                  </tr>
                </table>

                <div
                  style="
                    margin-top:24px;
                    padding:20px;
                    background:#f9fafb;
                    border:1px solid #e5e7eb;
                    border-radius:10px;
                  "
                >
                  <strong>
                    📎 Relatório técnico em anexo
                  </strong>

                  <p
                    style="
                      margin:8px 0 0;
                      color:#6b7280;
                      font-size:13px;
                      line-height:1.7;
                    "
                  >
                    A planilha contém os clientes afetados,
                    vendedor, produto, etapa da falha,
                    quantidade de tentativas, código HTTP,
                    mensagem retornada e detalhes técnicos.
                  </p>
                </div>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:20px 32px;
                  background:#f3f4f6;
                  color:#6b7280;
                  font-size:11px;
                "
              >
                Mensagem automática gerada pelo sistema de distribuição.
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>
`;
};

export const createImportErrorEmailText = (
  input: SendImportErrorReportInput,
) => {
  return `
Relatório de erros da importação

Empresa: ${input.enterpriseName}
Executado por: ${input.sender.name}
Total de falhas: ${input.failures.length}

O relatório técnico completo está anexado em formato Excel.

A planilha contém os clientes afetados, vendedor, produto, etapa da falha, tentativas, HTTP, mensagem de erro e detalhes técnicos.
`.trim();
};
