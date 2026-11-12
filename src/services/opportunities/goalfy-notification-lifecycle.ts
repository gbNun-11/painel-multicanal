import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/src/db";
import {
  goalfyDistributionBatchesTable,
  goalfyDistributionNotificationItemsTable,
} from "@/src/db/schema";

export type GoalfyNotificationChannel = "whatsapp" | "email";

export interface GoalfyNotificationSelection {
  batchId: string;
  initiatedByUserId: string;
  channel: GoalfyNotificationChannel;
  enterpriseInsurerId: string;
  salespersonId: string;
  opportunityIds: string[];
}

const validateOpportunityIds = (ids: string[]) => {
  const uniqueIds = [...new Set(ids)];

  if (
    uniqueIds.length === 0 ||
    uniqueIds.length > 500 ||
    uniqueIds.length !== ids.length
  ) {
    throw new Error(
      "Grupo de notificações vazio, duplicado ou acima do limite.",
    );
  }

  return uniqueIds;
};

const notificationIdentity = (
  input: GoalfyNotificationSelection,
  ids: string[],
) =>
  and(
    eq(goalfyDistributionNotificationItemsTable.batchId, input.batchId),
    eq(goalfyDistributionNotificationItemsTable.channel, input.channel),
    eq(
      goalfyDistributionNotificationItemsTable.enterpriseInsurerId,
      input.enterpriseInsurerId,
    ),
    eq(
      goalfyDistributionNotificationItemsTable.salespersonId,
      input.salespersonId,
    ),
    inArray(goalfyDistributionNotificationItemsTable.opportunityId, ids),
  );

export const claimGoalfyNotificationGroup = async (
  input: GoalfyNotificationSelection,
) => {
  const ids = validateOpportunityIds(input.opportunityIds);

  return db.transaction(async (tx) => {
    const [batch] = await tx
      .select({
        status: goalfyDistributionBatchesTable.status,
        sendWhatsApp: goalfyDistributionBatchesTable.sendListByWhatsApp,
        sendEmail: goalfyDistributionBatchesTable.sendListByEmail,
      })
      .from(goalfyDistributionBatchesTable)
      .where(
        and(
          eq(goalfyDistributionBatchesTable.id, input.batchId),
          eq(
            goalfyDistributionBatchesTable.initiatedByUserId,
            input.initiatedByUserId,
          ),
        ),
      )
      .limit(1)
      .for("update");

    if (!batch || batch.status !== "reconciling") {
      throw new Error("Lote inexistente, não autorizado ou indisponível.");
    }

    const channelEnabled =
      input.channel === "whatsapp" ? batch.sendWhatsApp : batch.sendEmail;

    if (!channelEnabled) {
      throw new Error("Canal de notificação não autorizado para o lote.");
    }

    const available = await tx
      .select({
        opportunityId: goalfyDistributionNotificationItemsTable.opportunityId,
      })
      .from(goalfyDistributionNotificationItemsTable)
      .where(
        and(
          notificationIdentity(input, ids),
          eq(goalfyDistributionNotificationItemsTable.status, "pending"),
          eq(goalfyDistributionNotificationItemsTable.attemptCount, 0),
        ),
      );

    if (available.length !== ids.length) {
      throw new Error(
        "Uma ou mais notificações já foram reservadas, " +
          "enviadas ou estão pendentes de revisão.",
      );
    }

    const claimed = await tx
      .update(goalfyDistributionNotificationItemsTable)
      .set({
        status: "sending",
        attemptCount: sql`
          ${goalfyDistributionNotificationItemsTable.attemptCount} + 1
        `,
        claimedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          notificationIdentity(input, ids),
          eq(goalfyDistributionNotificationItemsTable.status, "pending"),
          eq(goalfyDistributionNotificationItemsTable.attemptCount, 0),
        ),
      )
      .returning({
        opportunityId: goalfyDistributionNotificationItemsTable.opportunityId,
      });

    if (claimed.length !== ids.length) {
      throw new Error("Reserva incompleta. Transação cancelada.");
    }

    return {
      claimed: claimed.length,
      opportunityIds: claimed.map((item) => item.opportunityId),
    };
  });
};

export const settleGoalfyNotificationGroup = async (
  input: GoalfyNotificationSelection & {
    result: "delivered" | "uncertain";
    errorCode?: string;
  },
) => {
  const ids = validateOpportunityIds(input.opportunityIds);

  return db.transaction(async (tx) => {
    const [batch] = await tx
      .select({
        status: goalfyDistributionBatchesTable.status,
      })
      .from(goalfyDistributionBatchesTable)
      .where(
        and(
          eq(goalfyDistributionBatchesTable.id, input.batchId),
          eq(
            goalfyDistributionBatchesTable.initiatedByUserId,
            input.initiatedByUserId,
          ),
        ),
      )
      .limit(1)
      .for("update");

    if (!batch || !["reconciling", "interrupted"].includes(batch.status)) {
      throw new Error("Lote indisponível para confirmar a notificação.");
    }

    const settled = await tx
      .update(goalfyDistributionNotificationItemsTable)
      .set({
        status: input.result,
        deliveredAt: input.result === "delivered" ? new Date() : null,
        lastErrorCode:
          input.result === "uncertain"
            ? input.errorCode?.trim().slice(0, 100) ||
              "external_delivery_unconfirmed"
            : null,
        updatedAt: new Date(),
      })
      .where(
        and(
          notificationIdentity(input, ids),
          eq(goalfyDistributionNotificationItemsTable.status, "sending"),
          eq(goalfyDistributionNotificationItemsTable.attemptCount, 1),
        ),
      )
      .returning({
        opportunityId: goalfyDistributionNotificationItemsTable.opportunityId,
      });

    if (settled.length !== ids.length) {
      throw new Error(
        "Estado da notificação mudou. " +
          "Confirmação cancelada para evitar inconsistência.",
      );
    }

    return {
      result: input.result,
      count: settled.length,
    };
  });
};
