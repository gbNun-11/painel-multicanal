ALTER TYPE "status_role" RENAME TO "status";--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"issuer" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" RENAME COLUMN "dynamics_id" TO "external_id";--> statement-breakpoint
ALTER TABLE "enterprise_insurer_suseps" RENAME COLUMN "susep" TO "code";--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "enterprise_insurer_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "enterprise_insurers" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "user_role";--> statement-breakpoint
CREATE TYPE "user_role" AS ENUM('administrativo', 'comercial', 'admin');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "user_role" USING "role"::"user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'comercial'::"user_role";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password";--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "external_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON "account" ("issuer","account_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "clients_source_external_id_uidx" ON "clients" ("enterprise_insurer_id","external_id");--> statement-breakpoint
CREATE INDEX "clients_status_created_at_idx" ON "clients" ("status","created_at");--> statement-breakpoint
CREATE INDEX "clients_salesperson_status_idx" ON "clients" ("salesperson_id","status");--> statement-breakpoint
CREATE INDEX "clients_source_status_created_at_idx" ON "clients" ("enterprise_insurer_id","status","created_at");--> statement-breakpoint
CREATE INDEX "clients_susep_idx" ON "clients" ("susep_id");--> statement-breakpoint
CREATE INDEX "clients_cpf_idx" ON "clients" ("cpf");--> statement-breakpoint
CREATE INDEX "clients_phone_idx" ON "clients" ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "enterprise_insurers_unique_idx" ON "enterprise_insurers" ("enterprise_id","insurer_id");--> statement-breakpoint
CREATE INDEX "enterprise_insurers_enterprise_idx" ON "enterprise_insurers" ("enterprise_id");--> statement-breakpoint
CREATE INDEX "enterprise_insurers_insurer_idx" ON "enterprise_insurers" ("insurer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "suseps_enterprise_insurer_code_unique_idx" ON "enterprise_insurer_suseps" ("enterprise_insurer_id","code");--> statement-breakpoint
CREATE INDEX "suseps_enterprise_insurer_idx" ON "enterprise_insurer_suseps" ("enterprise_insurer_id");--> statement-breakpoint
CREATE INDEX "suseps_code_idx" ON "enterprise_insurer_suseps" ("code");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_enterprise_insurer_id_enterprise_insurers_id_fkey" FOREIGN KEY ("enterprise_insurer_id") REFERENCES "enterprise_insurers"("id");--> statement-breakpoint
ALTER TABLE "enterprise_insurers" DROP CONSTRAINT "enterprise_insurers_enterprise_id_enterprises_id_fkey", ADD CONSTRAINT "enterprise_insurers_enterprise_id_enterprises_id_fkey" FOREIGN KEY ("enterprise_id") REFERENCES "enterprises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "enterprise_insurers" DROP CONSTRAINT "enterprise_insurers_insurer_id_insurers_id_fkey", ADD CONSTRAINT "enterprise_insurers_insurer_id_insurers_id_fkey" FOREIGN KEY ("insurer_id") REFERENCES "insurers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "enterprise_insurer_suseps" DROP CONSTRAINT "enterprise_insurer_suseps_KJ3itZ3Bi7vz_fkey", ADD CONSTRAINT "enterprise_insurer_suseps_KJ3itZ3Bi7vz_fkey" FOREIGN KEY ("enterprise_insurer_id") REFERENCES "enterprise_insurers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;