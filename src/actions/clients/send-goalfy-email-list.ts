"use server";

import { and, asc, eq, ilike, inArray } from "drizzle-orm";

import { db } from "@/src/db";
import {
  clientsTable,
  enterpriseInsurersTable,
  enterprisesTable,
  opportunitiesTable,
  usersTable,
} from "@/src/db/schema";
import { getSmtpAccountByEnterpriseId } from "@/src/integrations/email/config";
import {
  type DistributionCopyRecipient,
  DistributionPartialDeliveryError,
  sendDistributionEmail,
} from "@/src/integrations/email/send-distribution-email";
import { protectedActionClient } from "@/src/lib/safe-action";
import sendGoalfyEmailListSchema from "@/src/schemas/client/sendGoalfyEmailListSchema";
import {
  claimGoalfyNotificationGroup,
  settleGoalfyNotificationGroup,
} from "@/src/services/opportunities/goalfy-notification-lifecycle";

const normalizedProduct = (product: string | null) =>
  (product ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

const requiresThallesCopy = (product: string | null) =>
  ["AUTOMOVEL", "MOTO"].includes(normalizedProduct(product));

/**
 * Não fixa e-mail ou ID inventado no código.
 * Com GOALFY_AUTO_MOTO_CC_USER_ID configurado, consulta o ID exato.
 * Sem essa variável, só aceita um usuário ativo cujo primeiro nome seja
 * THALLES ou THALES. Se houver ambiguidade, interrompe o envio.
 */
const resolveThallesRecipient =
  async (): Promise<DistributionCopyRecipient> => {
    const explicitId = process.env.GOALFY_AUTO_MOTO_CC_USER_ID?.trim();

    const candidates = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
      })
      .from(usersTable)
      .where(
        explicitId
          ? and(eq(usersTable.id, explicitId), eq(usersTable.status, "ativo"))
          : and(
              eq(usersTable.status, "ativo"),
              ilike(usersTable.name, "thal%"),
            ),
      );

    const matches = explicitId
      ? candidates
      : candidates.filter((user) => {
          const firstName = user.name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .split(/\s+/)[0]
            ?.toUpperCase();
          return firstName === "THALLES" || firstName === "THALES";
        });

    if (matches.length !== 1) {
      throw new Error(
        "Não foi possível identificar de forma única o usuário THALLES ativo para " +
          "cópia de AUTOMÓVEL/MOTO. Confirme o cadastro ou configure " +
          "GOALFY_AUTO_MOTO_CC_USER_ID com o ID correto.",
      );
    }

    const user = matches[0];
    if (!user.email?.trim()) {
      throw new Error("O usuário THALLES não possui e-mail cadastrado.");
    }

    return { name: user.name, email: user.email.trim() };
  };

