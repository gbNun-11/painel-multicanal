import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import {
  enterpriseInsurersTable,
  multichannelAssignmentsTable,
  productsTable,
  susepsTable,
  usersTable,
} from "@/src/db/schema";
import { PAGE_ACCESS, requirePageAccess } from "@/src/lib/require-page-access";

export const getMultichannelConfiguration = async (susepId: string) => {
  await requirePageAccess(PAGE_ACCESS.adminOnly);

  const [susep] = await db
    .select({
      id: susepsTable.id,

      code: susepsTable.code,

      status: susepsTable.status,

      multichannel: susepsTable.multichannel,

      enterpriseInsurerId: susepsTable.enterpriseInsurerId,

      insurerId: enterpriseInsurersTable.insurerId,

      enterpriseInsurerStatus: enterpriseInsurersTable.status,
    })
    .from(susepsTable)
    .innerJoin(
      enterpriseInsurersTable,
      eq(susepsTable.enterpriseInsurerId, enterpriseInsurersTable.id),
    )
    .where(eq(susepsTable.id, susepId))
    .limit(1);

  if (!susep) {
    throw new Error("SUSEP não encontrada.");
  }

  if (!susep.multichannel) {
    throw new Error(
      `A SUSEP ${susep.code} não está configurada como multicanal.`,
    );
  }

  const [assignments, products, users] = await Promise.all([
    db
      .select({
        id: multichannelAssignmentsTable.id,

        susepId: multichannelAssignmentsTable.susepId,

        productId: multichannelAssignmentsTable.productId,

        productName: productsTable.name,

        productStatus: productsTable.status,

        userId: multichannelAssignmentsTable.userId,

        userName: usersTable.name,

        leadCapacity: multichannelAssignmentsTable.leadCapacity,

        userRole: usersTable.role,

        userStatus: usersTable.status,

        status: multichannelAssignmentsTable.status,
      })
      .from(multichannelAssignmentsTable)
      .innerJoin(
        productsTable,
        eq(multichannelAssignmentsTable.productId, productsTable.id),
      )
      .innerJoin(
        usersTable,
        eq(multichannelAssignmentsTable.userId, usersTable.id),
      )
      .where(eq(multichannelAssignmentsTable.susepId, susep.id))
      .orderBy(asc(productsTable.name), asc(usersTable.name)),

    db
      .select({
        id: productsTable.id,

        name: productsTable.name,
      })
      .from(productsTable)
      .where(
        and(
          eq(productsTable.insurerId, susep.insurerId),

          eq(productsTable.status, "ativo"),
        ),
      )
      .orderBy(asc(productsTable.name)),

    db
      .select({
        id: usersTable.id,

        name: usersTable.name,

        role: usersTable.role,
      })
      .from(usersTable)
      .where(eq(usersTable.status, "ativo"))
      .orderBy(asc(usersTable.name)),
  ]);

  return {
    susep: {
      id: susep.id,

      code: susep.code,

      status: susep.status,

      multichannel: susep.multichannel,

      enterpriseInsurerId: susep.enterpriseInsurerId,

      insurerId: susep.insurerId,
    },

    assignments,

    products,

    users,
  };
};
