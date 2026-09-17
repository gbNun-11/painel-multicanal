import { pgEnum } from "drizzle-orm/pg-core";

import { statuses, userRoles } from "@/src/constants/enums";

export const statusEnum = pgEnum("status", statuses);

export const userRoleEnum = pgEnum("user_role", userRoles);

export const clientStatusEnum = pgEnum("client_status", [
  "novo",
  "distribuindo",
  "distribuido",
  "atrasado",
]);

export const clientSalesModelEnum = pgEnum("client_sales_model", [
  "LEAD",
  "VINCULO",
  "CONTINGENCIA",
]);
