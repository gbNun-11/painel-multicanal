"use server";

import { db } from "@/src/db";
import { enterprisesTable } from "@/src/db/schema";
import { adminActionClient } from "@/src/lib/safe-action";
import createEnterpriseSchema from "@/src/schemas/enterprise/createEnterprisesSchema";

export const createEnterpriseAction = adminActionClient
  .inputSchema(createEnterpriseSchema)
  .action(async ({ parsedInput }) => {
    const [enterprise] = await db
      .insert(enterprisesTable)
      .values({
        name: parsedInput.name,
        cnpj: parsedInput.cnpj,
        status: parsedInput.status,
      })
      .returning({
        id: enterprisesTable.id,
        name: enterprisesTable.name,
        cnpj: enterprisesTable.cnpj,
        status: enterprisesTable.status,
      });

    return enterprise;
  });
