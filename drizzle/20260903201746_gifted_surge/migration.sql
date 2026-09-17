CREATE TYPE "client_sales_model" AS ENUM('LEAD', 'VINCULO', 'CONTINGENCIA');--> statement-breakpoint
ALTER TABLE "clients" RENAME COLUMN "cpf" TO "document";--> statement-breakpoint
ALTER INDEX "clients_cpf_idx" RENAME TO "clients_document_idx";--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "external_source" text NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "person_type" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "product_code" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "propensity_code" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "source_program_code" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "sales_model" "client_sales_model";--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "external_status_reason" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "asset_value" numeric(15,2);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "address_number" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "address_complement" text;--> statement-breakpoint
DROP INDEX "clients_source_external_id_uidx";--> statement-breakpoint
CREATE UNIQUE INDEX "clients_source_external_id_uidx" ON "clients" ("enterprise_insurer_id","external_source","external_id");--> statement-breakpoint
CREATE INDEX "clients_product_code_idx" ON "clients" ("product_code");--> statement-breakpoint
ALTER TABLE "clients" DROP CONSTRAINT "clients_enterprise_insurer_id_enterprise_insurers_id_fkey", ADD CONSTRAINT "clients_enterprise_insurer_id_enterprise_insurers_id_fkey" FOREIGN KEY ("enterprise_insurer_id") REFERENCES "enterprise_insurers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "clients" DROP CONSTRAINT "clients_susep_id_enterprise_insurer_suseps_id_fkey", ADD CONSTRAINT "clients_susep_id_enterprise_insurer_suseps_id_fkey" FOREIGN KEY ("susep_id") REFERENCES "enterprise_insurer_suseps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "clients" DROP CONSTRAINT "clients_salesperson_id_users_id_fkey", ADD CONSTRAINT "clients_salesperson_id_users_id_fkey" FOREIGN KEY ("salesperson_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;