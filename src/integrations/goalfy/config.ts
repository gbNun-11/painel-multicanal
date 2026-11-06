import "server-only";

export const GOALFY_CARD_URL = "https://api.goalfy.com.br/api/cards/form/";

export const GOALFY_MAX_ATTEMPTS = 5;
export const GOALFY_RETRY_DELAY_MS = 5_000;
export const GOALFY_REQUEST_TIMEOUT_MS = 30_000;

export interface GoalfyProfile {
  modelId: string;
  fields: {
    internalId: string;
    leadNumber: string;
    externalId: string;
    adminId: string;
    distributor: string;
    salesperson: string;
    salesModel: string;
    name: string;
    personType: string;
    cpf: string;
    cnpj: string;
    phone: string;
    email: string;
    birthDate?: string;
    product: string;
    productSubcategory?: string;
    model: string;
    modelYear: string;
    licensePlate: string;
    assetValue: string;
    zipCode: string;
    address: string;
    addressNumber: string;
    city: string;
    state?: string;
    neighborhood: string;
    addressComplement: string;
    observation: string;
    externalStatusReason: string;
    sourceCreatedAt: string;
    recollectionDate: string;
    propensity: string;
    isReopening: string;
    isRetransmission: string;
    isSecondarySale: string;
  };
}

export const GOALFY_ICX_PROFILE: GoalfyProfile = {
  modelId: "536f5bcd-e373-4df8-a3ef-ecedd91f5d51",
  fields: {
    internalId: "09d37b80-8bc4-451f-8456-a59862cb6525",
    leadNumber: "09d2fc9a-af10-43d2-8f12-2c9c36ca0476",
    externalId: "e4e6aaba-4669-4231-8a4f-5579cf42075c",
    adminId: "844ab400-df20-48f5-821d-ca77672dee05",
    distributor: "c00b6cb2-b64d-4dfb-9703-f3de9f60c57e",
    name: "3ae8a052-9748-4136-8ef5-c3ee6bda027c",
    phone: "a0523a28-84ed-4f0e-8005-4d46de2cc65e",
    personType: "2886cd08-0cd8-43ff-90ec-0fd8f8930932",
    cpf: "a45dc263-f85d-45f3-b8c2-e66dfa303358",
    cnpj: "0026a6ec-9adf-401b-89e2-c64191d52381",
    email: "19c87e07-1e60-45fd-98ce-df28e50afe47",
    product: "4104ae8f-953d-4e5d-a82b-68c58f17587b",
    productSubcategory: "fa379baf-a9ef-4148-9a69-e62257d17b5f",
    salesperson: "fe49a7b9-a663-403f-b45e-56df874f2a3b",
    model: "bfb2dbf9-5ade-4823-af9a-2cd5be6ba128",
    modelYear: "a23636d9-e80e-4d4a-b706-b68d705845f2",
    licensePlate: "a51e2c70-4ba6-4234-87b1-25d78f5ac425",
    assetValue: "d98e6a4e-91e3-4908-9062-47c12d367915",
    zipCode: "53c0b79a-0175-4cd1-b0de-14bf8527700d",
    address: "0c1dbf56-4d5d-4ae2-9729-5ad3aee9c874",
    addressNumber: "0f1cdf94-1b47-49e0-81fd-0b8a646c9ef8",
    city: "2e3195e5-3450-41ee-8874-75810d74195c",
    neighborhood: "65935d5b-398a-4be0-bf82-dd7e5fb7461e",
    addressComplement: "3827c3a6-307b-40cf-ab30-5be612b77c73",
    observation: "047f2371-de04-46d8-b049-cea7df6cae6f",
    externalStatusReason: "bb7e5664-22ea-4960-8ec7-75561ca26cd4",
    sourceCreatedAt: "5c138148-7554-4e81-a90d-5c2702284081",
    recollectionDate: "4de265bd-e3d4-4e94-afc6-fbcb6c067c50",
    propensity: "a6aae85f-94bd-4640-9fb8-2ba579f8a07c",
    isReopening: "7de693d4-be8b-48e0-9870-a9c1be346a92",
    isRetransmission: "805038f3-57c5-4b3d-9d36-d224e02dedc0",
    isSecondarySale: "2d03b018-4134-444f-a036-4e67c861e846",
    salesModel: "5640e5dc-4c4f-44b4-aaf1-287bd99b5984",
  },
};

