import "server-only";

import { asc, count, eq, sql } from "drizzle-orm";

import { DEFAULT_PAGE_SIZE } from "@/src/constants/pagination";
import { db } from "@/src/db";
import {
  enterpriseInsurersTable,
  enterprisesTable,
  insurersTable,
  susepsTable,
} from "@/src/db/schema";

interface GetEnterpriseInsurersParams {
  page: number;
}

export const getEnterpriseInsurers = async ({
  page,
}: GetEnterpriseInsurersParams) => {
  const pageSize = DEFAULT_PAGE_SIZE;

  const requestedPage = Number.isSafeInteger(page) && page > 0 ? page : 1;

  const [countResult] = await db
    .select({
      total: count(),
    })
    .from(enterpriseInsurersTable);

  const total = countResult?.total ?? 0;

  const totalPages = Math.ceil(total / pageSize);

  const safePage = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);

  const offset = (safePage - 1) * pageSize;

  const enterpriseInsurers = await db
    .select({
      id: enterpriseInsurersTable.id,

      enterpriseId: enterprisesTable.id,

      enterpriseName: enterprisesTable.name,

      insurerId: insurersTable.id,

      insurerName: insurersTable.name,

      status: enterpriseInsurersTable.status,

      susepCount: sql<number>`
        (
          SELECT COUNT(*)::int
          FROM ${susepsTable}
          WHERE ${susepsTable.enterpriseInsurerId}
            = ${enterpriseInsurersTable.id}
        )
      `,
    })
    .from(enterpriseInsurersTable)
    .innerJoin(
      enterprisesTable,
      eq(enterpriseInsurersTable.enterpriseId, enterprisesTable.id),
    )
    .innerJoin(
      insurersTable,
      eq(enterpriseInsurersTable.insurerId, insurersTable.id),
    )
    .orderBy(
      asc(insurersTable.name),
      asc(enterprisesTable.name),
      asc(enterpriseInsurersTable.id),
    )
    .limit(pageSize)
    .offset(offset);

  return {
    enterpriseInsurers,

    pagination: {
      page: safePage,
      pageSize,
      total,
      totalPages,
    },
  };
};
