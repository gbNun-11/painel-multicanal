ALTER TABLE "users" ADD COLUMN "goalfy_user_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_goalfy_user_id_key" UNIQUE("goalfy_user_id");