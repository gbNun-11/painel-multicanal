CREATE TABLE "goalfy_distribution_batch_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"batch_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"enterprise_insurer_id" uuid NOT NULL,
	"salesperson_id" uuid NOT NULL,
	"expected_external_id" text NOT NULL,
	"expected_goalfy_responsible_id" text NOT NULL,
	"status" text DEFAULT 'reserved' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_http_status" integer,
	"error_code" text,
	"goalfy_card_id" uuid,
	"sent_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"last_checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "goalfy_batch_items_status_check" CHECK ("status" IN
        ('reserved', 'sent', 'confirmed', 'rejected', 'inconclusive')),
	CONSTRAINT "goalfy_batch_items_attempt_count_check" CHECK ("attempt_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "goalfy_distribution_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"initiated_by_user_id" uuid NOT NULL,
	"mode" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "goalfy_batches_mode_check" CHECK ("mode" IN ('automatic', 'selected')),
	CONSTRAINT "goalfy_batches_status_check" CHECK ("status" IN
        ('running', 'reconciling', 'completed', 'interrupted'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "goalfy_batch_opportunity_uidx" ON "goalfy_distribution_batch_items" ("batch_id","opportunity_id");--> statement-breakpoint
CREATE INDEX "goalfy_batch_items_pending_idx" ON "goalfy_distribution_batch_items" ("status","updated_at");--> statement-breakpoint
CREATE INDEX "goalfy_batch_items_opportunity_idx" ON "goalfy_distribution_batch_items" ("opportunity_id");--> statement-breakpoint
CREATE INDEX "goalfy_batches_status_idx" ON "goalfy_distribution_batches" ("status","started_at");--> statement-breakpoint
ALTER TABLE "goalfy_distribution_batch_items" ADD CONSTRAINT "goalfy_distribution_batch_items_wFzvGUO043HN_fkey" FOREIGN KEY ("batch_id") REFERENCES "goalfy_distribution_batches"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "goalfy_distribution_batch_items" ADD CONSTRAINT "goalfy_distribution_batch_items_2yzNNTZqKcAB_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "goalfy_distribution_batch_items" ADD CONSTRAINT "goalfy_distribution_batch_items_7aYu9IT8onRw_fkey" FOREIGN KEY ("enterprise_insurer_id") REFERENCES "enterprise_insurers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "goalfy_distribution_batch_items" ADD CONSTRAINT "goalfy_distribution_batch_items_salesperson_id_users_id_fkey" FOREIGN KEY ("salesperson_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "goalfy_distribution_batches" ADD CONSTRAINT "goalfy_distribution_batches_initiated_by_user_id_users_id_fkey" FOREIGN KEY ("initiated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;
