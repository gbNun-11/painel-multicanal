import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { enterpriseInsurersTable } from "./enterprise-insurers";
import { statusEnum } from "./enums";

export const susepsTable = pgTable(
  "enterprise_insurer_suseps",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    enterpriseInsurerId: uuid("enterprise_insurer_id")
      .notNull()
      .references(() => enterpriseInsurersTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    masterSusepId: uuid("master_susep_id"),

    code: text("code").notNull(),

    multichannel: boolean("multichannel").default(false).notNull(),

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
    uniqueIndex("suseps_enterprise_insurer_code_unique_idx").on(
      table.enterpriseInsurerId,
      table.code,
    ),

    uniqueIndex("suseps_id_enterprise_insurer_unique_idx").on(
      table.id,
      table.enterpriseInsurerId,
    ),

    foreignKey({
      columns: [table.masterSusepId, table.enterpriseInsurerId],
      foreignColumns: [table.id, table.enterpriseInsurerId],
      name: "suseps_master_same_enterprise_insurer_fk",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),

    check(
      "suseps_master_not_self_check",
      sql`${table.masterSusepId} IS NULL OR ${table.masterSusepId} <> ${table.id}`,
    ),

    index("suseps_enterprise_insurer_idx").on(table.enterpriseInsurerId),

    index("suseps_master_susep_idx").on(table.masterSusepId),

    index("suseps_code_idx").on(table.code),
  ],
);
