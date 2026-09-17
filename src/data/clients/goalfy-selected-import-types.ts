export interface GoalfySelectedImportPayload {
  clientIds: string[];

  salespersonId: string;

  sendListByWhatsApp: boolean;

  sendListByEmail: boolean;
}

export type GoalfySelectedImportProgressCallback = (
  completed: number,
  total: number,
) => void;

export type GoalfySelectedImportRunner = (
  payload: GoalfySelectedImportPayload,

  onProgress: GoalfySelectedImportProgressCallback,
) => Promise<void>;
