"use server";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/src/db";
import {
  goalfyDistributionBatchesTable,
  goalfyDistributionBatchItemsTable,
  usersTable,
} from "@/src/db/schema";
import { protectedActionClient } from "@/src/lib/safe-action";

const PAGE_SIZE = 30;

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

      const rows = await db
        .select({
          id: goalfyDistributionBatchesTable.id,
          mode: goalfyDistributionBatchesTable.mode,
          status: goalfyDistributionBatchesTable.status,
          startedAt: goalfyDistributionBatchesTable.startedAt,
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

      return {
        hasMore,
        canViewAll,
        batches: batches.map((batch) => {
          const entries = counts.filter(
            (row) => row.batchId === batch.id,
          );

          const countStatus = (status: string) =>
            entries
              .filter((row) => row.status === status)
              .reduce((sum, row) => sum + row.total, 0);

          return {
            batchId: batch.id,
            mode: batch.mode,
            status: batch.status,
            operatorName: batch.operatorName,
            canReconcile:
              batch.initiatedByUserId === ctx.user.id &&
              ["reconciling", "interrupted"].includes(batch.status),
            startedAt: batch.startedAt.toISOString(),
            reserved: countStatus("reserved"),
            sent: countStatus("sent"),
            inconclusive: countStatus("inconclusive"),
            remaining: entries.reduce(
              (sum, row) => sum + row.total,
              0,
            ),
          };
        }),
      };
    });
