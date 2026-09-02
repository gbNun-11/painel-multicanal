import type { Status } from "@/src/constants/enums";

export type EnterpriseInsurerTableRow = {
  id: string;

  enterpriseId: string;
  enterpriseName: string;

  insurerId: string;
  insurerName: string;

  status: Status;

  susepCount: number;
};
