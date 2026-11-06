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

import { clientAssetsTable, clientRelatedPeopleTable } from "./assets";
import { opportunitiesTable } from "./opportunities";
import { insuranceQuotesTable } from "./quotes";
import { usersTable } from "./users";

export const proposalsTable = pgTable(
  "proposals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunitiesTable.id, {
        onDelete: "restrict",
      }),
    clientId: uuid("client_id").notNull(),
    quoteId: uuid("quote_id"),
    proposalNumber: text("proposal_number"),
    quoteNumber: text("quote_number"),
    planName: text("plan_name"),
    pdfLayout: text("pdf_layout"),
    status: text("status").default("em_analise").notNull(),
    statusReason: text("status_reason"),
    requestedAt: timestamp("requested_at", { withTimezone: true }),
    startsOn: date("starts_on", { mode: "string" }),
    endsOn: date("ends_on", { mode: "string" }),
    operationType: text("operation_type"),
    bonusClass: text("bonus_class"),
    grossPremium: numeric("gross_premium", {
      precision: 18,
      scale: 2,
    }),
    netPremium: numeric("net_premium", {
      precision: 18,
      scale: 2,
    }),
    insuredPaymentMethod: text("insured_payment_method"),
    insuredPaymentInstallments: integer("insured_payment_installments"),
    sourceSystem: text("source_system"),
    sourceExternalId: text("source_external_id"),
    recordedByUserId: uuid("recorded_by_user_id").references(
      () => usersTable.id,
      { onDelete: "restrict" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("proposals_opportunity_idx").on(t.opportunityId, t.createdAt),
    index("proposals_quote_idx").on(t.quoteId),
    index("proposals_number_idx").on(t.proposalNumber),
    index("proposals_status_idx").on(t.status),

    unique("proposals_id_client_id_uniq").on(t.id, t.clientId),

    foreignKey({
      name: "proposals_opportunity_client_fk",
      columns: [t.opportunityId, t.clientId],
      foreignColumns: [opportunitiesTable.id, opportunitiesTable.clientId],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),

    foreignKey({
      name: "proposals_quote_opportunity_fk",
      columns: [t.opportunityId, t.quoteId],
      foreignColumns: [
        insuranceQuotesTable.opportunityId,
        insuranceQuotesTable.id,
      ],
    }).onDelete("restrict"),

    check(
      "proposals_insured_installments_positive",
      sql`${t.insuredPaymentInstallments} IS NULL OR ${t.insuredPaymentInstallments} > 0`,
    ),
    check(
      "proposals_gross_premium_nonnegative",
      sql`${t.grossPremium} IS NULL OR ${t.grossPremium} >= 0`,
    ),
    check(
      "proposals_net_premium_nonnegative",
      sql`${t.netPremium} IS NULL OR ${t.netPremium} >= 0`,
    ),
    check(
      "proposals_validity_range_check",
      sql`${t.startsOn} IS NULL OR ${t.endsOn} IS NULL OR ${t.startsOn} <= ${t.endsOn}`,
    ),
  ],
);

export const proposalStatusHistoryTable = pgTable(
  "proposal_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => proposalsTable.id, { onDelete: "restrict" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    changedByUserId: uuid("changed_by_user_id").references(
      () => usersTable.id,
      { onDelete: "restrict" },
    ),
    reason: text("reason"),
    origin: text("origin"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("proposal_status_history_proposal_idx").on(
      t.proposalId,
      t.occurredAt,
    ),
  ],
);

