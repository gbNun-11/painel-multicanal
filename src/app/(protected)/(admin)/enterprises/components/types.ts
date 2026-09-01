import type { enterprisesTable } from "@/src/db/schema";

export type EnterpriseTableRow = Pick<
  typeof enterprisesTable.$inferSelect,
  "id" | "name" | "cnpj" | "status"
>;
