import { z } from "zod";

const getSusepsSchema = z.object({
  enterpriseInsurerId: z.uuid(),
});

export default getSusepsSchema;
