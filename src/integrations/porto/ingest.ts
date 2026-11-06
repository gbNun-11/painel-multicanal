import type { ResolvedSusep } from "@/src/services/suseps/resolve-susep";
import { ingestOpportunity } from "@/src/services/opportunities/ingest-opportunity";
import { resolveSusep } from "@/src/services/suseps/resolve-susep";

import { adaptPortoOpportunity } from "./adapter";
import {
  portoOpportunitiesResponseSchema,
  portoOpportunitySchema,
} from "./schema";

export interface IngestPortoResponseInput {
  enterpriseInsurerId: string;

  payload: unknown;
}

export interface PortoIngestSuccess {
  clientId: string;

  opportunityId: string;

  externalId: string;

  susepId: string;

  brokerUserId: string;

  clientCreated: boolean;

  opportunityCreated: boolean;
}

export interface PortoIngestFailure {
  index: number;

  externalId: string | null;

  document: string | null;

  susepCode: string | null;

  message: string;

  details: string | null;
}

export interface IngestPortoResponseResult {
  totalReceived: number;

  totalPaginacao: number;

  clientsCreated: number;

  opportunitiesCreated: number;

  opportunitiesExisting: number;

  successCount: number;

  failureCount: number;

  successes: PortoIngestSuccess[];

  failures: PortoIngestFailure[];
}

const normalizeOptionalText = (value: string | null | undefined) => {
  const normalized = value?.trim();

  return normalized || null;
};

const normalizeSusepCode = (value: string | null | undefined) => {
  return normalizeOptionalText(value)?.toUpperCase() ?? null;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Erro desconhecido durante a importação da oportunidade Porto.";
};

const getValidationDetails = (
  issues: {
    path: PropertyKey[];
    message: string;
  }[],
) => {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "item";

      return `${path}: ${issue.message}`;
    })
    .join(" | ");
};

const getRawStringValue = (value: unknown, key: string) => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;

  const rawValue = record[key];

  if (typeof rawValue === "string") {
    const normalized = rawValue.trim();

    return normalized || null;
  }

  if (typeof rawValue === "number") {
    return String(rawValue);
  }

  return null;
};

const validateSusepProduct = (
  opportunityProductCode: string | null | undefined,
  susep: ResolvedSusep,
) => {
  const productCode = normalizeOptionalText(opportunityProductCode);

  if (!productCode) {
    throw new Error(
      `A oportunidade da SUSEP ${susep.code} não informou o código do produto.`,
    );
  }

  if (productCode !== susep.productCode) {
    throw new Error(
      `Produto incompatível com a SUSEP ${susep.code}. A oportunidade informou o produto ${productCode}, mas a SUSEP está configurada para ${susep.productCode} - ${susep.product}.`,
    );
  }
};

export const ingestPortoResponse = async ({
  enterpriseInsurerId,
  payload,
}: IngestPortoResponseInput): Promise<IngestPortoResponseResult> => {
  const normalizedEnterpriseInsurerId = enterpriseInsurerId.trim();

  if (!normalizedEnterpriseInsurerId) {
    throw new Error(
      "EnterpriseInsurerId não informado para a importação Porto.",
    );
  }

  const response = portoOpportunitiesResponseSchema.parse(payload);

  const successes: PortoIngestSuccess[] = [];

  const failures: PortoIngestFailure[] = [];

  const susepCache = new Map<string, ResolvedSusep>();

  let clientsCreated = 0;

  let opportunitiesCreated = 0;

  let opportunitiesExisting = 0;

  for (let index = 0; index < response.itens.length; index += 1) {
    const rawOpportunity = response.itens[index];

    const parsedOpportunity = portoOpportunitySchema.safeParse(rawOpportunity);

    if (!parsedOpportunity.success) {
      failures.push({
        index,

        externalId: getRawStringValue(rawOpportunity, "idOportunidadeSql"),

        document: getRawStringValue(rawOpportunity, "cpfCnpjCliente"),

        susepCode: getRawStringValue(rawOpportunity, "susep"),

        message: "Oportunidade Porto com estrutura inválida.",

        details: getValidationDetails(parsedOpportunity.error.issues),
      });

      continue;
    }

    const opportunity = parsedOpportunity.data;

    try {
      const susepCode = normalizeSusepCode(opportunity.susep);

      if (!susepCode) {
        throw new Error(
          `A oportunidade ${opportunity.idOportunidadeSql} não possui SUSEP informada.`,
        );
      }

      let susep = susepCache.get(susepCode);

      if (!susep) {
        susep = await resolveSusep({
          enterpriseInsurerId: normalizedEnterpriseInsurerId,

          code: susepCode,
        });

        susepCache.set(susepCode, susep);
      }

      validateSusepProduct(opportunity.codigoProduto, susep);

      const input = adaptPortoOpportunity(opportunity, {
        enterpriseInsurerId: normalizedEnterpriseInsurerId,

        susepId: susep.id,

        productCode: susep.productCode,

        product: susep.product,
      });

      const result = await ingestOpportunity(input);

      if (result.clientCreated) {
        clientsCreated += 1;
      }

      if (result.opportunityCreated) {
        opportunitiesCreated += 1;
      } else {
        opportunitiesExisting += 1;
      }

      successes.push({
        clientId: result.client.id,

        opportunityId: result.opportunity.id,

        externalId: result.opportunity.externalId,

        susepId: susep.id,

        brokerUserId: susep.brokerUserId,

        clientCreated: result.clientCreated,

        opportunityCreated: result.opportunityCreated,
      });
    } catch (error) {
      failures.push({
        index,

        externalId: opportunity.idOportunidadeSql,

        document: opportunity.cpfCnpjCliente,

        susepCode: normalizeSusepCode(opportunity.susep),

        message: getErrorMessage(error),

        details: null,
      });
    }
  }

  return {
    totalReceived: response.itens.length,

    totalPaginacao: response.totalPaginacao,

    clientsCreated,

    opportunitiesCreated,

    opportunitiesExisting,

    successCount: successes.length,

    failureCount: failures.length,

    successes,

    failures,
  };
};
