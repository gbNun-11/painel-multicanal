"use server";

import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/src/db";
import {
  clientsTable,
  goalfyDistributionBatchesTable,
  goalfyDistributionBatchItemsTable,
  opportunitiesTable,
  usersTable,
} from "@/src/db/schema";
import { ActionError, protectedActionClient } from "@/src/lib/safe-action";

const PAGE_SIZE = 50;
const schema = z.object({
  batchId: z.uuid(),
  page: z.number().int().min(0).max(100000),
});

export const getGoalfyBatchClientsAction = protectedActionClient
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const [batch] = await db
      .select({ initiatedByUserId: goalfyDistributionBatchesTable.initiatedByUserId })
      .from(goalfyDistributionBatchesTable)
      .where(eq(goalfyDistributionBatchesTable.id, parsedInput.batchId))
      .limit(1);

    if (!batch || (ctx.user.role !== "admin" && batch.initiatedByUserId !== ctx.user.id)) {
      throw new ActionError("Lote inexistente ou não autorizado.");
    }

    const rows = await db
      .select({
        opportunityId: opportunitiesTable.id,
        name: clientsTable.name,
        product: opportunitiesTable.product,
        salesModel: opportunitiesTable.salesModel,
        distributionStatus: opportunitiesTable.distributionStatus,
        batchStatus: goalfyDistributionBatchItemsTable.status,
        attemptCount: goalfyDistributionBatchItemsTable.attemptCount,
        errorCode: goalfyDistributionBatchItemsTable.errorCode,
        lastHttpStatus: goalfyDistributionBatchItemsTable.lastHttpStatus,
        salespersonName: usersTable.name,
      })
      .from(goalfyDistributionBatchItemsTable)
      .innerJoin(opportunitiesTable, eq(goalfyDistributionBatchItemsTable.opportunityId, opportunitiesTable.id))
      .innerJoin(clientsTable, eq(opportunitiesTable.clientId, clientsTable.id))
      .innerJoin(usersTable, eq(goalfyDistributionBatchItemsTable.salespersonId, usersTable.id))
      .where(eq(goalfyDistributionBatchItemsTable.batchId, parsedInput.batchId))
      .orderBy(asc(clientsTable.name), asc(opportunitiesTable.id))
      .limit(PAGE_SIZE + 1)
      .offset(parsedInput.page * PAGE_SIZE);

    return {
      clients: rows.slice(0, PAGE_SIZE),
      hasMore: rows.length > PAGE_SIZE,
    };
  });
