import { asc } from "drizzle-orm";

import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";

export const getUsers = async () => {
  return db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      phone: usersTable.phone,
      email: usersTable.email,
      role: usersTable.role,
      status: usersTable.status,
    })
    .from(usersTable)
    .orderBy(asc(usersTable.name));
};
