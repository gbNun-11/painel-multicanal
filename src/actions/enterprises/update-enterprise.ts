"use server";

import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { enterprisesTable } from "@/src/db/schema";
import { adminActionClient } from "@/src/lib/safe-action";
import updateEnterpriseSchema from "@/src/schemas/enterprise/updateEnterpriseSchema";

export const updateEnterpriseAction = adminActionClient
  .inputSchema(updateEnterpriseSchema)
  .action(async ({ parsedInput }) => {
    try {
      const [updatedEnterprise] = await db
        .update(enterprisesTable)
        .set({
          name: parsedInput.name,
          cnpj: parsedInput.cnpj,
        })
        .where(eq(enterprisesTable.id, parsedInput.id))
        .returning({
          id: enterprisesTable.id,
        });

      if (!updatedEnterprise) {
        throw new Error("Empresa não encontrada.");
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
