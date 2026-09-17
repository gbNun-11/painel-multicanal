export const ENTERPRISE_IDS = {
  INRI: "71e0874a-89df-47a7-9f29-ad68466afa4a",

  ICX: "16fd1df0-2ac6-429e-b881-0ee4868a7f1e",
} as const;

export type EnterpriseId = (typeof ENTERPRISE_IDS)[keyof typeof ENTERPRISE_IDS];
