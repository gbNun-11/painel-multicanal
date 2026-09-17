"use server";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/src/db";
import {
  clientsTable,
  enterpriseInsurersTable,
  insurersTable,
  usersTable,
} from "@/src/db/schema";
import { createGoalfyCard } from "@/src/integrations/goalfy/create-card";
import { getGoalfyErrorDetails } from "@/src/integrations/goalfy/goalfy-fetch";
import { protectedActionClient } from "@/src/lib/safe-action";
import distributeSelectedGoalfyClientSchema from "@/src/schemas/client/distributeSelectedGoalfyClientSchema";

export const distributeSelectedGoalfyClientAction = protectedActionClient
  .inputSchema(distributeSelectedGoalfyClientSchema)
  .action(async ({ parsedInput }) => {
    const { clientId, salespersonId } = parsedInput;

    const occurredAt = new Date().toISOString();

    const [clientMetadata] = await db
      .select({
        id: clientsTable.id,

        enterpriseInsurerId: clientsTable.enterpriseInsurerId,

        product: clientsTable.product,

        insurerName: insurersTable.name,
      })
      .from(clientsTable)
      .innerJoin(
        enterpriseInsurersTable,
        eq(clientsTable.enterpriseInsurerId, enterpriseInsurersTable.id),
      )
      .innerJoin(
        insurersTable,
        eq(enterpriseInsurersTable.insurerId, insurersTable.id),
      )
      .where(eq(clientsTable.id, clientId))
      .limit(1);

    if (!clientMetadata) {
      throw new Error("Cliente selecionado não encontrado.");
    }

    const product = clientMetadata.product?.trim() || "Produto não informado";

    const [salesperson] = await db
      .select({
        id: usersTable.id,
      })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.id, salespersonId),

          eq(usersTable.role, "comercial"),

          eq(usersTable.status, "ativo"),
        ),
      )
      .limit(1);

    if (!salesperson) {
      return {
        success: false,

        reason: "salesperson_unavailable" as const,

        failure: {
          stage: "database" as const,

          enterpriseInsurerId: clientMetadata.enterpriseInsurerId,

          product,

          salespersonId,

          clientId,

          message: "Usuário comercial não encontrado ou inativo.",

          details: null,

          attempts: null,

          statusCode: null,

          occurredAt,
        },
      };
    }

    const client = await db.transaction(async (tx) => {
      const [candidate] = await tx
        .select({
          id: clientsTable.id,

          enterpriseInsurerId: clientsTable.enterpriseInsurerId,

          name: clientsTable.name,

          document: clientsTable.document,

          email: clientsTable.email,

          phone: clientsTable.phone,

          birthDate: clientsTable.birthDate,

          product: clientsTable.product,

          salesModel: clientsTable.salesModel,

          sourceCreatedAt: clientsTable.sourceCreatedAt,

          propensity: clientsTable.propensity,

          model: clientsTable.model,

          modelYear: clientsTable.modelYear,

          licensePlate: clientsTable.licensePlate,

          assetValue: clientsTable.assetValue,

          zipCode: clientsTable.zipCode,

          address: clientsTable.address,

          state: clientsTable.state,

          city: clientsTable.city,

          neighborhood: clientsTable.neighborhood,

          observation: clientsTable.observation,

          externalStatusReason: clientsTable.externalStatusReason,

          status: clientsTable.status,

          currentSalespersonId: clientsTable.salespersonId,
        })
        .from(clientsTable)
        .where(eq(clientsTable.id, clientId))
        .limit(1)
        .for("update", {
          skipLocked: true,
        });

      if (!candidate) {
        return null;
      }

      if (
        candidate.status !== "novo" ||
        candidate.currentSalespersonId !== null
      ) {
        return null;
      }

      const [claimed] = await tx
        .update(clientsTable)
        .set({
          status: "distribuindo",

          updatedAt: new Date(),
        })
        .where(
          and(
            eq(clientsTable.id, candidate.id),

            eq(clientsTable.status, "novo"),

            isNull(clientsTable.salespersonId),
          ),
        )
        .returning({
          id: clientsTable.id,
        });

      if (!claimed) {
        return null;
      }

      return candidate;
    });

    if (!client) {
      return {
        success: false,

        reason: "client_unavailable" as const,

        failure: {
          stage: "database" as const,

          enterpriseInsurerId: clientMetadata.enterpriseInsurerId,

          product,

          salespersonId,

          clientId,

          message:
            "O cliente selecionado não está mais disponível para distribuição.",

          details:
            "O cliente pode ter sido distribuído por outra operação ou não estar mais com status 'novo'.",

          attempts: null,

          statusCode: null,

          occurredAt: new Date().toISOString(),
        },
      };
    }

    try {
      await createGoalfyCard({
        ...client,

        insurerName: clientMetadata.insurerName,
      });
    } catch (error) {
      const goalfyError = getGoalfyErrorDetails(error);

      try {
        await db
          .update(clientsTable)
          .set({
            status: "novo",

            updatedAt: new Date(),
          })
          .where(
            and(
              eq(clientsTable.id, client.id),

              eq(clientsTable.status, "distribuindo"),
            ),
          );
      } catch (resetError) {
        const resetMessage =
          resetError instanceof Error
            ? resetError.message
            : "Erro desconhecido ao restaurar o cliente.";

        return {
          success: false,

          reason: "database_recovery_error" as const,

          failure: {
            stage: "database" as const,

            enterpriseInsurerId: client.enterpriseInsurerId,

            product: client.product?.trim() || "Produto não informado",

            salespersonId,

            clientId: client.id,

            message:
              "A criação na Goalfy falhou e também não foi possível devolver o cliente para o status 'novo'.",

            details: `Erro da Goalfy: ${goalfyError.message} | Erro ao restaurar: ${resetMessage}`,

            attempts: goalfyError.attempts,

            statusCode: goalfyError.status,

            occurredAt: new Date().toISOString(),
          },
        };
      }

      return {
        success: false,

        reason: "goalfy_error" as const,

        failure: {
          stage: "goalfy" as const,

          enterpriseInsurerId: client.enterpriseInsurerId,

          product: client.product?.trim() || "Produto não informado",

          salespersonId,

          clientId: client.id,

          message: goalfyError.message,

          details: goalfyError.details,

          attempts: goalfyError.attempts,

          statusCode: goalfyError.status,

          occurredAt: new Date().toISOString(),
        },
      };
    }

    const assignedAt = new Date();

    try {
      const [distributedClient] = await db
        .update(clientsTable)
        .set({
          status: "distribuido",

          salespersonId,

          assignedAt,

          updatedAt: assignedAt,
        })
        .where(
          and(
            eq(clientsTable.id, client.id),

            eq(clientsTable.status, "distribuindo"),
          ),
        )
        .returning({
          id: clientsTable.id,

          name: clientsTable.name,

          phone: clientsTable.phone,
        });

      if (!distributedClient) {
        return {
          success: false,

          reason: "database_finalize_error" as const,

          failure: {
            stage: "database" as const,

            enterpriseInsurerId: client.enterpriseInsurerId,

            product: client.product?.trim() || "Produto não informado",

            salespersonId,

            clientId: client.id,

            message:
              "O card foi criado na Goalfy, mas não foi possível concluir a distribuição no banco.",

            details:
              "O cliente foi mantido como 'distribuindo' para evitar duplicidade.",

            attempts: null,

            statusCode: null,

            occurredAt: new Date().toISOString(),
          },
        };
      }

      return {
        success: true,

        client: distributedClient,

        salespersonId,

        enterpriseInsurerId: client.enterpriseInsurerId,

        product: client.product?.trim() || "Produto não informado",
      };
    } catch (error) {
      return {
        success: false,

        reason: "database_finalize_error" as const,

        failure: {
          stage: "database" as const,

          enterpriseInsurerId: client.enterpriseInsurerId,

          product: client.product?.trim() || "Produto não informado",

          salespersonId,

          clientId: client.id,

          message:
            "O card foi criado na Goalfy, mas ocorreu um erro ao concluir a distribuição no banco.",

          details:
            error instanceof Error
              ? `${error.message} O cliente foi mantido como 'distribuindo' para evitar duplicidade.`
              : "O cliente foi mantido como 'distribuindo' para evitar duplicidade.",

          attempts: null,

          statusCode: null,

          occurredAt: new Date().toISOString(),
        },
      };
    }
  });
