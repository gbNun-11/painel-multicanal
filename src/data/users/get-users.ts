import "server-only";

import { asc, count } from "drizzle-orm";

import { DEFAULT_PAGE_SIZE } from "@/src/constants/pagination";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";

interface GetUsersParams {
  page: number;
}

export const getUsers = async ({ page }: GetUsersParams) => {
  const pageSize = DEFAULT_PAGE_SIZE;

  const [countResult] = await db
    .select({
      total: count(),
    })
    .from(usersTable);

  const total = countResult.total;

  const totalPages = Math.ceil(total / pageSize);

  const safePage =
    totalPages === 0 ? 1 : Math.min(Math.max(page, 1), totalPages);

  const offset = (safePage - 1) * pageSize;

  const users = await db
    .select({
      id: usersTable.id,

      name: usersTable.name,

      cpf: usersTable.cpf,

      birthDate: usersTable.birthDate,

      phone: usersTable.phone,

      email: usersTable.email,

      role: usersTable.role,

      status: usersTable.status,
    })
    .from(usersTable)
    .orderBy(asc(usersTable.role), asc(usersTable.name), asc(usersTable.id))
    .limit(pageSize)
    .offset(offset);

  return {
    users,

    pagination: {
      page: safePage,

      pageSize,

      total,

      totalPages,
    },
  };
};
