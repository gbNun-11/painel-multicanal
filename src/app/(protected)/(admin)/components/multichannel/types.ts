import type { Status } from "@/src/constants/enums";

export type MultichannelAssignmentTableRow = {
  id: string;

  productId: string;

  productName: string;

  productStatus: Status;

  userId: string;

  userName: string;

  userStatus: Status;

  status: Status;
};

export type MultichannelProductOption = {
  id: string;

  name: string;
};

export type MultichannelUserOption = {
  id: string;

  name: string;
};

export type MultichannelConfiguration = {
  susep: {
    id: string;

    code: string;

    status: Status;
  };

  assignments: MultichannelAssignmentTableRow[];

  products: MultichannelProductOption[];

  users: MultichannelUserOption[];
};