export const proposalAssetsTable = pgTable(
  "proposal_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => proposalsTable.id, { onDelete: "restrict" }),
    clientId: uuid("client_id").notNull(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => clientAssetsTable.id, { onDelete: "restrict" }),
    relationType: text("relation_type").default("segurado").notNull(),
    assetSnapshot: jsonb("asset_snapshot")
      .$type<Record<string, unknown>>()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("proposal_assets_proposal_asset_uniq").on(
      t.proposalId,
      t.assetId,
      t.relationType,
    ),
    index("proposal_assets_asset_idx").on(t.assetId),

    foreignKey({
      name: "proposal_assets_proposal_client_fk",
      columns: [t.proposalId, t.clientId],
      foreignColumns: [proposalsTable.id, proposalsTable.clientId],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),

    foreignKey({
      name: "proposal_assets_asset_client_fk",
      columns: [t.assetId, t.clientId],
      foreignColumns: [clientAssetsTable.id, clientAssetsTable.clientId],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),

    check(
      "proposal_assets_snapshot_object_check",
      sql`jsonb_typeof(${t.assetSnapshot}) = 'object'`,
    ),
  ],
);

export const proposalParticipantsTable = pgTable(
  "proposal_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => proposalsTable.id, { onDelete: "restrict" }),
    clientId: uuid("client_id").notNull(),
    relatedPersonId: uuid("related_person_id").references(
      () => clientRelatedPeopleTable.id,
      { onDelete: "restrict" },
    ),
    role: text("role").notNull(),
    nameSnapshot: text("name_snapshot"),
    documentSnapshot: text("document_snapshot"),
    detailsSnapshot: jsonb("details_snapshot").$type<Record<string, unknown>>(),
  },
  (t) => [
    index("proposal_participants_proposal_idx").on(t.proposalId),
    index("proposal_participants_related_person_idx").on(t.relatedPersonId),

    foreignKey({
      name: "proposal_participants_proposal_client_fk",
      columns: [t.proposalId, t.clientId],
      foreignColumns: [proposalsTable.id, proposalsTable.clientId],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),

    foreignKey({
      name: "proposal_participants_person_client_fk",
      columns: [t.relatedPersonId, t.clientId],
      foreignColumns: [
        clientRelatedPeopleTable.id,
        clientRelatedPeopleTable.clientId,
      ],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),

    check(
      "proposal_participants_details_object_check",
      sql`${t.detailsSnapshot} IS NULL OR jsonb_typeof(${t.detailsSnapshot}) = 'object'`,
    ),
  ],
);

export const proposalCoveragesTable = pgTable(
  "proposal_coverages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => proposalsTable.id, { onDelete: "restrict" }),
    code: text("code"),
    description: text("description").notNull(),
    insuredLimit: numeric("insured_limit", {
      precision: 18,
      scale: 2,
    }),
    deductible: numeric("deductible", {
      precision: 18,
      scale: 2,
    }),
    premium: numeric("premium", {
      precision: 18,
      scale: 2,
    }),
    extraDetails: jsonb("extra_details").$type<Record<string, unknown>>(),
  },
  (t) => [
    index("proposal_coverages_proposal_idx").on(t.proposalId),
    check(
      "proposal_coverages_limit_nonnegative",
      sql`${t.insuredLimit} IS NULL OR ${t.insuredLimit} >= 0`,
    ),
    check(
      "proposal_coverages_deductible_nonnegative",
      sql`${t.deductible} IS NULL OR ${t.deductible} >= 0`,
    ),
  ],
);

export const proposalProductDetailsTable = pgTable(
  "proposal_product_details",
  {
    proposalId: uuid("proposal_id")
      .primaryKey()
      .references(() => proposalsTable.id, { onDelete: "restrict" }),
    product: text("product").notNull(),
    fields: jsonb("fields").$type<Record<string, unknown>>().notNull(),
    parserVersion: text("parser_version"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    check(
      "proposal_product_details_fields_object_check",
      sql`jsonb_typeof(${t.fields}) = 'object'`,
    ),
  ],
);

export const leaseContractsTable = pgTable(
  "lease_contracts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id")
      .notNull()
      .unique()
      .references(() => proposalsTable.id, { onDelete: "restrict" }),
    propertyAssetId: uuid("property_asset_id").references(
      () => clientAssetsTable.id,
      { onDelete: "restrict" },
    ),
    leaseReference: text("lease_reference"),
    contractStartsOn: date("contract_starts_on", { mode: "string" }),
    contractEndsOn: date("contract_ends_on", { mode: "string" }),
    monthlyRent: numeric("monthly_rent", {
      precision: 18,
      scale: 2,
    }),
    charges: numeric("charges", {
      precision: 18,
      scale: 2,
    }),
    depositAmount: numeric("deposit_amount", {
      precision: 18,
      scale: 2,
    }),
    details: jsonb("details").$type<Record<string, unknown>>(),
  },
  (t) => [
    index("lease_contracts_property_asset_idx").on(t.propertyAssetId),
    check(
      "lease_contracts_dates_check",
      sql`${t.contractStartsOn} IS NULL OR ${t.contractEndsOn} IS NULL OR ${t.contractStartsOn} <= ${t.contractEndsOn}`,
    ),
    check(
      "lease_contracts_monthly_rent_nonnegative",
      sql`${t.monthlyRent} IS NULL OR ${t.monthlyRent} >= 0`,
    ),
    check(
      "lease_contracts_charges_nonnegative",
      sql`${t.charges} IS NULL OR ${t.charges} >= 0`,
    ),
    check(
      "lease_contracts_deposit_nonnegative",
      sql`${t.depositAmount} IS NULL OR ${t.depositAmount} >= 0`,
    ),
  ],
);

export const leaseParticipantsTable = pgTable(
  "lease_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leaseContractId: uuid("lease_contract_id")
      .notNull()
      .references(() => leaseContractsTable.id, { onDelete: "restrict" }),
    role: text("role").notNull(),
    name: text("name").notNull(),
    document: text("document"),
    relatedPersonId: uuid("related_person_id").references(
      () => clientRelatedPeopleTable.id,
      { onDelete: "restrict" },
    ),
  },
  (t) => [
    index("lease_participants_contract_idx").on(t.leaseContractId),
    index("lease_participants_related_person_idx").on(t.relatedPersonId),
  ],
);
