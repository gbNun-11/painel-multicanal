export interface ClientTableRow {
  id: string;
  clientId: string;
  opportunityNumber: number | string | null;
  name: string;
  document: string | null;
  phone: string | null;
  product: string | null;
  enterpriseName: string;
  propensity: string | null;
  salesModel: "LEAD" | "VINCULO" | "CONTINGENCIA" | null;
}

export interface ClientsSearchParams {
  page?: string | string[];
  q?: string | string[];

  from?: string | string[];
  to?: string | string[];

  product?: string | string[];
  salesModel?: string | string[];

  enterpriseId?: string | string[];
}
