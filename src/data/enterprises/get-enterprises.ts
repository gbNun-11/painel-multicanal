import "server-only";

import { asc, count } from "drizzle-orm";

import { db } from "@/src/db";
import { enterprisesTable } from "@/src/db/schema";
import { calculatePagination } from "@/src/utils/pagination";

interface GetEnterprisesParams {
  page: number;
}

export const getEnterprises = async ({ page }: GetEnterprisesParams) => {
  const [countResult] = await db
    .select({
      total: count(),
    })
    .from(enterprisesTable);

  const total = countResult?.total ?? 0;

  const { pagination, offset } = calculatePagination({
    page,
    total,
  });

  const enterprises = await db
    .select({
      id: enterprisesTable.id,
      name: enterprisesTable.name,
      cnpj: enterprisesTable.cnpj,
      status: enterprisesTable.status,
    })
    .from(enterprisesTable)
    .orderBy(asc(enterprisesTable.name), asc(enterprisesTable.id))
    .limit(pagination.pageSize)
    .offset(offset);

  return {
    enterprises,
    pagination,
  };
};
