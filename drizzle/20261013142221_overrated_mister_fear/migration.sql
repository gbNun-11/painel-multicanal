DROP INDEX "product_codes_insurer_code_unique_idx";--> statement-breakpoint
ALTER TABLE "insurer_product_codes" ADD COLUMN "external_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "product_codes_insurer_code_name_unique_idx" ON "insurer_product_codes" ("insurer_id","code","name");--> statement-breakpoint
CREATE UNIQUE INDEX "product_codes_insurer_external_id_unique_idx" ON "insurer_product_codes" ("insurer_id","external_id");