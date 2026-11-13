import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/src/db";
import {
  goalfyDistributionBatchesTable,
  goalfyDistributionBatchItemsTable,
  goalfyDistributionNotificationItemsTable,
  opportunitiesTable,
} from "@/src/db/schema";

export interface TrackedGoalfyDistribution {
  batchId: string;
  opportunityId: string;
  salespersonId: string;
}

const itemIdentity = (input: TrackedGoalfyDistribution) =>
  and(
    eq(goalfyDistributionBatchItemsTable.batchId, input.batchId),
    eq(goalfyDistributionBatchItemsTable.opportunityId, input.opportunityId),
    eq(goalfyDistributionBatchItemsTable.salespersonId, input.salespersonId),
  );

const reservedOpportunity = (input: TrackedGoalfyDistribution) =>
  and(
    eq(opportunitiesTable.id, input.opportunityId),
    eq(opportunitiesTable.salespersonId, input.salespersonId),
    eq(opportunitiesTable.distributionStatus, "distribuindo"),
  );

// Deve ser executado ANTES de enviar o POST ao Goalfy.
// Uma interrupção depois desta gravação exige conciliação.
export const markGoalfyRequestStarted = async (
  input: TrackedGoalfyDistribution,
) => {
  await db.transaction(async (tx) => {
    // Usa o mesmo bloqueio de linha da conclusão do lote.
    // Assim a mudança para reconciling impede novos POSTs.
    const [batch] = await tx
      .select({
        id: goalfyDistributionBatchesTable.id,
      })
      .from(goalfyDistributionBatchesTable)
      .where(
        and(
          eq(goalfyDistributionBatchesTable.id, input.batchId),
          eq(goalfyDistributionBatchesTable.status, "running"),
        ),
      )
      .limit(1)
      .for("update");

    if (!batch) {
      throw new Error(
        "Lote encerrado ou indisponível para novos envios.",
      );
    }

    const [updated] = await tx
      .update(goalfyDistributionBatchItemsTable)
      .set({
        status: "sent",
        attemptCount: sql`${goalfyDistributionBatchItemsTable.attemptCount} + 1`,
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          itemIdentity(input),
          eq(goalfyDistributionBatchItemsTable.status, "reserved"),
          eq(goalfyDistributionBatchItemsTable.attemptCount, 0),
        ),
      )
      .returning({
        id: goalfyDistributionBatchItemsTable.id,
      });

    if (!updated) {
      throw new Error(
        "Reserva inexistente ou tentativa já iniciada.",
      );
    }
  });
};

// Somente após confirmação confiável da criação do card.
// O sucesso fica exclusivamente em opportunities.
export const confirmTrackedGoalfyDistribution = async (
  input: TrackedGoalfyDistribution,
  distributionAt: Date,
) => {
  return db.transaction(async (tx) => {
    // O mesmo bloqueio utilizado na conciliação impede
    // encerrar o lote durante a confirmação.
    const [batch] = await tx
      .select({
        status: goalfyDistributionBatchesTable.status,
        sendListByWhatsApp:
          goalfyDistributionBatchesTable.sendListByWhatsApp,
        sendListByEmail:
          goalfyDistributionBatchesTable.sendListByEmail,
      })
      .from(goalfyDistributionBatchesTable)
      .where(
        eq(goalfyDistributionBatchesTable.id, input.batchId),
      )
      .limit(1)
      .for("update");

    if (!batch || !["running", "reconciling"].includes(batch.status)) {
      throw new Error(
        "Lote indisponível para confirmação transacional.",
      );
    }

    const [updated] = await tx
      .update(opportunitiesTable)
      .set({
        distributionStatus: "distribuido",
        salespersonId: input.salespersonId,
        assignedAt: distributionAt,
        updatedAt: new Date(),
      })
      .where(reservedOpportunity(input))
      .returning({
        id: opportunitiesTable.id,
        enterpriseInsurerId: opportunitiesTable.enterpriseInsurerId,
        product: opportunitiesTable.product,
      });

    if (!updated) {
      throw new Error(
        "Oportunidade não está reservada ao vendedor esperado.",
      );
    }

    const [removed] = await tx
      .delete(goalfyDistributionBatchItemsTable)
      .where(
        and(
          itemIdentity(input),
          inArray(goalfyDistributionBatchItemsTable.status, [
            "sent",
            "inconclusive",
          ]),
          sql`${goalfyDistributionBatchItemsTable.attemptCount} > 0`,
        ),
      )
      .returning({
        id: goalfyDistributionBatchItemsTable.id,
      });

    if (!removed) {
      throw new Error(
        "Controle de distribuição não encontrado. Transação cancelada.",
      );
    }

    // O controle de notificações nasce na mesma transação
    // que confirma a distribuição da oportunidade.
    const channels: Array<"whatsapp" | "email"> = [];

    if (batch.sendListByWhatsApp) {
      channels.push("whatsapp");
    }

    if (batch.sendListByEmail) {
      channels.push("email");
    }

    if (channels.length > 0) {
      await tx
        .insert(goalfyDistributionNotificationItemsTable)
        .values(
          channels.map((channel) => ({
            batchId: input.batchId,
            opportunityId: updated.id,
            enterpriseInsurerId: updated.enterpriseInsurerId,
            salespersonId: input.salespersonId,
            channel,
            status: "pending",
          })),
        );
    }

    return {
      opportunityId: updated.id,
      enterpriseInsurerId: updated.enterpriseInsurerId,
      salespersonId: input.salespersonId,
      product: updated.product,
    };
  });
};

// Exclusivamente para falhas comprovadamente ANTERIORES ao POST.
export const releaseUnsentGoalfyDistribution = async (
  input: TrackedGoalfyDistribution,
) => {
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(opportunitiesTable)
      .set({
        distributionStatus: "novo",
        salespersonId: null,
        assignedAt: null,
        updatedAt: new Date(),
      })
      .where(reservedOpportunity(input))
      .returning({
        id: opportunitiesTable.id,
      });

    if (!updated) {
      throw new Error(
        "Oportunidade não está reservada ao vendedor esperado.",
      );
    }

    const [removed] = await tx
      .delete(goalfyDistributionBatchItemsTable)
      .where(
        and(
          itemIdentity(input),
          eq(goalfyDistributionBatchItemsTable.status, "reserved"),
          eq(goalfyDistributionBatchItemsTable.attemptCount, 0),
        ),
      )
      .returning({
        id: goalfyDistributionBatchItemsTable.id,
      });

    if (!removed) {
      throw new Error(
        "A criação pode ter sido iniciada. Liberação bloqueada.",
      );
    }

    return { opportunityId: updated.id };
  });
};

// Erro de rede, timeout ou resposta ambígua:
// nunca devolver automaticamente para "novo".
export const markGoalfyDistributionInconclusive = async (
  input: TrackedGoalfyDistribution,
  errorCode: string,
  httpStatus: number | null,
) => {
  const [updated] = await db
    .update(goalfyDistributionBatchItemsTable)
    .set({
      status: "inconclusive",
      errorCode: errorCode.slice(0, 100),
      lastHttpStatus: httpStatus,
      updatedAt: new Date(),
    })
    .where(
      and(
        itemIdentity(input),
        inArray(goalfyDistributionBatchItemsTable.status, [
          "reserved",
          "sent",
        ]),
      ),
    )
    .returning({
      id: goalfyDistributionBatchItemsTable.id,
    });

  if (!updated) {
    throw new Error(
      "Não foi possível registrar a distribuição inconclusiva.",
    );
  }
};