export const GOALFY_INRI_PROFILE: GoalfyProfile = {
  modelId: "815d6596-c9f1-46a8-940c-0caaf181e982",
  fields: {
    internalId: "be6c920e-3134-4b8b-9aae-3ff39edd085d",
    leadNumber: "9c223606-e4fe-4c7c-bbbf-117d05c814fe",
    externalId: "a6e877c3-40bb-4d0d-a9a1-990404e43968",
    adminId: "d2bffd07-35b6-45e2-bdbc-ada17269e161",
    distributor: "f544003e-9bf8-4ee1-840e-32516e5dd23c",
    name: "08e23f7c-9c33-428d-adad-2015c6f499ec",
    phone: "e5770185-3010-4d4a-a807-fe81bb6a7536",
    personType: "ade17c29-0b3a-4800-bff8-03623476cb3b",
    cpf: "9289c04e-d225-48b9-bc65-89c26c9bd059",
    cnpj: "c72b65d1-ef3b-4efa-adb5-18bf5c49f840",
    email: "ce799892-1dd1-4f11-9fac-e0f72817029f",
    birthDate: "95e92f32-5f91-4788-9cfc-3b806567f8be",
    product: "73521b64-0022-4416-894f-3a2608f13a6b",
    productSubcategory: "62842c72-b3aa-4537-8f93-8ee4cd7f4bc8",
    salesperson: "21ca582a-802b-4a72-8917-3274b70dc58c",
    model: "a9db7049-85b9-4447-9270-0af8a6f3aad2",
    modelYear: "3569a7be-31b4-4266-bfc2-872a64e01053",
    licensePlate: "333a5e73-de8c-4f2d-8836-b76360580495",
    assetValue: "3f8c53a1-a79c-418c-861e-725e9443235d",
    zipCode: "33070efb-fa7a-41fc-baa9-0a0561c16ed1",
    address: "e1b6b36d-3bb4-4ba0-8066-613a54fd66a0",
    addressNumber: "4c22ecfd-fd85-4202-95f0-8f28bd6202bc",
    city: "1e25a223-8f37-417f-a2cc-d3c6d2ccd0cc",
    neighborhood: "25931a88-9bce-45ea-a807-7744d29deb34",
    addressComplement: "27bcb022-b5f9-4b67-a02f-042d314ebf5a",
    observation: "eca2bc11-3968-49c7-88d9-7cd9ba1de023",
    externalStatusReason: "337ef7ab-dd8a-4df7-b789-c5f2f14a63bb",
    sourceCreatedAt: "bd46aaf5-8bbb-4b23-b0fb-03e6c8e15c8a",
    recollectionDate: "37ada6be-e514-4e19-9257-fb36b93f4580",
    propensity: "d646e37b-0f58-41e3-8f51-91820c1e31cf",
    isReopening: "6f765d3e-f4e4-4678-913b-e821a903717a",
    isRetransmission: "62e1143b-cba7-4b73-9cc1-ef29fe643935",
    isSecondarySale: "50917f4e-4e81-4dc8-9473-a5da255e7278",
    salesModel: "d38c51e7-c554-48f1-8e7f-183bb57b4672",
  },
};

export const resolveGoalfyProfile = (enterpriseName: string): GoalfyProfile => {
  const normalized = enterpriseName
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleUpperCase("pt-BR");

  if (normalized === "ICX CORRETORA LTDA") {
    return GOALFY_ICX_PROFILE;
  }

  if (
    normalized === "INRI CORRETORA" ||
    normalized === "INRI CORRETORA DE SEGUROS E CONSORCIOS LTDA"
  ) {
    return GOALFY_INRI_PROFILE;
  }

  throw new Error(`Empresa sem perfil de criação no Goalfy: ${enterpriseName}`);
};

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
