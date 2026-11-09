import "server-only";

import { asc, count, eq, sql } from "drizzle-orm";

import { db } from "@/src/db";
import {
  enterpriseInsurersTable,
  enterprisesTable,
  insurersTable,
  susepsTable,
} from "@/src/db/schema";
import { calculatePagination } from "@/src/utils/pagination";

interface GetEnterpriseInsurersParams {
  page: number;
}

export const getEnterpriseInsurers = async ({
  page,
}: GetEnterpriseInsurersParams) => {
  const [countResult] = await db
    .select({
      total: count(),
    })
    .from(enterpriseInsurersTable);

  const total = countResult?.total ?? 0;

  const { pagination, offset } = calculatePagination({
    page,
    total,
  });

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
    .limit(pagination.pageSize)
    .offset(offset);

  return {
    enterpriseInsurers,
    pagination,
  };
};
