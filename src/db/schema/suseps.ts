import {
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
  "suseps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    enterpriseInsurerId: uuid("enterprise_insurer_id")
      .notNull()
      .references(() => enterpriseInsurersTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    code: text("code").notNull(),
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

    index("suseps_enterprise_insurer_idx").on(table.enterpriseInsurerId),

    index("suseps_code_idx").on(table.code),
  ],
);
