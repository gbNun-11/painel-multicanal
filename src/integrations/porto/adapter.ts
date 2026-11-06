import type { IngestOpportunityInput } from "@/src/services/opportunities/ingest-opportunity";

import type { PortoOpportunity } from "./schema";

export interface AdaptPortoOpportunityOptions {
  enterpriseInsurerId: string;

  susepId: string;

  productCode: string;

  product: string;
}

const normalizeOptionalText = (value: string | null | undefined) => {
  const normalized = value?.trim();

  if (!normalized || normalized === "-") {
    return null;
  }

  return normalized;
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

  if (!birthDate) {
    return null;
  }

  if (birthDate.startsWith("1900-01-01")) {
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

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const parseModelYear = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const parseAssetValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();

  return normalized || null;
};

export const adaptPortoOpportunity = (
  opportunity: PortoOpportunity,
  options: AdaptPortoOpportunityOptions,
): IngestOpportunityInput => {
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

      externalId: opportunity.idOportunidadeSql,

      productCode: options.productCode,

      product: options.product,

      propensityCode: normalizeOptionalText(opportunity.codigoPropensao),

      propensity: normalizeOptionalText(opportunity.propensao),

      salesModel: null,

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
