import "server-only";

import { and, asc, eq, isNotNull } from "drizzle-orm";

import { db } from "@/src/db";
import { clientsTable, enterpriseInsurersTable } from "@/src/db/schema";

interface GetClientFiltersParams {
  insurerId: string;
}

export const getClientFilters = async ({
  insurerId,
}: GetClientFiltersParams) => {
  const result = await db
    .selectDistinct({
      product: clientsTable.product,
    })
    .from(clientsTable)
    .innerJoin(
      enterpriseInsurersTable,
      eq(clientsTable.enterpriseInsurerId, enterpriseInsurersTable.id),
    )
    .where(
      and(
        eq(enterpriseInsurersTable.insurerId, insurerId),
        isNotNull(clientsTable.product),
      ),
    )
    .orderBy(asc(clientsTable.product));

  const productsByKey = new Map<string, string>();

  for (const item of result) {
    const product = item.product?.trim();

    if (!product) {
      continue;
    }

    const key = product.toLocaleUpperCase("pt-BR");

    if (!productsByKey.has(key)) {
      productsByKey.set(key, product);
    }
  }

  return {
    products: [...productsByKey.values()],
  };
};
