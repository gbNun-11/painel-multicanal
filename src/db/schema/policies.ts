import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { proposalsTable } from "./proposals";
import { usersTable } from "./users";

export const policiesTable = pgTable(
  "policies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => proposalsTable.id, { onDelete: "restrict" }),
    policyNumber: text("policy_number"),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    startsOn: date("starts_on", { mode: "string" }),
    endsOn: date("ends_on", { mode: "string" }),
    status: text("status").default("emitida").notNull(),
    grossPremium: numeric("gross_premium", { precision: 18, scale: 2 }),
    netPremium: numeric("net_premium", { precision: 18, scale: 2 }),
    originalPaymentMethod: text("original_payment_method"),
    originalPaymentInstallments: integer("original_payment_installments"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("policies_proposal_uniq").on(t.proposalId),
    index("policies_number_idx").on(t.policyNumber),
    index("policies_status_idx").on(t.status),
    check(
      "policies_validity_range_check",
      sql`${t.startsOn} IS NULL OR ${t.endsOn} IS NULL OR ${t.startsOn} <= ${t.endsOn}`,
    ),
    check(
      "policies_gross_premium_nonnegative",
      sql`${t.grossPremium} IS NULL OR ${t.grossPremium} >= 0`,
    ),
    check(
      "policies_net_premium_nonnegative",
      sql`${t.netPremium} IS NULL OR ${t.netPremium} >= 0`,
    ),
    check(
      "policies_original_installments_positive",
      sql`${t.originalPaymentInstallments} IS NULL OR ${t.originalPaymentInstallments} > 0`,
    ),
  ],
);

export const policyCoveragesTable = pgTable(
  "policy_coverages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    policyId: uuid("policy_id")
      .notNull()
      .references(() => policiesTable.id, { onDelete: "restrict" }),
    code: text("code"),
    description: text("description").notNull(),
    insuredLimit: numeric("insured_limit", { precision: 18, scale: 2 }),
    deductible: numeric("deductible", { precision: 18, scale: 2 }),
    premium: numeric("premium", { precision: 18, scale: 2 }),
  },
  (t) => [
    index("policy_coverages_policy_idx").on(t.policyId),
    check(
      "policy_coverages_insured_limit_nonnegative",
      sql`${t.insuredLimit} IS NULL OR ${t.insuredLimit} >= 0`,
    ),
    check(
      "policy_coverages_deductible_nonnegative",
      sql`${t.deductible} IS NULL OR ${t.deductible} >= 0`,
    ),
    check(
      "policy_coverages_premium_nonnegative",
      sql`${t.premium} IS NULL OR ${t.premium} >= 0`,
    ),
  ],
);

export const policyEndorsementsTable = pgTable(
  "policy_endorsements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    policyId: uuid("policy_id")
      .notNull()
      .references(() => policiesTable.id, { onDelete: "restrict" }),
    endorsementNumber: text("endorsement_number"),
    kind: text("kind").notNull(),
    status: text("status").default("solicitado").notNull(),
    reason: text("reason"),
    requestedAt: timestamp("requested_at", { withTimezone: true }),
    effectiveOn: date("effective_on", { mode: "string" }),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    grossPremiumDelta: numeric("gross_premium_delta", {
      precision: 18,
      scale: 2,
    }),
    netPremiumDelta: numeric("net_premium_delta", { precision: 18, scale: 2 }),
    createdByUserId: uuid("created_by_user_id").references(
      () => usersTable.id,
      { onDelete: "restrict" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("policy_endorsements_policy_idx").on(t.policyId, t.createdAt),
    unique("policy_endorsements_policy_id_id_uniq").on(t.policyId, t.id),
  ],
);

export const policyEndorsementItemsTable = pgTable(
  "policy_endorsement_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    endorsementId: uuid("endorsement_id")
      .notNull()
      .references(() => policyEndorsementsTable.id, { onDelete: "restrict" }),
    itemType: text("item_type").notNull(),
    description: text("description"),
    previousValue: jsonb("previous_value").$type<unknown>(),
    newValue: jsonb("new_value").$type<unknown>(),
    amountDelta: numeric("amount_delta", { precision: 18, scale: 2 }),
  },
  (t) => [
    index("policy_endorsement_items_endorsement_idx").on(t.endorsementId),
  ],
);
