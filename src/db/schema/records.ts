import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { clientsTable } from "./clients";
import { opportunitiesTable } from "./opportunities";
import { policiesTable, policyEndorsementsTable } from "./policies";
import { proposalsTable } from "./proposals";
import { insuranceQuotesTable } from "./quotes";
import { usersTable } from "./users";

export const documentFilesTable = pgTable(
  "document_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    storageKey: text("storage_key").notNull(),
    sha256: text("sha256"),
    sourceSystem: text("source_system"),
    uploadedByUserId: uuid("uploaded_by_user_id").references(
      () => usersTable.id,
      { onDelete: "restrict" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("document_files_storage_key_uniq").on(t.storageKey),
    index("document_files_sha256_idx").on(t.sha256),
  ],
);

export const documentLinksTable = pgTable(
  "document_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fileId: uuid("file_id")
      .notNull()
      .references(() => documentFilesTable.id, { onDelete: "restrict" }),
    clientId: uuid("client_id").references(() => clientsTable.id, {
      onDelete: "restrict",
    }),
    opportunityId: uuid("opportunity_id").references(
      () => opportunitiesTable.id,
      { onDelete: "restrict" },
    ),
    quoteId: uuid("quote_id").references(() => insuranceQuotesTable.id, {
      onDelete: "restrict",
    }),
    proposalId: uuid("proposal_id").references(() => proposalsTable.id, {
      onDelete: "restrict",
    }),
    policyId: uuid("policy_id").references(() => policiesTable.id, {
      onDelete: "restrict",
    }),
    endorsementId: uuid("endorsement_id").references(
      () => policyEndorsementsTable.id,
      { onDelete: "restrict" },
    ),
    kind: text("kind").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("document_links_file_idx").on(t.fileId),
    index("document_links_proposal_idx").on(t.proposalId),
    index("document_links_policy_idx").on(t.policyId),
    check(
      "document_links_single_target_check",
      sql`num_nonnulls(${t.clientId}, ${t.opportunityId}, ${t.quoteId}, ${t.proposalId}, ${t.policyId}, ${t.endorsementId}) = 1`,
    ),
  ],
);

export const operationHistoryTable = pgTable(
  "operation_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    action: text("action").notNull(),
    actorUserId: uuid("actor_user_id").references(() => usersTable.id, {
      onDelete: "restrict",
    }),
    before: jsonb("before").$type<Record<string, unknown>>(),
    after: jsonb("after").$type<Record<string, unknown>>(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("operation_history_entity_idx").on(
      t.entityType,
      t.entityId,
      t.occurredAt,
    ),
    check(
      "operation_history_before_object_check",
      sql`${t.before} IS NULL OR jsonb_typeof(${t.before}) = 'object'`,
    ),
    check(
      "operation_history_after_object_check",
      sql`${t.after} IS NULL OR jsonb_typeof(${t.after}) = 'object'`,
    ),
  ],
);

export const integrationEventsTable = pgTable(
  "integration_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: text("source").notNull(),
    externalEventId: text("external_event_id").notNull(),
    kind: text("kind").notNull(),
    status: text("status").default("recebido").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    lastError: text("last_error"),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("integration_events_source_external_uniq").on(
      t.source,
      t.externalEventId,
    ),
    index("integration_events_status_idx").on(t.status, t.receivedAt),
    check(
      "integration_events_payload_object_check",
      sql`${t.payload} IS NULL OR jsonb_typeof(${t.payload}) = 'object'`,
    ),
  ],
);
