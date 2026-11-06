import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { susepsTable } from "@/src/db/schema";

interface GetSusepsParams {
  enterpriseInsurerId: string;
}

export const getSuseps = async ({ enterpriseInsurerId }: GetSusepsParams) => {
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
