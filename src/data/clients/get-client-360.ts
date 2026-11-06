import "server-only";

import { and, count, desc, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/src/db";
import {
  clientsTable,
  enterpriseInsurersTable,
  enterprisesTable,
  insurersTable,
  opportunitiesTable,
  productCodesTable,
  susepsTable,
  usersTable,
} from "@/src/db/schema";
import { auth } from "@/src/lib/auth";

const PAGE_SIZE = 20;

interface GetClient360Params {
  clientId: string;
  page?: number;
}

/**
 * Consulta protegida do Cliente 360 (INRI, primeira versão).
 * A autorização por organização/empresa deverá ser acrescentada
 * antes de abrir acesso a outras corretoras ou a outros setores.
 */
export const getClient360 = async ({
  clientId,
  page = 1,
}: GetClient360Params) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect("/authentication");
  }

  // Não confiar apenas no grupo de rotas (protected) ou na visibilidade do menu.
  const [authorizedUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.id, session.user.id),
        eq(usersTable.status, "ativo"),
        eq(usersTable.banned, false),
        inArray(usersTable.role, ["admin", "administrativo"]),
      ),
    )
    .limit(1);

  if (!authorizedUser) {
    notFound();
  }

  if (!z.uuid().safeParse(clientId).success) {
    notFound();
  }

  const [client] = await db
    .select({
      id: clientsTable.id,
      name: clientsTable.name,
      document: clientsTable.document,
      personType: clientsTable.personType,
      phone: clientsTable.phone,
      email: clientsTable.email,
      birthDate: clientsTable.birthDate,
      sex: clientsTable.sex,
      profession: clientsTable.profession,
      monthlyIncomeRange: clientsTable.monthlyIncomeRange,
      economicActivity: clientsTable.economicActivity,
      companyType: clientsTable.companyType,
      netWorth: clientsTable.netWorth,
      annualGrossOperatingRevenue: clientsTable.annualGrossOperatingRevenue,
      address: clientsTable.address,
      addressNumber: clientsTable.addressNumber,
      addressComplement: clientsTable.addressComplement,
      neighborhood: clientsTable.neighborhood,
      city: clientsTable.city,
      state: clientsTable.state,
      zipCode: clientsTable.zipCode,
      createdAt: clientsTable.createdAt,
      updatedAt: clientsTable.updatedAt,
    })
    .from(clientsTable)
    .where(eq(clientsTable.id, clientId))
    .limit(1);

  if (!client) {
    notFound();
  }

  const [countResult] = await db
    .select({ total: count() })
    .from(opportunitiesTable)
    .where(eq(opportunitiesTable.clientId, client.id));

  const total = countResult?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const requestedPage = Number.isSafeInteger(page) && page > 0 ? page : 1;
  const safePage = Math.min(requestedPage, Math.max(1, totalPages));

  const opportunities = await db
    .select({
      id: opportunitiesTable.id,
      enterpriseInsurerId: opportunitiesTable.enterpriseInsurerId,
      enterpriseName: enterprisesTable.name,
      insurerName: insurersTable.name,
      susepCode: susepsTable.code,
      externalSource: opportunitiesTable.externalSource,
      productCode: productCodesTable.code,
      product: opportunitiesTable.product,
      propensity: opportunitiesTable.propensity,
      salesModel: opportunitiesTable.salesModel,
      distributionStatus: opportunitiesTable.distributionStatus,
      salesStatus: opportunitiesTable.salesStatus,
      salespersonName: usersTable.name,
      assignedAt: opportunitiesTable.assignedAt,
      sourceCreatedAt: opportunitiesTable.sourceCreatedAt,
      createdAt: opportunitiesTable.createdAt,
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
    .innerJoin(
      insurersTable,
      eq(enterpriseInsurersTable.insurerId, insurersTable.id),
    )
    .innerJoin(susepsTable, eq(opportunitiesTable.susepId, susepsTable.id))
    .leftJoin(usersTable, eq(opportunitiesTable.salespersonId, usersTable.id))
    .leftJoin(
      productCodesTable,
      eq(opportunitiesTable.productCodeId, productCodesTable.id),
    )
    .where(eq(opportunitiesTable.clientId, client.id))
    .orderBy(desc(opportunitiesTable.createdAt), desc(opportunitiesTable.id))
    .limit(PAGE_SIZE)
    .offset((safePage - 1) * PAGE_SIZE);

  return {
    client,
    opportunities,
    pagination: {
      page: safePage,
      pageSize: PAGE_SIZE,
      total,
      totalPages,
    },
  };
};
