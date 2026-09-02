import { z } from "zod";

const updateSusepSchema = z.object({
  id: z.uuid(),

  code: z
    .string()
    .trim()
    .min(1, {
      error: "Informe a SUSEP.",
    })
    .max(50, {
      error: "A SUSEP deve conter no máximo 50 caracteres.",
    }),
});

export type UpdateSusepFormData = z.infer<typeof updateSusepSchema>;

export default updateSusepSchema;
