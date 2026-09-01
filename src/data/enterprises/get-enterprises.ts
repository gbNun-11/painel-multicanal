import "server-only";

import { asc, count } from "drizzle-orm";

import { DEFAULT_PAGE_SIZE } from "@/src/constants/pagination";
import { db } from "@/src/db";
import { enterprisesTable } from "@/src/db/schema";

interface GetEnterprisesParams {
  page: number;
}

export const getEnterprises = async ({ page }: GetEnterprisesParams) => {
  const pageSize = DEFAULT_PAGE_SIZE;

  const requestedPage = Number.isSafeInteger(page) && page > 0 ? page : 1;

  const [countResult] = await db
    .select({
      total: count(),
    })
    .from(enterprisesTable);

  const total = countResult?.total ?? 0;

  const totalPages = Math.ceil(total / pageSize);

  const safePage = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);

  const offset = (safePage - 1) * pageSize;

  const enterprises = await db
    .select({
      id: enterprisesTable.id,
      name: enterprisesTable.name,
      cnpj: enterprisesTable.cnpj,
      status: enterprisesTable.status,
    })
    .from(enterprisesTable)
    .orderBy(asc(enterprisesTable.name), asc(enterprisesTable.id))
    .limit(pageSize)
    .offset(offset);

  return {
    enterprises,

    pagination: {
      page: safePage,
      pageSize,
      total,
      totalPages,
    },
  };
};
