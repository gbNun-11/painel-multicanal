"use server";

import { getSuseps } from "@/src/data/suseps/get-suseps";
import { adminActionClient } from "@/src/lib/safe-action";
import getSusepsSchema from "@/src/schemas/susep/getSusepsSchema";

export const getSusepsAction = adminActionClient
  .inputSchema(getSusepsSchema)
  .action(async ({ parsedInput }) => {
    const suseps = await getSuseps({
      enterpriseInsurerId: parsedInput.enterpriseInsurerId,
    });

    return {
      suseps,
    };
  });
