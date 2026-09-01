"use server";

import { db } from "@/src/db";
import { enterprisesTable } from "@/src/db/schema";
import { adminActionClient } from "@/src/lib/safe-action";
import upsertEnterpriseSchema from "@/src/schemas/enterprise/upsertEnterprisesSchema";

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
      const databaseError = error as {
        code?: string;
        constraint?: string;
      };

      if (databaseError.code === "23505") {
        throw new Error("Já existe uma empresa cadastrada com este CNPJ.");
      }

      throw error;
    }
  });
