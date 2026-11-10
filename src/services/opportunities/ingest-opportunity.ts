import { and, eq, sql } from "drizzle-orm";

import { db } from "@/src/db";
import {
  enterpriseInsurersTable,
  opportunitiesTable,
  opportunityCountersTable,
  productCodesTable,
} from "@/src/db/schema";
import {
  resolveClient,
  type ResolveClientInput,
} from "@/src/services/clients/resolve-client";

type OpportunityInsert = typeof opportunitiesTable.$inferInsert;

type OpportunitySelect = typeof opportunitiesTable.$inferSelect;

export interface IngestOpportunityInput {
  client: ResolveClientInput;

  opportunity: {
    enterpriseInsurerId: string;

    susepId: string;

    externalSource: string;

    externalId: string;

    productCodeId: string;

    product: string;

    propensityCode?: string | null;

    propensity?: string | null;

    sourceProgramCode?: string | null;

    salesModel?: OpportunityInsert["salesModel"] | null;

    externalStatusReason?: string | null;

    model?: string | null;

    modelYear?: number | null;

    licensePlate?: string | null;

    assetValue?: string | null;

    observation?: string | null;

    sourceCreatedAt?: Date | null;

    sourcePayload?: Record<string, unknown> | null;
  };
}

export interface IngestOpportunityResult {
  client: Awaited<ReturnType<typeof resolveClient>>["client"];

  opportunity: OpportunitySelect;

  clientCreated: boolean;

  opportunityCreated: boolean;
}

