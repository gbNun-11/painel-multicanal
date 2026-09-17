"use server";

import { and, asc, eq, isNull } from "drizzle-orm";

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
import distributeGoalfyClientSchema from "@/src/schemas/client/distributeGoalfyClientSchema";

export const distributeGoalfyClientAction = protectedActionClient
  .inputSchema(distributeGoalfyClientSchema)
  .action(async ({ parsedInput }) => {
    const { enterpriseInsurerId, product, salespersonId } = parsedInput;

    const occurredAt = new Date().toISOString();

    const [salespersonResult, insurerResult] = await Promise.all([
      db
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
        .limit(1),

      db
        .select({
          insurerName: insurersTable.name,
        })
        .from(enterpriseInsurersTable)
        .innerJoin(
          insurersTable,
          eq(enterpriseInsurersTable.insurerId, insurersTable.id),
        )
        .where(eq(enterpriseInsurersTable.id, enterpriseInsurerId))
        .limit(1),
    ]);

    const salesperson = salespersonResult[0];

    if (!salesperson) {
      return {
        success: false,

        reason: "salesperson_unavailable" as const,

        failure: {
          stage: "database" as const,

          enterpriseInsurerId,

          product,

          salespersonId,

          clientId: null,

          message: "Usuário comercial não encontrado ou inativo.",

          details: null,

          attempts: null,

          statusCode: null,

          occurredAt,
        },
      };
    }

    const insurer = insurerResult[0];

    if (!insurer) {
      return {
        success: false,

        reason: "enterprise_insurer_not_found" as const,

        failure: {
          stage: "database" as const,

          enterpriseInsurerId,

          product,

          salespersonId,

          clientId: null,

          message:
            "Não foi possível identificar a seguradora responsável pela distribuição.",

          details: "O relacionamento enterprise_insurers não foi encontrado.",

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
        })
        .from(clientsTable)
        .where(
          and(
            eq(clientsTable.enterpriseInsurerId, enterpriseInsurerId),

            eq(clientsTable.product, product),

            eq(clientsTable.status, "novo"),

            isNull(clientsTable.salespersonId),
          ),
        )
        .orderBy(
          asc(clientsTable.sourceCreatedAt),

          asc(clientsTable.createdAt),

          asc(clientsTable.id),
        )
        .limit(1)
        .for("update", {
          skipLocked: true,
        });

      if (!candidate) {
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

        reason: "no_available_client" as const,

        failure: {
          stage: "database" as const,

          enterpriseInsurerId,

          product,

          salespersonId,

          clientId: null,

          message:
            "Nenhum cliente disponível foi encontrado para esta distribuição.",

          details:
            "O registro pode ter sido distribuído por outra execução concorrente ou não estar mais com status 'novo'.",

          attempts: null,

          statusCode: null,

          occurredAt,
        },
      };
    }

    try {
      await createGoalfyCard({
        ...client,

        insurerName: insurer.insurerName,
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

            enterpriseInsurerId,

            product,

            salespersonId,

            clientId: client.id,

            message:
              "A criação na Goalfy falhou e também não foi possível devolver o cliente para o status 'novo'.",

            details: `Erro da Goalfy: ${goalfyError.message} | Erro ao restaurar o cliente: ${resetMessage}`,

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

          enterpriseInsurerId,

          product,

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

            enterpriseInsurerId,

            product,

            salespersonId,

            clientId: client.id,

            message:
              "O card foi criado na Goalfy, mas não foi possível concluir a distribuição no banco.",

            details:
              "O cliente foi mantido como 'distribuindo' para evitar a criação de um card duplicado na Goalfy.",

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

        enterpriseInsurerId,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao concluir a distribuição no banco.";

      return {
        success: false,

        reason: "database_finalize_error" as const,

        failure: {
          stage: "database" as const,

          enterpriseInsurerId,

          product,

          salespersonId,

          clientId: client.id,

          message:
            "O card foi criado na Goalfy, mas ocorreu um erro ao concluir a distribuição no banco.",

          details: `${message} O cliente foi mantido como 'distribuindo' para evitar duplicidade.`,

          attempts: null,

          statusCode: null,

          occurredAt: new Date().toISOString(),
        },
      };
    }
  });
