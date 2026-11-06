import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
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

import { enterpriseInsurersTable } from "./enterprise-insurers";
import { policiesTable, policyEndorsementsTable } from "./policies";
import { productsTable } from "./products";
import { usersTable } from "./users";

export const commissionRulesTable = pgTable(
  "commission_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    enterpriseInsurerId: uuid("enterprise_insurer_id")
      .notNull()
      .references(() => enterpriseInsurersTable.id, { onDelete: "restrict" }),
    productId: uuid("product_id").references(() => productsTable.id, {
      onDelete: "restrict",
    }),
    name: text("name").notNull(),
    status: text("status").default("ativo").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("commission_rules_enterprise_insurer_idx").on(t.enterpriseInsurerId),
    index("commission_rules_product_idx").on(t.productId),
  ],
);

export const commissionRuleVersionsTable = pgTable(
  "commission_rule_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ruleId: uuid("rule_id")
      .notNull()
      .references(() => commissionRulesTable.id, { onDelete: "restrict" }),
    version: integer("version").notNull(),
    effectiveFrom: date("effective_from", { mode: "string" }).notNull(),
    effectiveUntil: date("effective_until", { mode: "string" }),
    commissionPercent: numeric("commission_percent", {
      precision: 9,
      scale: 5,
    }),
    fixedCommission: numeric("fixed_commission", { precision: 18, scale: 2 }),
    installmentsCount: integer("installments_count"),
    startMonthOffset: integer("start_month_offset"),
    settlementPolicy: text("settlement_policy"),
    calculationParameters: jsonb("calculation_parameters").$type<
      Record<string, unknown>
    >(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("commission_rule_versions_number_uniq").on(t.ruleId, t.version),
    check("commission_rule_version_positive", sql`${t.version} > 0`),
    check(
      "commission_rule_versions_dates_check",
      sql`${t.effectiveUntil} IS NULL OR ${t.effectiveUntil} >= ${t.effectiveFrom}`,
    ),
    check(
      "commission_rule_versions_percent_check",
      sql`${t.commissionPercent} IS NULL OR ${t.commissionPercent} >= 0`,
    ),
    check(
      "commission_rule_versions_fixed_check",
      sql`${t.fixedCommission} IS NULL OR ${t.fixedCommission} >= 0`,
    ),
    check(
      "commission_rule_versions_installments_check",
      sql`${t.installmentsCount} IS NULL OR ${t.installmentsCount} > 0`,
    ),
    check(
      "commission_rule_versions_parameters_check",
      sql`${t.calculationParameters} IS NULL OR jsonb_typeof(${t.calculationParameters}) = 'object'`,
    ),
  ],
);

export const commissionSchedulesTable = pgTable(
  "commission_schedules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    policyId: uuid("policy_id")
      .notNull()
      .references(() => policiesTable.id, { onDelete: "restrict" }),
    endorsementId: uuid("endorsement_id"),
    ruleVersionId: uuid("rule_version_id").references(
      () => commissionRuleVersionsTable.id,
      { onDelete: "restrict" },
    ),
    sourceType: text("source_type").notNull(),
    basisAmount: numeric("basis_amount", { precision: 18, scale: 2 }),
    totalCommission: numeric("total_commission", { precision: 18, scale: 2 }),
    scheduledInstallments: integer("scheduled_installments"),
    firstCompetenceOn: date("first_competence_on", { mode: "string" }),
    ruleSnapshot: jsonb("rule_snapshot").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("commission_schedules_policy_id_id_uniq").on(t.policyId, t.id),
    index("commission_schedules_policy_idx").on(t.policyId),
    index("commission_schedules_endorsement_idx").on(
      t.policyId,
      t.endorsementId,
    ),
    foreignKey({
      name: "commission_schedules_endorsement_policy_fk",
      columns: [t.policyId, t.endorsementId],
      foreignColumns: [
        policyEndorsementsTable.policyId,
        policyEndorsementsTable.id,
      ],
    }).onDelete("restrict"),
    check(
      "commission_schedules_source_check",
      sql`${t.sourceType} IN ('ORIGINAL', 'ENDORSEMENT')`,
    ),
    check(
      "commission_schedules_endorsement_source_check",
      sql`(${t.sourceType} = 'ORIGINAL' AND ${t.endorsementId} IS NULL) OR (${t.sourceType} = 'ENDORSEMENT' AND ${t.endorsementId} IS NOT NULL)`,
    ),
    check(
      "commission_schedules_installments_check",
      sql`${t.scheduledInstallments} IS NULL OR ${t.scheduledInstallments} > 0`,
    ),
    check(
      "commission_schedules_snapshot_check",
      sql`${t.ruleSnapshot} IS NULL OR jsonb_typeof(${t.ruleSnapshot}) = 'object'`,
    ),
  ],
);

