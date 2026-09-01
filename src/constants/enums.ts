export const statuses = ["ativo", "inativo"] as const;

export type Status = (typeof statuses)[number];

export const statusLabels: Record<Status, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
};

export const statusItems = statuses.map((status) => ({
  value: status,
  label: statusLabels[status],
}));

export const userRoles = ["admin", "administrativo", "comercial"] as const;

export type UserRole = (typeof userRoles)[number];

export const userRoleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  administrativo: "Administrativo",
  comercial: "Comercial",
};

export const userRoleItems = userRoles.map((role) => ({
  value: role,
  label: userRoleLabels[role],
}));
