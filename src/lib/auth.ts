import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";

import { db } from "@/src/db";
import { account, session, usersTable, verification } from "@/src/db/schema";

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
