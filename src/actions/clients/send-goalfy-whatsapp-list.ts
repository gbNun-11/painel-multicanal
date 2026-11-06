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

export const sendGoalfyWhatsAppListAction = protectedActionClient
  .inputSchema(sendGoalfyWhatsAppListSchema)
  .action(async ({ parsedInput }) => {
    const { salespersonId, enterpriseInsurerId, clientIds } = parsedInput;

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

      /*
       * TEMPORÁRIO PARA O PRIMEIRO TESTE.
       *
       * Depois que confirmarmos que tudo
       * está correto, podemos remover.
       */
      console.log(
        "[GOALFY WHATSAPP] Payload:",
        JSON.stringify(payload, null, 2),
      );

      const webhookResult = await sendGoalfyWhatsAppList(payload);

      console.log("[GOALFY WHATSAPP] Resposta:", webhookResult);

      return {
        success: true,

        sent: clients.length,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro desconhecido no envio do WhatsApp.";

      console.error("[GOALFY WHATSAPP] Erro:", error);

      return {
        success: false,

        error: message,
      };
    }
  });
