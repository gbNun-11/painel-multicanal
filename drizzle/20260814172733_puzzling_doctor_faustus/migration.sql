CREATE TYPE "client_status" AS ENUM('novo', 'distribuido', 'atrasado');--> statement-breakpoint
CREATE TYPE "status_role" AS ENUM('ativo', 'inativo');--> statement-breakpoint
CREATE TYPE "user_role" AS ENUM('admin', 'administrador', 'comercial');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"status" "client_status" DEFAULT 'novo'::"client_status" NOT NULL,
	"name" text NOT NULL,
	"cpf" text,
	"phone" text,
	"birth_date" date,
	"susep_id" uuid,
	"dynamics_id" text,
	"product" text,
	"propensity" text,
	"model" text,
	"model_year" integer,
	"license_plate" text,
	"state" text,
	"zip_code" text,
	"neighborhood" text,
	"city" text,
	"observation" text,
	"salesperson_id" uuid,
	"assigned_at" timestamp with time zone,
	"source_created_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enterprise_insurers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"enterprise_id" uuid NOT NULL,
	"insurer_id" uuid NOT NULL,
	"status" "status_role" DEFAULT 'ativo'::"status_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enterprises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"cnpj" text NOT NULL UNIQUE,
	"status" "status_role" DEFAULT 'ativo'::"status_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insurers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL UNIQUE,
	"status" "status_role" DEFAULT 'ativo'::"status_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enterprise_insurer_suseps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"enterprise_insurer_id" uuid NOT NULL,
	"susep" text NOT NULL,
	"status" "status_role" DEFAULT 'ativo'::"status_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"password" text NOT NULL,
	"phone" text NOT NULL UNIQUE,
	"email" text NOT NULL UNIQUE,
	"role" "user_role" NOT NULL,
	"status" "status_role" DEFAULT 'ativo'::"status_role" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_susep_id_enterprise_insurer_suseps_id_fkey" FOREIGN KEY ("susep_id") REFERENCES "enterprise_insurer_suseps"("id");--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_salesperson_id_users_id_fkey" FOREIGN KEY ("salesperson_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "enterprise_insurers" ADD CONSTRAINT "enterprise_insurers_enterprise_id_enterprises_id_fkey" FOREIGN KEY ("enterprise_id") REFERENCES "enterprises"("id");--> statement-breakpoint
ALTER TABLE "enterprise_insurers" ADD CONSTRAINT "enterprise_insurers_insurer_id_insurers_id_fkey" FOREIGN KEY ("insurer_id") REFERENCES "insurers"("id");--> statement-breakpoint
ALTER TABLE "enterprise_insurer_suseps" ADD CONSTRAINT "enterprise_insurer_suseps_KJ3itZ3Bi7vz_fkey" FOREIGN KEY ("enterprise_insurer_id") REFERENCES "enterprise_insurers"("id");

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;