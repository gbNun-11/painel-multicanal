CREATE TABLE "goalfy_notification_resolution_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"batch_id" uuid NOT NULL,
	"notification_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"previous_status" text NOT NULL,
	"previous_error_code" text,
	"evidence_source" text NOT NULL,
	"evidence_reference" text NOT NULL,
	"resolution_note" text NOT NULL,
	"resolved_by_user_id" uuid NOT NULL,
	"resolved_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "goalfy_resolution_channel_check" CHECK ("channel" IN ('whatsapp', 'email')),
	CONSTRAINT "goalfy_resolution_previous_status_check" CHECK ("previous_status" = 'uncertain'),
	CONSTRAINT "goalfy_resolution_source_check" CHECK ("evidence_source" IN
        ('smtp_log', 'whatsapp_log'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "goalfy_resolution_notification_uidx" ON "goalfy_notification_resolution_audit" ("notification_id");--> statement-breakpoint
CREATE INDEX "goalfy_resolution_batch_idx" ON "goalfy_notification_resolution_audit" ("batch_id");--> statement-breakpoint
CREATE INDEX "goalfy_resolution_opportunity_idx" ON "goalfy_notification_resolution_audit" ("opportunity_id");--> statement-breakpoint
ALTER TABLE "goalfy_notification_resolution_audit" ADD CONSTRAINT "goalfy_notification_resolution_audit_ZL3L3UGZLmpF_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "goalfy_notification_resolution_audit" ADD CONSTRAINT "goalfy_notification_resolution_audit_hSjJYmVxJW5d_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;