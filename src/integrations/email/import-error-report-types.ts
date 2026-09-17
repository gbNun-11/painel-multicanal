import type { GoalfyImportFailureStage } from "@/src/data/clients/goalfy-import-error-types";

import type { SmtpAccountKey } from "./types";

export interface ImportErrorReportClient {
  id: string;

  name: string;

  phone: string | null;
}

export interface ImportErrorReportFailure {
  stage: GoalfyImportFailureStage;

  product: string;

  salespersonName: string;

  clients: ImportErrorReportClient[];

  message: string;

  details: string | null;

  attempts: number | null;

  statusCode: number | null;

  occurredAt: Date;
}

export interface SendImportErrorReportInput {
  smtpAccount: SmtpAccountKey;

  enterpriseName: string;

  sender: {
    name: string;
    email: string;
  };

  failures: ImportErrorReportFailure[];
}
