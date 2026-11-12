"use server";

import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { sendGoalfyEmailListAction } from "@/src/actions/clients/send-goalfy-email-list";
import { sendGoalfyWhatsAppListAction } from "@/src/actions/clients/send-goalfy-whatsapp-list";
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
import type { GoalfyNotificationChannel } from "@/src/services/opportunities/goalfy-notification-lifecycle";

const schema = z.object({
  batchId: z.uuid(),
});

// Limites por execução: evitam requisições HTTP excessivamente
// longas, especialmente quando existem múltiplos grupos SMTP.
const MAX_ROWS_PER_DISPATCH = 200;
const MAX_GROUPS_PER_DISPATCH = 2;
const MAX_ITEMS_PER_GROUP = 100;

interface NotificationGroup {
  channel: GoalfyNotificationChannel;
  enterpriseInsurerId: string;
  salespersonId: string;
  opportunityIds: string[];
}

const notificationCounts = async (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  batchId: string,
) => {
  const table = goalfyDistributionNotificationItemsTable;

  const [counts] = await tx
    .select({
      total: sql<number>`count(*)::integer`,
      pending: sql<number>`
        count(*) FILTER (WHERE ${table.status} = 'pending')::integer
      `,
      sending: sql<number>`
        count(*) FILTER (WHERE ${table.status} = 'sending')::integer
      `,
      uncertain: sql<number>`
        count(*) FILTER (WHERE ${table.status} = 'uncertain')::integer
      `,
      delivered: sql<number>`
        count(*) FILTER (WHERE ${table.status} = 'delivered')::integer
      `,
    })
    .from(table)
    .where(eq(table.batchId, batchId));

  return {
    total: counts?.total ?? 0,
    pending: counts?.pending ?? 0,
    sending: counts?.sending ?? 0,
    uncertain: counts?.uncertain ?? 0,
    delivered: counts?.delivered ?? 0,
  };
};

