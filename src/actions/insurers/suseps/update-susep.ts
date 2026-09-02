"use server";

import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { susepsTable } from "@/src/db/schema";
import { adminActionClient } from "@/src/lib/safe-action";
import updateSusepSchema from "@/src/schemas/insurer/susep/updateSusepSchema";

export const updateSusepAction = adminActionClient
  .inputSchema(updateSusepSchema)
  .action(async ({ parsedInput }) => {
    try {
      const [updatedSusep] = await db
        .update(susepsTable)
        .set({
          code: parsedInput.code.trim().toUpperCase(),
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
      };
    } catch (error) {
      const databaseError = error as {
        code?: string;
      };

      if (databaseError.code === "23505") {
        throw new Error("Já existe uma SUSEP com este código neste vínculo.");
      }

      throw error;
    }
  });
