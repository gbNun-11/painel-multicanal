import { z } from "zod";

const upsertEnterpriseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, {
      error: "Informe o nome da empresa.",
    })
    .max(100, {
      error: "O nome deve conter no máximo 100 caracteres.",
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
});

export type UpsertEnterpriseFormData = z.infer<typeof upsertEnterpriseSchema>;

export default upsertEnterpriseSchema;
