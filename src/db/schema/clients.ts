import {
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { enterpriseInsurersTable } from "./enterprise-insurers";
import { clientSalesModelEnum, clientStatusEnum } from "./enums";
import { susepsTable } from "./suseps";
import { usersTable } from "./users";

export const clientsTable = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    enterpriseInsurerId: uuid("enterprise_insurer_id")
      .notNull()
      .references(() => enterpriseInsurersTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    susepId: uuid("susep_id").references(() => susepsTable.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),

    externalSource: text("external_source").notNull(),

    externalId: text("external_id").notNull(),

    name: text("name").notNull(),
    document: text("document"),
    personType: text("person_type"),
    email: text("email"),
    phone: text("phone"),
    birthDate: date("birth_date"),

    productCode: text("product_code"),
    product: text("product"),
    propensityCode: text("propensity_code"),
    propensity: text("propensity"),
    sourceProgramCode: text("source_program_code"),
    salesModel: clientSalesModelEnum("sales_model"),
    externalStatusReason: text("external_status_reason"),

    model: text("model"),
    modelYear: integer("model_year"),
    licensePlate: text("license_plate"),
    assetValue: numeric("asset_value", {
      precision: 15,
      scale: 2,
    }),

    address: text("address"),
    addressNumber: text("address_number"),
    addressComplement: text("address_complement"),
    neighborhood: text("neighborhood"),
    city: text("city"),
    state: text("state"),
    zipCode: text("zip_code"),

    observation: text("observation"),
    salespersonId: uuid("salesperson_id").references(() => usersTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    status: clientStatusEnum("status").default("novo").notNull(),
    assignedAt: timestamp("assigned_at", {
      withTimezone: true,
    }),

    sourceCreatedAt: timestamp("source_created_at", {
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
    uniqueIndex("clients_source_external_id_uidx").on(
      table.enterpriseInsurerId,
      table.externalSource,
      table.externalId,
    ),
    index("clients_status_created_at_idx").on(table.status, table.createdAt),
    index("clients_salesperson_status_idx").on(
      table.salespersonId,
      table.status,
    ),
    index("clients_source_status_created_at_idx").on(
      table.enterpriseInsurerId,
      table.status,
      table.createdAt,
    ),
    index("clients_susep_idx").on(table.susepId),
    index("clients_document_idx").on(table.document),
    index("clients_phone_idx").on(table.phone),
    index("clients_product_code_idx").on(table.productCode),
  ],
);
