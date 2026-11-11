"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/src/db";
import {
  goalfyDistributionBatchesTable,
  goalfyDistributionBatchItemsTable,
  goalfyDistributionNotificationItemsTable,
} from "@/src/db/schema";
import {
  ActionError,
  protectedActionClient,
} from "@/src/lib/safe-action";
import {
  confirmTrackedGoalfyDistribution,
  releaseUnsentGoalfyDistribution,
} from "@/src/services/opportunities/goalfy-distribution-lifecycle";
import { prepareGoalfyBatchReconciliation } from "@/src/services/opportunities/prepare-goalfy-batch-reconciliation";

const schema = z.object({
  batchId: z.uuid(),
});

export const finishGoalfyDistributionBatchAction =
  protectedActionClient
    .inputSchema(schema)
    .action(async ({ parsedInput, ctx }) => {
      const batchId = parsedInput.batchId;
      const userId = ctx.user.id;

      // Bloqueia o lote enquanto muda seu estado.
      // Novas reservas rastreadas exigem status running.
      const alreadyCompleted = await db.transaction(async (tx) => {
        const [batch] = await tx
          .select({
            status: goalfyDistributionBatchesTable.status,
          })
          .from(goalfyDistributionBatchesTable)
          .where(
            and(
              eq(goalfyDistributionBatchesTable.id, batchId),
              eq(
                goalfyDistributionBatchesTable.initiatedByUserId,
                userId,
              ),
            ),
          )
          .limit(1)
          .for("update");

        if (!batch) {
          throw new ActionError(
            "Lote inexistente ou não autorizado.",
          );
        }

        if (batch.status === "completed") {
          return true;
        }

        await tx
          .update(goalfyDistributionBatchesTable)
          .set({
            status: "reconciling",
            updatedAt: new Date(),
          })
          .where(eq(goalfyDistributionBatchesTable.id, batchId));

        return false;
      });

      if (alreadyCompleted) {
        return {
          batchId,
          status: "completed" as const,
          confirmed: [],
          unresolved: [],
          remaining: 0,
        };
      }

      const items = await db
        .select({
          opportunityId:
            goalfyDistributionBatchItemsTable.opportunityId,
          salespersonId:
            goalfyDistributionBatchItemsTable.salespersonId,
          status: goalfyDistributionBatchItemsTable.status,
          sentAt: goalfyDistributionBatchItemsTable.sentAt,
          createdAt: goalfyDistributionBatchItemsTable.createdAt,
        })
        .from(goalfyDistributionBatchItemsTable)
        .where(
          eq(goalfyDistributionBatchItemsTable.batchId, batchId),
        );

      const itemsByOpportunity = new Map(
        items.map((item) => [item.opportunityId, item]),
      );

      const confirmed: {
        opportunityId: string;
        enterpriseInsurerId: string;
        salespersonId: string;
        product: string;
      }[] = [];
      const unresolved: {
        opportunityId: string;
        reason: string;
      }[] = [];

      // Libera somente reservas comprovadamente sem POST.
      // A transação verifica status=reserved e attemptCount=0.
      // Se uma tentativa começou simultaneamente, a liberação
      // falha e a oportunidade permanece protegida.
      for (const item of items) {
        if (item.status !== "reserved") {
          if (
            item.status !== "sent" &&
            item.status !== "inconclusive"
          ) {
            unresolved.push({
              opportunityId: item.opportunityId,
              reason: "unexpected_status",
            });
          }

          continue;
        }

        try {
          await releaseUnsentGoalfyDistribution({
            batchId,
            opportunityId: item.opportunityId,
            salespersonId: item.salespersonId,
          });
        } catch {
          unresolved.push({
            opportunityId: item.opportunityId,
            reason: "unsent_release_pending",
          });
        }
      }

      // Consultar a API apenas quando houve uma tentativa
      // de envio ou quando existe resultado inconclusivo.
      const needsGoalfyReconciliation = items.some(
        (item) =>
          item.status === "sent" ||
          item.status === "inconclusive",
      );

      if (needsGoalfyReconciliation) {
        let reconciliation: Awaited<
          ReturnType<typeof prepareGoalfyBatchReconciliation>
        >;

        try {
          reconciliation = await prepareGoalfyBatchReconciliation({
            batchId,
            initiatedByUserId: userId,
          });
        } catch {
          throw new ActionError(
            "A consulta Goalfy não foi concluída. " +
              "O lote permanece protegido para nova conciliação.",
          );
        }

        for (const result of reconciliation.results) {
          if (result.decision !== "candidate") {
            unresolved.push({
              opportunityId: result.opportunityId,
              reason: result.decision,
            });
            continue;
          }

          const item = itemsByOpportunity.get(result.opportunityId);

          if (
            !item ||
            (item.status !== "sent" &&
              item.status !== "inconclusive")
          ) {
            unresolved.push({
              opportunityId: result.opportunityId,
              reason: "state_changed",
            });
            continue;
          }

          try {
            const confirmedItem =
              await confirmTrackedGoalfyDistribution(
              {
                batchId,
                opportunityId: item.opportunityId,
                salespersonId: item.salespersonId,
              },
              item.sentAt ?? item.createdAt,
            );

            confirmed.push(confirmedItem);
          } catch {
            // A confirmação transacional falhou.
            // Não liberar e não repetir o POST.
            unresolved.push({
              opportunityId: item.opportunityId,
              reason: "confirmation_failed",
            });
          }
        }
      }

      const [countRow] = await db
        .select({
          remaining: sql<number>`count(*)::integer`,
        })
        .from(goalfyDistributionBatchItemsTable)
        .where(
          eq(goalfyDistributionBatchItemsTable.batchId, batchId),
        );

      const remaining = countRow?.remaining ?? 0;

      const [preferences] = await db
        .select({
          sendListByWhatsApp:
            goalfyDistributionBatchesTable.sendListByWhatsApp,
          sendListByEmail:
            goalfyDistributionBatchesTable.sendListByEmail,
        })
        .from(goalfyDistributionBatchesTable)
        .where(
          and(
            eq(goalfyDistributionBatchesTable.id, batchId),
            eq(
              goalfyDistributionBatchesTable.initiatedByUserId,
              userId,
            ),
          ),
        )
        .limit(1);

      if (!preferences) {
        throw new ActionError("Lote não encontrado.");
      }

      const [notificationCount] = await db
        .select({
          total: sql<number>`count(*)::integer`,
        })
        .from(goalfyDistributionNotificationItemsTable)
        .where(
          eq(
            goalfyDistributionNotificationItemsTable.batchId,
            batchId,
          ),
        );

      // Enquanto algum canal solicitado não tiver sido
      // processado, o lote deve continuar disponível.
      // Também preserva qualquer controle de notificação
      // existente, independentemente das preferências.
      const canRemoveBatch =
        remaining === 0 &&
        unresolved.length === 0 &&
        !preferences.sendListByWhatsApp &&
        !preferences.sendListByEmail &&
        (notificationCount?.total ?? 0) === 0;

      if (canRemoveBatch) {
        // O lote é temporário. Após confirmar todas as
        // oportunidades, remove seu cabeçalho também.
        await db.transaction(async (tx) => {
          const [batch] = await tx
            .select({
              id: goalfyDistributionBatchesTable.id,
            })
            .from(goalfyDistributionBatchesTable)
            .where(
              and(
                eq(goalfyDistributionBatchesTable.id, batchId),
                eq(
                  goalfyDistributionBatchesTable.initiatedByUserId,
                  userId,
                ),
                eq(
                  goalfyDistributionBatchesTable.status,
                  "reconciling",
                ),
              ),
            )
            .limit(1)
            .for("update");

          if (!batch) {
            throw new ActionError(
              "Lote não está disponível para exclusão.",
            );
          }

          // Confirma novamente dentro da transação que
          // nenhum controle temporário permanece no lote.
          const [pending] = await tx
            .select({
              total: sql<number>`count(*)::integer`,
            })
            .from(goalfyDistributionBatchItemsTable)
            .where(
              eq(goalfyDistributionBatchItemsTable.batchId, batchId),
            );

          if ((pending?.total ?? 0) !== 0) {
            throw new ActionError(
              "Lote possui oportunidades pendentes. Exclusão bloqueada.",
            );
          }

          const [deleted] = await tx
            .delete(goalfyDistributionBatchesTable)
            .where(
              and(
                eq(goalfyDistributionBatchesTable.id, batchId),
                eq(
                  goalfyDistributionBatchesTable.initiatedByUserId,
                  userId,
                ),
                eq(
                  goalfyDistributionBatchesTable.status,
                  "reconciling",
                ),
              ),
            )
            .returning({
              id: goalfyDistributionBatchesTable.id,
            });

          if (!deleted) {
            throw new ActionError(
              "Não foi possível excluir o lote concluído.",
            );
          }
        });
      }

      return {
        batchId,
        status:
          canRemoveBatch
            ? ("completed" as const)
            : ("reconciling" as const),
        confirmed,
        unresolved,
        remaining,
      };
    });
