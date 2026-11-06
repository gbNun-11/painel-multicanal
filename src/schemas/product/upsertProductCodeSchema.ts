import { z } from "zod";

const upsertProductCodeSchema = z.object({
  id: z.uuid().optional(),

  productId: z.uuid({
    error: "Produto inválido.",
  }),

  code: z
    .string()
    .trim()
    .min(1, {
      error: "Informe o código do produto.",
    })
    .max(50, {
      error: "O código deve conter no máximo 50 caracteres.",
    }),

  name: z
    .string()
    .trim()
    .min(1, {
      error: "Informe o nome da variação do produto.",
    })
    .max(120, {
      error: "O nome deve conter no máximo 120 caracteres.",
    }),
});

export type UpsertProductCodeFormData = z.infer<typeof upsertProductCodeSchema>;

export default upsertProductCodeSchema;
