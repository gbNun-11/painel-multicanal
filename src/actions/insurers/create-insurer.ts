"use server";

import { db } from "@/src/db";
import { insurersTable } from "@/src/db/schema";
import { adminActionClient } from "@/src/lib/safe-action";
import upsertInsurerSchema from "@/src/schemas/insurer/upsertInsurerSchema";
import { isDatabaseErrorCode } from "@/src/utils/database-errors";

export const createInsurerAction = adminActionClient
  .inputSchema(upsertInsurerSchema)
  .action(async ({ parsedInput }) => {
    try {
      const [createdInsurer] = await db
        .insert(insurersTable)
        .values({
          name: parsedInput.name,
          status: "ativo",
        })
        .returning({
          id: insurersTable.id,
        });

      if (!createdInsurer) {
        throw new Error("Não foi possível criar a seguradora.");
      }

      return {
        success: true,
      };
    } catch (error) {
      if (isDatabaseErrorCode(error, "23505")) {
        throw new Error("Já existe uma seguradora cadastrada com este nome.");
      }

      throw error;
    }
  });
