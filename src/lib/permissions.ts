import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

export const adminRole = ac.newRole({
  ...adminAc.statements,
});

export const administrativoRole = ac.newRole({});

export const comercialRole = ac.newRole({});

export const roles = {
  admin: adminRole,
  administrativo: administrativoRole,
  comercial: comercialRole,
} as const;
