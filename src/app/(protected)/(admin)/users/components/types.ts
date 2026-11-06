import type { usersTable } from "@/src/db/schema";

export type UserTableRow = Pick<
  typeof usersTable.$inferSelect,
  "id" | "name" | "cpf" | "birthDate" | "phone" | "email" | "role" | "status"
>;
