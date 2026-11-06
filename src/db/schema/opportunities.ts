import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { clientsTable } from "./clients";
import { enterpriseInsurersTable } from "./enterprise-insurers";
import {
  opportunityDistributionStatusEnum,
  opportunitySalesModelEnum,
  opportunitySalesStatusEnum,
} from "./enums";
import { susepsTable } from "./suseps";
import { usersTable } from "./users";

export const opportunitiesTable = pgTable(
  "opportunities",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    clientId: uuid("client_id")
      .notNull()
      .references(() => clientsTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    enterpriseInsurerId: uuid("enterprise_insurer_id")
      .notNull()
      .references(() => enterpriseInsurersTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    susepId: uuid("susep_id")
      .notNull()
      .references(() => susepsTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    externalSource: text("external_source").notNull(),

    externalId: text("external_id").notNull(),

    productCode: text("product_code").notNull(),

    product: text("product").notNull(),

    propensityCode: text("propensity_code"),

    propensity: text("propensity"),

    sourceProgramCode: text("source_program_code"),

    salesModel: opportunitySalesModelEnum("sales_model"),

    externalStatusReason: text("external_status_reason"),

    model: text("model"),

    modelYear: integer("model_year"),

    licensePlate: text("license_plate"),

    assetValue: numeric("asset_value", {
      precision: 15,
      scale: 2,
    }),

    observation: text("observation"),

    salespersonId: uuid("salesperson_id").references(() => usersTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),

    distributionStatus: opportunityDistributionStatusEnum("distribution_status")
      .default("novo")
      .notNull(),

    salesStatus: opportunitySalesStatusEnum("sales_status")
      .default("aberto")
      .notNull(),

    assignedAt: timestamp("assigned_at", {
      withTimezone: true,
    }),

    sourceCreatedAt: timestamp("source_created_at", {
      withTimezone: true,
    }),

    sourcePayload: jsonb("source_payload").$type<Record<string, unknown>>(),

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
    uniqueIndex("opportunities_source_external_id_uidx").on(
      table.enterpriseInsurerId,
      table.externalSource,
      table.externalId,
    ),

    index("opportunities_client_created_at_idx").on(
      table.clientId,
      table.createdAt,
    ),

    index("opportunities_distribution_created_at_idx").on(
      table.distributionStatus,
      table.createdAt,
    ),

    index("opportunities_sales_status_created_at_idx").on(
      table.salesStatus,
      table.createdAt,
    ),

    index("opportunities_salesperson_distribution_idx").on(
      table.salespersonId,
      table.distributionStatus,
    ),

    index("opportunities_source_distribution_created_at_idx").on(
      table.enterpriseInsurerId,
      table.distributionStatus,
      table.createdAt,
    ),

    index("opportunities_susep_idx").on(table.susepId),

    index("opportunities_product_code_idx").on(table.productCode),

    index("opportunities_license_plate_idx").on(table.licensePlate),
  ],
);
