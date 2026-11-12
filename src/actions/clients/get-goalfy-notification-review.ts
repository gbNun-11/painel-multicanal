"use server";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/src/db";
import {
  clientsTable,
  enterpriseInsurersTable,
  enterprisesTable,
  goalfyDistributionBatchesTable,
  goalfyDistributionNotificationItemsTable,
  opportunitiesTable,
  usersTable,
} from "@/src/db/schema";
import {
  ActionError,
  adminActionClient,
} from "@/src/lib/safe-action";

const PAGE_SIZE = 25;

const schema = z.object({
  batchId: z.uuid(),
  page: z.number().int().min(0).max(10000),
});

// Somente leitura. Exclusivo para administradores.
// Não libera reenvio e não modifica notificações.
export const getGoalfyNotificationReviewAction =
  adminActionClient
    .inputSchema(schema)
    .action(async ({ parsedInput }) => {
      const { batchId, page } = parsedInput;

      const [batch] = await db
        .select({
          id: goalfyDistributionBatchesTable.id,
        })
        .from(goalfyDistributionBatchesTable)
        .where(eq(goalfyDistributionBatchesTable.id, batchId))
        .limit(1);

      if (!batch) {
        throw new ActionError("Lote não encontrado.");
      }

      const notification = goalfyDistributionNotificationItemsTable;

      const rows = await db
        .select({
          id: notification.id,
          opportunityId: notification.opportunityId,
          clientName: clientsTable.name,
          product: opportunitiesTable.product,
          enterpriseName: enterprisesTable.name,
          salespersonName: usersTable.name,
          channel: notification.channel,
          status: notification.status,
          attemptCount: notification.attemptCount,
          lastErrorCode: notification.lastErrorCode,
          claimedAt: notification.claimedAt,
          updatedAt: notification.updatedAt,
        })
        .from(notification)
        .innerJoin(
          opportunitiesTable,
          eq(notification.opportunityId, opportunitiesTable.id),
        )
        .innerJoin(
          clientsTable,
          eq(opportunitiesTable.clientId, clientsTable.id),
        )
        .innerJoin(
          usersTable,
          eq(notification.salespersonId, usersTable.id),
        )
        .innerJoin(
          enterpriseInsurersTable,
          eq(
            notification.enterpriseInsurerId,
            enterpriseInsurersTable.id,
          ),
        )
        .innerJoin(
          enterprisesTable,
          eq(
            enterpriseInsurersTable.enterpriseId,
            enterprisesTable.id,
          ),
        )
        .where(
          and(
            eq(notification.batchId, batchId),
            inArray(notification.status, ["uncertain", "sending"]),
          ),
        )
        .orderBy(
          desc(notification.updatedAt),
          asc(notification.id),
        )
        .limit(PAGE_SIZE + 1)
        .offset(page * PAGE_SIZE);

      return {
        batchId,
        page,
        hasMore: rows.length > PAGE_SIZE,
        items: rows.slice(0, PAGE_SIZE).map((row) => ({
          ...row,
          claimedAt: row.claimedAt?.toISOString() ?? null,
          updatedAt: row.updatedAt.toISOString(),
        })),
      };
    });
