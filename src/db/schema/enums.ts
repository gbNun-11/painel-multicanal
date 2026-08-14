import { pgEnum } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["ativo", "inativo"]);

export const userRoleEnum = pgEnum("user_role", [
  "administrativo",
  "comercial",
  "admin",
]);

export const clientStatusEnum = pgEnum("client_status", [
  "novo",
  "distribuido",
  "atrasado",
]);
