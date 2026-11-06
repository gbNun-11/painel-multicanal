DROP INDEX "product_codes_insurer_code_name_unique_idx";--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "product_code_id" uuid;--> statement-breakpoint
CREATE INDEX "opportunities_product_code_id_idx" ON "opportunities" ("product_code_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_codes_insurer_product_code_name_unique_idx" ON "insurer_product_codes" ("insurer_id","product_id","code","name");--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_product_code_id_insurer_product_codes_id_fkey" FOREIGN KEY ("product_code_id") REFERENCES "insurer_product_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;