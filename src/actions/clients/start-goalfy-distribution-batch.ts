"use server";

import { z } from "zod";

import { db } from "@/src/db";
import { goalfyDistributionBatchesTable } from "@/src/db/schema";
import { ActionError, protectedActionClient } from "@/src/lib/safe-action";
import {
  assertGoalfyBatchCompletionSecret,
  createGoalfyBatchCompletionToken,
} from "@/src/services/opportunities/goalfy-batch-completion-token";

const startGoalfyDistributionBatchSchema = z.object({
  mode: z.enum(["automatic", "selected"]),
  sendListByWhatsApp: z.boolean().default(false),
  sendListByEmail: z.boolean().default(false),
});

export const startGoalfyDistributionBatchAction = protectedActionClient
  .inputSchema(startGoalfyDistributionBatchSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Impede criar um lote sem chave de assinatura válida.
    assertGoalfyBatchCompletionSecret();

    const [batch] = await db
      .insert(goalfyDistributionBatchesTable)
      .values({
        initiatedByUserId: ctx.user.id,
        mode: parsedInput.mode,
        status: "running",
        sendListByWhatsApp: parsedInput.sendListByWhatsApp,
        sendListByEmail: parsedInput.sendListByEmail,
      })
      .returning({
        id: goalfyDistributionBatchesTable.id,
      });

    if (!batch) {
      throw new ActionError("Não foi possível iniciar o lote de distribuição.");
    }

    return {
      batchId: batch.id,
      completionToken: createGoalfyBatchCompletionToken(batch.id, ctx.user.id),
      status: "running" as const,
    };
  });
