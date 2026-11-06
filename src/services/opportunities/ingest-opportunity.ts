import { and, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { opportunitiesTable } from "@/src/db/schema";
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

    productCode: string;

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

  const productCode = normalizeRequiredText(
    input.opportunity.productCode,
    "Código do produto",
  );

  const product = normalizeRequiredText(input.opportunity.product, "Produto");

  const resolvedClient = await resolveClient(input.client);

  const [createdOpportunity] = await db
    .insert(opportunitiesTable)
    .values({
      clientId: resolvedClient.client.id,

      enterpriseInsurerId,

      susepId,

      externalSource,

      externalId,

      productCode,

      product,

      propensityCode: normalizeOptionalText(input.opportunity.propensityCode),

      propensity: normalizeOptionalText(input.opportunity.propensity),

      sourceProgramCode: normalizeOptionalText(
        input.opportunity.sourceProgramCode,
      ),

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

  if (createdOpportunity) {
    return {
      client: resolvedClient.client,

      opportunity: createdOpportunity,

      clientCreated: resolvedClient.created,

      opportunityCreated: true,
    };
  }

  const [existingOpportunity] = await db
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
};
