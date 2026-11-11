CREATE TABLE "goalfy_distribution_notification_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"batch_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"enterprise_insurer_id" uuid NOT NULL,
	"salesperson_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_error_code" text,
	"claimed_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "goalfy_notification_channel_check" CHECK ("channel" IN ('whatsapp', 'email')),
	CONSTRAINT "goalfy_notification_status_check" CHECK ("status" IN
        ('pending', 'sending', 'delivered', 'uncertain')),
	CONSTRAINT "goalfy_notification_attempt_count_check" CHECK ("attempt_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "goalfy_distribution_batches" ADD COLUMN "send_list_by_whatsapp" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "goalfy_distribution_batches" ADD COLUMN "send_list_by_email" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "goalfy_notification_opportunity_channel_uidx" ON "goalfy_distribution_notification_items" ("batch_id","opportunity_id","channel");--> statement-breakpoint
CREATE INDEX "goalfy_notification_pending_idx" ON "goalfy_distribution_notification_items" ("batch_id","status");--> statement-breakpoint
ALTER TABLE "goalfy_distribution_notification_items" ADD CONSTRAINT "goalfy_distribution_notification_items_r1LOnWvqnVI0_fkey" FOREIGN KEY ("batch_id") REFERENCES "goalfy_distribution_batches"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "goalfy_distribution_notification_items" ADD CONSTRAINT "goalfy_distribution_notification_items_ZjP41XLwniIW_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "goalfy_distribution_notification_items" ADD CONSTRAINT "goalfy_distribution_notification_items_iLd5vgv0QaOf_fkey" FOREIGN KEY ("enterprise_insurer_id") REFERENCES "enterprise_insurers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "goalfy_distribution_notification_items" ADD CONSTRAINT "goalfy_distribution_notification_items_NwHY9UfUNAUJ_fkey" FOREIGN KEY ("salesperson_id") REFERENCES "users"("id") ON DELETE RESTRICT;