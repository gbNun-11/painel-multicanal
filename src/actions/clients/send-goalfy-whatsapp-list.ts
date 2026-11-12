"use server";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/src/db";
import {
  clientsTable,
  enterpriseInsurersTable,
  enterprisesTable,
  opportunitiesTable,
  usersTable,
} from "@/src/db/schema";
import { sendGoalfyWhatsAppList } from "@/src/integrations/goalfy/send-whatsapp-list";
import { protectedActionClient } from "@/src/lib/safe-action";
import sendGoalfyWhatsAppListSchema from "@/src/schemas/client/sendGoalfyWhatsAppListSchema";
import {
  claimGoalfyNotificationGroup,
  type GoalfyNotificationSelection,
  settleGoalfyNotificationGroup,
} from "@/src/services/opportunities/goalfy-notification-lifecycle";

export const sendGoalfyWhatsAppListAction = protectedActionClient
  .inputSchema(sendGoalfyWhatsAppListSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { salespersonId, enterpriseInsurerId, clientIds, batchId } =
      parsedInput;

    let tracked: GoalfyNotificationSelection | null = null;
    let claimed = false;

    try {
      const [salespersonResult, enterpriseResult] = await Promise.all([
        db
          .select({
            id: usersTable.id,

            name: usersTable.name,

            phone: usersTable.phone,
          })
          .from(usersTable)
          .where(
            and(
              eq(usersTable.id, salespersonId),

              eq(usersTable.role, "comercial"),

              eq(usersTable.status, "ativo"),
            ),
          )
          .limit(1),

        db
          .select({
            enterpriseId: enterprisesTable.id,

            enterpriseName: enterprisesTable.name,
          })
          .from(enterpriseInsurersTable)
          .innerJoin(
            enterprisesTable,
            eq(enterpriseInsurersTable.enterpriseId, enterprisesTable.id),
          )
          .where(eq(enterpriseInsurersTable.id, enterpriseInsurerId))
          .limit(1),
      ]);

      const salesperson = salespersonResult[0];

      if (!salesperson) {
        throw new Error("Usuário comercial não encontrado ou inativo.");
      }

      const enterprise = enterpriseResult[0];

      if (!enterprise) {
        throw new Error("Empresa não encontrada.");
      }

      const clients = await db
        .select({
          id: opportunitiesTable.id,

          name: clientsTable.name,

          phone: clientsTable.phone,
        })
        .from(opportunitiesTable)
        .innerJoin(
          clientsTable,
          eq(opportunitiesTable.clientId, clientsTable.id),
        )
        .where(
          and(
            inArray(opportunitiesTable.id, clientIds),

            eq(opportunitiesTable.enterpriseInsurerId, enterpriseInsurerId),

            eq(opportunitiesTable.salespersonId, salespersonId),

            eq(opportunitiesTable.distributionStatus, "distribuido"),
          ),
        );

      if (clients.length === 0) {
        throw new Error(
          "Nenhum cliente distribuído válido foi encontrado para envio.",
        );
      }

      if (clients.length !== clientIds.length) {
        throw new Error(
          "Algumas oportunidades não pertencem à distribuição informada.",
        );
      }

      const clientsText = clients
        .map((client) => {
          const phone = client.phone?.trim() || "Sem telefone";

          return `${client.name} - ${phone}`;
        })
        .join("\n");

      const payload = {
        telefone: salesperson.phone.trim(),

        empresa: enterprise.enterpriseName,

        clientes: clientsText,
      };

      if (batchId) {
        tracked = {
          batchId,
          initiatedByUserId: ctx.user.id,
          channel: "whatsapp",
          enterpriseInsurerId,
          salespersonId,
          opportunityIds: clientIds,
        };

        await claimGoalfyNotificationGroup(tracked);
        claimed = true;
      }

      const webhookResult = await sendGoalfyWhatsAppList(payload);

      const acknowledged =
        webhookResult.status >= 200 &&
        webhookResult.status < 300 &&
        typeof webhookResult.body === "object" &&
        webhookResult.body !== null &&
        "status" in webhookResult.body &&
        webhookResult.body.status === "success";

      if (!acknowledged) {
        throw new Error("O webhook respondeu sem confirmação de aceite.");
      }

      if (tracked) {
        await settleGoalfyNotificationGroup({
          ...tracked,
          result: "delivered",
        });
        claimed = false;
      }

      console.info("[GOALFY WHATSAPP] Aceite confirmado:", {
        status: webhookResult.status,
        opportunities: clients.length,
        tracked: Boolean(tracked),
      });

      return {
        success: true,

        sent: clients.length,
      };
    } catch (error) {
      if (claimed && tracked) {
        try {
          await settleGoalfyNotificationGroup({
            ...tracked,
            result: "uncertain",
            errorCode: "whatsapp_delivery_unconfirmed",
          });
        } catch {
          console.error(
            "[GOALFY WHATSAPP] Revisão manual necessária: " +
              "não foi possível registrar o resultado do envio.",
          );
        }
      }

      const message =
        error instanceof Error
          ? error.message
          : "Erro desconhecido no envio do WhatsApp.";

      console.error("[GOALFY WHATSAPP] Falha:", message);

      return {
        success: false,

        error: message,
      };
    }
  });
