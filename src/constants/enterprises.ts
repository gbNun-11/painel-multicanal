export const ENTERPRISE_IDS = {
  INRI: "2bf1065a-36fd-49a1-9ac6-c68c40c6d22d",

  ICX: "edb3add7-39a0-4389-a298-ceb2febb0404",
} as const;

export type EnterpriseId = (typeof ENTERPRISE_IDS)[keyof typeof ENTERPRISE_IDS];
