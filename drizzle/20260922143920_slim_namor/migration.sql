CREATE TABLE "multichannel_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"susep_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "status" DEFAULT 'ativo'::"status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insurer_product_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"insurer_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"status" "status" DEFAULT 'ativo'::"status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"insurer_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" "status" DEFAULT 'ativo'::"status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enterprise_insurer_suseps" DROP CONSTRAINT "enterprise_insurer_suseps_broker_user_id_users_id_fkey";--> statement-breakpoint
DROP INDEX "suseps_broker_user_idx";--> statement-breakpoint
DROP INDEX "suseps_product_code_idx";--> statement-breakpoint
ALTER TABLE "enterprise_insurer_suseps" ADD COLUMN "master_susep_id" uuid;--> statement-breakpoint
ALTER TABLE "enterprise_insurer_suseps" ADD COLUMN "multichannel" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "enterprise_insurer_suseps" DROP COLUMN "broker_user_id";--> statement-breakpoint
ALTER TABLE "enterprise_insurer_suseps" DROP COLUMN "product_code";--> statement-breakpoint
ALTER TABLE "enterprise_insurer_suseps" DROP COLUMN "product";--> statement-breakpoint
CREATE UNIQUE INDEX "multichannel_assignments_susep_product_unique_idx" ON "multichannel_assignments" ("susep_id","product_id");--> statement-breakpoint
CREATE INDEX "multichannel_assignments_susep_idx" ON "multichannel_assignments" ("susep_id");--> statement-breakpoint
CREATE INDEX "multichannel_assignments_product_idx" ON "multichannel_assignments" ("product_id");--> statement-breakpoint
CREATE INDEX "multichannel_assignments_user_idx" ON "multichannel_assignments" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_codes_insurer_code_unique_idx" ON "insurer_product_codes" ("insurer_id","code");--> statement-breakpoint
CREATE INDEX "product_codes_product_idx" ON "insurer_product_codes" ("product_id");--> statement-breakpoint
CREATE INDEX "product_codes_insurer_idx" ON "insurer_product_codes" ("insurer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_insurer_name_unique_idx" ON "products" ("insurer_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "products_id_insurer_unique_idx" ON "products" ("id","insurer_id");--> statement-breakpoint
CREATE INDEX "products_insurer_idx" ON "products" ("insurer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "suseps_id_enterprise_insurer_unique_idx" ON "enterprise_insurer_suseps" ("id","enterprise_insurer_id");--> statement-breakpoint
CREATE INDEX "suseps_master_susep_idx" ON "enterprise_insurer_suseps" ("master_susep_id");--> statement-breakpoint
ALTER TABLE "multichannel_assignments" ADD CONSTRAINT "multichannel_assignments_6YgrV1KuilW1_fkey" FOREIGN KEY ("susep_id") REFERENCES "enterprise_insurer_suseps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "multichannel_assignments" ADD CONSTRAINT "multichannel_assignments_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "multichannel_assignments" ADD CONSTRAINT "multichannel_assignments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "insurer_product_codes" ADD CONSTRAINT "insurer_product_codes_insurer_id_insurers_id_fkey" FOREIGN KEY ("insurer_id") REFERENCES "insurers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "insurer_product_codes" ADD CONSTRAINT "product_codes_product_insurer_fk" FOREIGN KEY ("product_id","insurer_id") REFERENCES "products"("id","insurer_id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_insurer_id_insurers_id_fkey" FOREIGN KEY ("insurer_id") REFERENCES "insurers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "enterprise_insurer_suseps" ADD CONSTRAINT "suseps_master_same_enterprise_insurer_fk" FOREIGN KEY ("master_susep_id","enterprise_insurer_id") REFERENCES "enterprise_insurer_suseps"("id","enterprise_insurer_id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "enterprise_insurer_suseps" ADD CONSTRAINT "suseps_master_not_self_check" CHECK ("master_susep_id" IS NULL OR "master_susep_id" <> "id");