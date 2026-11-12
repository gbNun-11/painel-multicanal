import { z } from "zod";

const sendGoalfyEmailListSchema = z.object({
  salespersonId: z.uuid({
    error: "Usuário comercial inválido.",
  }),

  enterpriseInsurerId: z.uuid({
    error: "Empresa/seguradora inválida.",
  }),

  clientIds: z
    .array(
      z.uuid({
        error: "Cliente inválido.",
      }),
    )
    .min(1, {
      error: "Informe pelo menos um cliente.",
    })
    .max(500, {
      error:
        "O envio por e-mail suporta no máximo 500 clientes por solicitação.",
    })
    .refine((clientIds) => new Set(clientIds).size === clientIds.length, {
      error: "Existem clientes duplicados na lista.",
    }),

  batchId: z.uuid(),
});

export default sendGoalfyEmailListSchema;
