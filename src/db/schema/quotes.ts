import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { opportunitiesTable } from "./opportunities";

export const insuranceQuotesTable = pgTable(
  "insurance_quotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunitiesTable.id, { onDelete: "restrict" }),
    quoteType: text("quote_type").notNull(),
    product: text("product").notNull(),
    externalNumber: text("external_number"),
    status: text("status").default("rascunho").notNull(),
    validUntil: date("valid_until", { mode: "string" }),
    totalLives: integer("total_lives"),
    totalAmount: numeric("total_amount", { precision: 18, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("insurance_quotes_opportunity_idx").on(t.opportunityId),
    unique("insurance_quotes_opportunity_id_id_uniq").on(t.opportunityId, t.id),
    check(
      "insurance_quotes_total_lives_check",
      sql`${t.totalLives} IS NULL OR ${t.totalLives} >= 0`,
    ),
    check(
      "insurance_quotes_total_amount_check",
      sql`${t.totalAmount} IS NULL OR ${t.totalAmount} >= 0`,
    ),
  ],
);

export const quotePlansTable = pgTable(
  "quote_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => insuranceQuotesTable.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    provider: text("provider"),
    accommodation: text("accommodation"),
    copayment: text("copayment"),
    lives: integer("lives"),
    monthlyAmount: numeric("monthly_amount", { precision: 18, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("quote_plans_quote_idx").on(t.quoteId),
    unique("quote_plans_quote_id_id_unique").on(t.quoteId, t.id),
    check(
      "quote_plans_lives_check",
      sql`${t.lives} IS NULL OR ${t.lives} >= 0`,
    ),
    check(
      "quote_plans_monthly_amount_check",
      sql`${t.monthlyAmount} IS NULL OR ${t.monthlyAmount} >= 0`,
    ),
  ],
);

export const quoteMembersTable = pgTable(
  "quote_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => insuranceQuotesTable.id, { onDelete: "restrict" }),
    quotePlanId: uuid("quote_plan_id"),
    name: text("name"),
    document: text("document"),
    birthDate: date("birth_date", { mode: "string" }),
    ageBand: text("age_band"),
    relationship: text("relationship"),
    monthlyAmount: numeric("monthly_amount", { precision: 18, scale: 2 }),
  },
  (t) => [
    index("quote_members_quote_idx").on(t.quoteId),
    index("quote_members_plan_idx").on(t.quoteId, t.quotePlanId),
    foreignKey({
      name: "quote_members_plan_quote_fk",
      columns: [t.quoteId, t.quotePlanId],
      foreignColumns: [quotePlansTable.quoteId, quotePlansTable.id],
    }).onDelete("restrict"),
    check(
      "quote_members_monthly_amount_check",
      sql`${t.monthlyAmount} IS NULL OR ${t.monthlyAmount} >= 0`,
    ),
  ],
);
