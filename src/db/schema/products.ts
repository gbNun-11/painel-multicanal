import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { statusEnum } from "./enums";
import { insurersTable } from "./insurers";

export const productsTable = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    insurerId: uuid("insurer_id")
      .notNull()
      .references(() => insurersTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    name: text("name").notNull(),

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
  },

  (table) => [
    uniqueIndex("products_insurer_name_unique_idx").on(
      table.insurerId,
      table.name,
    ),

    uniqueIndex("products_id_insurer_unique_idx").on(table.id, table.insurerId),

    index("products_insurer_idx").on(table.insurerId),
  ],
);
