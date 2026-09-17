import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { usersTable } from "./users";

export const session = pgTable(
  "session",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),

    token: text("token").notNull().unique(),

    impersonatedBy: text("impersonated_by"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    ipAddress: text("ip_address"),

    userAgent: text("user_agent"),

    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
      }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    issuer: text("issuer"),

    accountId: text("account_id").notNull(),

    providerId: text("provider_id").notNull(),

    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
      }),

    accessToken: text("access_token"),

    refreshToken: text("refresh_token"),

    idToken: text("id_token"),

    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),

    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),

    scope: text("scope"),

    password: text("password"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    identifier: text("identifier").notNull(),

    value: text("value").notNull(),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);
