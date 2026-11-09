"use server";

import { db } from "@/src/db";
import { enterprisesTable } from "@/src/db/schema";
import { ActionError, adminActionClient } from "@/src/lib/safe-action";
import upsertEnterpriseSchema from "@/src/schemas/enterprise/upsertEnterprisesSchema";
import { isDatabaseErrorCode } from "@/src/utils/database-errors";

export const createEnterpriseAction = adminActionClient
  .inputSchema(upsertEnterpriseSchema)
  .action(async ({ parsedInput }) => {
    try {
      const [createdEnterprise] = await db
        .insert(enterprisesTable)
        .values({
          name: parsedInput.name,
          cnpj: parsedInput.cnpj,
          status: "ativo",
        })
        .returning({
          id: enterprisesTable.id,
        });

      if (!createdEnterprise) {
        throw new Error("Não foi possível criar a empresa.");
      }

      return {
        success: true,
      };
    } catch (error) {
      if (isDatabaseErrorCode(error, "23505")) {
        throw new ActionError("Já existe uma empresa cadastrada com este CNPJ.");
      }

      throw error;
    }
  });
