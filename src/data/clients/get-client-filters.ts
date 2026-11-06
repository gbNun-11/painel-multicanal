import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";

import { INSURER_IDS } from "@/src/constants/insurers";
import { db } from "@/src/db";
import {
  enterpriseInsurersTable,
  enterprisesTable,
  opportunitiesTable,
} from "@/src/db/schema";

interface GetClientFiltersParams {
  insurerId: string;
}

export const getClientFilters = async ({
  insurerId,
}: GetClientFiltersParams) => {
  const insurerCondition =
    insurerId === INSURER_IDS.PORTO
      ? eq(opportunitiesTable.externalSource, "PORTO")
      : eq(enterpriseInsurersTable.insurerId, insurerId);

  // Uma única busca fornece produtos e empresas de oportunidades disponíveis.
  const rows = await db
    .selectDistinct({
      product: opportunitiesTable.product,
      enterpriseId: enterprisesTable.id,
      enterpriseName: enterprisesTable.name,
    })
    .from(opportunitiesTable)
    .innerJoin(
      enterpriseInsurersTable,
      eq(opportunitiesTable.enterpriseInsurerId, enterpriseInsurersTable.id),
    )
    .innerJoin(
      enterprisesTable,
      eq(enterpriseInsurersTable.enterpriseId, enterprisesTable.id),
    )
    .where(
      and(
        insurerCondition,
        eq(opportunitiesTable.distributionStatus, "novo"),
        eq(opportunitiesTable.salesStatus, "aberto"),
        isNull(opportunitiesTable.salespersonId),
      ),
    )
    .orderBy(asc(enterprisesTable.name), asc(opportunitiesTable.product));

  const productsByKey = new Map<string, string>();
  const companiesById = new Map<string, { id: string; name: string }>();

  for (const row of rows) {
    const product = row.product?.trim();
    if (product) {
      const key = product.toLocaleUpperCase("pt-BR");
      if (!productsByKey.has(key)) {
        productsByKey.set(key, product);
      }
    }

    if (!companiesById.has(row.enterpriseId)) {
      companiesById.set(row.enterpriseId, {
        id: row.enterpriseId,
        name: row.enterpriseName,
      });
    }
  }

  return {
    products: [...productsByKey.values()].sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    ),
    companies: [...companiesById.values()].sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR"),
    ),
  };
};
