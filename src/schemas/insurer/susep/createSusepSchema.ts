import { z } from "zod";

const createSusepSchema = z.object({
  enterpriseInsurerId: z.uuid(),

  codes: z
    .string()
    .trim()
    .min(1, {
      error: "Informe pelo menos uma SUSEP.",
    })
    .max(2000, {
      error: "A lista de SUSEPs é muito grande.",
    }),
});

export type CreateSusepFormData = z.infer<typeof createSusepSchema>;

export default createSusepSchema;
