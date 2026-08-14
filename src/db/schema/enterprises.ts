import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { statusEnum } from "./enums";

export const enterprisesTable = pgTable("enterprises", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj").notNull().unique(),
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
});
