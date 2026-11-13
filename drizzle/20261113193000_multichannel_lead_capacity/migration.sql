ALTER TABLE "multichannel_assignments" ADD COLUMN "lead_capacity" integer;
--> statement-breakpoint
ALTER TABLE "multichannel_assignments" ADD CONSTRAINT "multichannel_assignments_lead_capacity_check" CHECK ("lead_capacity" IS NULL OR "lead_capacity" >= 0);
