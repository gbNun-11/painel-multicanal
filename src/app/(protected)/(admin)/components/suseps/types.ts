import type { Status } from "@/src/constants/enums";

export type SusepTableRow = {
  id: string;

  enterpriseInsurerId: string;

  masterSusepId: string | null;

  code: string;

  multichannel: boolean;

  status: Status;
};

export type SusepContext = {
  type: "enterpriseInsurer";

  enterpriseInsurerId: string;

  enterpriseName: string;

  insurerName: string;
};
