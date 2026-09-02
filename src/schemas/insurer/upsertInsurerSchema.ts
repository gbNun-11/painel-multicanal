import { z } from "zod";

const upsertInsurerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, {
      error: "Informe o nome da seguradora.",
    })
    .max(100, {
      error: "O nome deve conter no máximo 100 caracteres.",
    }),
});

export type UpsertInsurerFormData = z.infer<typeof upsertInsurerSchema>;

export default upsertInsurerSchema;
