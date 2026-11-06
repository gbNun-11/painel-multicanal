import { pgEnum } from "drizzle-orm/pg-core";

import { statuses, userRoles } from "@/src/constants/enums";

export const statusEnum = pgEnum("status", statuses);

export const userRoleEnum = pgEnum("user_role", userRoles);

export const clientPersonTypeEnum = pgEnum("client_person_type", ["PF", "PJ"]);

export const opportunityDistributionStatusEnum = pgEnum(
  "opportunity_distribution_status",
  ["novo", "distribuindo", "distribuido", "atrasado"],
);

export const opportunitySalesStatusEnum = pgEnum("opportunity_sales_status", [
  "aberto",
  "em_atendimento",
  "vendido",
  "declinado",
  "cancelado",
]);

export const opportunitySalesModelEnum = pgEnum("opportunity_sales_model", [
  "LEAD",
  "VINCULO",
  "CONTINGENCIA",
]);
