import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { betterAuth } from "better-auth";

import { db } from "@/src/db";
import { account, session, usersTable, verification } from "@/src/db/schema";

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

      role: {
        type: ["administrativo", "comercial", "admin"],
        required: true,
        input: false,
      },

      status: {
        type: ["ativo", "inativo"],
        required: true,
        input: false,
      },
    },
  },
  advanced: {
    database: {
      generateId: "uuid",
      joins: true,
    },
  },
});