const finishIfFullyDelivered = async (
  batchId: string,
  userId: string,
) => {
  return db.transaction(async (tx) => {
    const [batch] = await tx
      .select({
        id: goalfyDistributionBatchesTable.id,
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
      // Outra execução pode ter concluído o lote.
      return {
        completed: true,
        remainingDistributions: 0,
        notifications: {
          total: 0,
          pending: 0,
          sending: 0,
          uncertain: 0,
          delivered: 0,
        },
      };
    }

    if (batch.status !== "reconciling") {
      throw new ActionError(
        "Lote indisponível para encerramento.",
      );
    }

    const [distributionCount] = await tx
      .select({
        total: sql<number>`count(*)::integer`,
      })
      .from(goalfyDistributionBatchItemsTable)
      .where(
        eq(goalfyDistributionBatchItemsTable.batchId, batchId),
      );

    const remainingDistributions = distributionCount?.total ?? 0;

    const notifications = await notificationCounts(tx, batchId);

    // Preserva lotes com criações pendentes, mensagens em envio
    // ou resultados inconclusivos.
    // Um lote sem notificações não possui mensagens
    // aguardando processamento, mesmo que os canais
    // tenham sido solicitados inicialmente.
    const notificationsResolved =
      notifications.pending === 0 &&
      notifications.sending === 0 &&
      notifications.uncertain === 0 &&
      notifications.delivered === notifications.total;

    const completed =
      remainingDistributions === 0 &&
      notificationsResolved;

    if (!completed) {
      return {
        completed: false,
        remainingDistributions,
        notifications,
      };
    }

    // Primeiro remove controles de notificações já entregues.
    // O WHERE impede excluir registros não concluídos.
    const deletedNotifications = await tx
      .delete(goalfyDistributionNotificationItemsTable)
      .where(
        and(
          eq(
            goalfyDistributionNotificationItemsTable.batchId,
            batchId,
          ),
          eq(
            goalfyDistributionNotificationItemsTable.status,
            "delivered",
          ),
        ),
      )
      .returning({
        id: goalfyDistributionNotificationItemsTable.id,
      });

    if (deletedNotifications.length !== notifications.total) {
      throw new ActionError(
        "Contagem de notificações inconsistente. " +
          "Exclusão cancelada.",
      );
    }

    const [deletedBatch] = await tx
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

    if (!deletedBatch) {
      throw new ActionError(
        "Não foi possível remover o lote concluído.",
      );
    }

    return {
      completed: true,
      remainingDistributions: 0,
      notifications,
    };
  });
};

export const dispatchGoalfyBatchNotificationsAction =
  protectedActionClient
    .inputSchema(schema)
    .action(async ({ parsedInput, ctx }) => {
      const batchId = parsedInput.batchId;
      const userId = ctx.user.id;

      const [batch] = await db
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
        .limit(1);

      if (!batch || batch.status !== "reconciling") {
        throw new ActionError(
          "Lote inexistente, encerrado ou não autorizado.",
        );
      }

      const [distributionState] = await db
        .select({
          total: sql<number>`count(*)::integer`,
        })
        .from(goalfyDistributionBatchItemsTable)
        .where(
          eq(goalfyDistributionBatchItemsTable.batchId, batchId),
        );

      if ((distributionState?.total ?? 0) > 0) {
        throw new ActionError(
          "Notificações bloqueadas: o lote ainda possui " +
          "oportunidades aguardando conciliação.",
        );
      }

      // Lê exclusivamente entradas ainda não reservadas.
      // A reserva definitiva acontece dentro das ações
      // protegidas de WhatsApp e e-mail.
      const pending = await db
        .select({
          opportunityId:
            goalfyDistributionNotificationItemsTable.opportunityId,
          enterpriseInsurerId:
            goalfyDistributionNotificationItemsTable.enterpriseInsurerId,
          salespersonId:
            goalfyDistributionNotificationItemsTable.salespersonId,
          channel:
            goalfyDistributionNotificationItemsTable.channel,
        })
        .from(goalfyDistributionNotificationItemsTable)
        .where(
          and(
            eq(
              goalfyDistributionNotificationItemsTable.batchId,
              batchId,
            ),
            eq(
              goalfyDistributionNotificationItemsTable.status,
              "pending",
            ),
            eq(
              goalfyDistributionNotificationItemsTable.attemptCount,
              0,
            ),
          ),
        )
        .orderBy(
          asc(
            goalfyDistributionNotificationItemsTable.enterpriseInsurerId,
          ),
          asc(
            goalfyDistributionNotificationItemsTable.salespersonId,
          ),
          asc(goalfyDistributionNotificationItemsTable.channel),
          asc(
            goalfyDistributionNotificationItemsTable.opportunityId,
          ),
        )
        .limit(MAX_ROWS_PER_DISPATCH);

      const grouped = new Map<string, NotificationGroup>();

      for (const row of pending) {
        if (row.channel !== "whatsapp" && row.channel !== "email") {
          continue;
        }

        const key = [
          row.channel,
          row.enterpriseInsurerId,
          row.salespersonId,
        ].join(":");

        let group = grouped.get(key);

        if (!group) {
          group = {
            channel: row.channel,
            enterpriseInsurerId: row.enterpriseInsurerId,
            salespersonId: row.salespersonId,
            opportunityIds: [],
          };

          grouped.set(key, group);
        }

        if (group.opportunityIds.length < MAX_ITEMS_PER_GROUP) {
          group.opportunityIds.push(row.opportunityId);
        }
      }

      const groups = [...grouped.values()].slice(
        0,
        MAX_GROUPS_PER_DISPATCH,
      );

      let acceptedGroups = 0;
      let attentionGroups = 0;
      let processedOpportunities = 0;

      for (const group of groups) {
        const input = {
          batchId,
          salespersonId: group.salespersonId,
          enterpriseInsurerId: group.enterpriseInsurerId,
          clientIds: group.opportunityIds,
        };

        try {
          const response =
            group.channel === "whatsapp"
              ? await sendGoalfyWhatsAppListAction(input)
              : await sendGoalfyEmailListAction(input);

          if (response?.data?.success === true) {
            acceptedGroups += 1;
            processedOpportunities += group.opportunityIds.length;
          } else {
            // A própria ação registra delivered/uncertain
            // conforme a resposta externa de cada grupo.
            // Não repetir automaticamente.
            attentionGroups += 1;
          }
        } catch {
          // Mesmo uma exceção aqui pode ocorrer após o
          // serviço externo aceitar a mensagem.
          attentionGroups += 1;
        }
      }

      const completion = await finishIfFullyDelivered(
        batchId,
        userId,
      );

      return {
        batchId,
        completed: completion.completed,
        remainingDistributions: completion.remainingDistributions,
        notifications: completion.notifications,
        acceptedGroups,
        attentionGroups,
        processedOpportunities,
      };
    });
