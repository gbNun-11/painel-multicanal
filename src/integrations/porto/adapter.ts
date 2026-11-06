import type { IngestOpportunityInput } from "@/src/services/opportunities/ingest-opportunity";

import type { PortoOpportunity } from "./schema";

export interface AdaptPortoOpportunityOptions {
  enterpriseInsurerId: string;
  susepId: string;
  externalId: string;
  productCodeId: string;
  product: string;
  salesModelOverride?: "CONTINGENCIA";
}

const normalizeOptionalText = (value: string | null | undefined) => {
  const normalized = value?.trim();

  if (!normalized || normalized === "-") {
    return null;
  }

  return normalized;
};

const normalizeSourceProgramCode = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error("Código de programa Porto com tipo inválido.");
  }

  const normalized = String(value).trim();

  return normalized && normalized !== "-" ? normalized : null;
};

const resolveSourceProgramCode = (opportunity: PortoOpportunity) => {
  const raw = opportunity as PortoOpportunity & {
    codigoPrograma?: unknown;
  };

  return (
    normalizeSourceProgramCode(raw.codigoPrograma) ??
    normalizeSourceProgramCode(opportunity.programa)
  );
};

const resolveSalesModel = (
  programCode: string | null,
  override?: "CONTINGENCIA",
): "LEAD" | "VINCULO" | "CONTINGENCIA" => {
  if (override === "CONTINGENCIA") {
    return "CONTINGENCIA";
  }

  if (programCode === "390260001") {
    return "VINCULO";
  }

  return "LEAD";
};

const selectPhone = (opportunity: PortoOpportunity) => {
  return (
    normalizeOptionalText(opportunity.telefoneContato?.telefoneCelular) ??
    normalizeOptionalText(opportunity.telefoneContato?.telefoneResidencial) ??
    normalizeOptionalText(opportunity.telefoneContato?.telefoneComercial)
  );
};

const resolveBirthDate = (opportunity: PortoOpportunity) => {
  const normalizedDocument = opportunity.cpfCnpjCliente
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (normalizedDocument.length !== 11) {
    return null;
  }

  const birthDate = normalizeOptionalText(opportunity.dataNascimento);

  if (!birthDate || birthDate.startsWith("1900-01-01")) {
    return null;
  }

  return birthDate.slice(0, 10);
};

const parseSourceCreatedAt = (value: string | null | undefined) => {
  const normalized = normalizeOptionalText(value);

  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
};

const parseModelYear = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseAssetValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value).trim() || null;
};

export const adaptPortoOpportunity = (
  opportunity: PortoOpportunity,
  options: AdaptPortoOpportunityOptions,
): IngestOpportunityInput => {
  const sourceProgramCode = resolveSourceProgramCode(opportunity);

  const salesModel = resolveSalesModel(
    sourceProgramCode,
    options.salesModelOverride,
  );

  return {
    client: {
      name: opportunity.nomeCliente,
      document: opportunity.cpfCnpjCliente,
      phone: selectPhone(opportunity),
      email: normalizeOptionalText(opportunity.emailCliente),
      birthDate: resolveBirthDate(opportunity),
      address: normalizeOptionalText(opportunity.contatoEndereco),
      addressNumber: normalizeOptionalText(opportunity.contatoNumero),
      addressComplement: normalizeOptionalText(opportunity.contatoComplemento),
      neighborhood: normalizeOptionalText(opportunity.contatoBairro),
      city: normalizeOptionalText(opportunity.contatoCidade),
      state: normalizeOptionalText(opportunity.contatoEstado),
      zipCode: normalizeOptionalText(opportunity.contatoCep),
    },

    opportunity: {
      enterpriseInsurerId: options.enterpriseInsurerId,
      susepId: options.susepId,
      externalSource: "PORTO",
      externalId: options.externalId,

      productCodeId: options.productCodeId,
      product: options.product,

      propensityCode: normalizeOptionalText(opportunity.codigoPropensao),
      propensity: normalizeOptionalText(opportunity.propensao),

      sourceProgramCode,
      salesModel,

      externalStatusReason: normalizeOptionalText(opportunity.razaoStatus),

      model: normalizeOptionalText(opportunity.modelo),
      modelYear: parseModelYear(opportunity.modeloAno),
      licensePlate: normalizeOptionalText(opportunity.placa),
      assetValue: parseAssetValue(opportunity.valorBem),
      observation: normalizeOptionalText(opportunity.observacoes),
      sourceCreatedAt: parseSourceCreatedAt(opportunity.dataCriacao),

      sourcePayload: opportunity as Record<string, unknown>,
    },
  };
};
