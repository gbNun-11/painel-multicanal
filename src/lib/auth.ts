import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { APIError, betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { account, session, usersTable, verification } from "@/src/db/schema";

import {
  hasAllowedEmailDomain,
  hasAllowedLoginRole,
} from "../utils/auth-policy";
import { ac, roles } from "./permissions";

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

          return {
            data: user,
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

          return {
            data,
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
