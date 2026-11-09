"use server";

import { and, eq, ne } from "drizzle-orm";

import { db } from "@/src/db";
import {
  enterpriseInsurersTable,
  multichannelAssignmentsTable,
  productsTable,
  susepsTable,
  usersTable,
} from "@/src/db/schema";
import { ActionError, adminActionClient } from "@/src/lib/safe-action";
import upsertMultichannelAssignmentSchema from "@/src/schemas/multichannel/upsertMultichannelAssignmentSchema";
import { isDatabaseErrorCode } from "@/src/utils/database-errors";

export const upsertMultichannelAssignmentAction = adminActionClient
  .inputSchema(upsertMultichannelAssignmentSchema)
  .action(async ({ parsedInput }) => {
    const [susep] = await db
      .select({
        id: susepsTable.id,

        code: susepsTable.code,

        status: susepsTable.status,

        multichannel: susepsTable.multichannel,

        insurerId: enterpriseInsurersTable.insurerId,

        enterpriseInsurerStatus: enterpriseInsurersTable.status,
      })
      .from(susepsTable)
      .innerJoin(
        enterpriseInsurersTable,
        eq(susepsTable.enterpriseInsurerId, enterpriseInsurersTable.id),
      )
      .where(eq(susepsTable.id, parsedInput.susepId))
      .limit(1);

    if (!susep) {
      throw new ActionError("SUSEP não encontrada.");
    }

    if (susep.enterpriseInsurerStatus !== "ativo") {
      throw new ActionError("O vínculo entre empresa e seguradora está inativo.");
    }

    if (susep.status !== "ativo") {
      throw new ActionError(`A SUSEP ${susep.code} está inativa.`);
    }

    if (!susep.multichannel) {
      throw new ActionError(
        `A SUSEP ${susep.code} não está configurada como multicanal.`,
      );
    }

    const [product] = await db
      .select({
        id: productsTable.id,

        insurerId: productsTable.insurerId,

        name: productsTable.name,

        status: productsTable.status,
      })
      .from(productsTable)
      .where(eq(productsTable.id, parsedInput.productId))
      .limit(1);

    if (!product) {
      throw new ActionError("Produto não encontrado.");
    }

    if (product.insurerId !== susep.insurerId) {
      throw new ActionError(
        `O produto ${product.name} não pertence à seguradora da SUSEP ${susep.code}.`,
      );
    }

    if (product.status !== "ativo") {
      throw new ActionError(`O produto ${product.name} está inativo.`);
    }

    const [user] = await db
      .select({
        id: usersTable.id,

        name: usersTable.name,

        status: usersTable.status,
      })
      .from(usersTable)
      .where(eq(usersTable.id, parsedInput.userId))
      .limit(1);

    if (!user) {
      throw new ActionError("Usuário não encontrado.");
    }

    if (user.status !== "ativo") {
      throw new ActionError(`O usuário ${user.name} está inativo.`);
    }

    if (parsedInput.id) {
      const [existingAssignment] = await db
        .select({
          id: multichannelAssignmentsTable.id,

          susepId: multichannelAssignmentsTable.susepId,

          productId: multichannelAssignmentsTable.productId,
        })
        .from(multichannelAssignmentsTable)
        .where(eq(multichannelAssignmentsTable.id, parsedInput.id))
        .limit(1);

      if (!existingAssignment) {
        throw new ActionError("Configuração multicanal não encontrada.");
      }

      if (existingAssignment.susepId !== parsedInput.susepId) {
        throw new ActionError(
          "Não é permitido mover uma configuração para outra SUSEP.",
        );
      }

      if (existingAssignment.productId !== parsedInput.productId) {
        throw new ActionError(
          "Não é permitido alterar o produto de uma configuração existente.",
        );
      }
    }

    const duplicateCondition = parsedInput.id
      ? and(
          eq(multichannelAssignmentsTable.susepId, parsedInput.susepId),

          eq(multichannelAssignmentsTable.productId, parsedInput.productId),

          ne(multichannelAssignmentsTable.id, parsedInput.id),
        )
      : and(
          eq(multichannelAssignmentsTable.susepId, parsedInput.susepId),

          eq(multichannelAssignmentsTable.productId, parsedInput.productId),
        );

    const [duplicateAssignment] = await db
      .select({
        id: multichannelAssignmentsTable.id,
      })
      .from(multichannelAssignmentsTable)
      .where(duplicateCondition)
      .limit(1);

    if (duplicateAssignment) {
      throw new ActionError(
        `A SUSEP ${susep.code} já possui uma configuração para o produto ${product.name}.`,
      );
    }

    try {
      if (parsedInput.id) {
        const [updatedAssignment] = await db
          .update(multichannelAssignmentsTable)
          .set({
            userId: parsedInput.userId,

            updatedAt: new Date(),
          })
          .where(eq(multichannelAssignmentsTable.id, parsedInput.id))
          .returning({
            id: multichannelAssignmentsTable.id,
          });

        if (!updatedAssignment) {
          throw new ActionError("Configuração multicanal não encontrada.");
        }

        return {
          success: true,

          mode: "updated" as const,

          id: updatedAssignment.id,
        };
      }

      const [createdAssignment] = await db
        .insert(multichannelAssignmentsTable)
        .values({
          susepId: parsedInput.susepId,

          productId: parsedInput.productId,

          userId: parsedInput.userId,
        })
        .returning({
          id: multichannelAssignmentsTable.id,
        });

      if (!createdAssignment) {
        throw new Error("Não foi possível criar a configuração multicanal.");
      }

      return {
        success: true,
      };
    } catch (error) {
      if (isDatabaseErrorCode(error, "23505")) {
        throw new ActionError(
          `A SUSEP ${susep.code} já possui uma configuração para o produto ${product.name}.`,
        );
      }

      throw error;
    }
  });
