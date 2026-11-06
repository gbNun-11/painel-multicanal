"use server";

import { and, eq, ne } from "drizzle-orm";

import { db } from "@/src/db";
import {
  enterpriseInsurersTable,
  enterprisesTable,
  insurersTable,
  multichannelAssignmentsTable,
  susepsTable,
} from "@/src/db/schema";
import { adminActionClient } from "@/src/lib/safe-action";
import upsertSusepSchema from "@/src/schemas/susep/upsertSusepSchema";

export const upsertSusepAction = adminActionClient
  .inputSchema(upsertSusepSchema)
  .action(async ({ parsedInput }) => {
    const code = parsedInput.code.trim().toUpperCase();

    const [enterpriseInsurer] = await db
      .select({
        id: enterpriseInsurersTable.id,
      })
      .from(enterpriseInsurersTable)
      .innerJoin(
        enterprisesTable,
        eq(enterpriseInsurersTable.enterpriseId, enterprisesTable.id),
      )
      .innerJoin(
        insurersTable,
        eq(enterpriseInsurersTable.insurerId, insurersTable.id),
      )
      .where(
        and(
          eq(enterpriseInsurersTable.id, parsedInput.enterpriseInsurerId),
          eq(enterpriseInsurersTable.status, "ativo"),
          eq(enterprisesTable.status, "ativo"),
          eq(insurersTable.status, "ativo"),
        ),
      )
      .limit(1);

    if (!enterpriseInsurer) {
      throw new Error(
        "O vínculo entre empresa e seguradora não existe ou está inativo.",
      );
    }

    let existingSusep:
      | {
          id: string;
          enterpriseInsurerId: string;
          masterSusepId: string | null;
          multichannel: boolean;
        }
      | undefined;

    if (parsedInput.id) {
      [existingSusep] = await db
        .select({
          id: susepsTable.id,

          enterpriseInsurerId: susepsTable.enterpriseInsurerId,

          masterSusepId: susepsTable.masterSusepId,

          multichannel: susepsTable.multichannel,
        })
        .from(susepsTable)
        .where(eq(susepsTable.id, parsedInput.id))
        .limit(1);

      if (!existingSusep) {
        throw new Error("SUSEP não encontrada.");
      }

      if (
        existingSusep.enterpriseInsurerId !== parsedInput.enterpriseInsurerId
      ) {
        throw new Error(
          "Não é permitido alterar o vínculo da SUSEP com a empresa e seguradora.",
        );
      }
    }

    if (parsedInput.id && parsedInput.masterSusepId === parsedInput.id) {
      throw new Error("Uma SUSEP não pode ser Master dela mesma.");
    }

    if (parsedInput.masterSusepId) {
      const [masterSusep] = await db
        .select({
          id: susepsTable.id,

          masterSusepId: susepsTable.masterSusepId,

          status: susepsTable.status,
        })
        .from(susepsTable)
        .where(
          and(
            eq(susepsTable.id, parsedInput.masterSusepId),
            eq(
              susepsTable.enterpriseInsurerId,
              parsedInput.enterpriseInsurerId,
            ),
          ),
        )
        .limit(1);

      if (!masterSusep) {
        throw new Error(
          "A SUSEP Master não existe neste vínculo entre empresa e seguradora.",
        );
      }

      if (masterSusep.status !== "ativo") {
        throw new Error("A SUSEP Master selecionada está inativa.");
      }

      if (masterSusep.masterSusepId) {
        throw new Error("Uma SUSEP filha não pode ser utilizada como Master.");
      }

      if (parsedInput.id) {
        const [childSusep] = await db
          .select({
            id: susepsTable.id,
          })
          .from(susepsTable)
          .where(eq(susepsTable.masterSusepId, parsedInput.id))
          .limit(1);

        if (childSusep) {
          throw new Error(
            "Uma SUSEP que já possui SUSEPs vinculadas não pode se tornar filha de outra Master.",
          );
        }
      }
    }

    const duplicateConditions = [
      eq(susepsTable.enterpriseInsurerId, parsedInput.enterpriseInsurerId),
      eq(susepsTable.code, code),
    ];

    if (parsedInput.id) {
      duplicateConditions.push(ne(susepsTable.id, parsedInput.id));
    }

    const [duplicateSusep] = await db
      .select({
        id: susepsTable.id,
      })
      .from(susepsTable)
      .where(and(...duplicateConditions))
      .limit(1);

    if (duplicateSusep) {
      throw new Error("Já existe uma SUSEP com este código neste vínculo.");
    }

    if (
      parsedInput.id &&
      existingSusep?.multichannel &&
      !parsedInput.multichannel
    ) {
      const [assignment] = await db
        .select({
          id: multichannelAssignmentsTable.id,
        })
        .from(multichannelAssignmentsTable)
        .where(eq(multichannelAssignmentsTable.susepId, parsedInput.id))
        .limit(1);

      if (assignment) {
        throw new Error(
          "Remova as configurações multicanal desta SUSEP antes de desativar o modo multicanal.",
        );
      }
    }

    try {
      if (parsedInput.id) {
        const [updatedSusep] = await db
          .update(susepsTable)
          .set({
            masterSusepId: parsedInput.masterSusepId,

            code,

            multichannel: parsedInput.multichannel,

            updatedAt: new Date(),
          })
          .where(eq(susepsTable.id, parsedInput.id))
          .returning({
            id: susepsTable.id,
          });

        if (!updatedSusep) {
          throw new Error("SUSEP não encontrada.");
        }

        return {
          success: true,
          mode: "updated" as const,
          id: updatedSusep.id,
        };
      }

      const [createdSusep] = await db
        .insert(susepsTable)
        .values({
          enterpriseInsurerId: parsedInput.enterpriseInsurerId,

          masterSusepId: parsedInput.masterSusepId,

          code,

          multichannel: parsedInput.multichannel,
        })
        .returning({
          id: susepsTable.id,
        });

      if (!createdSusep) {
        throw new Error("Não foi possível criar a SUSEP.");
      }

      return {
        success: true,
      };
    } catch (error) {
      const databaseError = error as {
        code?: string;

        cause?: {
          code?: string;
        };
      };

      const errorCode = databaseError.code ?? databaseError.cause?.code;

      if (errorCode === "23505") {
        throw new Error("Já existe uma SUSEP com este código neste vínculo.");
      }

      throw error;
    }
  });
