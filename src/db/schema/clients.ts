import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { enterpriseInsurersTable } from "./enterprise-insurers";
import { clientStatusEnum } from "./enums";
import { susepsTable } from "./suseps";
import { usersTable } from "./users";

export const clientsTable = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Origem
    enterpriseInsurerId: uuid("enterprise_insurer_id")
      .notNull()
      .references(() => enterpriseInsurersTable.id),
    susepId: uuid("susep_id").references(() => susepsTable.id),
    externalId: text("external_id").notNull(),

    // Cliente
    name: text("name").notNull(),
    cpf: text("cpf"),
    phone: text("phone"),
    birthDate: date("birth_date"),

    // Produto
    product: text("product"),
    propensity: text("propensity"),

    // Veículo
    model: text("model"),
    modelYear: integer("model_year"),
    licensePlate: text("license_plate"),

    // Endereço
    state: text("state"),
    zipCode: text("zip_code"),
    neighborhood: text("neighborhood"),
    city: text("city"),
    observation: text("observation"),

    // Distribuição
    salespersonId: uuid("salesperson_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    status: clientStatusEnum("status").default("novo").notNull(),
    assignedAt: timestamp("assigned_at", {
      withTimezone: true,
    }),

    // Data que veio da seguradora
    sourceCreatedAt: timestamp("source_created_at", {
      withTimezone: true,
    }),

    // Controle interno
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
    // Não importar a mesma oportunidade
    // da mesma origem duas vezes
    uniqueIndex("clients_source_external_id_uidx").on(
      table.enterpriseInsurerId,
      table.externalId,
    ),

    // Tela: novos / atrasados / distribuídos
    index("clients_status_created_at_idx").on(table.status, table.createdAt),

    // Leads de determinado vendedor
    index("clients_salesperson_status_idx").on(
      table.salespersonId,
      table.status,
    ),

    // Leads Porto/Suhai/etc + status
    index("clients_source_status_created_at_idx").on(
      table.enterpriseInsurerId,
      table.status,
      table.createdAt,
    ),

    index("clients_susep_idx").on(table.susepId),

    index("clients_cpf_idx").on(table.cpf),

    index("clients_phone_idx").on(table.phone),
  ],
);
