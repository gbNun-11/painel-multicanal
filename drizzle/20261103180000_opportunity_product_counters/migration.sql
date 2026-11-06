CREATE TABLE "opportunity_counters" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "enterprise_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "last_number" bigint DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "opportunity_counters_last_number_nonnegative_check" CHECK ("last_number" >= 0)
);
--> statement-breakpoint
ALTER TABLE "opportunity_counters" ADD CONSTRAINT "opportunity_counters_enterprise_id_enterprises_id_fkey" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "opportunity_counters" ADD CONSTRAINT "opportunity_counters_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
--> statement-breakpoint
CREATE UNIQUE INDEX "opportunity_counters_enterprise_product_uidx" ON "opportunity_counters" USING btree ("enterprise_id", "product_id");
--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "counter_id" uuid;
--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "opportunity_number" bigint;
--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_counter_id_opportunity_counters_id_fkey" FOREIGN KEY ("counter_id") REFERENCES "public"."opportunity_counters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
--> statement-breakpoint
CREATE UNIQUE INDEX "opportunities_counter_number_uidx" ON "opportunities" USING btree ("counter_id", "opportunity_number");
--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_counter_number_pair_check" CHECK (
  ("counter_id" IS NULL AND "opportunity_number" IS NULL)
  OR ("counter_id" IS NOT NULL AND "opportunity_number" IS NOT NULL AND "opportunity_number" > 0)
);
