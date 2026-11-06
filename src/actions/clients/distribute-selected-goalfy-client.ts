"use server";

import { distributeGoalfyOpportunity } from "@/src/services/opportunities/distribute-goalfy-opportunity";
import { protectedActionClient } from "@/src/lib/safe-action";
import distributeSelectedGoalfyClientSchema from "@/src/schemas/client/distributeSelectedGoalfyClientSchema";

export const distributeSelectedGoalfyClientAction = protectedActionClient
  .inputSchema(distributeSelectedGoalfyClientSchema)
  .action(async ({ parsedInput }) => {
    return distributeGoalfyOpportunity({
      kind: "selected",

      opportunityId: parsedInput.clientId,

      salespersonId: parsedInput.salespersonId,
    });
  });
