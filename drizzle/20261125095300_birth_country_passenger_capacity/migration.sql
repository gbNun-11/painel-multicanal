ALTER TABLE "clients" ADD COLUMN "birth_country" text;
--> statement-breakpoint
-- Porta e lotação são conceitos diferentes: manter o valor antigo como legado,
-- sem copiar nem inferir a capacidade de passageiros.
ALTER TABLE "asset_vehicles" RENAME COLUMN "doors" TO "legacy_doors";
--> statement-breakpoint
ALTER TABLE "asset_vehicles" DROP CONSTRAINT "asset_vehicles_doors_check";
--> statement-breakpoint
ALTER TABLE "asset_vehicles" ADD COLUMN "passenger_capacity" integer;
--> statement-breakpoint
ALTER TABLE "asset_vehicles" ADD CONSTRAINT "asset_vehicles_legacy_doors_check" CHECK ("legacy_doors" IS NULL OR "legacy_doors" >= 0);
--> statement-breakpoint
ALTER TABLE "asset_vehicles" ADD CONSTRAINT "asset_vehicles_passenger_capacity_check" CHECK ("passenger_capacity" IS NULL OR "passenger_capacity" > 0);
