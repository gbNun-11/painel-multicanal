import { z } from "zod";

const upsertSusepSchema = z.object({
  id: z.uuid().optional(),

  enterpriseInsurerId: z.uuid({
    error: "Vínculo entre empresa e seguradora inválido.",
  }),

  masterSusepId: z.uuid().nullable(),

  code: z
    .string()
    .trim()
    .min(1, {
      error: "Informe a SUSEP.",
    })
    .max(50, {
      error: "A SUSEP deve conter no máximo 50 caracteres.",
    }),

  multichannel: z.boolean(),
});

export type UpsertSusepFormData = z.infer<typeof upsertSusepSchema>;

export default upsertSusepSchema;
