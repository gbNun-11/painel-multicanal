import {
  boolean,
  date,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { statusEnum, userRoleEnum } from "./enums";

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull(),

  cpf: text("cpf").notNull().unique(),

  birthDate: date("birth_date", {
    mode: "string",
  }).notNull(),

  phone: text("phone").notNull().unique(),

  email: text("email").notNull().unique(),

  emailVerified: boolean("email_verified").default(false).notNull(),

  image: text("image"),

  role: userRoleEnum("role").notNull(),

  status: statusEnum("status").default("ativo").notNull(),

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

  banned: boolean("banned").default(false).notNull(),

  banReason: text("ban_reason"),

  banExpires: timestamp("ban_expires", {
    withTimezone: true,
  }),
});
