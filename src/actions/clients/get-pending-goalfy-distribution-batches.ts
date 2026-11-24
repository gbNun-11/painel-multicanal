"use server";

import { and, asc, desc, eq, inArray, notExists, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/src/db";
import {
  goalfyDistributionBatchesTable,
  goalfyDistributionBatchItemsTable,
  goalfyDistributionNotificationItemsTable,
  usersTable,
} from "@/src/db/schema";
import { protectedActionClient } from "@/src/lib/safe-action";

const PAGE_SIZE = 30;
const CLEANUP_BATCHES_PER_REQUEST = 30;
const STALE_NOTIFICATION_MS = 30 * 60 * 1000;

const PENDING_STATUSES = [
  "running",
  "reconciling",
  "interrupted",
];

const schema = z.object({
  page: z.number().int().min(0).max(100000),
});

export const getPendingGoalfyDistributionBatchesAction =
  protectedActionClient
    .inputSchema(schema)
    .action(async ({ parsedInput, ctx }) => {
      const canViewAll = ctx.user.role === "admin";

      const scope = canViewAll
        ? inArray(
            goalfyDistributionBatchesTable.status,
            PENDING_STATUSES,
          )
        : and(
            eq(
              goalfyDistributionBatchesTable.initiatedByUserId,
              ctx.user.id,
            ),
            inArray(
              goalfyDistributionBatchesTable.status,
              PENDING_STATUSES,
            ),
          );

      // Conciliações antigas podem ter todos os cards confirmados, mas
      // continuar visíveis apenas porque um aviso (e-mail/WhatsApp) ficou
      // "uncertain". Como a outbox é temporária, encerrar esses lotes não
      // exige aceite administrativo nem novo envio de mensagens.
      //
      // A busca abaixo é um pré-filtro. A transação revalida TODOS os
      // requisitos sob FOR UPDATE para não encerrar lotes em andamento.
      const batchItems = goalfyDistributionBatchItemsTable;
      const notificationItems = goalfyDistributionNotificationItemsTable;
      const candidates = await db
        .select({ id: goalfyDistributionBatchesTable.id })
        .from(goalfyDistributionBatchesTable)
        .where(
          and(
            scope,
            eq(goalfyDistributionBatchesTable.status, "reconciling"),
            notExists(
              db
                .select({ id: batchItems.id })
                .from(batchItems)
                .where(eq(batchItems.batchId, goalfyDistributionBatchesTable.id)),
            ),
            notExists(
              db
                .select({ id: notificationItems.id })
                .from(notificationItems)
                .where(
                  and(
                    eq(notificationItems.batchId, goalfyDistributionBatchesTable.id),
                    inArray(notificationItems.status, ["pending", "sending"]),
                  ),
                ),
            ),
          ),
        )
        .orderBy(asc(goalfyDistributionBatchesTable.startedAt))
        .limit(CLEANUP_BATCHES_PER_REQUEST);

      for (const candidate of candidates) {
        try {
          await db.transaction(async (tx) => {
            const [batch] = await tx
              .select({
                id: goalfyDistributionBatchesTable.id,
                initiatedByUserId:
                  goalfyDistributionBatchesTable.initiatedByUserId,
                status: goalfyDistributionBatchesTable.status,
              })
              .from(goalfyDistributionBatchesTable)
              .where(eq(goalfyDistributionBatchesTable.id, candidate.id))
              .limit(1)
              .for("update");

            if (
              !batch ||
              batch.status !== "reconciling" ||
              (!canViewAll && batch.initiatedByUserId !== ctx.user.id)
            ) {
              return;
            }

            const [pendingCards] = await tx
              .select({ total: sql<number>`count(*)::integer` })
              .from(batchItems)
              .where(eq(batchItems.batchId, batch.id));

            if ((pendingCards?.total ?? 0) !== 0) return;

            const [unsentNotifications] = await tx
              .select({ total: sql<number>`count(*)::integer` })
              .from(notificationItems)
              .where(
                and(
                  eq(notificationItems.batchId, batch.id),
                  inArray(notificationItems.status, ["pending", "sending"]),
                ),
              );

            // Nunca descarta uma notificação não tentada ou com requisição
            // em curso. "uncertain" não é "delivered" e não será reenviada.
            if ((unsentNotifications?.total ?? 0) !== 0) return;

            await tx
              .delete(notificationItems)
              .where(eq(notificationItems.batchId, batch.id));

            await tx
              .delete(goalfyDistributionBatchesTable)
              .where(
                and(
                  eq(goalfyDistributionBatchesTable.id, batch.id),
                  eq(goalfyDistributionBatchesTable.status, "reconciling"),
                ),
              );
          });
        } catch (error) {
          // Falha em um lote não deve impedir a consulta dos demais.
          console.error("[GOALFY BATCH CLEANUP] Não foi possível encerrar lote:", {
            batchId: candidate.id,
            error,
          });
        }
      }

      const rows = await db
        .select({
          id: goalfyDistributionBatchesTable.id,
          mode: goalfyDistributionBatchesTable.mode,
          status: goalfyDistributionBatchesTable.status,
          startedAt: goalfyDistributionBatchesTable.startedAt,
          updatedAt: goalfyDistributionBatchesTable.updatedAt,
          operatorName: usersTable.name,
          initiatedByUserId:
            goalfyDistributionBatchesTable.initiatedByUserId,
        })
        .from(goalfyDistributionBatchesTable)
        .innerJoin(
          usersTable,
          eq(
            usersTable.id,
            goalfyDistributionBatchesTable.initiatedByUserId,
          ),
        )
        .where(scope)
        .orderBy(
          desc(goalfyDistributionBatchesTable.startedAt),
          desc(goalfyDistributionBatchesTable.id),
        )
        .limit(PAGE_SIZE + 1)
        .offset(parsedInput.page * PAGE_SIZE);

      const hasMore = rows.length > PAGE_SIZE;
      const batches = rows.slice(0, PAGE_SIZE);

      if (batches.length === 0) {
        return {
          batches: [],
          hasMore: false,
          canViewAll,
        };
      }

      const counts = await db
        .select({
          batchId: goalfyDistributionBatchItemsTable.batchId,
          status: goalfyDistributionBatchItemsTable.status,
          total: sql<number>`count(*)::integer`,
          latestUpdatedAt: sql<Date | null>`
            max(${goalfyDistributionBatchItemsTable.updatedAt})
          `,
        })
        .from(goalfyDistributionBatchItemsTable)
        .where(
          inArray(
            goalfyDistributionBatchItemsTable.batchId,
            batches.map((batch) => batch.id),
          ),
        )
        .groupBy(
          goalfyDistributionBatchItemsTable.batchId,
          goalfyDistributionBatchItemsTable.status,
        );

      const notifications = await db
        .select({
          batchId: goalfyDistributionNotificationItemsTable.batchId,
          channel: goalfyDistributionNotificationItemsTable.channel,
          status: goalfyDistributionNotificationItemsTable.status,
          total: sql<number>`count(*)::integer`,
          latestUpdatedAt: sql<Date | null>`max(${goalfyDistributionNotificationItemsTable.updatedAt})`,
        })
        .from(goalfyDistributionNotificationItemsTable)
        .where(
          inArray(
            goalfyDistributionNotificationItemsTable.batchId,
            batches.map((batch) => batch.id),
          ),
        )
        .groupBy(
          goalfyDistributionNotificationItemsTable.batchId,
          goalfyDistributionNotificationItemsTable.channel,
          goalfyDistributionNotificationItemsTable.status,
        );

      return {
        hasMore,
        canViewAll,
        batches: batches.map((batch) => {
          const entries = counts.filter(
            (row) => row.batchId === batch.id,
          );

          const lastActivityAt = Math.max(
            batch.startedAt.getTime(),
            batch.updatedAt.getTime(),
            ...entries.map((entry) =>
              entry.latestUpdatedAt
                ? new Date(entry.latestUpdatedAt).getTime()
                : 0,
            ),
          );

          const canRecoverRunning =
            batch.status === "running" &&
            Date.now() - lastActivityAt >= 30 * 60 * 1000;

          const countStatus = (status: string) =>
            entries
              .filter((row) => row.status === status)
              .reduce((sum, row) => sum + row.total, 0);

          const notificationEntries = notifications.filter(
            (item) => item.batchId === batch.id,
          );

          const countNotifications = (
            channel: string | null,
            status: string,
          ) =>
            notificationEntries
              .filter(
                (item) =>
                  (channel === null || item.channel === channel) &&
                  item.status === status,
              )
              .reduce((sum, item) => sum + item.total, 0);

          const whatsappPending = countNotifications(
            "whatsapp",
            "pending",
          );
          const emailPending = countNotifications(
            "email",
            "pending",
          );

          const remaining = entries.reduce(
            (sum, row) => sum + row.total,
            0,
          );
          const notificationSending = countNotifications(
            null,
            "sending",
          );
          const notificationUncertain = countNotifications(
            null,
            "uncertain",
          );

          // Notificações inconclusivas não exigem conferência do
          // administrador. Uma mensagem ainda em envio só impede
          // o encerramento enquanto sua tentativa estiver ativa.
          const recentSending = notificationEntries.some(
            (entry) =>
              entry.status === "sending" &&
              (!entry.latestUpdatedAt ||
                Date.now() - new Date(entry.latestUpdatedAt).getTime() <
                  STALE_NOTIFICATION_MS),
          );
          const canFinalize =
            remaining === 0 &&
            whatsappPending + emailPending === 0 &&
            !recentSending;

          return {
            batchId: batch.id,
            mode: batch.mode,
            status: batch.status,
            operatorName: batch.operatorName,
            canReconcile:
              batch.initiatedByUserId === ctx.user.id &&
              (["reconciling", "interrupted"].includes(batch.status) ||
                canRecoverRunning),
            canDispatch:
              batch.initiatedByUserId === ctx.user.id &&
              batch.status === "reconciling" &&
              remaining === 0 &&
              (whatsappPending + emailPending > 0 || canFinalize),
            whatsappPending,
            emailPending,
            notificationSending,
            notificationUncertain,
            notificationDelivered: countNotifications(null, "delivered"),
            startedAt: batch.startedAt.toISOString(),
            reserved: countStatus("reserved"),
            sent: countStatus("sent"),
            inconclusive: countStatus("inconclusive"),
            remaining,
          };
        }),
      };
    });
