"use server";

import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/src/db";
import {
  clientsTable,
  enterpriseInsurersTable,
  enterprisesTable,
  usersTable,
} from "@/src/db/schema";
import { getSmtpAccountByEnterpriseId } from "@/src/integrations/email/config";
import { sendDistributionEmail } from "@/src/integrations/email/send-distribution-email";
import { protectedActionClient } from "@/src/lib/safe-action";
import sendGoalfyEmailListSchema from "@/src/schemas/client/sendGoalfyEmailListSchema";

export const sendGoalfyEmailListAction = protectedActionClient
  .inputSchema(sendGoalfyEmailListSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { salespersonId, enterpriseInsurerId, clientIds } = parsedInput;

    try {
      const [senderResult, salespersonResult, enterpriseResult, clients] =
        await Promise.all([
          db
            .select({
              id: usersTable.id,

              name: usersTable.name,

              email: usersTable.email,
            })
            .from(usersTable)
            .where(eq(usersTable.id, ctx.user.id))
            .limit(1),

          db
            .select({
              id: usersTable.id,

              name: usersTable.name,

              email: usersTable.email,
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

          db
            .select({
              id: clientsTable.id,

              name: clientsTable.name,

              document: clientsTable.document,

              phone: clientsTable.phone,

              email: clientsTable.email,

              product: clientsTable.product,

              salesModel: clientsTable.salesModel,

              propensity: clientsTable.propensity,

              sourceCreatedAt: clientsTable.sourceCreatedAt,

              assignedAt: clientsTable.assignedAt,
            })
            .from(clientsTable)
            .where(
              and(
                inArray(clientsTable.id, clientIds),

                eq(clientsTable.enterpriseInsurerId, enterpriseInsurerId),

                eq(clientsTable.salespersonId, salespersonId),

                eq(clientsTable.status, "distribuido"),
              ),
            )
            .orderBy(asc(clientsTable.name)),
        ]);

      const sender = senderResult[0];

      if (!sender) {
        throw new Error(
          "Usuário responsável pela distribuição não encontrado.",
        );
      }

      if (!sender.email?.trim()) {
        throw new Error(
          "O usuário responsável pela distribuição não possui e-mail cadastrado.",
        );
      }

      const salesperson = salespersonResult[0];

      if (!salesperson) {
        throw new Error("Usuário comercial não encontrado ou inativo.");
      }

      if (!salesperson.email?.trim()) {
        throw new Error(
          `O usuário comercial ${salesperson.name} não possui e-mail cadastrado.`,
        );
      }

      const enterprise = enterpriseResult[0];

      if (!enterprise) {
        throw new Error("Empresa não encontrada.");
      }

      if (clients.length === 0) {
        throw new Error(
          "Nenhum cliente distribuído válido foi encontrado para envio por e-mail.",
        );
      }

      if (clients.length !== clientIds.length) {
        throw new Error(
          "Alguns clientes informados não pertencem à distribuição solicitada.",
        );
      }

      const smtpAccount = getSmtpAccountByEnterpriseId(enterprise.enterpriseId);

      const result = await sendDistributionEmail({
        smtpAccount,

        enterpriseName: enterprise.enterpriseName,

        sender: {
          name: sender.name,

          email: sender.email,
        },

        recipient: {
          name: salesperson.name,

          email: salesperson.email,
        },

        clients,
      });

      console.log("[GOALFY EMAIL] E-mail enviado:", {
        sender: sender.email,

        recipient: salesperson.email,

        enterprise: enterprise.enterpriseName,

        clients: clients.length,

        attachment: result.reportFilename,

        messageId: result.messageId,
      });

      return {
        success: true,

        sent: clients.length,

        messageId: result.messageId,

        reportFilename: result.reportFilename,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro desconhecido no envio por e-mail.";

      console.error("[GOALFY EMAIL] Erro:", error);

      return {
        success: false,

        error: message,
      };
    }
  });
