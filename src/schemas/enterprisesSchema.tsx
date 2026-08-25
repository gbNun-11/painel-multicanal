import z from "zod";

import { statuses } from "@/src/constants/enums";

const createEnterpriseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, {
      error: "O nome é obrigatório.",
    })
    .max(100, {
      error: "O nome não pode ter mais que 100 caracteres.",
    }),
  cnpj: z
    .string()
    .trim()
    .length(14, {
      error: "O CNPJ deve conter exatamente 14 números.",
    })
    .regex(/^\d+$/, {
      error: "O CNPJ deve conter apenas números.",
    }),
  status: z.enum(statuses, {
    error: "Selecione um status.",
  }),
});

export type CreateEnterpriseFormData = z.infer<typeof createEnterpriseSchema>;

export default createEnterpriseSchema;
