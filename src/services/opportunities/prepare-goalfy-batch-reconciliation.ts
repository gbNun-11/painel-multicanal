import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import {
  ENTERPRISE_IDS,
  type EnterpriseId,
} from "@/src/constants/enterprises";
import { db } from "@/src/db";
import {
  enterpriseInsurersTable,
  goalfyDistributionBatchesTable,
  goalfyDistributionBatchItemsTable,
} from "@/src/db/schema";
import { getAllCreatedGoalfyCards } from "@/src/integrations/goalfy/get-created-cards";

type ReconciliationDecision =
  | "candidate"
  | "not_sent"
  | "not_found"
  | "duplicate"
  | "external_id_mismatch"
  | "responsible_mismatch"
  | "incomplete_response";

type ReconciliationItem = {
  opportunityId: string;
  decision: ReconciliationDecision;
  goalfyCardId: string | null;
};

const isSupportedEnterprise = (
  value: string,
): value is EnterpriseId =>
  Object.values(ENTERPRISE_IDS).some((id) => id === value);

const normalizeId = (value: string) =>
  value.trim().toLowerCase();

export const prepareGoalfyBatchReconciliation = async (input: {
  batchId: string;
  initiatedByUserId: string;
}) => {
  const [batch] = await db
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
    .limit(1);

  if (
    !batch ||
    !["reconciling", "interrupted"].includes(batch.status)
  ) {
    throw new Error(
      "Lote inexistente, encerrado ou não autorizado.",
    );
  }

  const items = await db
    .select({
      opportunityId:
        goalfyDistributionBatchItemsTable.opportunityId,
      status: goalfyDistributionBatchItemsTable.status,
      externalId:
        goalfyDistributionBatchItemsTable.expectedExternalId,
      responsibleId:
        goalfyDistributionBatchItemsTable.expectedGoalfyResponsibleId,
      enterpriseId: enterpriseInsurersTable.enterpriseId,
    })
    .from(goalfyDistributionBatchItemsTable)
    .innerJoin(
      enterpriseInsurersTable,
      eq(
        goalfyDistributionBatchItemsTable.enterpriseInsurerId,
        enterpriseInsurersTable.id,
      ),
    )
    .where(
      and(
        eq(goalfyDistributionBatchItemsTable.batchId, input.batchId),
        inArray(goalfyDistributionBatchItemsTable.status, [
          "reserved",
          "sent",
          "inconclusive",
        ]),
      ),
    );

  const grouped = new Map<string, typeof items>();

  for (const item of items) {
    const group = grouped.get(item.enterpriseId) ?? [];
    group.push(item);
    grouped.set(item.enterpriseId, group);
  }

  const results: ReconciliationItem[] = [];
  const companies: {
    enterpriseId: string;
    pagesFetched: number;
    cardsReturned: number;
    unidentifiedCards: number;
  }[] = [];

  // Consultas sequenciais, sem solicitações paralelas
  // desnecessárias ao Goalfy.
  for (const [enterpriseId, enterpriseItems] of grouped) {
    if (!isSupportedEnterprise(enterpriseId)) {
      throw new Error(
        "Empresa sem configuração de consulta Goalfy.",
      );
    }

    // O serviço paginado lança erro quando recebe
    // resultados inconsistentes ou incompletos.
    // Nunca interpretamos essa falha como ausência de cards.
    const snapshot = await getAllCreatedGoalfyCards(enterpriseId);

    companies.push({
      enterpriseId,
      pagesFetched: snapshot.pagesFetched,
      cardsReturned: snapshot.returnedCards,
      unidentifiedCards: snapshot.unidentifiedCards,
    });

    const byOpportunity = new Map<
      string,
      typeof snapshot.cards
    >();

    for (const card of snapshot.cards) {
      const key = normalizeId(card.opportunityId);
      const matches = byOpportunity.get(key) ?? [];
      matches.push(card);
      byOpportunity.set(key, matches);
    }

    for (const item of enterpriseItems) {
      const base = {
        opportunityId: item.opportunityId,
        goalfyCardId: null as string | null,
      };

      if (item.status === "reserved") {
        results.push({
          ...base,
          decision: "not_sent",
        });
        continue;
      }

      const matches =
        byOpportunity.get(normalizeId(item.opportunityId)) ?? [];

      // Cards com UUID correto podem ser confirmados mesmo quando
      // outros cards do relatório não têm UUID. Porém, NÃO é seguro
      // presumir ausência e reenviar quando há itens não identificados.
      if (matches.length === 0 && snapshot.unidentifiedCards > 0) {
        results.push({
          ...base,
          decision: "incomplete_response",
        });
        continue;
      }

      if (matches.length > 1) {
        results.push({
          ...base,
          decision: "duplicate",
        });
        continue;
      }

      if (matches.length === 0) {
        // A ausência é válida apenas com paginação integral
        // do AdvancedFilter. Um resultado incompleto não autoriza reenvio.
        results.push({
          ...base,
          decision: "not_found",
        });
        continue;
      }

      const card = matches[0];

      if (
        !card.externalId ||
        card.externalId.trim() !== item.externalId.trim()
      ) {
        results.push({
          ...base,
          decision: "external_id_mismatch",
        });
        continue;
      }

      const responsibleIds = card.responsibleIds.map(normalizeId);

      if (
        responsibleIds.length !== 1 ||
        responsibleIds[0] !== normalizeId(item.responsibleId)
      ) {
        results.push({
          ...base,
          decision: "responsible_mismatch",
        });
        continue;
      }

      results.push({
        opportunityId: item.opportunityId,
        decision: "candidate",
        goalfyCardId: card.cardId,
      });
    }
  }

  return {
    batchId: input.batchId,
    checkedAt: new Date().toISOString(),
    companies,
    results,
  };
};
