import "server-only";

import { and, asc, count, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/src/db";
import {
  enterpriseInsurersTable,
  enterprisesTable,
  opportunitiesTable,
  usersTable,
} from "@/src/db/schema";

import type {
  GoalfyBulkSalesModel,
  GoalfyImportAvailability,
  GoalfyImportOptions,
} from "./goalfy-import-types";

interface GetGoalfyImportOptionsParams {
  insurerId: string;
}

export const getGoalfyImportOptions = async ({
  insurerId,
}: GetGoalfyImportOptionsParams): Promise<GoalfyImportOptions> => {
  const [availabilityResult, commercialUsers] = await Promise.all([
    db
      .select({
        enterpriseInsurerId: enterpriseInsurersTable.id,
        enterpriseId: enterprisesTable.id,
        enterpriseName: enterprisesTable.name,
        product: opportunitiesTable.product,
        salesModel: opportunitiesTable.salesModel,
        available: count(),
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
          eq(enterpriseInsurersTable.insurerId, insurerId),
          eq(enterpriseInsurersTable.status, "ativo"),
          eq(enterprisesTable.status, "ativo"),
          eq(opportunitiesTable.distributionStatus, "novo"),
          eq(opportunitiesTable.salesStatus, "aberto"),
          isNull(opportunitiesTable.salespersonId),
          inArray(opportunitiesTable.salesModel, [
            "LEAD",
            "VINCULO",
            "CONTINGENCIA",
          ]),
        ),
      )
      .groupBy(
        enterpriseInsurersTable.id,
        enterprisesTable.id,
        enterprisesTable.name,
        opportunitiesTable.product,
        opportunitiesTable.salesModel,
      )
      .orderBy(
        asc(enterprisesTable.name),
        asc(opportunitiesTable.product),
        asc(opportunitiesTable.salesModel),
      ),

    db
      .select({
        id: usersTable.id,
        name: usersTable.name,
      })
      .from(usersTable)
      .where(
        and(eq(usersTable.role, "comercial"), eq(usersTable.status, "ativo")),
      )
      .orderBy(asc(usersTable.name), asc(usersTable.id)),
  ]);

  const availability: GoalfyImportAvailability[] = availabilityResult.flatMap(
    (item) => {
      const product = item.product.trim();

      if (!product) {
        return [];
      }

      const salesModel = item.salesModel;

      if (
        salesModel !== "LEAD" &&
        salesModel !== "VINCULO" &&
        salesModel !== "CONTINGENCIA"
      ) {
        return [];
      }

      const model: GoalfyBulkSalesModel = salesModel;

      return [
        {
          enterpriseInsurerId: item.enterpriseInsurerId,
          enterpriseId: item.enterpriseId,
          enterpriseName: item.enterpriseName,
          product,
          salesModel: model,
          available: Number(item.available),
        },
      ];
    },
  );

  return {
    availability,
    commercialUsers,
  };
};
