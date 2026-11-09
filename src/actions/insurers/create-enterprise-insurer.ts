"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/src/db";
import {
  enterpriseInsurersTable,
  enterprisesTable,
  insurersTable,
} from "@/src/db/schema";
import { adminActionClient } from "@/src/lib/safe-action";
import createEnterpriseInsurerSchema from "@/src/schemas/insurer/createEnterpriseInsurerSchema";
import { isDatabaseErrorCode } from "@/src/utils/database-errors";

export const createEnterpriseInsurerAction = adminActionClient
  .inputSchema(createEnterpriseInsurerSchema)
  .action(async ({ parsedInput }) => {
    const [enterprise, insurer] = await Promise.all([
      db
        .select({
          id: enterprisesTable.id,
        })
        .from(enterprisesTable)
        .where(
          and(
            eq(enterprisesTable.id, parsedInput.enterpriseId),
            eq(enterprisesTable.status, "ativo"),
          ),
        )
        .limit(1),

      db
        .select({
          id: insurersTable.id,
        })
        .from(insurersTable)
        .where(
          and(
            eq(insurersTable.id, parsedInput.insurerId),
            eq(insurersTable.status, "ativo"),
          ),
        )
        .limit(1),
    ]);

    if (!enterprise[0]) {
      throw new Error("Empresa não encontrada ou inativa.");
    }

    if (!insurer[0]) {
      throw new Error("Seguradora não encontrada ou inativa.");
    }

    try {
      const [createdLink] = await db
        .insert(enterpriseInsurersTable)
        .values({
          enterpriseId: parsedInput.enterpriseId,
          insurerId: parsedInput.insurerId,
          status: "ativo",
        })
        .returning({
          id: enterpriseInsurersTable.id,
        });

      if (!createdLink) {
        throw new Error("Não foi possível vincular a seguradora.");
      }

      return {
        success: true,
      };
    } catch (error) {
      if (isDatabaseErrorCode(error, "23505")) {
        throw new Error(
          "Esta seguradora já está vinculada à empresa selecionada.",
        );
      }

      throw error;
    }
  });
