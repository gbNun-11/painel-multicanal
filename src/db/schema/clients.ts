import {
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { clientPersonTypeEnum } from "./enums";

export const clientsTable = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: text("name").notNull(),

    document: text("document").notNull(),

    personType: clientPersonTypeEnum("person_type").notNull(),

    phone: text("phone"),

    email: text("email"),

    birthDate: date("birth_date"),

    sex: text("sex"),

    profession: text("profession"),

    monthlyIncomeRange: text("monthly_income_range"),

    economicActivity: text("economic_activity"),

    companyType: text("company_type"),

    netWorth: numeric("net_worth", {
      precision: 18,
      scale: 2,
    }),

    annualGrossOperatingRevenue: numeric("annual_gross_operating_revenue", {
      precision: 18,
      scale: 2,
    }),

    address: text("address"),

    addressNumber: text("address_number"),

    addressComplement: text("address_complement"),

    neighborhood: text("neighborhood"),

    city: text("city"),

    state: text("state"),

    zipCode: text("zip_code"),

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
    uniqueIndex("clients_document_uidx").on(table.document),

    index("clients_name_idx").on(table.name),

    index("clients_phone_idx").on(table.phone),

    index("clients_email_idx").on(table.email),
  ],
);
