"use server";

import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { enterprisesTable } from "@/src/db/schema";
import { adminActionClient } from "@/src/lib/safe-action";
import changeEnterpriseStatusSchema from "@/src/schemas/enterprise/changeEnterpriseStatusSchema";

export const changeEnterpriseStatusAction = adminActionClient
  .inputSchema(changeEnterpriseStatusSchema)
  .action(async ({ parsedInput }) => {
    const [enterprise] = await db
      .update(enterprisesTable)
      .set({
        status: parsedInput.status,
      })
      .where(eq(enterprisesTable.id, parsedInput.id))
      .returning({
        id: enterprisesTable.id,
      });

    if (!enterprise) {
      throw new Error("Empresa não encontrada.");
    }

    return {
      success: true,
    };
  });
