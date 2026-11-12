import { z } from "zod";

const sendGoalfyWhatsAppListSchema = z.object({
  salespersonId: z.uuid(),

  enterpriseInsurerId: z.uuid(),

  clientIds: z.array(z.uuid()).min(1).max(500),

  batchId: z.uuid(),
});

export default sendGoalfyWhatsAppListSchema;
