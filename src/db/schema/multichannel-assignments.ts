import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { statusEnum } from "./enums";
import { productsTable } from "./products";
import { susepsTable } from "./suseps";
import { usersTable } from "./users";

export const multichannelAssignmentsTable = pgTable(
  "multichannel_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    susepId: uuid("susep_id")
      .notNull()
      .references(() => susepsTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    productId: uuid("product_id")
      .notNull()
      .references(() => productsTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, {
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
    uniqueIndex("multichannel_assignments_susep_product_unique_idx").on(
      table.susepId,
      table.productId,
    ),

    index("multichannel_assignments_susep_idx").on(table.susepId),

    index("multichannel_assignments_product_idx").on(table.productId),

    index("multichannel_assignments_user_idx").on(table.userId),
  ],
);
