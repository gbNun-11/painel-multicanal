import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { enterprisesTable } from "./enterprises";
import { statusEnum } from "./enums";
import { insurersTable } from "./insurers";

export const enterpriseInsurersTable = pgTable(
  "enterprise_insurers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    enterpriseId: uuid("enterprise_id")
      .notNull()
      .references(() => enterprisesTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    insurerId: uuid("insurer_id")
      .notNull()
      .references(() => insurersTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
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
    uniqueIndex("enterprise_insurers_unique_idx").on(
      table.enterpriseId,
      table.insurerId,
    ),

    index("enterprise_insurers_enterprise_idx").on(table.enterpriseId),

    index("enterprise_insurers_insurer_idx").on(table.insurerId),
  ],
);
