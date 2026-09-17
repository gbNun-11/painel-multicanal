export interface GoalfyImportAvailability {
  enterpriseInsurerId: string;
  enterpriseId: string;
  enterpriseName: string;
  product: string;
  available: number;
}

export interface GoalfyCommercialUser {
  id: string;
  name: string;
}

export interface GoalfyImportOptions {
  availability: GoalfyImportAvailability[];
  commercialUsers: GoalfyCommercialUser[];
}

export interface GoalfySellerAllocationPayload {
  userId: string;
  quantity: number;
}

export interface GoalfyBulkImportBlockPayload {
  enterpriseInsurerId: string;
  product: string;
  quantity: number;
  allocations: GoalfySellerAllocationPayload[];
}

export interface GoalfyBulkImportPayload {
  blocks: GoalfyBulkImportBlockPayload[];

  sendListByWhatsApp: boolean;
  sendListByEmail: boolean;
}

export type GoalfyImportProgressCallback = (
  completed: number,
  total: number,
) => void;

export type GoalfyBulkImportRunner = (
  payload: GoalfyBulkImportPayload,
  onProgress: GoalfyImportProgressCallback,
) => Promise<void>;
