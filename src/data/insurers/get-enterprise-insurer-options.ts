import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import {
  enterpriseInsurersTable,
  enterprisesTable,
  insurersTable,
} from "@/src/db/schema";
import { PAGE_ACCESS, requirePageAccess } from "@/src/lib/require-page-access";

export const getEnterpriseInsurerOptions = async () => {
  await requirePageAccess(PAGE_ACCESS.adminOnly, {
    deniedRedirectTo: "/dashboard",
  });

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
