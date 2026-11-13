"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { db, pool } from "@/src/db";
import {
  goalfyDistributionBatchesTable,
  goalfyDistributionBatchItemsTable,
  goalfyDistributionNotificationItemsTable,
} from "@/src/db/schema";
import {
  buildGoalfyCardBody,
  createGoalfyCard,
} from "@/src/integrations/goalfy/create-card";
import { getGoalfyErrorDetails } from "@/src/integrations/goalfy/goalfy-fetch";
import { ActionError, protectedActionClient } from "@/src/lib/safe-action";
import { confirmTrackedGoalfyDistribution } from "@/src/services/opportunities/goalfy-distribution-lifecycle";
import { prepareGoalfyBatchReconciliation } from "@/src/services/opportunities/prepare-goalfy-batch-reconciliation";
import { prepareGoalfyCardForOpportunity } from "@/src/services/opportunities/prepare-goalfy-card-from-opportunity";

const schema = z.object({ batchId: z.uuid() });
const STALE_INITIAL_MS = 30 * 60 * 1000;

export const reconcileGoalfyDistributionBatchAction = protectedActionClient
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const batchId = parsedInput.batchId;
    const userId = ctx.user.id;
    const connection = await pool.connect();
    let locked = false;

    try {
      // O advisory lock do PostgreSQL permanece durante toda a execução.
      // Outro navegador, instância ou operador NÃO inicia um segundo ciclo.
      const guard = await connection.query<{ acquired: boolean }>(
        "SELECT pg_try_advisory_lock(hashtext('goalfy:reconcile'), hashtext($1)) AS acquired",
        [batchId],
      );
      locked = guard.rows[0]?.acquired === true;
      if (!locked) {
        throw new ActionError("Este lote já está sendo conferido.");
      }

      await db.transaction(async (tx) => {
        const [batch] = await tx
          .select({
            status: goalfyDistributionBatchesTable.status,
            startedAt: goalfyDistributionBatchesTable.startedAt,
            updatedAt: goalfyDistributionBatchesTable.updatedAt,
          })
          .from(goalfyDistributionBatchesTable)
          .where(
            and(
              eq(goalfyDistributionBatchesTable.id, batchId),
              eq(goalfyDistributionBatchesTable.initiatedByUserId, userId),
            ),
          )
          .limit(1)
          .for("update");

        if (!batch)
          throw new ActionError("Lote inexistente ou não autorizado.");

        if (batch.status === "running") {
          const [activity] = await tx
            .select({
              latest: sql<Date | null>`max(${goalfyDistributionBatchItemsTable.updatedAt})`,
            })
            .from(goalfyDistributionBatchItemsTable)
            .where(eq(goalfyDistributionBatchItemsTable.batchId, batchId));

          const activityTime = Math.max(
            batch.startedAt.getTime(),
            batch.updatedAt.getTime(),
            activity?.latest?.getTime() ?? 0,
          );
          if (Date.now() - activityTime < STALE_INITIAL_MS) {
            throw new ActionError("Importação inicial ainda em andamento.");
          }
        } else if (!["reconciling", "interrupted"].includes(batch.status)) {
          throw new ActionError("Lote indisponível para conferência.");
        }

        if (batch.status !== "reconciling") {
          await tx
            .update(goalfyDistributionBatchesTable)
            .set({ status: "reconciling", updatedAt: new Date() })
            .where(eq(goalfyDistributionBatchesTable.id, batchId));
        }
      });

      // Exatamente um snapshot completo por empresa nesta conferência.
      // Uma falha do AdvancedFilter NÃO autoriza reenvio de nenhum card.
      const snapshot = await prepareGoalfyBatchReconciliation({
        batchId,
        initiatedByUserId: userId,
      });

      const items = await db
        .select({
          opportunityId: goalfyDistributionBatchItemsTable.opportunityId,
          salespersonId: goalfyDistributionBatchItemsTable.salespersonId,
          status: goalfyDistributionBatchItemsTable.status,
          sentAt: goalfyDistributionBatchItemsTable.sentAt,
        })
        .from(goalfyDistributionBatchItemsTable)
        .where(eq(goalfyDistributionBatchItemsTable.batchId, batchId));

      const byId = new Map(items.map((item) => [item.opportunityId, item]));
      const confirmed: Array<{
        opportunityId: string;
        enterpriseInsurerId: string;
        salespersonId: string;
        product: string;
      }> = [];
      const unresolved: Array<{ opportunityId: string; reason: string }> = [];

      for (const decision of snapshot.results) {
        const item = byId.get(decision.opportunityId);

        if (!item || !["sent", "inconclusive"].includes(item.status)) {
          unresolved.push({
            opportunityId: decision.opportunityId,
            reason: "state_changed",
          });
          continue;
        }

        const tracking = {
          batchId,
          opportunityId: item.opportunityId,
          salespersonId: item.salespersonId,
        };

        if (decision.decision === "candidate") {
          try {
            const result = await confirmTrackedGoalfyDistribution(
              tracking,
              item.sentAt ?? new Date(),
            );
            confirmed.push(result);
          } catch {
            unresolved.push({
              opportunityId: item.opportunityId,
              reason: "confirmation_failed",
            });
          }
          continue;
        }

        if (decision.decision !== "not_found") {
          // Resposta incompleta, UUID duplicado ou dados divergentes:
          // preservar a oportunidade sem enviar POST.
          unresolved.push({
            opportunityId: item.opportunityId,
            reason: decision.decision,
          });
          continue;
        }

        // Preparar e validar antes de registrar novo início de POST.
        // Falha de validação não é erro de rede e não provoca tentativas cegas.
        let payload;
        try {
          payload = await prepareGoalfyCardForOpportunity({
            opportunityId: item.opportunityId,
            salespersonId: item.salespersonId,
            distributionAt: item.sentAt ?? new Date(),
          });
          buildGoalfyCardBody(payload);
        } catch {
          unresolved.push({
            opportunityId: item.opportunityId,
            reason: "payload_invalid",
          });
          continue;
        }

        const [claimed] = await db
          .update(goalfyDistributionBatchItemsTable)
          .set({
            status: "sent",
            attemptCount: sql`${goalfyDistributionBatchItemsTable.attemptCount} + 1`,
            sentAt: new Date(),
            lastCheckedAt: new Date(),
            errorCode: null,
            lastHttpStatus: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(goalfyDistributionBatchItemsTable.batchId, batchId),
              eq(
                goalfyDistributionBatchItemsTable.opportunityId,
                item.opportunityId,
              ),
              inArray(goalfyDistributionBatchItemsTable.status, [
                "sent",
                "inconclusive",
              ]),
            ),
          )
          .returning({ id: goalfyDistributionBatchItemsTable.id });

        if (!claimed) {
          unresolved.push({
            opportunityId: item.opportunityId,
            reason: "state_changed",
          });
          continue;
        }

        // Apenas UM POST para esta oportunidade neste clique.
        try {
          await createGoalfyCard(payload);
        } catch (error) {
          const details = getGoalfyErrorDetails(error);
          await db
            .update(goalfyDistributionBatchItemsTable)
            .set({
              status: "inconclusive",
              errorCode: "goalfy_create_unconfirmed",
              lastHttpStatus: details.status,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(goalfyDistributionBatchItemsTable.batchId, batchId),
                eq(
                  goalfyDistributionBatchItemsTable.opportunityId,
                  item.opportunityId,
                ),
                eq(goalfyDistributionBatchItemsTable.status, "sent"),
              ),
            );
          unresolved.push({
            opportunityId: item.opportunityId,
            reason: "post_unconfirmed",
          });
          continue;
        }

        try {
          confirmed.push(
            await confirmTrackedGoalfyDistribution(tracking, new Date()),
          );
        } catch {
          // POST aceito; preservar controle para consulta na próxima execução.
          unresolved.push({
            opportunityId: item.opportunityId,
            reason: "confirmation_failed",
          });
        }
      }

      // Reservations comprovadamente não enviadas permanecem separadas,
      // não são reenviadas sem validação.
      const final = await db.transaction(async (tx) => {
        const [batch] = await tx
          .select({ id: goalfyDistributionBatchesTable.id })
          .from(goalfyDistributionBatchesTable)
          .where(
            and(
              eq(goalfyDistributionBatchesTable.id, batchId),
              eq(goalfyDistributionBatchesTable.initiatedByUserId, userId),
              eq(goalfyDistributionBatchesTable.status, "reconciling"),
            ),
          )
          .limit(1)
          .for("update");

        if (!batch) throw new ActionError("Lote não está disponível.");

        const [itemsCount] = await tx
          .select({ total: sql<number>`count(*)::integer` })
          .from(goalfyDistributionBatchItemsTable)
          .where(eq(goalfyDistributionBatchItemsTable.batchId, batchId));

        const [notificationCount] = await tx
          .select({ total: sql<number>`count(*)::integer` })
          .from(goalfyDistributionNotificationItemsTable)
          .where(eq(goalfyDistributionNotificationItemsTable.batchId, batchId));

        const remaining = itemsCount?.total ?? 0;
        const notificationRemaining = notificationCount?.total ?? 0;

        if (remaining === 0 && notificationRemaining === 0) {
          await tx
            .delete(goalfyDistributionBatchesTable)
            .where(eq(goalfyDistributionBatchesTable.id, batchId));
          return { remaining, completed: true };
        }

        return { remaining, completed: false };
      });

      return {
        batchId,
        status: final.completed
          ? ("completed" as const)
          : ("reconciling" as const),
        confirmed,
        unresolved,
        remaining: final.remaining,
      };
    } finally {
      if (locked) {
        try {
          await connection.query(
            "SELECT pg_advisory_unlock(hashtext('goalfy:reconcile'), hashtext($1))",
            [batchId],
          );
        } finally {
          connection.release();
        }
      } else {
        connection.release();
      }
    }
  });
