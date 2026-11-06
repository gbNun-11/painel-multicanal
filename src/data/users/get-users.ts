import "server-only";

import { asc, count, eq, ilike, or } from "drizzle-orm";

import { DEFAULT_PAGE_SIZE } from "@/src/constants/pagination";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import {
  escapeLikePattern,
  normalizeNumericSearch,
  normalizeSearchTerm,
} from "@/src/utils/search";

interface GetUsersParams {
  page: number;
  search?: string;
}

export const getUsers = async ({ page, search }: GetUsersParams) => {
  const pageSize = DEFAULT_PAGE_SIZE;

  const normalizedSearch = normalizeSearchTerm(search);

  let searchCondition;

  if (normalizedSearch) {
    const escapedSearch = escapeLikePattern(normalizedSearch);

    const cpfSearch = normalizeNumericSearch(normalizedSearch);

    const nameCondition = ilike(usersTable.name, `%${escapedSearch}%`);

    if (cpfSearch) {
      const cpfCondition =
        cpfSearch.length === 11
          ? eq(usersTable.cpf, cpfSearch)
          : ilike(usersTable.cpf, `%${escapeLikePattern(cpfSearch)}%`);

      searchCondition = or(nameCondition, cpfCondition);
    } else {
      searchCondition = nameCondition;
    }
  }

  const [countResult] = await db
    .select({
      total: count(),
    })
    .from(usersTable)
    .where(searchCondition);

  const total = countResult?.total ?? 0;

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
    .where(searchCondition)
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
