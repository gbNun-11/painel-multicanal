import "server-only";

export const GOALFY_CARD_URL = "https://api.goalfy.com.br/api/cards/form/";

export const GOALFY_MAX_ATTEMPTS = 5;

export const GOALFY_RETRY_DELAY_MS = 5_000;

export const GOALFY_REQUEST_TIMEOUT_MS = 30_000;

export const GOALFY_TEST_PROFILE = {
  modelId: "ad72d56a-43eb-4deb-8f3c-dba032cf509b",

  fields: {
    internalId: "e2671c16-4c76-465f-8076-d5f8df91018a",

    name: "dd9e1860-19e8-4c92-a50e-229ae2d34cf3",

    cpf: "245c14f0-0d3a-4942-9469-fc5fb7ad406a",

    cnpj: "10c0739c-f05c-4757-a88c-8ba711d08c72",

    phone: "edebac70-7f43-4181-bd41-6f35b7049acc",

    email: "98fc1645-04e6-411e-9772-60ec92c21c6e",

    birthDate: "18c21345-88c6-437a-b0b3-203440f7a17b",

    product: "c41b467b-c62c-4718-851c-36df21e61c07",

    salesModel: "dc4fa037-372c-47d2-be1c-cf6337bade21",

    sourceCreatedAt: "12ca8ad0-e4cb-4bc2-8113-cc5a54db0e62",

    propensity: "ffb16af9-2ba3-452c-aabe-9c12f347e92c",

    model: "2d99d902-870b-4321-b846-d1b7ec0c7a57",

    modelYear: "64f70f17-a2de-4567-aa6d-db8e45185a9c",

    licensePlate: "f5dd36c8-975d-48e6-b2c2-594914797b4f",

    assetValue: "6a06f7a8-cf89-4908-b905-0caeb21395fd",

    zipCode: "1cd45006-6fc2-4d6d-a50e-d715e2ef0e46",

    address: "25e0ad35-ee57-40ec-bfe6-fb6d1b60a768",

    state: "be5de2d3-4d2f-4a39-afda-508cb7c2527e",

    city: "41702120-a1a5-4c76-b810-4a00a85de6df",

    neighborhood: "c0ade7e3-11d8-43b6-b2e1-37c9a25f319d",

    observation: "536163ac-1f34-421e-af0f-8b0d48f1932d",

    externalStatusReason: "6748b1fb-bcaf-4678-bbe5-2bbd7e4a046f",

    distributor: "c11f2379-3483-4b53-b61d-0817b2cb4545",
  },
} as const;

export const getGoalfyToken = () => {
  const token = process.env.TOKEN_GOALFY?.trim();

  if (!token) {
    throw new Error("TOKEN_GOALFY não configurado.");
  }

  return token;
};

export const getGoalfyWhatsAppWebhookUrl = () => {
  const url = process.env.GOALFY_WHATSAPP_WEBHOOK_URL?.trim();

  if (!url) {
    throw new Error("GOALFY_WHATSAPP_WEBHOOK_URL não configurado.");
  }

  return url;
};
