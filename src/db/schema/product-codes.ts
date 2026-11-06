import {
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { statusEnum } from "./enums";
import { insurersTable } from "./insurers";
import { productsTable } from "./products";

export const productCodesTable = pgTable(
  "insurer_product_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    insurerId: uuid("insurer_id")
      .notNull()
      .references(() => insurersTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    productId: uuid("product_id").notNull(),

    externalId: text("external_id"),

    code: text("code").notNull(),

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
    foreignKey({
      columns: [table.productId, table.insurerId],
      foreignColumns: [productsTable.id, productsTable.insurerId],
      name: "product_codes_product_insurer_fk",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),

    uniqueIndex("product_codes_insurer_product_code_name_unique_idx").on(
      table.insurerId,
      table.productId,
      table.code,
      table.name,
    ),

    uniqueIndex("product_codes_insurer_external_id_unique_idx").on(
      table.insurerId,
      table.externalId,
    ),

    index("product_codes_product_idx").on(table.productId),
    index("product_codes_insurer_idx").on(table.insurerId),
  ],
);
