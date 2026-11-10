import "server-only";

import { and, asc, eq, isNull, type SQL,sql } from "drizzle-orm";

import { db } from "@/src/db";
import {
  clientsTable,
  enterpriseInsurersTable,
  enterprisesTable,
  insurersTable,
  opportunitiesTable,
  productCodesTable,
  usersTable,
} from "@/src/db/schema";
import {
  buildGoalfyCardBody,
  createGoalfyCard,
  type GoalfyCreateCardData,
} from "@/src/integrations/goalfy/create-card";
import {
  getGoalfyErrorDetails,
  type GoalfyErrorDetails,
} from "@/src/integrations/goalfy/goalfy-fetch";
import {
  getGoalfyReportCards,
  matchesReportSalesperson,
  matchGoalfyReportCard,
} from "@/src/integrations/goalfy/report";

type SalesModel = "LEAD" | "VINCULO" | "CONTINGENCIA";

export type DistributeGoalfyRequest =
  | {
      kind: "automatic";
      enterpriseInsurerId: string;
      product: string;
      salesModel: SalesModel;
      salespersonId: string;
    }
  | {
      kind: "selected";
      opportunityId: string;
      salespersonId: string;
    };

const MAX_CREATION_ATTEMPTS = 5;

const REPORT_VISIBILITY_DELAY_MS = 5_000;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// Evita expor tokens do relatório nos logs de diagnóstico.
const redactSecrets = (value: string) =>
  value
    .replace(/(apiKey=)[^&\s"'`]+/gi, "$1[REDACTED]")
    .replace(/(Bearer\s+)[a-zA-Z0-9._-]+/gi, "$1[REDACTED]");

const errorDetails = (error: unknown) => {
  const message = error instanceof Error ? error.message : "Erro desconhecido";
  const cause =
    error instanceof Error && error.cause instanceof Error
      ? ` | Causa: ${error.cause.message}`
      : "";

  return redactSecrets(`${message}${cause}`).slice(0, 2_000);
};

const failureResult = (input: {
  reason: string;
  stage: "database" | "goalfy";
  enterpriseInsurerId: string;
  product: string;
  salespersonId: string;
  opportunityId: string | null;
  message: string;
  details?: string | null;
  attempts?: number | null;
  statusCode?: number | null;
}) => ({
  success: false as const,
  reason: input.reason,
  failure: {
    stage: input.stage,
    enterpriseInsurerId: input.enterpriseInsurerId,
    product: input.product,
    salespersonId: input.salespersonId,
    clientId: input.opportunityId,
    message: input.message,
    details: input.details ?? null,
    attempts: input.attempts ?? null,
    statusCode: input.statusCode ?? null,
    occurredAt: new Date().toISOString(),
  },
});

export const distributeGoalfyOpportunity = async (
  request: DistributeGoalfyRequest,
) => {
  const salespersonId = request.salespersonId;

  const metadata =
    request.kind === "selected"
      ? await db
          .select({
            enterpriseInsurerId: opportunitiesTable.enterpriseInsurerId,
            product: opportunitiesTable.product,
          })
          .from(opportunitiesTable)
          .where(eq(opportunitiesTable.id, request.opportunityId))
          .limit(1)
      : [];

  if (request.kind === "selected" && !metadata[0]) {
    throw new Error("Oportunidade selecionada não encontrada.");
  }

  const enterpriseInsurerId =
    request.kind === "automatic"
      ? request.enterpriseInsurerId
      : metadata[0]!.enterpriseInsurerId;

  const product =
    request.kind === "automatic" ? request.product : metadata[0]!.product;

  const requestedOpportunityId =
    request.kind === "selected" ? request.opportunityId : null;

  const fail = (
    reason: string,
    stage: "database" | "goalfy",
    opportunityId: string | null,
    message: string,
    details: string | null = null,
    attempts: number | null = null,
    statusCode: number | null = null,
  ) => {
    console.error("[GOALFY DISTRIBUTION] Falha:", {
      reason,
      stage,
      opportunityId,
      enterpriseInsurerId,
      salespersonId,
      attempts,
      statusCode,
      message: redactSecrets(message),
      details: details ? redactSecrets(details) : null,
    });

    return failureResult({
      reason,
      stage,
      enterpriseInsurerId,
      product,
      salespersonId,
      opportunityId,
      message,
      details,
      attempts,
      statusCode,
    });
  };

  const [salesperson] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      goalfyUserId: usersTable.goalfyUserId,
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
    return fail(
      "salesperson_unavailable",
      "database",
      requestedOpportunityId,
      "Usuário comercial não encontrado ou inativo.",
    );
  }

  const goalfyResponsibleValue = salesperson.goalfyUserId?.trim();

  if (!goalfyResponsibleValue) {
    return fail(
      "goalfy_responsible_not_configured",
      "database",
      requestedOpportunityId,
      "O vendedor não possui ID correspondente no Goalfy.",
      "Configure o ID do usuário Goalfy no cadastro.",
    );
  }

  const [enterprise] = await db
    .select({
      enterpriseId: enterprisesTable.id,
      insurerName: insurersTable.name,
      enterpriseName: enterprisesTable.name,
    })
    .from(enterpriseInsurersTable)
    .innerJoin(
      insurersTable,
      eq(enterpriseInsurersTable.insurerId, insurersTable.id),
    )
    .innerJoin(
      enterprisesTable,
      eq(enterpriseInsurersTable.enterpriseId, enterprisesTable.id),
    )
    .where(eq(enterpriseInsurersTable.id, enterpriseInsurerId))
    .limit(1);

  if (!enterprise) {
    return fail(
      "enterprise_insurer_not_found",
      "database",
      requestedOpportunityId,
      "Empresa ou seguradora não encontrada.",
    );
  }

  const conditions: SQL[] = [
    eq(opportunitiesTable.distributionStatus, "novo"),
    eq(opportunitiesTable.salesStatus, "aberto"),
    isNull(opportunitiesTable.salespersonId),
  ];

  if (request.kind === "automatic") {
    conditions.push(
      eq(opportunitiesTable.enterpriseInsurerId, request.enterpriseInsurerId),
      eq(opportunitiesTable.product, request.product),
      eq(opportunitiesTable.salesModel, request.salesModel),
    );
  } else {
    conditions.push(eq(opportunitiesTable.id, request.opportunityId));
  }

  // Uma única execução reserva a oportunidade.
  // Outras execuções não podem pegá-la enquanto
  // as cinco tentativas estiverem acontecendo.
  const opportunity = await db.transaction(async (tx) => {
    const [candidate] = await tx
      .select({
        opportunityId: opportunitiesTable.id,

        clientId: clientsTable.id,
        name: clientsTable.name,
        document: clientsTable.document,
        email: clientsTable.email,
        phone: clientsTable.phone,
        birthDate: clientsTable.birthDate,

        product: opportunitiesTable.product,
        productCodeId: opportunitiesTable.productCodeId,
        externalId: opportunitiesTable.externalId,
        opportunityNumber: opportunitiesTable.opportunityNumber,
        salesModel: opportunitiesTable.salesModel,
        sourceCreatedAt: opportunitiesTable.sourceCreatedAt,
        propensity: opportunitiesTable.propensity,

        model: opportunitiesTable.model,
        modelYear: opportunitiesTable.modelYear,
        licensePlate: opportunitiesTable.licensePlate,
        assetValue: opportunitiesTable.assetValue,

        zipCode: clientsTable.zipCode,
        address: clientsTable.address,
        addressNumber: clientsTable.addressNumber,
        addressComplement: clientsTable.addressComplement,
        state: clientsTable.state,
        city: clientsTable.city,
        neighborhood: clientsTable.neighborhood,

        observation: opportunitiesTable.observation,
        externalStatusReason: opportunitiesTable.externalStatusReason,
      })
      .from(opportunitiesTable)
      .innerJoin(clientsTable, eq(opportunitiesTable.clientId, clientsTable.id))
      .where(and(...conditions))
      .orderBy(
        sql`
            ${opportunitiesTable.sourceCreatedAt}
            ASC NULLS LAST
          `,
        asc(opportunitiesTable.createdAt),
        asc(opportunitiesTable.id),
      )
      .limit(1)
      .for("update", {
        skipLocked: true,
      });

    if (!candidate) {
      return null;
    }

    const [claimed] = await tx
      .update(opportunitiesTable)
      .set({
        distributionStatus: "distribuindo",
        salespersonId,
        updatedAt: new Date(),
      })
      .where(
        and(eq(opportunitiesTable.id, candidate.opportunityId), ...conditions),
      )
      .returning({
        id: opportunitiesTable.id,
      });

    return claimed ? candidate : null;
  });

  if (!opportunity) {
    return fail(
      request.kind === "selected"
        ? "client_unavailable"
        : "no_available_client",
      "database",
      requestedOpportunityId,
      "A oportunidade não está disponível para distribuição.",
    );
  }

  const opportunityId = opportunity.opportunityId;

  const distributionAt = new Date();

  // Retorna a oportunidade para a lista original,
  // limpando o vendedor reservado.
  const releaseReservation = async () => {
    const [released] = await db
      .update(opportunitiesTable)
      .set({
        distributionStatus: "novo",
        salespersonId: null,
        assignedAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(opportunitiesTable.id, opportunityId),
          eq(opportunitiesTable.distributionStatus, "distribuindo"),
          eq(opportunitiesTable.salespersonId, salespersonId),
        ),
      )
      .returning({
        id: opportunitiesTable.id,
      });

    if (!released) {
      throw new Error(
        "Não foi possível devolver a oportunidade para Distribuição Pendente.",
      );
    }
  };

  const restorePending = async (
    reason: string,
    message: string,
    details: string | null = null,
    attempts: number | null = null,
    statusCode: number | null = null,
  ) => {
    try {
      await releaseReservation();
    } catch (error) {
      return fail(
        "database_recovery_error",
        "database",
        opportunityId,
        "Falha ao devolver a oportunidade para Distribuição Pendente.",
        error instanceof Error ? error.message : null,
        attempts,
        statusCode,
      );
    }

    return fail(
      reason,
      "goalfy",
      opportunityId,
      message,
      details,
      attempts,
      statusCode,
    );
  };

  const finalize = async () => {
    const [updated] = await db
      .update(opportunitiesTable)
      .set({
        distributionStatus: "distribuido",
        salespersonId,
        assignedAt: distributionAt,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(opportunitiesTable.id, opportunityId),
          eq(opportunitiesTable.distributionStatus, "distribuindo"),
          eq(opportunitiesTable.salespersonId, salespersonId),
        ),
      )
      .returning({
        id: opportunitiesTable.id,
      });

    if (!updated) {
      throw new Error(
        "A oportunidade deixou de estar reservada ao vendedor esperado.",
      );
    }

    return {
      success: true as const,
      client: {
        id: opportunityId,
        name: opportunity.name,
        phone: opportunity.phone,
      },
      salespersonId,
      enterpriseInsurerId,
      product: opportunity.product.trim(),
    };
  };

  const pending = (
    reason: string,
    details: string,
    attempts: number | null = null,
    statusCode: number | null = null,
  ) =>
    fail(
      reason,
      "goalfy",
      opportunityId,
      "A confirmação da criação está inconclusiva. A oportunidade permanece bloqueada para evitar duplicidade.",
      details,
      attempts,
      statusCode,
    );

  const finalizeSafely = async () => {
    try {
      return await finalize();
    } catch (error) {
      return pending(
        "database_finalize_error",
        error instanceof Error
          ? error.message
          : "Falha ao concluir a distribuição no banco.",
      );
    }
  };

  // Sempre baixa um relatório novo.
  // Nunca utiliza o XLSX da consulta anterior.
  const inspectFreshReport = async () => {
    const cards = await getGoalfyReportCards(enterprise.enterpriseId);

    const match = matchGoalfyReportCard(
      cards,
      opportunityId,
      opportunity.externalId,
    );

    if (match.status !== "unique") {
      return match;
    }

    if (
      !matchesReportSalesperson(match.card.salespersonName, salesperson.name)
    ) {
      return {
        status: "inconsistent" as const,
        details:
          "O vendedor no relatório Goalfy não corresponde ao vendedor selecionado no V2.",
      };
    }

    return match;
  };

  let cardInput: GoalfyCreateCardData;

  try {
    if (!opportunity.productCodeId) {
      throw new Error("Oportunidade sem variação de produto vinculada.");
    }

    const [variant] = await db
      .select({
        name: productCodesTable.name,
      })
      .from(productCodesTable)
      .where(eq(productCodesTable.id, opportunity.productCodeId))
      .limit(1);

    if (!variant?.name?.trim()) {
      throw new Error("Variação de produto não encontrada.");
    }

    cardInput = {
      id: opportunityId,
      distributionAt,
      externalId: opportunity.externalId,
      opportunityNumber: opportunity.opportunityNumber,
      goalfyResponsibleValue,

      name: opportunity.name,
      document: opportunity.document,
      email: opportunity.email,
      phone: opportunity.phone,
      birthDate: opportunity.birthDate,

      product: opportunity.product,
      productSubcategory: variant.name,

      salesModel:
        request.kind === "automatic"
          ? request.salesModel
          : (opportunity.salesModel ?? "LEAD"),

      sourceCreatedAt: opportunity.sourceCreatedAt,
      propensity: opportunity.propensity,

      model: opportunity.model,
      modelYear: opportunity.modelYear,
      licensePlate: opportunity.licensePlate,
      assetValue: opportunity.assetValue,

      zipCode: opportunity.zipCode,
      address: opportunity.address,
      addressNumber: opportunity.addressNumber,
      addressComplement: opportunity.addressComplement,
      state: opportunity.state,
      city: opportunity.city,
      neighborhood: opportunity.neighborhood,

      observation: opportunity.observation,
      externalStatusReason: opportunity.externalStatusReason,

      insurerName: enterprise.insurerName,
      enterpriseName: enterprise.enterpriseName,
    };

    // Detecta payload inválido antes de qualquer POST.
    buildGoalfyCardBody(cardInput);
  } catch (error) {
    return restorePending(
      "goalfy_validation_error",
      "Não foi possível preparar o card. A oportunidade voltou para Distribuição Pendente.",
      errorDetails(error),
      0,
    );
  }

  // Conferência anterior à primeira tentativa.
  // Caso o card já exista, não reenviar.
  try {
    const existing = await inspectFreshReport();

    if (existing.status === "unique") {
      return finalizeSafely();
    }

    if (existing.status === "duplicate") {
      return pending(
        "goalfy_report_conflict",
        `O Goalfy já possui ${existing.cards.length} cards com o mesmo UUID.`,
        0,
      );
    }

    if (existing.status === "inconsistent") {
      return pending("goalfy_report_conflict", existing.details, 0);
    }
  } catch (error) {
    return restorePending(
      "goalfy_report_unavailable",
      "Relatório Goalfy indisponível antes da criação. Nenhum POST foi realizado.",
      errorDetails(error),
      0,
    );
  }

  let lastError: GoalfyErrorDetails | null = null;

  for (let attempt = 1; attempt <= MAX_CREATION_ATTEMPTS; attempt += 1) {
    let created = false;

    try {
      await createGoalfyCard(cardInput);
      created = true;
    } catch (error) {
      lastError = getGoalfyErrorDetails(error);
    }

    if (created) {
      return finalizeSafely();
    }

    await sleep(REPORT_VISIBILITY_DELAY_MS);

    let match: Awaited<ReturnType<typeof inspectFreshReport>>;

    try {
      match = await inspectFreshReport();
    } catch (error) {
      return pending(
        "goalfy_report_unavailable",
        `Tentativa ${attempt}/5: a criação não foi confirmada e o XLSX está indisponível. ${errorDetails(error)}`,
        attempt,
        lastError?.status ?? null,
      );
    }

    if (match.status === "unique") {
      return finalizeSafely();
    }

    if (match.status === "duplicate") {
      return pending(
        "goalfy_report_conflict",
        `Tentativa ${attempt}/5: encontrados ${match.cards.length} cards com o mesmo UUID.`,
        attempt,
      );
    }

    if (match.status === "inconsistent") {
      return pending("goalfy_report_conflict", match.details, attempt);
    }

    const status = lastError?.status ?? null;

    const permanentRejection =
      status !== null &&
      status >= 400 &&
      status < 500 &&
      status !== 408 &&
      status !== 429;

    if (permanentRejection) {
      return restorePending(
        "goalfy_error",
        "Goalfy rejeitou a criação. A oportunidade voltou para Distribuição Pendente.",
        lastError?.message ?? null,
        attempt,
        status,
      );
    }

    if (attempt < MAX_CREATION_ATTEMPTS) {
      continue;
    }
  }

  return restorePending(
    "goalfy_error",
    "Cinco tentativas de sincronização sem confirmação. A oportunidade foi devolvida para Distribuição Pendente.",
    lastError?.message ?? null,
    MAX_CREATION_ATTEMPTS,
    lastError?.status ?? null,
  );
};
