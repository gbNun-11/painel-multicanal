export interface GoalfyClientData {
  id: string;
  externalId: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  product: string | null;
  productSubcategory: string | null;
  salesModel: "LEAD" | "VINCULO" | "CONTINGENCIA" | null;
  sourceCreatedAt: Date | null;
  propensity: string | null;
  model: string | null;
  modelYear: number | null;
  licensePlate: string | null;
  assetValue: string | null;
  zipCode: string | null;
  address: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  state: string | null;
  city: string | null;
  neighborhood: string | null;
  observation: string | null;
  externalStatusReason: string | null;
  insurerName: string;
  goalfyResponsibleValue: string | null;
}

export interface GoalfyWhatsAppPayload {
  telefone: string;
  empresa: string;
  clientes: string;
}
