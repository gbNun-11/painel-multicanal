import "server-only";

import type { SendDistributionEmailInput } from "./types";

const escapeHtml = (value: string) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

export const createDistributionEmailHtml = ({
  enterpriseName,
  sender,
  recipient,
  clients,
}: SendDistributionEmailInput) => {
  const safeEnterpriseName = escapeHtml(enterpriseName);

  const safeSenderName = escapeHtml(sender.name);

  const safeRecipientName = escapeHtml(recipient.name);

  const now = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",

    timeStyle: "short",

    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  return `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />

    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />

    <title>
      Novos clientes distribuídos
    </title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #CBCDD1;
      font-family:
        Arial,
        Helvetica,
        sans-serif;
      color: #111827;
    "
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      role="presentation"
      style="
        width: 100%;
        background-color: #CBCDD1;
        padding: 36px 12px;
      "
    >
      <tr>
        <td align="center">
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            role="presentation"
            style="
              width: 100%;
              max-width: 680px;
              background-color: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow:
                0 10px 30px
                rgba(0, 0, 0, 0.08);
            "
          >
            <tr>
              <td
                style="
                  background-color: #111827;
                  padding: 30px 32px;
                "
              >
                <div
                  style="
                    color: #f9fafb;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    margin-bottom: 10px;
                  "
                >
                  Goalfy
                </div>

                <div
                  style="
                    color: #ffffff;
                    font-size: 26px;
                    font-weight: 700;
                    line-height: 1.25;
                  "
                >
                  Novos clientes distribuídos
                </div>

                <div
                  style="
                    color: #9ca3af;
                    font-size: 14px;
                    line-height: 1.5;
                    margin-top: 8px;
                  "
                >
                  Sua relação de novos clientes está pronta para atendimento.
                </div>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding: 32px;
                "
              >
                <p
                  style="
                    margin: 0 0 10px;
                    color: #111827;
                    font-size: 17px;
                    line-height: 1.6;
                  "
                >
                  Olá,
                  <strong>
                    ${safeRecipientName}
                  </strong>.
                </p>

                <p
                  style="
                    margin: 0;
                    color: #6b7280;
                    font-size: 14px;
                    line-height: 1.7;
                  "
                >
                  Segue sua relação de novos clientes distribuídos no Goalfy.
                </p>

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  role="presentation"
                  style="
                    margin-top: 26px;
                    background-color: #f3f4f6;
                    border: 1px solid #d1d5db;
                    border-radius: 12px;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding: 18px;
                      "
                    >
                      <div
                        style="
                          color: #6b7280;
                          font-size: 12px;
                          font-weight: 700;
                          letter-spacing: 0.8px;
                          text-transform: uppercase;
                        "
                      >
                        Empresa
                      </div>

                      <div
                        style="
                          margin-top: 6px;
                          color: #111827;
                          font-size: 16px;
                          font-weight: 700;
                        "
                      >
                        ${safeEnterpriseName}
                      </div>
                    </td>

                    <td
                      style="
                        padding: 18px;
                        text-align: right;
                      "
                    >
                      <div
                        style="
                          color: #6b7280;
                          font-size: 12px;
                          font-weight: 700;
                          letter-spacing: 0.8px;
                          text-transform: uppercase;
                        "
                      >
                        Clientes
                      </div>

                      <div
                        style="
                          margin-top: 6px;
                          color: #111827;
                          font-size: 24px;
                          font-weight: 700;
                        "
                      >
                        ${clients.length}
                      </div>
                    </td>
                  </tr>
                </table>

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  role="presentation"
                  style="
                    margin-top: 26px;
                    background-color: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding: 22px;
                      "
                    >
                      <div
                        style="
                          color: #111827;
                          font-size: 15px;
                          font-weight: 700;
                          line-height: 1.5;
                        "
                      >
                        📎 Relatório de clientes em anexo
                      </div>

                      <div
                        style="
                          margin-top: 8px;
                          color: #6b7280;
                          font-size: 13px;
                          line-height: 1.7;
                        "
                      >
                        Em anexo está a planilha com os dados dos
                        <strong
                          style="
                            color: #374151;
                          "
                        >
                          ${clients.length} clientes
                        </strong>
                        distribuídos nesta operação.
                      </div>

                      <div
                        style="
                          margin-top: 8px;
                          color: #6b7280;
                          font-size: 13px;
                          line-height: 1.7;
                        "
                      >
                        O relatório contém informações de identificação,
                        contato, produto, modelo de venda, propensão e
                        dados da distribuição.
                      </div>
                    </td>
                  </tr>
                </table>

                <div
                  style="
                    margin-top: 28px;
                    padding: 20px;
                    background-color: #f3f4f6;
                    border-left: 4px solid #111827;
                    border-radius: 8px;
                  "
                >
                  <div
                    style="
                      color: #111827;
                      font-size: 14px;
                      font-weight: 700;
                    "
                  >
                    Boas vendas! 🚀
                  </div>

                  <div
                    style="
                      margin-top: 5px;
                      color: #6b7280;
                      font-size: 13px;
                      line-height: 1.6;
                    "
                  >
                    Os clientes do relatório já foram distribuídos e estão disponíveis no Goalfy.
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding: 22px 32px;
                  background-color: #f3f4f6;
                  border-top: 1px solid #e5e7eb;
                "
              >
                <div
                  style="
                    color: #6b7280;
                    font-size: 12px;
                    line-height: 1.6;
                  "
                >
                  Distribuição realizada por
                  <strong
                    style="
                      color: #374151;
                    "
                  >
                    ${safeSenderName}
                  </strong>
                </div>

                <div
                  style="
                    margin-top: 4px;
                    color: #9ca3af;
                    font-size: 11px;
                  "
                >
                  ${escapeHtml(now)}
                </div>

                <div
                  style="
                    margin-top: 14px;
                    color: #9ca3af;
                    font-size: 11px;
                    line-height: 1.5;
                  "
                >
                  Esta é uma mensagem automática gerada pelo sistema de distribuição.
                </div>
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

export const createDistributionEmailText = ({
  enterpriseName,
  sender,
  recipient,
  clients,
}: SendDistributionEmailInput) => {
  return `
Olá, ${recipient.name}.

Segue sua relação de novos clientes distribuídos no Goalfy.

Empresa: ${enterpriseName}
Clientes distribuídos: ${clients.length}

RELATÓRIO EM ANEXO

Em anexo está a planilha com os dados dos ${clients.length} clientes distribuídos nesta operação.

O relatório contém informações de identificação, contato, produto, modelo de venda, propensão e dados da distribuição.

Boas vendas!

Distribuição realizada por ${sender.name}.
`.trim();
};
