import { z } from "zod";

const distributeSelectedGoalfyClientSchema = z.object({
  clientId: z.uuid({
    error: "Cliente inválido.",
  }),

  salespersonId: z.uuid({
    error: "Usuário comercial inválido.",
  }),

  batchId: z.uuid().optional(),
});

export default distributeSelectedGoalfyClientSchema;
