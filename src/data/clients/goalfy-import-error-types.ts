export type GoalfyImportFailureStage =
  "goalfy" | "database" | "whatsapp" | "email";

export interface GoalfyImportFailure {
  stage: GoalfyImportFailureStage;

  enterpriseInsurerId: string;

  product: string;

  salespersonId: string;

  clientIds: string[];

  message: string;

  details: string | null;

  attempts: number | null;

  statusCode: number | null;

  occurredAt: string;
}
