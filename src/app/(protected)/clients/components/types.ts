export interface ClientTableRow {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  product: string | null;
  propensity: string | null;
}

export interface ClientsSearchParams {
  page?: string | string[];
  q?: string | string[];

  from?: string | string[];
  to?: string | string[];

  product?: string | string[];
  salesModel?: string | string[];
}