const normalizeRequiredText = (value: string, fieldName: string) => {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} não informado.`);
  }

  return normalized;
};

const normalizeOptionalText = (value: string | null | undefined) => {
  const normalized = value?.trim();

  return normalized || null;
};

const normalizeLicensePlate = (value: string | null | undefined) => {
  const normalized = value
    ?.trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  return normalized || null;
};

/**
 * Cria a oportunidade e reserva o número comercial na MESMA transação.
 * A primeira inserção usa counterId/opportunityNumber nulos, pois esses
 * campos são nulos para as oportunidades históricas anteriores à migração.
 * Se o ID externo já existe, a transação não incrementa contador algum.
 */
export const ingestOpportunity = async (
  input: IngestOpportunityInput,
): Promise<IngestOpportunityResult> => {
  const enterpriseInsurerId = normalizeRequiredText(
    input.opportunity.enterpriseInsurerId,
    "EnterpriseInsurerId",
  );
  const susepId = normalizeRequiredText(input.opportunity.susepId, "SUSEP");
  const externalSource = normalizeRequiredText(
    input.opportunity.externalSource,
    "Origem externa",
  );
  const externalId = normalizeRequiredText(
    input.opportunity.externalId,
    "ID externo da oportunidade",
  );
  const product = normalizeRequiredText(input.opportunity.product, "Produto");
  const productCodeId = normalizeRequiredText(
    input.opportunity.productCodeId,
    "UUID da variação do produto",
  );

  // Preserva o contrato atual de resolveClient(), que opera via db.
  // A reserva de número + gravação da oportunidade ficam juntas no tx abaixo.
  const resolvedClient = await resolveClient(input.client);

  return db.transaction(async (tx): Promise<IngestOpportunityResult> => {
    // A restrição UNIQUE do identificador externo é a autoridade final,
    // inclusive quando dois processos importam o mesmo lote simultaneamente.
    const [inserted] = await tx
      .insert(opportunitiesTable)
      .values({
        clientId: resolvedClient.client.id,
        enterpriseInsurerId,
        susepId,
        externalSource,
        externalId,
        productCodeId,
        product,
        propensityCode: normalizeOptionalText(input.opportunity.propensityCode),
        propensity: normalizeOptionalText(input.opportunity.propensity),
        sourceProgramCode: normalizeOptionalText(input.opportunity.sourceProgramCode),
        salesModel: input.opportunity.salesModel ?? null,
        externalStatusReason: normalizeOptionalText(
          input.opportunity.externalStatusReason,
        ),
        model: normalizeOptionalText(input.opportunity.model),
        modelYear: input.opportunity.modelYear ?? null,
        licensePlate: normalizeLicensePlate(input.opportunity.licensePlate),
        assetValue: normalizeOptionalText(input.opportunity.assetValue),
        observation: normalizeOptionalText(input.opportunity.observation),
        sourceCreatedAt: input.opportunity.sourceCreatedAt ?? null,
        sourcePayload: input.opportunity.sourcePayload ?? null,
      })
      .onConflictDoNothing({
        target: [
          opportunitiesTable.enterpriseInsurerId,
          opportunitiesTable.externalSource,
          opportunitiesTable.externalId,
        ],
      })
      .returning();

    if (!inserted) {
      const [existingOpportunity] = await tx
        .select()
        .from(opportunitiesTable)
        .where(
          and(
            eq(opportunitiesTable.enterpriseInsurerId, enterpriseInsurerId),
            eq(opportunitiesTable.externalSource, externalSource),
            eq(opportunitiesTable.externalId, externalId),
          ),
        )
        .limit(1);

      if (!existingOpportunity) {
        throw new Error(
          `Não foi possível localizar a oportunidade após o conflito do identificador externo ${externalId}.`,
        );
      }

      if (existingOpportunity.clientId !== resolvedClient.client.id) {
        throw new Error(
          `Conflito de integridade: a oportunidade externa ${externalId} já está vinculada a outro cliente.`,
        );
      }

      return {
        client: resolvedClient.client,
        opportunity: existingOpportunity,
        clientCreated: resolvedClient.created,
        opportunityCreated: false,
      };
    }

    // O produto lógico é obtido pelo FK da variação já resolvida na Porto.
    // Verifica também que a variação pertence à seguradora da empresa.
    const [scope] = await tx
      .select({
        enterpriseId: enterpriseInsurersTable.enterpriseId,
        productId: productCodesTable.productId,
      })
      .from(enterpriseInsurersTable)
      .innerJoin(
        productCodesTable,
        eq(enterpriseInsurersTable.insurerId, productCodesTable.insurerId),
      )
      .where(
        and(
          eq(enterpriseInsurersTable.id, enterpriseInsurerId),
          eq(productCodesTable.id, productCodeId),
        ),
      )
      .limit(1);

    if (!scope) {
      throw new Error(
        "Não foi possível numerar a oportunidade: variação de produto incompatível com a seguradora/empresa.",
      );
    }

    // UPSERT serializado pela chave UNIQUE (empresa, produto).
    // Produto/empresa novos começam em 1; existentes avançam de 1 em 1.
    // Se qualquer etapa falhar, o incremento é revertido pelo PostgreSQL.
    const [counter] = await tx
      .insert(opportunityCountersTable)
      .values({
        enterpriseId: scope.enterpriseId,
        productId: scope.productId,
        lastNumber: 1,
      })
      .onConflictDoUpdate({
        target: [
          opportunityCountersTable.enterpriseId,
          opportunityCountersTable.productId,
        ],
        set: {
          lastNumber: sql`${opportunityCountersTable.lastNumber} + 1`,
          updatedAt: sql`now()`,
        },
      })
      .returning({
        id: opportunityCountersTable.id,
        lastNumber: opportunityCountersTable.lastNumber,
      });

    if (!counter || !Number.isSafeInteger(counter.lastNumber)) {
      throw new Error("Falha ao reservar o número comercial da oportunidade.");
    }

    const [createdOpportunity] = await tx
      .update(opportunitiesTable)
      .set({
        counterId: counter.id,
        opportunityNumber: counter.lastNumber,
      })
      .where(eq(opportunitiesTable.id, inserted.id))
      .returning();

    if (!createdOpportunity) {
      throw new Error("Não foi possível concluir a numeração da oportunidade.");
    }

    return {
      client: resolvedClient.client,
      opportunity: createdOpportunity,
      clientCreated: resolvedClient.created,
      opportunityCreated: true,
    };
  });
};
