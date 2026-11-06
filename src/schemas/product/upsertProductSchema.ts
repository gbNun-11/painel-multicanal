import { z } from "zod";

const upsertProductSchema = z.object({
  id: z.uuid().optional(),

  insurerId: z.uuid({
    error: "Seguradora inválida.",
  }),

  name: z
    .string()
    .trim()
    .min(1, {
      error: "Informe o nome do produto.",
    })
    .max(100, {
      error: "O nome do produto deve conter no máximo 100 caracteres.",
    }),
});

export type UpsertProductFormData = z.infer<typeof upsertProductSchema>;

export default upsertProductSchema;
