import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import {
  enterpriseInsurersTable,
  enterprisesTable,
  insurersTable,
} from "@/src/db/schema";

export const getEnterpriseInsurerOptions = async () => {
  const [insurers, enterprises, existingLinks] = await Promise.all([
    db
      .select({
        id: insurersTable.id,
        name: insurersTable.name,
      })
      .from(insurersTable)
      .where(eq(insurersTable.status, "ativo"))
      .orderBy(asc(insurersTable.name)),

    db
      .select({
        id: enterprisesTable.id,
        name: enterprisesTable.name,
      })
      .from(enterprisesTable)
      .where(eq(enterprisesTable.status, "ativo"))
      .orderBy(asc(enterprisesTable.name)),

    db
      .select({
        insurerId: enterpriseInsurersTable.insurerId,
        enterpriseId: enterpriseInsurersTable.enterpriseId,
      })
      .from(enterpriseInsurersTable),
  ]);

  return {
    insurers,
    enterprises,
    existingLinks,
  };
};