export const sendGoalfyEmailListAction = protectedActionClient
  .inputSchema(sendGoalfyEmailListSchema)
  .action(async ({ parsedInput, ctx }) => {
    const {
      salespersonId,
      enterpriseInsurerId,
      clientIds,
      batchId,
    } = parsedInput;
    let sentClients = 0;
    const deliveredGroups: Array<{
      group: string;
      messageId: string;
      count: number;
      reportFilename: string;
    }> = [];

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
              id: opportunitiesTable.id,
              name: clientsTable.name,
              document: clientsTable.document,
              phone: clientsTable.phone,
              email: clientsTable.email,
              product: opportunitiesTable.product,
              salesModel: opportunitiesTable.salesModel,
              propensity: opportunitiesTable.propensity,
              sourceCreatedAt: opportunitiesTable.sourceCreatedAt,
              assignedAt: opportunitiesTable.assignedAt,
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
      if (!enterprise) throw new Error("Empresa não encontrada.");

      if (clients.length === 0) {
        throw new Error(
          "Nenhuma oportunidade distribuída válida foi encontrada para envio por e-mail.",
        );
      }
      if (clients.length !== clientIds.length) {
        throw new Error(
          "Algumas oportunidades informadas não pertencem à distribuição solicitada.",
        );
      }

      const smtpAccount = getSmtpAccountByEnterpriseId(enterprise.enterpriseId);
      const baseData = {
        smtpAccount,
        enterpriseName: enterprise.enterpriseName,
        sender: { name: sender.name, email: sender.email.trim() },
        recipient: { name: salesperson.name, email: salesperson.email.trim() },
      };

      const autoMotoClients = clients.filter((client) =>
        requiresThallesCopy(client.product),
      );
      const ordinaryClients = clients.filter(
        (client) => !requiresThallesCopy(client.product),
      );

      // Resolve o CC obrigatório antes de disparar a primeira mensagem.
      // Não inclui no e-mail do THALLES produtos fora de AUTOMÓVEL/MOTO.
      const thalles =
        autoMotoClients.length > 0 ? await resolveThallesRecipient() : null;

      const groups = [
        ...(autoMotoClients.length > 0
          ? [
              {
                name: "AUTOMOVEL_MOTO",
                clients: autoMotoClients,
                cc: [thalles!],
              },
            ]
          : []),
        ...(ordinaryClients.length > 0
          ? [
              {
                name: "OUTROS_PRODUTOS",
                clients: ordinaryClients,
                cc: [] as DistributionCopyRecipient[],
              },
            ]
          : []),
      ];

      for (const group of groups) {
        const tracking = batchId
          ? {
              batchId,
              initiatedByUserId: ctx.user.id,
              channel: "email" as const,
              enterpriseInsurerId,
              salespersonId,
              opportunityIds: group.clients.map(
                (client) => client.id,
              ),
            }
          : null;

        let claimed = false;

        try {
          if (tracking) {
            // Registra o início antes de qualquer envio SMTP.
            await claimGoalfyNotificationGroup(tracking);
            claimed = true;
          }

          const result = await sendDistributionEmail(
            { ...baseData, clients: group.clients },
            group.cc,
          );

          if (tracking) {
            // Somente aceite completo permite delivered.
            await settleGoalfyNotificationGroup({
              ...tracking,
              result: "delivered",
            });

            claimed = false;
          }

          sentClients += group.clients.length;

          deliveredGroups.push({
            group: group.name,
            messageId: result.messageId,
            count: group.clients.length,
            reportFilename: result.reportFilename,
          });

          console.info(
            "[GOALFY EMAIL] Grupo aceito pelo SMTP:",
            {
              group: group.name,
              opportunities: group.clients.length,
              recipients: result.accepted.length,
              messageId: result.messageId,
              tracked: Boolean(tracking),
            },
          );
        } catch (error) {
          if (tracking && claimed) {
            try {
              // Mesmo uma resposta de erro pode acontecer
              // depois de o SMTP aceitar a mensagem.
              // Nunca liberar para reenvio automático.
              await settleGoalfyNotificationGroup({
                ...tracking,
                result: "uncertain",
                errorCode: "smtp_delivery_unconfirmed",
              });
            } catch {
              // Se a gravação falhar, sending permanece
              // bloqueado para conferência manual.
              console.error(
                "[GOALFY EMAIL] Não foi possível registrar " +
                  "o resultado. Revisão manual necessária.",
              );
            }
          }

          throw error;
        }
      }

      return {
        success: true,
        sent: sentClients,
        messageId: deliveredGroups[0]?.messageId ?? null,
        reportFilename: deliveredGroups[0]?.reportFilename ?? null,
        distributorNotified: true,
        distributorMessageId: deliveredGroups[0]?.messageId ?? null,
        deliveries: deliveredGroups,
      };
    } catch (error) {
      const partialDelivery =
        sentClients > 0 ||
        (error instanceof DistributionPartialDeliveryError &&
          error.accepted.length > 0);
      const message =
        error instanceof Error
          ? error.message
          : "Erro desconhecido no envio por e-mail.";

      console.warn("[GOALFY EMAIL] Falha no envio:", {
        message,
        sentClients,
        partialDelivery,
      });

      return {
        success: false,
        partialDelivery,
        sent: sentClients,
        error: partialDelivery
          ? `${message} Parte da distribuição já foi aceita pelo SMTP; não reenvie o lote completo.`
          : message,
        deliveries: deliveredGroups,
      };
    }
  });
