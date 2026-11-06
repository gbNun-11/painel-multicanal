import { z } from "zod";

const importFailureSchema = z.object({
  stage: z.enum(["goalfy", "database", "whatsapp", "email"]),

  enterpriseInsurerId: z.uuid(),

  product: z.string().trim().min(1).max(255),

  salespersonId: z.uuid(),

  clientIds: z.array(z.uuid()).max(500),

  message: z.string().trim().min(1).max(2_000),

  details: z.string().max(10_000).nullable(),

  attempts: z.number().int().nonnegative().nullable(),

  statusCode: z.number().int().min(100).max(599).nullable(),

  occurredAt: z.iso.datetime(),
});

const sendGoalfyImportErrorReportSchema = z.object({
  failures: z.array(importFailureSchema).min(1).max(2_000),
});

export default sendGoalfyImportErrorReportSchema;
