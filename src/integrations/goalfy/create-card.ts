import "server-only";

import { GOALFY_CARD_URL, GOALFY_TEST_PROFILE, getGoalfyToken } from "./config";
import { goalfyFetch } from "./goalfy-fetch";
import type { GoalfyClientData } from "./types";

interface GoalfyField {
  value: string;

  fieldInfoId: string;
}

const normalizeDocument = (value: string | null) => {
  return value?.replace(/\D/g, "") ?? "";
};

const addField = (
  fields: GoalfyField[],
  fieldInfoId: string,
  value: string | number | null | undefined,
) => {
  if (value === null || value === undefined) {
    return;
  }

  const normalizedValue = String(value).trim();

  if (!normalizedValue) {
    return;
  }

  fields.push({
    value: normalizedValue,

    fieldInfoId,
  });
};

const buildGoalfyCardBody = (client: GoalfyClientData) => {
  const profile = GOALFY_TEST_PROFILE;

  const fields: GoalfyField[] = [];

  addField(fields, profile.fields.internalId, client.id);

  addField(fields, profile.fields.name, client.name);

  const document = normalizeDocument(client.document);

  if (document.length === 11) {
    addField(fields, profile.fields.cpf, document);
  }

  if (document.length === 14) {
    addField(fields, profile.fields.cnpj, document);
  }

  addField(fields, profile.fields.phone, client.phone);

  addField(fields, profile.fields.email, client.email);

  addField(fields, profile.fields.birthDate, client.birthDate);

  addField(fields, profile.fields.product, client.product);

  addField(fields, profile.fields.salesModel, client.salesModel);

  addField(
    fields,
    profile.fields.sourceCreatedAt,
    client.sourceCreatedAt?.toISOString(),
  );

  addField(fields, profile.fields.propensity, client.propensity);

  addField(fields, profile.fields.model, client.model);

  addField(fields, profile.fields.modelYear, client.modelYear);

  addField(fields, profile.fields.licensePlate, client.licensePlate);

  addField(fields, profile.fields.assetValue, client.assetValue);

  addField(fields, profile.fields.zipCode, client.zipCode);

  addField(fields, profile.fields.address, client.address);

  addField(fields, profile.fields.state, client.state);

  addField(fields, profile.fields.city, client.city);

  addField(fields, profile.fields.neighborhood, client.neighborhood);

  addField(fields, profile.fields.observation, client.observation);

  addField(
    fields,
    profile.fields.externalStatusReason,
    client.externalStatusReason,
  );

  addField(fields, profile.fields.distributor, client.insurerName);

  return {
    modelId: profile.modelId,

    fields,
  };
};

export const createGoalfyCard = async (client: GoalfyClientData) => {
  return goalfyFetch({
    url: GOALFY_CARD_URL,

    operation: `Criar card Goalfy do cliente ${client.id}`,

    init: {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Token ${getGoalfyToken()}`,
      },

      body: JSON.stringify(buildGoalfyCardBody(client)),
    },
  });
};
