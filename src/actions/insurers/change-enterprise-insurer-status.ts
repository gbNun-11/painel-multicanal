"use server";

import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { enterpriseInsurersTable } from "@/src/db/schema";
import { adminActionClient } from "@/src/lib/safe-action";
import changeEnterpriseInsurerStatusSchema from "@/src/schemas/insurer/changeEnterpriseInsurerStatusSchema";

export const changeEnterpriseInsurerStatusAction = adminActionClient
  .inputSchema(changeEnterpriseInsurerStatusSchema)
  .action(async ({ parsedInput }) => {
    const [updatedEnterpriseInsurer] = await db
      .update(enterpriseInsurersTable)
      .set({
        status: parsedInput.status,
      })
      .where(eq(enterpriseInsurersTable.id, parsedInput.id))
      .returning({
        id: enterpriseInsurersTable.id,
      });

    if (!updatedEnterpriseInsurer) {
      throw new Error("Vínculo entre empresa e seguradora não encontrado.");
    }

    return {
      success: true,
    };
  });
