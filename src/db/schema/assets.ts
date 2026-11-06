import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { clientsTable } from "./clients";

export const clientAssetsTable = pgTable(
  "client_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clientsTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    kind: text("kind").notNull(),
    label: text("label").notNull(),
    externalReference: text("external_reference"),
    status: text("status").default("ativo").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("client_assets_client_kind_idx").on(t.clientId, t.kind),
    unique("client_assets_id_client_id_uniq").on(t.id, t.clientId),
    check(
      "client_assets_kind_check",
      sql`${t.kind} IN ('VEHICLE', 'BIKE', 'EQUIPMENT', 'PROPERTY', 'PET', 'OTHER')`,
    ),
  ],
);

export const assetVehiclesTable = pgTable(
  "asset_vehicles",
  {
    assetId: uuid("asset_id")
      .primaryKey()
      .references(() => clientAssetsTable.id, { onDelete: "restrict" }),
    plate: text("plate"),
    chassis: text("chassis"),
    fipeCode: text("fipe_code"),
    description: text("description"),
    make: text("make"),
    model: text("model"),
    manufactureYear: integer("manufacture_year"),
    modelYear: integer("model_year"),
    doors: integer("doors"),
    fuel: text("fuel"),
    category: text("category"),
    transmission: text("transmission"),
    usageType: text("usage_type"),
    overnightZipCode: text("overnight_zip_code"),
  },
  (t) => [
    index("asset_vehicles_plate_idx").on(t.plate),
    index("asset_vehicles_chassis_idx").on(t.chassis),
    check(
      "asset_vehicles_doors_check",
      sql`${t.doors} IS NULL OR ${t.doors} >= 0`,
    ),
  ],
);

export const assetBikesTable = pgTable(
  "asset_bikes",
  {
    assetId: uuid("asset_id")
      .primaryKey()
      .references(() => clientAssetsTable.id, { onDelete: "restrict" }),
    kind: text("kind"),
    make: text("make"),
    model: text("model"),
    serialNumber: text("serial_number"),
    acquiredAt: date("acquired_at", { mode: "string" }),
    acquisitionValue: numeric("acquisition_value", {
      precision: 18,
      scale: 2,
    }),
  },
  (t) => [
    index("asset_bikes_serial_idx").on(t.serialNumber),
    check(
      "asset_bikes_acquisition_value_check",
      sql`${t.acquisitionValue} IS NULL OR ${t.acquisitionValue} >= 0`,
    ),
  ],
);

export const assetEquipmentTable = pgTable(
  "asset_equipment",
  {
    assetId: uuid("asset_id")
      .primaryKey()
      .references(() => clientAssetsTable.id, { onDelete: "restrict" }),
    equipmentType: text("equipment_type"),
    make: text("make"),
    model: text("model"),
    serialNumber: text("serial_number"),
    ownerDocument: text("owner_document"),
    acquiredAt: date("acquired_at", { mode: "string" }),
    acquisitionValue: numeric("acquisition_value", {
      precision: 18,
      scale: 2,
    }),
    marketValue: numeric("market_value", {
      precision: 18,
      scale: 2,
    }),
  },
  (t) => [
    index("asset_equipment_serial_idx").on(t.serialNumber),
    check(
      "asset_equipment_acquisition_value_check",
      sql`${t.acquisitionValue} IS NULL OR ${t.acquisitionValue} >= 0`,
    ),
    check(
      "asset_equipment_market_value_check",
      sql`${t.marketValue} IS NULL OR ${t.marketValue} >= 0`,
    ),
  ],
);

export const assetPropertiesTable = pgTable(
  "asset_properties",
  {
    assetId: uuid("asset_id")
      .primaryKey()
      .references(() => clientAssetsTable.id, { onDelete: "restrict" }),
    usageType: text("usage_type"),
    buildingType: text("building_type"),
    zipCode: text("zip_code"),
    address: text("address"),
    number: text("number"),
    complement: text("complement"),
    neighborhood: text("neighborhood"),
    city: text("city"),
    state: text("state"),
    propertyValue: numeric("property_value", {
      precision: 18,
      scale: 2,
    }),
  },
  (t) => [
    index("asset_properties_zip_idx").on(t.zipCode),
    check(
      "asset_properties_value_check",
      sql`${t.propertyValue} IS NULL OR ${t.propertyValue} >= 0`,
    ),
  ],
);

export const assetPetsTable = pgTable("asset_pets", {
  assetId: uuid("asset_id")
    .primaryKey()
    .references(() => clientAssetsTable.id, { onDelete: "restrict" }),
  name: text("name"),
  species: text("species"),
  breed: text("breed"),
  sex: text("sex"),
  birthDate: date("birth_date", { mode: "string" }),
  microchip: text("microchip"),
});

export const clientRelatedPeopleTable = pgTable(
  "client_related_people",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clientsTable.id, { onDelete: "restrict" }),
    relatedClientId: uuid("related_client_id").references(
      () => clientsTable.id,
      { onDelete: "restrict" },
    ),
    name: text("name").notNull(),
    document: text("document"),
    relationType: text("relation_type").notNull(),
    birthDate: date("birth_date", { mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("client_related_people_client_idx").on(t.clientId),
    index("client_related_people_document_idx").on(t.document),
    unique("client_related_people_id_client_id_uniq").on(t.id, t.clientId),
    check(
      "client_related_people_not_self_check",
      sql`${t.relatedClientId} IS NULL OR ${t.relatedClientId} <> ${t.clientId}`,
    ),
  ],
);
