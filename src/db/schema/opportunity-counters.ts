import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { enterprisesTable } from "./enterprises";
import { productsTable } from "./products";

/**
 * Sequência comercial exclusiva por empresa + produto lógico.
 * Começa em 0 (a primeira oportunidade nova recebe 1).
 * Contadores históricos são inicializados via SQL antes de ativar a ingestão nova.
 */
export const opportunityCountersTable = pgTable(
  "opportunity_counters",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    enterpriseId: uuid("enterprise_id")
      .notNull()
      .references(() => enterprisesTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    productId: uuid("product_id")
      .notNull()
      .references(() => productsTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    lastNumber: bigint("last_number", { mode: "number" })
      .notNull()
      .default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("opportunity_counters_enterprise_product_uidx").on(
      table.enterpriseId,
      table.productId,
    ),
    check(
      "opportunity_counters_last_number_nonnegative_check",
      sql`${table.lastNumber} >= 0`,
    ),
  ],
);
