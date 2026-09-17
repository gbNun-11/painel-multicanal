import { z } from "zod";

const distributeSelectedGoalfyClientSchema = z.object({
  clientId: z.uuid({
    error: "Cliente inválido.",
  }),

  salespersonId: z.uuid({
    error: "Usuário comercial inválido.",
  }),
});

export default distributeSelectedGoalfyClientSchema;
