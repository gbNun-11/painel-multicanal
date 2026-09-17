import "server-only";

import { and, asc, count, eq, isNotNull, isNull } from "drizzle-orm";

import { db } from "@/src/db";
import {
  clientsTable,
  enterpriseInsurersTable,
  enterprisesTable,
  usersTable,
} from "@/src/db/schema";

import type {
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

        product: clientsTable.product,

        available: count(),
      })
      .from(clientsTable)
      .innerJoin(
        enterpriseInsurersTable,
        eq(clientsTable.enterpriseInsurerId, enterpriseInsurersTable.id),
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

          eq(clientsTable.status, "novo"),

          isNull(clientsTable.salespersonId),

          isNotNull(clientsTable.product),
        ),
      )
      .groupBy(
        enterpriseInsurersTable.id,
        enterprisesTable.id,
        enterprisesTable.name,
        clientsTable.product,
      )
      .orderBy(asc(enterprisesTable.name), asc(clientsTable.product)),

    db
      .select({
        id: usersTable.id,
        name: usersTable.name,
      })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.role, "comercial"),

          eq(usersTable.status, "ativo"),
        ),
      )
      .orderBy(asc(usersTable.name), asc(usersTable.id)),
  ]);

  const availability: GoalfyImportAvailability[] = availabilityResult.flatMap(
    (item) => {
      const product = item.product?.trim();

      if (!product) {
        return [];
      }

      return [
        {
          enterpriseInsurerId: item.enterpriseInsurerId,

          enterpriseId: item.enterpriseId,

          enterpriseName: item.enterpriseName,

          product,

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
