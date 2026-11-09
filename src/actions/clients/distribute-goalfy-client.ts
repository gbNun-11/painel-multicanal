"use server";

import { protectedActionClient } from "@/src/lib/safe-action";
import distributeGoalfyClientSchema from "@/src/schemas/client/distributeGoalfyClientSchema";
import { distributeGoalfyOpportunity } from "@/src/services/opportunities/distribute-goalfy-opportunity";

export const distributeGoalfyClientAction = protectedActionClient
  .inputSchema(distributeGoalfyClientSchema)
  .action(async ({ parsedInput }) => {
    return distributeGoalfyOpportunity({
      kind: "automatic",

      enterpriseInsurerId: parsedInput.enterpriseInsurerId,

      product: parsedInput.product,

      salesModel: parsedInput.salesModel,

      salespersonId: parsedInput.salespersonId,
    });
  });
