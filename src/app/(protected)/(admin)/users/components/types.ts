import type { usersTable } from "@/src/db/schema";

export type UserTableRow = Pick<
  typeof usersTable.$inferSelect,
  "id" | "name" | "phone" | "email" | "role" | "status"
>;
