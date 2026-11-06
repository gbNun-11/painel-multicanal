CREATE TYPE "client_person_type" AS ENUM('PF', 'PJ');--> statement-breakpoint
CREATE TYPE "opportunity_distribution_status" AS ENUM('novo', 'distribuindo', 'distribuido', 'atrasado');--> statement-breakpoint
CREATE TYPE "opportunity_sales_model" AS ENUM('LEAD', 'VINCULO', 'CONTINGENCIA');--> statement-breakpoint
CREATE TYPE "opportunity_sales_status" AS ENUM('aberto', 'em_atendimento', 'vendido', 'declinado', 'cancelado');--> statement-breakpoint
CREATE TYPE "status" AS ENUM('ativo', 'inativo');--> statement-breakpoint
CREATE TYPE "user_role" AS ENUM('administrativo', 'comercial', 'admin');--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"issuer" text,
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
	"impersonated_by" text,
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
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"document" text NOT NULL,
	"person_type" "client_person_type" NOT NULL,
	"phone" text,
	"email" text,
	"birth_date" date,
	"address" text,
	"address_number" text,
	"address_complement" text,
	"neighborhood" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enterprise_insurers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"enterprise_id" uuid NOT NULL,
	"insurer_id" uuid NOT NULL,
	"status" "status" DEFAULT 'ativo'::"status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enterprises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"cnpj" text NOT NULL UNIQUE,
	"status" "status" DEFAULT 'ativo'::"status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insurers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL UNIQUE,
	"status" "status" DEFAULT 'ativo'::"status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enterprise_insurer_suseps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"enterprise_insurer_id" uuid NOT NULL,
	"broker_user_id" uuid NOT NULL,
	"code" text NOT NULL,
	"product_code" text NOT NULL,
	"product" text NOT NULL,
	"status" "status" DEFAULT 'ativo'::"status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"cpf" text NOT NULL UNIQUE,
	"birth_date" date NOT NULL,
	"phone" text NOT NULL UNIQUE,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" NOT NULL,
	"status" "status" DEFAULT 'ativo'::"status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"client_id" uuid NOT NULL,
	"enterprise_insurer_id" uuid NOT NULL,
	"susep_id" uuid NOT NULL,
	"external_source" text NOT NULL,
	"external_id" text NOT NULL,
	"product_code" text NOT NULL,
	"product" text NOT NULL,
	"propensity_code" text,
	"propensity" text,
	"source_program_code" text,
	"sales_model" "opportunity_sales_model",
	"external_status_reason" text,
	"model" text,
	"model_year" integer,
	"license_plate" text,
	"asset_value" numeric(15,2),
	"observation" text,
	"salesperson_id" uuid,
	"distribution_status" "opportunity_distribution_status" DEFAULT 'novo'::"opportunity_distribution_status" NOT NULL,
	"sales_status" "opportunity_sales_status" DEFAULT 'aberto'::"opportunity_sales_status" NOT NULL,
	"assigned_at" timestamp with time zone,
	"source_created_at" timestamp with time zone,
	"source_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "clients_document_uidx" ON "clients" ("document");--> statement-breakpoint
CREATE INDEX "clients_name_idx" ON "clients" ("name");--> statement-breakpoint
CREATE INDEX "clients_phone_idx" ON "clients" ("phone");--> statement-breakpoint
CREATE INDEX "clients_email_idx" ON "clients" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "enterprise_insurers_unique_idx" ON "enterprise_insurers" ("enterprise_id","insurer_id");--> statement-breakpoint
CREATE INDEX "enterprise_insurers_enterprise_idx" ON "enterprise_insurers" ("enterprise_id");--> statement-breakpoint
CREATE INDEX "enterprise_insurers_insurer_idx" ON "enterprise_insurers" ("insurer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "suseps_enterprise_insurer_code_unique_idx" ON "enterprise_insurer_suseps" ("enterprise_insurer_id","code");--> statement-breakpoint
CREATE INDEX "suseps_enterprise_insurer_idx" ON "enterprise_insurer_suseps" ("enterprise_insurer_id");--> statement-breakpoint
CREATE INDEX "suseps_code_idx" ON "enterprise_insurer_suseps" ("code");--> statement-breakpoint
CREATE INDEX "suseps_broker_user_idx" ON "enterprise_insurer_suseps" ("broker_user_id");--> statement-breakpoint
CREATE INDEX "suseps_product_code_idx" ON "enterprise_insurer_suseps" ("product_code");--> statement-breakpoint
CREATE UNIQUE INDEX "opportunities_source_external_id_uidx" ON "opportunities" ("enterprise_insurer_id","external_source","external_id");--> statement-breakpoint
CREATE INDEX "opportunities_client_created_at_idx" ON "opportunities" ("client_id","created_at");--> statement-breakpoint
CREATE INDEX "opportunities_distribution_created_at_idx" ON "opportunities" ("distribution_status","created_at");--> statement-breakpoint
CREATE INDEX "opportunities_sales_status_created_at_idx" ON "opportunities" ("sales_status","created_at");--> statement-breakpoint
CREATE INDEX "opportunities_salesperson_distribution_idx" ON "opportunities" ("salesperson_id","distribution_status");--> statement-breakpoint
CREATE INDEX "opportunities_source_distribution_created_at_idx" ON "opportunities" ("enterprise_insurer_id","distribution_status","created_at");--> statement-breakpoint
CREATE INDEX "opportunities_susep_idx" ON "opportunities" ("susep_id");--> statement-breakpoint
CREATE INDEX "opportunities_product_code_idx" ON "opportunities" ("product_code");--> statement-breakpoint
CREATE INDEX "opportunities_license_plate_idx" ON "opportunities" ("license_plate");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "enterprise_insurers" ADD CONSTRAINT "enterprise_insurers_enterprise_id_enterprises_id_fkey" FOREIGN KEY ("enterprise_id") REFERENCES "enterprises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "enterprise_insurers" ADD CONSTRAINT "enterprise_insurers_insurer_id_insurers_id_fkey" FOREIGN KEY ("insurer_id") REFERENCES "insurers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "enterprise_insurer_suseps" ADD CONSTRAINT "enterprise_insurer_suseps_KJ3itZ3Bi7vz_fkey" FOREIGN KEY ("enterprise_insurer_id") REFERENCES "enterprise_insurers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "enterprise_insurer_suseps" ADD CONSTRAINT "enterprise_insurer_suseps_broker_user_id_users_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_client_id_clients_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_enterprise_insurer_id_enterprise_insurers_id_fkey" FOREIGN KEY ("enterprise_insurer_id") REFERENCES "enterprise_insurers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_susep_id_enterprise_insurer_suseps_id_fkey" FOREIGN KEY ("susep_id") REFERENCES "enterprise_insurer_suseps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_salesperson_id_users_id_fkey" FOREIGN KEY ("salesperson_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;