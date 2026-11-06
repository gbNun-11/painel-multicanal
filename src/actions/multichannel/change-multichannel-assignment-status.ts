"use server";

import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import {
  enterpriseInsurersTable,
  multichannelAssignmentsTable,
  productsTable,
  susepsTable,
  usersTable,
} from "@/src/db/schema";
import { adminActionClient } from "@/src/lib/safe-action";
import changeMultichannelAssignmentStatusSchema from "@/src/schemas/multichannel/changeMultichannelAssignmentStatusSchema";

export const changeMultichannelAssignmentStatusAction = adminActionClient
  .inputSchema(changeMultichannelAssignmentStatusSchema)
  .action(async ({ parsedInput }) => {
    const [assignment] = await db
      .select({
        id: multichannelAssignmentsTable.id,

        susepCode: susepsTable.code,

        susepStatus: susepsTable.status,

        multichannel: susepsTable.multichannel,

        enterpriseInsurerStatus: enterpriseInsurersTable.status,

        insurerId: enterpriseInsurersTable.insurerId,

        productName: productsTable.name,

        productStatus: productsTable.status,

        productInsurerId: productsTable.insurerId,

        userName: usersTable.name,

        userStatus: usersTable.status,
      })
      .from(multichannelAssignmentsTable)
      .innerJoin(
        susepsTable,
        eq(multichannelAssignmentsTable.susepId, susepsTable.id),
      )
      .innerJoin(
        enterpriseInsurersTable,
        eq(susepsTable.enterpriseInsurerId, enterpriseInsurersTable.id),
      )
      .innerJoin(
        productsTable,
        eq(multichannelAssignmentsTable.productId, productsTable.id),
      )
      .innerJoin(
        usersTable,
        eq(multichannelAssignmentsTable.userId, usersTable.id),
      )
      .where(eq(multichannelAssignmentsTable.id, parsedInput.id))
      .limit(1);

    if (!assignment) {
      throw new Error("Configuração multicanal não encontrada.");
    }

    if (parsedInput.status === "ativo") {
      if (assignment.enterpriseInsurerStatus !== "ativo") {
        throw new Error("O vínculo entre empresa e seguradora está inativo.");
      }

      if (assignment.susepStatus !== "ativo") {
        throw new Error(`A SUSEP ${assignment.susepCode} está inativa.`);
      }

      if (!assignment.multichannel) {
        throw new Error(
          `A SUSEP ${assignment.susepCode} não está configurada como multicanal.`,
        );
      }

      if (assignment.productStatus !== "ativo") {
        throw new Error(`O produto ${assignment.productName} está inativo.`);
      }

      if (assignment.productInsurerId !== assignment.insurerId) {
        throw new Error(
          `O produto ${assignment.productName} não pertence à seguradora da SUSEP ${assignment.susepCode}.`,
        );
      }

      if (assignment.userStatus !== "ativo") {
        throw new Error(`O usuário ${assignment.userName} está inativo.`);
      }
    }

    const [updatedAssignment] = await db
      .update(multichannelAssignmentsTable)
      .set({
        status: parsedInput.status,

        updatedAt: new Date(),
      })
      .where(eq(multichannelAssignmentsTable.id, parsedInput.id))
      .returning({
        id: multichannelAssignmentsTable.id,
      });

    if (!updatedAssignment) {
      throw new Error("Configuração multicanal não encontrada.");
    }

    return {
      success: true,
    };
  });
