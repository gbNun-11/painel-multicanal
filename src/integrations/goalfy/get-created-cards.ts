import "server-only";

import { z } from "zod";

import { ENTERPRISE_IDS, type EnterpriseId } from "@/src/constants/enterprises";

import { getGoalfyToken } from "./config";
import { goalfyFetch } from "./goalfy-fetch";

const PAGE_LIMIT = 1000;

const GOALFY_OWNER_ID = "d7480dd4-d7c3-4809-9928-52100dbb78b5";
const CONTEXT_IDS = {
  [ENTERPRISE_IDS.ICX]: "a0d1d4af-df27-48a6-97e2-14604731aa14",
  [ENTERPRISE_IDS.INRI]: "1b09929e-0788-4a59-8d1f-befcca4b7c80",
} as const satisfies Record<EnterpriseId, string>;

const PHASE_IDS = {
  [ENTERPRISE_IDS.ICX]: "e10d224d-fcf4-4ae3-8af1-7641eec53b7f",
  [ENTERPRISE_IDS.INRI]: "8a22f27c-03b7-42cd-b33b-5bd972ae5588",
} as const satisfies Record<EnterpriseId, string>;

const cardSchema = z.object({
  id: z.uuid(),
  createdAt: z.string().min(1),
  phaseId: z.uuid().optional(),
  responsibles: z.array(z.object({ id: z.uuid() })).optional(),
  subtitleFields: z.array(
    z.object({
      title: z.string(),
      value: z.unknown(),
    }),
  ),
});

const responseGroupSchema = z.object({
  cards: z.array(cardSchema),
  cardsCount: z.number().int().nonnegative(),
});

const responseSchema = z.union([
  responseGroupSchema,
  z.array(responseGroupSchema),
]);

type GoalfyCard = z.infer<typeof cardSchema>;

export interface CreatedGoalfyCard {
  cardId: string;
  opportunityId: string;
  externalId: string | null;
  createdAt: string;
  phaseId: string | null;
  responsibleIds: string[];
}

const normalizeTitle = (title: string) =>
  title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s+/g, " ")
    .trim();

const readUniqueField = (
  card: GoalfyCard,
  expectedTitle: string,
): string | null => {
  const normalizedTitle = normalizeTitle(expectedTitle);

  const matches = card.subtitleFields.filter(
    (field) => normalizeTitle(field.title) === normalizedTitle,
  );

  // Não aceita campo duplicado ou ausente.
  if (matches.length !== 1) {
    return null;
  }

  const value = matches[0].value;

  return typeof value === "string" ? value.trim() || null : null;
};

export const parseCreatedGoalfyCardsPage = (body: unknown) => {
  const parsed = responseSchema.safeParse(body);

  if (!parsed.success) {
    // Não registrar a resposta bruta: ela contém dados pessoais.
    throw new Error("Formato inesperado na consulta de cards do Goalfy.");
  }

  const cards: CreatedGoalfyCard[] = [];
  let unidentifiedCards = 0;
  let returnedCards = 0;

  const groups = Array.isArray(parsed.data) ? parsed.data : [parsed.data];

  for (const group of groups) {
    returnedCards += group.cards.length;

    for (const card of group.cards) {
      const rawOpportunityId = readUniqueField(
        card,
        "Identificador - Oportunidade",
      );

      const opportunityId = z.uuid().safeParse(rawOpportunityId);

      if (!opportunityId.success) {
        unidentifiedCards += 1;
        continue;
      }

      cards.push({
        cardId: card.id.toLowerCase(),
        opportunityId: opportunityId.data.toLowerCase(),
        externalId: readUniqueField(card, "Identificador - Externo"),
        createdAt: card.createdAt,
        phaseId: card.phaseId ?? null,
        responsibleIds: (card.responsibles ?? []).map((responsible) =>
          responsible.id.toLowerCase(),
        ),
      });
    }
  }

  const countsByOpportunity = new Map<string, number>();

  for (const card of cards) {
    countsByOpportunity.set(
      card.opportunityId,
      (countsByOpportunity.get(card.opportunityId) ?? 0) + 1,
    );
  }

  const duplicateOpportunityIds = [...countsByOpportunity.entries()]
    .filter(([, count]) => count > 1)
    .map(([opportunityId]) => opportunityId);

  return {
    cards,
    returnedCards,
    unidentifiedCards,
    reportedCounts: groups.map((group) => group.cardsCount),
    duplicateOpportunityIds,
  };
};

