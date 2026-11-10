import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { susepsTable } from "@/src/db/schema";
import { PAGE_ACCESS, requirePageAccess } from "@/src/lib/require-page-access";

interface GetSusepsParams {
  enterpriseInsurerId: string;
}

export const getSuseps = async ({ enterpriseInsurerId }: GetSusepsParams) => {
  await requirePageAccess(PAGE_ACCESS.adminOnly);

  const suseps = await db
    .select({
      id: susepsTable.id,

      enterpriseInsurerId: susepsTable.enterpriseInsurerId,

      masterSusepId: susepsTable.masterSusepId,

      code: susepsTable.code,

      multichannel: susepsTable.multichannel,

      status: susepsTable.status,
    })
    .from(susepsTable)
    .where(eq(susepsTable.enterpriseInsurerId, enterpriseInsurerId))
    .orderBy(asc(susepsTable.code), asc(susepsTable.id));

  return suseps;
};
