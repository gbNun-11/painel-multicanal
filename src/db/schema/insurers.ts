import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { statusEnum } from "./enums";

export const insurersTable = pgTable("insurers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
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