export const getCreatedGoalfyCardsPage = async (
  enterpriseId: EnterpriseId,
  offset = 0,
) => {
  if (!Number.isSafeInteger(offset) || offset < 0) {
    throw new Error("Offset de consulta inválido.");
  }

  const phaseId = PHASE_IDS[enterpriseId];

  if (!phaseId) {
    throw new Error("Empresa sem fase Goalfy configurada.");
  }

  const url = new URL(
    `https://api.goalfy.com.br/api/cards/phase/${phaseId}/advancedFilter`,
  );

  url.searchParams.set("limit", String(PAGE_LIMIT));
  url.searchParams.set("offset", String(offset));

  const payload = {
    title: "Filtro",
    conditionals: [
      {
        firstField: "card_createdAt",
        logic: "DATETIME_IS",
        secondField: "TODAY",
        groupOperator: "AND",
        fieldType: "datetime-local",
      },
      {
        firstField: "card_owner",
        logic: "LIST_IS",
        secondField: GOALFY_OWNER_ID,
        groupOperator: "AND",
        fieldType: "card_owner",
      },
    ],
    createdBy: GOALFY_OWNER_ID,
    contextId: CONTEXT_IDS[enterpriseId],
  };

  const response = await goalfyFetch({
    url: url.toString(),
    operation: "Consultar cards criados hoje no Goalfy",
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${getGoalfyToken()}`,
      },
      body: JSON.stringify(payload),
    },
  });

  return {
    enterpriseId,
    offset,
    limit: PAGE_LIMIT,
    ...parseCreatedGoalfyCardsPage(response.body),
  };
};

// Consulta paginada e limitada para conciliação de lotes.
// Não confirma, distribui ou libera oportunidades.
const MAX_CONCILIATION_PAGES = 10;

export const getAllCreatedGoalfyCards = async (
  enterpriseId: EnterpriseId,
) => {
  const cards: CreatedGoalfyCard[] = [];
  const seenCardIds = new Set<string>();
  const countsByOpportunity = new Map<string, number>();

  let offset = 0;
  let unidentifiedCards = 0;

  for (let pageNumber = 0; pageNumber < MAX_CONCILIATION_PAGES; pageNumber += 1) {
    const page = await getCreatedGoalfyCardsPage(enterpriseId, offset);

    if (
      page.reportedCounts.length === 0 ||
      page.returnedCards > PAGE_LIMIT ||
      page.returnedCards !== page.cards.length + page.unidentifiedCards
    ) {
      throw new Error("Paginação Goalfy retornou dados inconsistentes.");
    }

    unidentifiedCards += page.unidentifiedCards;

    for (const card of page.cards) {
      if (seenCardIds.has(card.cardId)) {
        throw new Error(
          "Card Goalfy repetido entre páginas. Conciliação interrompida.",
        );
      }

      seenCardIds.add(card.cardId);
      cards.push(card);

      countsByOpportunity.set(
        card.opportunityId,
        (countsByOpportunity.get(card.opportunityId) ?? 0) + 1,
      );
    }

    const previousOffset = offset;
    offset += page.returnedCards;

    // cardsCount pode ser uma contagem total ou da própria página.
    // Usamos como indicação, sem presumir o significado definitivo.
    const reportedCount =
      page.reportedCounts.length === 1
        ? page.reportedCounts[0]
        : null;

    const possibleMoreResults =
      page.returnedCards === PAGE_LIMIT ||
      (reportedCount !== null && reportedCount > offset);

    if (!possibleMoreResults) {
      return {
        enterpriseId,
        cards,
        pagesFetched: pageNumber + 1,
        returnedCards: offset,
        unidentifiedCards,
        duplicateOpportunityIds: [
          ...countsByOpportunity.entries(),
        ]
          .filter(([, count]) => count > 1)
          .map(([opportunityId]) => opportunityId),
      };
    }

    if (offset === previousOffset) {
      throw new Error(
        "Paginação Goalfy sem avanço. Conciliação interrompida.",
      );
    }
  }

  throw new Error(
    "Limite de páginas Goalfy atingido. " +
      "Conciliação interrompida para evitar resultado incompleto.",
  );
};
