export const statuses = ["ativo", "inativo"] as const;

export type Status = (typeof statuses)[number];

export const userRoles = ["administrativo", "comercial", "admin"] as const;

export type UserRole = (typeof userRoles)[number];
