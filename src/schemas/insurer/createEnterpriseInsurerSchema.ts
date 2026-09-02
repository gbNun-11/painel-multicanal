import { z } from "zod";

const createEnterpriseInsurerSchema = z.object({
  insurerId: z.uuid({
    error: "Selecione uma seguradora.",
  }),

  enterpriseId: z.uuid({
    error: "Selecione uma empresa.",
  }),
});

export type CreateEnterpriseInsurerFormData = z.infer<
  typeof createEnterpriseInsurerSchema
>;

export default createEnterpriseInsurerSchema;
