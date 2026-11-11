import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { enterpriseInsurersTable } from "./enterprise-insurers";
import { opportunitiesTable } from "./opportunities";
import { usersTable } from "./users";

export const goalfyDistributionBatchesTable = pgTable(
  "goalfy_distribution_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    initiatedByUserId: uuid("initiated_by_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),

    mode: text("mode").notNull(),
    status: text("status").notNull().default("running"),

    sendListByWhatsApp: boolean("send_list_by_whatsapp")
      .notNull()
      .default(false),

    sendListByEmail: boolean("send_list_by_email")
      .notNull()
      .default(false),

    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    finishedAt: timestamp("finished_at", { withTimezone: true }),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("goalfy_batches_status_idx").on(
      table.status,
      table.startedAt,
    ),

    check(
      "goalfy_batches_mode_check",
      sql`${table.mode} IN ('automatic', 'selected')`,
    ),

    check(
      "goalfy_batches_status_check",
      sql`${table.status} IN
        ('running', 'reconciling', 'completed', 'interrupted')`,
    ),
  ],
);

export const goalfyDistributionBatchItemsTable = pgTable(
  "goalfy_distribution_batch_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    batchId: uuid("batch_id")
      .notNull()
      .references(() => goalfyDistributionBatchesTable.id, {
        onDelete: "restrict",
      }),

    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunitiesTable.id, {
        onDelete: "restrict",
      }),

    enterpriseInsurerId: uuid("enterprise_insurer_id")
      .notNull()
      .references(() => enterpriseInsurersTable.id, {
        onDelete: "restrict",
      }),

    salespersonId: uuid("salesperson_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "restrict",
      }),

    expectedExternalId: text("expected_external_id").notNull(),

    expectedGoalfyResponsibleId: text(
      "expected_goalfy_responsible_id",
    ).notNull(),

    status: text("status").notNull().default("reserved"),

    attemptCount: integer("attempt_count").notNull().default(0),

    lastHttpStatus: integer("last_http_status"),
    errorCode: text("error_code"),
    goalfyCardId: uuid("goalfy_card_id"),

    sentAt: timestamp("sent_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("goalfy_batch_opportunity_uidx").on(
      table.batchId,
      table.opportunityId,
    ),

    // Uma oportunidade só pode ter uma distribuição ativa.
    uniqueIndex("goalfy_active_opportunity_uidx")
      .on(table.opportunityId)
      .where(
        sql`${table.status} IN ('reserved', 'sent', 'inconclusive')`,
      ),

    index("goalfy_batch_items_pending_idx").on(
      table.status,
      table.updatedAt,
    ),

    index("goalfy_batch_items_opportunity_idx").on(
      table.opportunityId,
    ),

    check(
      "goalfy_batch_items_status_check",
      sql`${table.status} IN
        ('reserved', 'sent', 'confirmed', 'rejected', 'inconclusive')`,
    ),

    check(
      "goalfy_batch_items_attempt_count_check",
      sql`${table.attemptCount} >= 0`,
    ),
  ],
);


// Caixa de saída temporária. Uma entrada por oportunidade e canal.
// Não é histórico de distribuições concluídas.
// O envio deverá reservar a entrada antes de chamar o serviço externo.
export const goalfyDistributionNotificationItemsTable = pgTable(
  "goalfy_distribution_notification_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    batchId: uuid("batch_id")
      .notNull()
      .references(() => goalfyDistributionBatchesTable.id, {
        onDelete: "restrict",
      }),

    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunitiesTable.id, {
        onDelete: "restrict",
      }),

    enterpriseInsurerId: uuid("enterprise_insurer_id")
      .notNull()
      .references(() => enterpriseInsurersTable.id, {
        onDelete: "restrict",
      }),

    salespersonId: uuid("salesperson_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "restrict",
      }),

    channel: text("channel").notNull(),

    status: text("status")
      .notNull()
      .default("pending"),

    attemptCount: integer("attempt_count")
      .notNull()
      .default(0),

    lastErrorCode: text("last_error_code"),

    claimedAt: timestamp("claimed_at", {
      withTimezone: true,
    }),

    deliveredAt: timestamp("delivered_at", {
      withTimezone: true,
    }),

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
    uniqueIndex("goalfy_notification_opportunity_channel_uidx").on(
      table.batchId,
      table.opportunityId,
      table.channel,
    ),

    index("goalfy_notification_pending_idx").on(
      table.batchId,
      table.status,
    ),

    check(
      "goalfy_notification_channel_check",
      sql`${table.channel} IN ('whatsapp', 'email')`,
    ),

    check(
      "goalfy_notification_status_check",
      sql`${table.status} IN
        ('pending', 'sending', 'delivered', 'uncertain')`,
    ),

    check(
      "goalfy_notification_attempt_count_check",
      sql`${table.attemptCount} >= 0`,
    ),
  ],
);
