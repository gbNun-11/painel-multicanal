import type { Status } from "@/src/constants/enums";

export type ProductCodeTableRow = {
  id: string;

  insurerId: string;

  productId: string;

  externalId: string | null;

  code: string;

  name: string;

  status: Status;
};

export type ProductTableRow = {
  id: string;

  insurerId: string;

  name: string;

  status: Status;

  codes: ProductCodeTableRow[];
};

export type ProductInsurerOption = {
  id: string;

  name: string;
};
