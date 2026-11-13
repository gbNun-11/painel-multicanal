"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/src/db";
import {
  goalfyDistributionBatchesTable,
  goalfyDistributionBatchItemsTable,
  goalfyDistributionNotificationItemsTable,
} from "@/src/db/schema";
import { ActionError, protectedActionClient } from "@/src/lib/safe-action";
import { verifyGoalfyBatchCompletionToken } from "@/src/services/opportunities/goalfy-batch-completion-token";
import { releaseUnsentGoalfyDistribution } from "@/src/services/opportunities/goalfy-distribution-lifecycle";

const schema = z.object({
  batchId: z.uuid(),
  completionToken: z.string().regex(/^[a-f0-9]{64}$/),
});

// Fechamento inicial: nunca consulta AdvancedFilter nem faz novo POST.
// As oportunidades confirmadas já foram atualizadas individualmente.
export const finishGoalfyDistributionBatchAction = protectedActionClient
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const batchId = parsedInput.batchId;
    const userId = ctx.user.id;

    await db.transaction(async (tx) => {
      const [batch] = await tx
        .select({ status: goalfyDistributionBatchesTable.status })
        .from(goalfyDistributionBatchesTable)
        .where(and(
          eq(goalfyDistributionBatchesTable.id, batchId),
          eq(goalfyDistributionBatchesTable.initiatedByUserId, userId),
        ))
        .limit(1)
        .for("update");

      if (!batch || batch.status !== "running") {
        throw new ActionError("Lote inexistente ou indisponível para conclusão.");
      }
      if (!verifyGoalfyBatchCompletionToken(batchId, userId, parsedInput.completionToken)) {
        throw new ActionError("Código de conclusão do lote inválido.");
      }

      await tx.update(goalfyDistributionBatchesTable)
        .set({ status: "reconciling", updatedAt: new Date() })
        .where(eq(goalfyDistributionBatchesTable.id, batchId));
    });

    const items = await db
      .select({
        opportunityId: goalfyDistributionBatchItemsTable.opportunityId,
        salespersonId: goalfyDistributionBatchItemsTable.salespersonId,
        status: goalfyDistributionBatchItemsTable.status,
      })
      .from(goalfyDistributionBatchItemsTable)
      .where(eq(goalfyDistributionBatchItemsTable.batchId, batchId));

    // Antes do POST, reservas sem envio podem ser devolvidas para "novo".
    for (const item of items) {
      if (item.status !== "reserved") continue;
      try {
        await releaseUnsentGoalfyDistribution({
          batchId,
          opportunityId: item.opportunityId,
          salespersonId: item.salespersonId,
        });
      } catch {
        // Concorrência ou erro: preservar item, nunca eliminar sem certeza.
      }
    }

    const remainingItems = await db
      .select({
        opportunityId: goalfyDistributionBatchItemsTable.opportunityId,
        status: goalfyDistributionBatchItemsTable.status,
      })
      .from(goalfyDistributionBatchItemsTable)
      .where(eq(goalfyDistributionBatchItemsTable.batchId, batchId));

    const remaining = remainingItems.length;
    const unresolved = remainingItems.map((item) => ({
      opportunityId: item.opportunityId,
      reason: item.status,
    }));

    // Descarta a tabela temporária somente se todas as criações
    // terminaram e não há notificações pendentes vinculadas.
    const completed = await db.transaction(async (tx) => {
      const [batch] = await tx
        .select({ id: goalfyDistributionBatchesTable.id })
        .from(goalfyDistributionBatchesTable)
        .where(and(
          eq(goalfyDistributionBatchesTable.id, batchId),
          eq(goalfyDistributionBatchesTable.initiatedByUserId, userId),
          eq(goalfyDistributionBatchesTable.status, "reconciling"),
        ))
        .limit(1)
        .for("update");

      if (!batch) throw new ActionError("Lote não encontrado.");

      const [pending] = await tx
        .select({ total: sql<number>`count(*)::integer` })
        .from(goalfyDistributionBatchItemsTable)
        .where(eq(goalfyDistributionBatchItemsTable.batchId, batchId));

      const [notifications] = await tx
        .select({ total: sql<number>`count(*)::integer` })
        .from(goalfyDistributionNotificationItemsTable)
        .where(eq(goalfyDistributionNotificationItemsTable.batchId, batchId));

      if ((pending?.total ?? 0) > 0 || (notifications?.total ?? 0) > 0) return false;

      await tx.delete(goalfyDistributionBatchesTable)
        .where(eq(goalfyDistributionBatchesTable.id, batchId));

      return true;
    });

    return {
      batchId,
      status: completed ? ("completed" as const) : ("reconciling" as const),
      confirmed: [],
      unresolved,
      remaining,
    };
  });
