import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { APIError, betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { account, session, usersTable, verification } from "@/src/db/schema";
import {
  hasAllowedEmailDomain,
  hasAllowedLoginRole,
} from "@/src/utils/auth-policy";
import { isValidCpf, normalizeCpf } from "@/src/utils/documents";

import { ac, roles } from "./permissions";

const getTodayDateString = () => {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(today.getMonth() + 1).padStart(2, "0");

  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const normalizeUserCpf = (value: unknown) => {
  if (typeof value !== "string") {
    throw new APIError("BAD_REQUEST", {
      message: "Informe o CPF.",
    });
  }

  const cpf = normalizeCpf(value);

  if (!isValidCpf(cpf)) {
    throw new APIError("BAD_REQUEST", {
      message: "Informe um CPF válido.",
    });
  }

  return cpf;
};

const normalizeUserBirthDate = (value: unknown) => {
  if (typeof value !== "string") {
    throw new APIError("BAD_REQUEST", {
      message: "Informe a data de nascimento.",
    });
  }

  const birthDate = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    throw new APIError("BAD_REQUEST", {
      message: "Informe uma data de nascimento válida.",
    });
  }

  const [year, month, day] = birthDate.split("-").map(Number);

  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  const isValidDate =
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day;

  if (!isValidDate) {
    throw new APIError("BAD_REQUEST", {
      message: "Informe uma data de nascimento válida.",
    });
  }

  if (birthDate > getTodayDateString()) {
    throw new APIError("BAD_REQUEST", {
      message: "A data de nascimento não pode estar no futuro.",
    });
  }

  return birthDate;
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",

    schema: {
      users: usersTable,

      session,

      account,

      verification,
    },
  }),

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!hasAllowedEmailDomain(user.email)) {
            throw new APIError("BAD_REQUEST", {
              message:
                "O e-mail deve pertencer ao domínio @inricorretora.com.br.",
            });
          }

          const cpf = normalizeUserCpf(user.cpf);

          const birthDate = normalizeUserBirthDate(user.birthDate);

          return {
            data: {
              ...user,

              cpf,

              birthDate,
            },
          };
        },
      },

      update: {
        before: async (data) => {
          if (data.email && !hasAllowedEmailDomain(data.email)) {
            throw new APIError("BAD_REQUEST", {
              message:
                "O e-mail deve pertencer ao domínio @inricorretora.com.br.",
            });
          }

          const cpf =
            data.cpf !== undefined ? normalizeUserCpf(data.cpf) : undefined;

          const birthDate =
            data.birthDate !== undefined
              ? normalizeUserBirthDate(data.birthDate)
              : undefined;

          return {
            data: {
              ...data,

              ...(cpf !== undefined ? { cpf } : {}),

              ...(birthDate !== undefined ? { birthDate } : {}),
            },
          };
        },
      },
    },

    session: {
      create: {
        before: async (session) => {
          const [user] = await db
            .select({
              id: usersTable.id,

              email: usersTable.email,

              role: usersTable.role,

              status: usersTable.status,
            })
            .from(usersTable)
            .where(eq(usersTable.id, session.userId))
            .limit(1);

          if (!user) {
            throw new APIError("UNAUTHORIZED", {
              message: "Acesso não autorizado.",
            });
          }

          if (user.status !== "ativo") {
            throw new APIError("FORBIDDEN", {
              message: "Acesso não autorizado.",
            });
          }

          if (!hasAllowedLoginRole(user.role)) {
            throw new APIError("FORBIDDEN", {
              message: "Acesso não autorizado.",
            });
          }

          if (!hasAllowedEmailDomain(user.email)) {
            throw new APIError("FORBIDDEN", {
              message: "Acesso não autorizado.",
            });
          }

          return {
            data: session,
          };
        },
      },
    },
  },

  emailAndPassword: {
    enabled: true,

    disableSignUp: true,

    minPasswordLength: 8,

    maxPasswordLength: 128,
  },

  user: {
    modelName: "users",

    additionalFields: {
      cpf: {
        type: "string",

        required: true,

        input: true,

        returned: false,
      },

      birthDate: {
        type: "string",

        required: true,

        input: true,

        returned: false,
      },

      phone: {
        type: "string",

        required: true,
      },

      status: {
        type: ["ativo", "inativo"],

        required: true,

        input: false,
      },
    },
  },

  plugins: [
    admin({
      ac,

      roles: {
        admin: roles.admin,

        administrativo: roles.administrativo,

        comercial: roles.comercial,
      },
    }),
  ],

  advanced: {
    database: {
      generateId: "uuid",

      joins: true,
    },
  },
});