export const commissionInstallmentsTable = pgTable(
  "commission_installments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    policyId: uuid("policy_id").notNull(),
    scheduleId: uuid("schedule_id").notNull(),
    installmentNumber: integer("installment_number").notNull(),
    competenceOn: date("competence_on", { mode: "string" }),
    dueOn: date("due_on", { mode: "string" }),
    originalAmount: numeric("original_amount", {
      precision: 18,
      scale: 2,
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("commission_installments_schedule_number_uniq").on(
      t.scheduleId,
      t.installmentNumber,
    ),
    unique("commission_installments_policy_id_id_uniq").on(t.policyId, t.id),
    index("commission_installments_due_idx").on(t.dueOn),
    index("commission_installments_policy_schedule_idx").on(
      t.policyId,
      t.scheduleId,
    ),
    foreignKey({
      name: "commission_installments_schedule_policy_fk",
      columns: [t.policyId, t.scheduleId],
      foreignColumns: [
        commissionSchedulesTable.policyId,
        commissionSchedulesTable.id,
      ],
    }).onDelete("restrict"),
    check(
      "commission_installments_number_positive",
      sql`${t.installmentNumber} > 0`,
    ),
  ],
);

export const commissionInstallmentEventsTable = pgTable(
  "commission_installment_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    policyId: uuid("policy_id").notNull(),
    installmentId: uuid("installment_id").notNull(),
    endorsementId: uuid("endorsement_id"),
    eventType: text("event_type").notNull(),
    reason: text("reason"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("commission_installment_events_inst_idx").on(
      t.installmentId,
      t.occurredAt,
    ),
    index("commission_installment_events_endorsement_idx").on(
      t.policyId,
      t.endorsementId,
    ),
    foreignKey({
      name: "commission_installment_events_inst_policy_fk",
      columns: [t.policyId, t.installmentId],
      foreignColumns: [
        commissionInstallmentsTable.policyId,
        commissionInstallmentsTable.id,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "commission_installment_events_endorsement_policy_fk",
      columns: [t.policyId, t.endorsementId],
      foreignColumns: [
        policyEndorsementsTable.policyId,
        policyEndorsementsTable.id,
      ],
    }).onDelete("restrict"),
    check(
      "commission_installment_events_type_check",
      sql`${t.eventType} IN ('CANCELLED', 'REINSTATED', 'NOTE')`,
    ),
  ],
);

export const commissionAdjustmentsTable = pgTable(
  "commission_adjustments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    policyId: uuid("policy_id")
      .notNull()
      .references(() => policiesTable.id, { onDelete: "restrict" }),
    endorsementId: uuid("endorsement_id"),
    installmentId: uuid("installment_id"),
    kind: text("kind").notNull(),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    competenceOn: date("competence_on", { mode: "string" }),
    dueOn: date("due_on", { mode: "string" }),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("commission_adjustments_policy_id_id_uniq").on(t.policyId, t.id),
    index("commission_adjustments_policy_idx").on(t.policyId),
    index("commission_adjustments_endorsement_idx").on(
      t.policyId,
      t.endorsementId,
    ),
    index("commission_adjustments_installment_idx").on(
      t.policyId,
      t.installmentId,
    ),
    foreignKey({
      name: "commission_adjustments_endorsement_policy_fk",
      columns: [t.policyId, t.endorsementId],
      foreignColumns: [
        policyEndorsementsTable.policyId,
        policyEndorsementsTable.id,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "commission_adjustments_installment_policy_fk",
      columns: [t.policyId, t.installmentId],
      foreignColumns: [
        commissionInstallmentsTable.policyId,
        commissionInstallmentsTable.id,
      ],
    }).onDelete("restrict"),
  ],
);

export const commissionReceiptsTable = pgTable(
  "commission_receipts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    policyId: uuid("policy_id")
      .notNull()
      .references(() => policiesTable.id, { onDelete: "restrict" }),
    reference: text("reference"),
    receivedOn: date("received_on", { mode: "string" }).notNull(),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    source: text("source"),
    status: text("status").default("confirmado").notNull(),
    recordedByUserId: uuid("recorded_by_user_id").references(
      () => usersTable.id,
      { onDelete: "restrict" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("commission_receipts_policy_id_id_uniq").on(t.policyId, t.id),
    index("commission_receipts_policy_received_idx").on(
      t.policyId,
      t.receivedOn,
    ),
  ],
);

export const commissionReceiptAllocationsTable = pgTable(
  "commission_receipt_allocations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    policyId: uuid("policy_id").notNull(),
    receiptId: uuid("receipt_id").notNull(),
    installmentId: uuid("installment_id"),
    adjustmentId: uuid("adjustment_id"),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("commission_receipt_allocations_receipt_idx").on(t.receiptId),
    index("commission_receipt_allocations_installment_idx").on(
      t.policyId,
      t.installmentId,
    ),
    index("commission_receipt_allocations_adjustment_idx").on(
      t.policyId,
      t.adjustmentId,
    ),
    foreignKey({
      name: "commission_receipt_allocations_receipt_policy_fk",
      columns: [t.policyId, t.receiptId],
      foreignColumns: [
        commissionReceiptsTable.policyId,
        commissionReceiptsTable.id,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "commission_receipt_allocations_installment_policy_fk",
      columns: [t.policyId, t.installmentId],
      foreignColumns: [
        commissionInstallmentsTable.policyId,
        commissionInstallmentsTable.id,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "commission_receipt_allocations_adjustment_policy_fk",
      columns: [t.policyId, t.adjustmentId],
      foreignColumns: [
        commissionAdjustmentsTable.policyId,
        commissionAdjustmentsTable.id,
      ],
    }).onDelete("restrict"),
    check(
      "commission_receipt_allocations_target_check",
      sql`num_nonnulls(${t.installmentId}, ${t.adjustmentId}) = 1`,
    ),
  ],
);
