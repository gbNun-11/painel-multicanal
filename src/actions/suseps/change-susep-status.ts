"use server";

import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { susepsTable } from "@/src/db/schema";
import { adminActionClient } from "@/src/lib/safe-action";
import changeSusepStatusSchema from "@/src/schemas/susep/changeSusepStatusSchema";

export const changeSusepStatusAction = adminActionClient
  .inputSchema(changeSusepStatusSchema)
  .action(async ({ parsedInput }) => {
    const [updatedSusep] = await db
      .update(susepsTable)
      .set({
        status: parsedInput.status,
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
  });
