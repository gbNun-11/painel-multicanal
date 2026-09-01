"use server";

import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { enterprisesTable } from "@/src/db/schema";
import { adminActionClient } from "@/src/lib/safe-action";
import updateEnterpriseSchema from "@/src/schemas/enterprise/updateEnterpriseSchema";

export const updateEnterpriseAction = adminActionClient
  .inputSchema(updateEnterpriseSchema)
  .action(async ({ parsedInput }) => {
    const [enterprise] = await db
      .update(enterprisesTable)
      .set({
        name: parsedInput.name,
        cnpj: parsedInput.cnpj,
        status: parsedInput.status,
      })
      .where(eq(enterprisesTable.id, parsedInput.id))
      .returning();

    return enterprise;
  });
