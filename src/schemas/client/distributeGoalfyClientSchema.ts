import { z } from "zod";

const distributeGoalfyClientSchema = z.object({
  enterpriseInsurerId: z.uuid(),

  product: z.string().trim().min(1).max(255),

  salesModel: z.enum(["LEAD", "VINCULO", "CONTINGENCIA"]),

  salespersonId: z.uuid(),
});

export default distributeGoalfyClientSchema;
