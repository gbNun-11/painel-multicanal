"use server";

import { protectedActionClient } from "@/src/lib/safe-action";
import distributeSelectedGoalfyClientSchema from "@/src/schemas/client/distributeSelectedGoalfyClientSchema";
import { distributeGoalfyOpportunity } from "@/src/services/opportunities/distribute-goalfy-opportunity";

export const distributeSelectedGoalfyClientAction = protectedActionClient
  .inputSchema(distributeSelectedGoalfyClientSchema)
  .action(async ({ parsedInput }) => {
    return distributeGoalfyOpportunity({
      kind: "selected",

      opportunityId: parsedInput.clientId,

      salespersonId: parsedInput.salespersonId,
    });
  });
