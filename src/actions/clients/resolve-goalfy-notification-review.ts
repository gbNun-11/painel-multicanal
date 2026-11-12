"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/src/db";
import {
  goalfyDistributionBatchesTable,
  goalfyDistributionNotificationItemsTable,
  goalfyNotificationResolutionAuditTable,
} from "@/src/db/schema";
import {
  ActionError,
  adminActionClient,
} from "@/src/lib/safe-action";

const schema = z.object({
  notificationId: z.uuid(),
  evidenceSource: z.enum(["smtp_log", "whatsapp_log"]),
  evidenceReference: z.string().trim().min(6).max(240),
  resolutionNote: z.string().trim().min(20).max(500),
});

// Não envia e-mail, WhatsApp nem cria cards.
// Somente registra aceite previamente comprovado.
export const resolveGoalfyNotificationReviewAction =
  adminActionClient
    .inputSchema(schema)
    .action(async ({ parsedInput, ctx }) => {
      const result = await db.transaction(async (tx) => {
        const notificationTable =
          goalfyDistributionNotificationItemsTable;

        // Identifica o lote antes de adquirir o bloqueio.
        const [snapshot] = await tx
          .select({
            batchId: notificationTable.batchId,
          })
          .from(notificationTable)
          .where(
            eq(notificationTable.id, parsedInput.notificationId),
          )
          .limit(1);

        if (!snapshot) {
          throw new ActionError(
            "Notificação não encontrada ou já encerrada.",
          );
        }

        // Mesma ordem de bloqueio usada pelo despachante:
        // primeiro lote, depois notificação.
        const [batch] = await tx
          .select({
            status: goalfyDistributionBatchesTable.status,
          })
          .from(goalfyDistributionBatchesTable)
          .where(
            eq(
              goalfyDistributionBatchesTable.id,
              snapshot.batchId,
            ),
          )
          .limit(1)
          .for("update");

        if (!batch || batch.status !== "reconciling") {
          throw new ActionError(
            "Lote indisponível para resolução administrativa.",
          );
        }

        const [notification] = await tx
          .select({
            id: notificationTable.id,
            batchId: notificationTable.batchId,
            opportunityId: notificationTable.opportunityId,
            channel: notificationTable.channel,
            status: notificationTable.status,
            lastErrorCode: notificationTable.lastErrorCode,
          })
          .from(notificationTable)
          .where(
            and(
              eq(
                notificationTable.id,
                parsedInput.notificationId,
              ),
              eq(notificationTable.batchId, snapshot.batchId),
              eq(notificationTable.status, "uncertain"),
            ),
          )
          .limit(1)
          .for("update");

        if (!notification) {
          throw new ActionError(
            "Esta notificação não está mais inconclusiva.",
          );
        }

        const expectedSource =
          notification.channel === "email"
            ? "smtp_log"
            : "whatsapp_log";

        if (parsedInput.evidenceSource !== expectedSource) {
          throw new ActionError(
            "A fonte da evidência não corresponde ao canal.",
          );
        }

        const [updated] = await tx
          .update(notificationTable)
          .set({
            status: "delivered",
            deliveredAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(notificationTable.id, notification.id),
              eq(notificationTable.status, "uncertain"),
            ),
          )
          .returning({
            id: notificationTable.id,
          });

        if (!updated) {
          throw new ActionError(
            "O estado da notificação mudou. Operação cancelada.",
          );
        }

        // Auditoria e mudança de status são atômicas:
        // se a auditoria falhar, o UPDATE será revertido.
        const [audit] = await tx
          .insert(goalfyNotificationResolutionAuditTable)
          .values({
            batchId: notification.batchId,
            notificationId: notification.id,
            opportunityId: notification.opportunityId,
            channel: notification.channel,
            previousStatus: notification.status,
            previousErrorCode: notification.lastErrorCode,
            evidenceSource: parsedInput.evidenceSource,
            evidenceReference: parsedInput.evidenceReference,
            resolutionNote: parsedInput.resolutionNote,
            resolvedByUserId: ctx.user.id,
          })
          .returning({
            id: goalfyNotificationResolutionAuditTable.id,
          });

        if (!audit) {
          throw new ActionError(
            "Auditoria não registrada. Operação cancelada.",
          );
        }

        return {
          auditId: audit.id,
          batchId: notification.batchId,
          notificationId: notification.id,
        };
      });

      return {
        ...result,
        status: "delivered" as const,
      };
    });
