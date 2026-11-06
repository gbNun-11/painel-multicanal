import "server-only";

import {
  GOALFY_CARD_URL,
  resolveGoalfyProfile,
  getGoalfyToken,
} from "./config";
import { goalfyFetch } from "./goalfy-fetch";
import { calculateRecollectionDate } from "@/src/utils/recollection-date";
import type { GoalfyClientData } from "./types";

interface GoalfyField {
  value: string | string[];
  fieldInfoId: string;
}
export type GoalfyCreateCardData = GoalfyClientData & {
  enterpriseName: string;
  opportunityNumber?: number | null;
  externalId?: string | null;
  productSubcategory?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  goalfyResponsibleValue?: string | null;
  distributionAt: Date;
};

const normalizeDocument = (value: string | null) =>
  value?.replace(/\D/g, "") ?? "";

const normalizeText = (value: string | number | null | undefined) =>
  value === null || value === undefined ? "" : String(value).trim();

const addField = (
  fields: GoalfyField[],
  fieldInfoId: string | undefined,
  value: string | number | null | undefined,
) => {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue || !fieldInfoId) return;
  fields.push({ value: normalizedValue, fieldInfoId });
};

const required = (label: string, value: string | number | null | undefined) => {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) {
    throw new Error(
      `Não foi possível criar o card Goalfy: ${label} não informado.`,
    );
  }
  return normalizedValue;
};

export const buildGoalfyCardBody = (client: GoalfyCreateCardData) => {
  const { fields: fieldIds, modelId } = resolveGoalfyProfile(
    client.enterpriseName,
  );
  const fields: GoalfyField[] = [];

  addField(
    fields,
    fieldIds.internalId,
    required("opportunities.id", client.id),
  );
  addField(fields, fieldIds.externalId, client.externalId);
  if (client.opportunityNumber != null) {
    if (
      !Number.isSafeInteger(client.opportunityNumber) ||
      client.opportunityNumber < 1
    ) {
      throw new Error(
        "Número comercial da oportunidade inválido para envio ao Goalfy.",
      );
    }
    addField(fields, fieldIds.leadNumber, client.opportunityNumber);
  }
  addField(fields, fieldIds.distributor, client.insurerName);

  fields.push({
    fieldInfoId: fieldIds.salesperson,
    value: [required("responsável Goalfy", client.goalfyResponsibleValue)],
  });
  addField(
    fields,
    fieldIds.salesModel,
    required("modelo de venda", client.salesModel),
  );
  addField(fields, fieldIds.name, required("nome do cliente", client.name));

  const document = normalizeDocument(client.document);
  if (document.length !== 11 && document.length !== 14) {
    throw new Error("Não foi possível criar o card Goalfy: CPF/CNPJ inválido.");
  }
  addField(fields, fieldIds.personType, document.length === 11 ? "PF" : "PJ");
  if (document.length === 11) addField(fields, fieldIds.cpf, document);
  if (document.length === 14) addField(fields, fieldIds.cnpj, document);

  if (!normalizeText(client.phone) && !normalizeText(client.email)) {
    throw new Error(
      "Não foi possível criar o card Goalfy: nenhum contato informado.",
    );
  }
  addField(fields, fieldIds.phone, client.phone);
  addField(fields, fieldIds.email, client.email);
  addField(fields, fieldIds.birthDate, client.birthDate);
  addField(
    fields,
    fieldIds.product,
    required("produto lógico", client.product),
  );
  addField(fields, fieldIds.productSubcategory, client.productSubcategory);
  addField(fields, fieldIds.model, client.model);
  addField(fields, fieldIds.modelYear, client.modelYear);
  addField(fields, fieldIds.licensePlate, client.licensePlate);
  addField(fields, fieldIds.assetValue, client.assetValue);
  addField(fields, fieldIds.zipCode, client.zipCode);
  addField(fields, fieldIds.address, client.address);
  addField(fields, fieldIds.addressNumber, client.addressNumber);
  addField(fields, fieldIds.city, client.city);
  addField(fields, fieldIds.state, client.state);
  addField(fields, fieldIds.neighborhood, client.neighborhood);
  addField(fields, fieldIds.addressComplement, client.addressComplement);
  addField(fields, fieldIds.observation, client.observation);
  addField(fields, fieldIds.externalStatusReason, client.externalStatusReason);

  const portoDate = client.sourceCreatedAt;
  if (!portoDate || Number.isNaN(portoDate.getTime())) {
    throw new Error(
      "Não foi possível criar o card Goalfy: data de chegada da Porto ausente ou inválida.",
    );
  }
  addField(fields, fieldIds.sourceCreatedAt, portoDate.toISOString());
  addField(fields, fieldIds.propensity, client.propensity);
  addField(fields, fieldIds.isReopening, "NÃO");
  addField(fields, fieldIds.isRetransmission, "NÃO");
  addField(fields, fieldIds.isSecondarySale, "NÃO");

  const distributionAt = client.distributionAt;
  if (
    !(distributionAt instanceof Date) ||
    Number.isNaN(distributionAt.getTime())
  ) {
    throw new Error(
      "Não foi possível criar o card Goalfy: data de distribuição inválida.",
    );
  }
  addField(
    fields,
    fieldIds.recollectionDate,
    calculateRecollectionDate(distributionAt),
  );

  return { modelId, fields };
};

export const createGoalfyCard = async (client: GoalfyCreateCardData) => {
  const body = buildGoalfyCardBody(client);
  return goalfyFetch({
    url: GOALFY_CARD_URL,
    operation: `Criar card Goalfy da oportunidade ${client.id}`,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${getGoalfyToken()}`,
      },
      body: JSON.stringify(body),
    },
  });
};
