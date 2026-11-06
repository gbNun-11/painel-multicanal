import { ingestOpportunity } from "@/src/services/opportunities/ingest-opportunity";
import {
  resolveSusep,
  type ResolvedSusep,
} from "@/src/services/suseps/resolve-susep";

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

  multichannel: boolean;

  multichannelUserId: string | null;

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

const normalizeProductCode = (value: string | null | undefined) => {
  return normalizeOptionalText(value)?.toUpperCase() ?? null;
};

const normalizeCacheProductName = (value: string | null | undefined) => {
  return value?.trim().replace(/\s+/g, " ").toLocaleUpperCase("pt-BR") ?? "";
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

  const susepResolutionCache = new Map<string, ResolvedSusep>();

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

      const productCode = normalizeProductCode(opportunity.codigoProduto);

      if (!productCode) {
        throw new Error(
          `A oportunidade ${opportunity.idOportunidadeSql} da SUSEP ${susepCode} não informou o código do produto.`,
        );
      }

      const sourceProduct = normalizeOptionalText(opportunity.nomeProduto);

      const cacheKey = JSON.stringify([
        susepCode,

        productCode,

        normalizeCacheProductName(sourceProduct),
      ]);

      let susep = susepResolutionCache.get(cacheKey);

      if (!susep) {
        susep = await resolveSusep({
          enterpriseInsurerId: normalizedEnterpriseInsurerId,

          code: susepCode,

          productCode,

          productName: sourceProduct,
        });

        susepResolutionCache.set(cacheKey, susep);
      }

      const product =
        sourceProduct ?? (susep.multichannel ? susep.productCodeName : null);

      if (!product) {
        throw new Error(
          `A oportunidade ${opportunity.idOportunidadeSql} não informou o nome do produto.`,
        );
      }

      const resolvedProductCode = susep.multichannel
        ? susep.productCode
        : productCode;

      const input = adaptPortoOpportunity(opportunity, {
        enterpriseInsurerId: normalizedEnterpriseInsurerId,

        susepId: susep.id,

        productCode: resolvedProductCode,

        product,
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

        multichannel: susep.multichannel,

        multichannelUserId: susep.multichannel
          ? susep.multichannelUserId
          : null,

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
