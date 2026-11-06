CREATE TABLE "asset_bikes" (
	"asset_id" uuid PRIMARY KEY,
	"kind" text,
	"make" text,
	"model" text,
	"serial_number" text,
	"acquired_at" date,
	"acquisition_value" numeric(18,2),
	CONSTRAINT "asset_bikes_acquisition_value_check" CHECK ("acquisition_value" IS NULL OR "acquisition_value" >= 0)
);
--> statement-breakpoint
CREATE TABLE "asset_equipment" (
	"asset_id" uuid PRIMARY KEY,
	"equipment_type" text,
	"make" text,
	"model" text,
	"serial_number" text,
	"owner_document" text,
	"acquired_at" date,
	"acquisition_value" numeric(18,2),
	"market_value" numeric(18,2),
	CONSTRAINT "asset_equipment_acquisition_value_check" CHECK ("acquisition_value" IS NULL OR "acquisition_value" >= 0),
	CONSTRAINT "asset_equipment_market_value_check" CHECK ("market_value" IS NULL OR "market_value" >= 0)
);
--> statement-breakpoint
CREATE TABLE "asset_pets" (
	"asset_id" uuid PRIMARY KEY,
	"name" text,
	"species" text,
	"breed" text,
	"sex" text,
	"birth_date" date,
	"microchip" text
);
--> statement-breakpoint
CREATE TABLE "asset_properties" (
	"asset_id" uuid PRIMARY KEY,
	"usage_type" text,
	"building_type" text,
	"zip_code" text,
	"address" text,
	"number" text,
	"complement" text,
	"neighborhood" text,
	"city" text,
	"state" text,
	"property_value" numeric(18,2),
	CONSTRAINT "asset_properties_value_check" CHECK ("property_value" IS NULL OR "property_value" >= 0)
);
--> statement-breakpoint
CREATE TABLE "asset_vehicles" (
	"asset_id" uuid PRIMARY KEY,
	"plate" text,
	"chassis" text,
	"fipe_code" text,
	"description" text,
	"make" text,
	"model" text,
	"manufacture_year" integer,
	"model_year" integer,
	"doors" integer,
	"fuel" text,
	"category" text,
	"transmission" text,
	"usage_type" text,
	"overnight_zip_code" text,
	CONSTRAINT "asset_vehicles_doors_check" CHECK ("doors" IS NULL OR "doors" >= 0)
);
--> statement-breakpoint
CREATE TABLE "client_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"client_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"label" text NOT NULL,
	"external_reference" text,
	"status" text DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_assets_id_client_id_uniq" UNIQUE("id","client_id"),
	CONSTRAINT "client_assets_kind_check" CHECK ("kind" IN ('VEHICLE', 'BIKE', 'EQUIPMENT', 'PROPERTY', 'PET', 'OTHER'))
);
--> statement-breakpoint
CREATE TABLE "client_related_people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"client_id" uuid NOT NULL,
	"related_client_id" uuid,
	"name" text NOT NULL,
	"document" text,
	"relation_type" text NOT NULL,
	"birth_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_related_people_id_client_id_uniq" UNIQUE("id","client_id"),
	CONSTRAINT "client_related_people_not_self_check" CHECK ("related_client_id" IS NULL OR "related_client_id" <> "client_id")
);
--> statement-breakpoint
CREATE TABLE "insurance_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"opportunity_id" uuid NOT NULL,
	"quote_type" text NOT NULL,
	"product" text NOT NULL,
	"external_number" text,
	"status" text DEFAULT 'rascunho' NOT NULL,
	"valid_until" date,
	"total_lives" integer,
	"total_amount" numeric(18,2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_quotes_opportunity_id_id_uniq" UNIQUE("opportunity_id","id"),
	CONSTRAINT "insurance_quotes_total_lives_check" CHECK ("total_lives" IS NULL OR "total_lives" >= 0),
	CONSTRAINT "insurance_quotes_total_amount_check" CHECK ("total_amount" IS NULL OR "total_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "quote_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"quote_id" uuid NOT NULL,
	"quote_plan_id" uuid,
	"name" text,
	"document" text,
	"birth_date" date,
	"age_band" text,
	"relationship" text,
	"monthly_amount" numeric(18,2),
	CONSTRAINT "quote_members_monthly_amount_check" CHECK ("monthly_amount" IS NULL OR "monthly_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "quote_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"quote_id" uuid NOT NULL,
	"name" text NOT NULL,
	"provider" text,
	"accommodation" text,
	"copayment" text,
	"lives" integer,
	"monthly_amount" numeric(18,2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quote_plans_quote_id_id_unique" UNIQUE("quote_id","id"),
	CONSTRAINT "quote_plans_lives_check" CHECK ("lives" IS NULL OR "lives" >= 0),
	CONSTRAINT "quote_plans_monthly_amount_check" CHECK ("monthly_amount" IS NULL OR "monthly_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "lease_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"proposal_id" uuid NOT NULL UNIQUE,
	"property_asset_id" uuid,
	"lease_reference" text,
	"contract_starts_on" date,
	"contract_ends_on" date,
	"monthly_rent" numeric(18,2),
	"charges" numeric(18,2),
	"deposit_amount" numeric(18,2),
	"details" jsonb,
	CONSTRAINT "lease_contracts_dates_check" CHECK ("contract_starts_on" IS NULL OR "contract_ends_on" IS NULL OR "contract_starts_on" <= "contract_ends_on"),
	CONSTRAINT "lease_contracts_monthly_rent_nonnegative" CHECK ("monthly_rent" IS NULL OR "monthly_rent" >= 0),
	CONSTRAINT "lease_contracts_charges_nonnegative" CHECK ("charges" IS NULL OR "charges" >= 0),
	CONSTRAINT "lease_contracts_deposit_nonnegative" CHECK ("deposit_amount" IS NULL OR "deposit_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "lease_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"lease_contract_id" uuid NOT NULL,
	"role" text NOT NULL,
	"name" text NOT NULL,
	"document" text,
	"related_person_id" uuid
);
--> statement-breakpoint
CREATE TABLE "proposal_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"proposal_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"relation_type" text DEFAULT 'segurado' NOT NULL,
	"asset_snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposal_assets_snapshot_object_check" CHECK (jsonb_typeof("asset_snapshot") = 'object')
);
--> statement-breakpoint
CREATE TABLE "proposal_coverages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"proposal_id" uuid NOT NULL,
	"code" text,
	"description" text NOT NULL,
	"insured_limit" numeric(18,2),
	"deductible" numeric(18,2),
	"premium" numeric(18,2),
	"extra_details" jsonb,
	CONSTRAINT "proposal_coverages_limit_nonnegative" CHECK ("insured_limit" IS NULL OR "insured_limit" >= 0),
	CONSTRAINT "proposal_coverages_deductible_nonnegative" CHECK ("deductible" IS NULL OR "deductible" >= 0)
);
--> statement-breakpoint
CREATE TABLE "proposal_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"proposal_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"related_person_id" uuid,
	"role" text NOT NULL,
	"name_snapshot" text,
	"document_snapshot" text,
	"details_snapshot" jsonb,
	CONSTRAINT "proposal_participants_details_object_check" CHECK ("details_snapshot" IS NULL OR jsonb_typeof("details_snapshot") = 'object')
);
--> statement-breakpoint
CREATE TABLE "proposal_product_details" (
	"proposal_id" uuid PRIMARY KEY,
	"product" text NOT NULL,
	"fields" jsonb NOT NULL,
	"parser_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposal_product_details_fields_object_check" CHECK (jsonb_typeof("fields") = 'object')
);
--> statement-breakpoint
CREATE TABLE "proposal_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"proposal_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"changed_by_user_id" uuid,
	"reason" text,
	"origin" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"opportunity_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"quote_id" uuid,
	"proposal_number" text,
	"quote_number" text,
	"plan_name" text,
	"pdf_layout" text,
	"status" text DEFAULT 'em_analise' NOT NULL,
	"status_reason" text,
	"requested_at" timestamp with time zone,
	"starts_on" date,
	"ends_on" date,
	"operation_type" text,
	"bonus_class" text,
	"gross_premium" numeric(18,2),
	"net_premium" numeric(18,2),
	"insured_payment_method" text,
	"insured_payment_installments" integer,
	"source_system" text,
	"source_external_id" text,
	"recorded_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposals_id_client_id_uniq" UNIQUE("id","client_id"),
	CONSTRAINT "proposals_insured_installments_positive" CHECK ("insured_payment_installments" IS NULL OR "insured_payment_installments" > 0),
	CONSTRAINT "proposals_gross_premium_nonnegative" CHECK ("gross_premium" IS NULL OR "gross_premium" >= 0),
	CONSTRAINT "proposals_net_premium_nonnegative" CHECK ("net_premium" IS NULL OR "net_premium" >= 0),
	CONSTRAINT "proposals_validity_range_check" CHECK ("starts_on" IS NULL OR "ends_on" IS NULL OR "starts_on" <= "ends_on")
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"proposal_id" uuid NOT NULL,
	"policy_number" text,
	"issued_at" timestamp with time zone,
	"starts_on" date,
	"ends_on" date,
	"status" text DEFAULT 'emitida' NOT NULL,
	"gross_premium" numeric(18,2),
	"net_premium" numeric(18,2),
	"original_payment_method" text,
	"original_payment_installments" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "policies_validity_range_check" CHECK ("starts_on" IS NULL OR "ends_on" IS NULL OR "starts_on" <= "ends_on"),
	CONSTRAINT "policies_gross_premium_nonnegative" CHECK ("gross_premium" IS NULL OR "gross_premium" >= 0),
	CONSTRAINT "policies_net_premium_nonnegative" CHECK ("net_premium" IS NULL OR "net_premium" >= 0),
	CONSTRAINT "policies_original_installments_positive" CHECK ("original_payment_installments" IS NULL OR "original_payment_installments" > 0)
);
--> statement-breakpoint
CREATE TABLE "policy_coverages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"policy_id" uuid NOT NULL,
	"code" text,
	"description" text NOT NULL,
	"insured_limit" numeric(18,2),
	"deductible" numeric(18,2),
	"premium" numeric(18,2),
	CONSTRAINT "policy_coverages_insured_limit_nonnegative" CHECK ("insured_limit" IS NULL OR "insured_limit" >= 0),
	CONSTRAINT "policy_coverages_deductible_nonnegative" CHECK ("deductible" IS NULL OR "deductible" >= 0),
	CONSTRAINT "policy_coverages_premium_nonnegative" CHECK ("premium" IS NULL OR "premium" >= 0)
);
--> statement-breakpoint
CREATE TABLE "policy_endorsement_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"endorsement_id" uuid NOT NULL,
	"item_type" text NOT NULL,
	"description" text,
	"previous_value" jsonb,
	"new_value" jsonb,
	"amount_delta" numeric(18,2)
);
--> statement-breakpoint
CREATE TABLE "policy_endorsements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"policy_id" uuid NOT NULL,
	"endorsement_number" text,
	"kind" text NOT NULL,
	"status" text DEFAULT 'solicitado' NOT NULL,
	"reason" text,
	"requested_at" timestamp with time zone,
	"effective_on" date,
	"issued_at" timestamp with time zone,
	"gross_premium_delta" numeric(18,2),
	"net_premium_delta" numeric(18,2),
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "policy_endorsements_policy_id_id_uniq" UNIQUE("policy_id","id")
);
--> statement-breakpoint
CREATE TABLE "commission_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"policy_id" uuid NOT NULL,
	"endorsement_id" uuid,
	"installment_id" uuid,
	"kind" text NOT NULL,
	"amount" numeric(18,2) NOT NULL,
	"competence_on" date,
	"due_on" date,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commission_adjustments_policy_id_id_uniq" UNIQUE("policy_id","id")
);
--> statement-breakpoint
CREATE TABLE "commission_installment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"policy_id" uuid NOT NULL,
	"installment_id" uuid NOT NULL,
	"endorsement_id" uuid,
	"event_type" text NOT NULL,
	"reason" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commission_installment_events_type_check" CHECK ("event_type" IN ('CANCELLED', 'REINSTATED', 'NOTE'))
);
--> statement-breakpoint
CREATE TABLE "commission_installments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"policy_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"installment_number" integer NOT NULL,
	"competence_on" date,
	"due_on" date,
	"original_amount" numeric(18,2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commission_installments_policy_id_id_uniq" UNIQUE("policy_id","id"),
	CONSTRAINT "commission_installments_number_positive" CHECK ("installment_number" > 0)
);
--> statement-breakpoint
CREATE TABLE "commission_receipt_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"policy_id" uuid NOT NULL,
	"receipt_id" uuid NOT NULL,
	"installment_id" uuid,
	"adjustment_id" uuid,
	"amount" numeric(18,2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commission_receipt_allocations_target_check" CHECK (num_nonnulls("installment_id", "adjustment_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "commission_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"policy_id" uuid NOT NULL,
	"reference" text,
	"received_on" date NOT NULL,
	"amount" numeric(18,2) NOT NULL,
	"source" text,
	"status" text DEFAULT 'confirmado' NOT NULL,
	"recorded_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commission_receipts_policy_id_id_uniq" UNIQUE("policy_id","id")
);
--> statement-breakpoint
CREATE TABLE "commission_rule_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"rule_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"effective_from" date NOT NULL,
	"effective_until" date,
	"commission_percent" numeric(9,5),
	"fixed_commission" numeric(18,2),
	"installments_count" integer,
	"start_month_offset" integer,
	"settlement_policy" text,
	"calculation_parameters" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commission_rule_version_positive" CHECK ("version" > 0),
	CONSTRAINT "commission_rule_versions_dates_check" CHECK ("effective_until" IS NULL OR "effective_until" >= "effective_from"),
	CONSTRAINT "commission_rule_versions_percent_check" CHECK ("commission_percent" IS NULL OR "commission_percent" >= 0),
	CONSTRAINT "commission_rule_versions_fixed_check" CHECK ("fixed_commission" IS NULL OR "fixed_commission" >= 0),
	CONSTRAINT "commission_rule_versions_installments_check" CHECK ("installments_count" IS NULL OR "installments_count" > 0),
	CONSTRAINT "commission_rule_versions_parameters_check" CHECK ("calculation_parameters" IS NULL OR jsonb_typeof("calculation_parameters") = 'object')
);
--> statement-breakpoint
CREATE TABLE "commission_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"enterprise_insurer_id" uuid NOT NULL,
	"product_id" uuid,
	"name" text NOT NULL,
	"status" text DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"policy_id" uuid NOT NULL,
	"endorsement_id" uuid,
	"rule_version_id" uuid,
	"source_type" text NOT NULL,
	"basis_amount" numeric(18,2),
	"total_commission" numeric(18,2),
	"scheduled_installments" integer,
	"first_competence_on" date,
	"rule_snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commission_schedules_policy_id_id_uniq" UNIQUE("policy_id","id"),
	CONSTRAINT "commission_schedules_source_check" CHECK ("source_type" IN ('ORIGINAL', 'ENDORSEMENT')),
	CONSTRAINT "commission_schedules_endorsement_source_check" CHECK (("source_type" = 'ORIGINAL' AND "endorsement_id" IS NULL) OR ("source_type" = 'ENDORSEMENT' AND "endorsement_id" IS NOT NULL)),
	CONSTRAINT "commission_schedules_installments_check" CHECK ("scheduled_installments" IS NULL OR "scheduled_installments" > 0),
	CONSTRAINT "commission_schedules_snapshot_check" CHECK ("rule_snapshot" IS NULL OR jsonb_typeof("rule_snapshot") = 'object')
);
--> statement-breakpoint
CREATE TABLE "document_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"storage_key" text NOT NULL,
	"sha256" text,
	"source_system" text,
	"uploaded_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"file_id" uuid NOT NULL,
	"client_id" uuid,
	"opportunity_id" uuid,
	"quote_id" uuid,
	"proposal_id" uuid,
	"policy_id" uuid,
	"endorsement_id" uuid,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_links_single_target_check" CHECK (num_nonnulls("client_id", "opportunity_id", "quote_id", "proposal_id", "policy_id", "endorsement_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "integration_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"source" text NOT NULL,
	"external_event_id" text NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'recebido' NOT NULL,
	"payload" jsonb,
	"last_error" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "integration_events_payload_object_check" CHECK ("payload" IS NULL OR jsonb_typeof("payload") = 'object')
);
--> statement-breakpoint
CREATE TABLE "operation_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" text NOT NULL,
	"actor_user_id" uuid,
	"before" jsonb,
	"after" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "operation_history_before_object_check" CHECK ("before" IS NULL OR jsonb_typeof("before") = 'object'),
	CONSTRAINT "operation_history_after_object_check" CHECK ("after" IS NULL OR jsonb_typeof("after") = 'object')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "opportunities_id_client_id_uidx" ON "opportunities" ("id","client_id");--> statement-breakpoint
CREATE INDEX "asset_bikes_serial_idx" ON "asset_bikes" ("serial_number");--> statement-breakpoint
CREATE INDEX "asset_equipment_serial_idx" ON "asset_equipment" ("serial_number");--> statement-breakpoint
CREATE INDEX "asset_properties_zip_idx" ON "asset_properties" ("zip_code");--> statement-breakpoint
CREATE INDEX "asset_vehicles_plate_idx" ON "asset_vehicles" ("plate");--> statement-breakpoint
CREATE INDEX "asset_vehicles_chassis_idx" ON "asset_vehicles" ("chassis");--> statement-breakpoint
CREATE INDEX "client_assets_client_kind_idx" ON "client_assets" ("client_id","kind");--> statement-breakpoint
CREATE INDEX "client_related_people_client_idx" ON "client_related_people" ("client_id");--> statement-breakpoint
CREATE INDEX "client_related_people_document_idx" ON "client_related_people" ("document");--> statement-breakpoint
CREATE INDEX "insurance_quotes_opportunity_idx" ON "insurance_quotes" ("opportunity_id");--> statement-breakpoint
CREATE INDEX "quote_members_quote_idx" ON "quote_members" ("quote_id");--> statement-breakpoint
CREATE INDEX "quote_members_plan_idx" ON "quote_members" ("quote_id","quote_plan_id");--> statement-breakpoint
CREATE INDEX "quote_plans_quote_idx" ON "quote_plans" ("quote_id");--> statement-breakpoint
CREATE INDEX "lease_contracts_property_asset_idx" ON "lease_contracts" ("property_asset_id");--> statement-breakpoint
CREATE INDEX "lease_participants_contract_idx" ON "lease_participants" ("lease_contract_id");--> statement-breakpoint
CREATE INDEX "lease_participants_related_person_idx" ON "lease_participants" ("related_person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_assets_proposal_asset_uniq" ON "proposal_assets" ("proposal_id","asset_id","relation_type");--> statement-breakpoint
CREATE INDEX "proposal_assets_asset_idx" ON "proposal_assets" ("asset_id");--> statement-breakpoint
CREATE INDEX "proposal_coverages_proposal_idx" ON "proposal_coverages" ("proposal_id");--> statement-breakpoint
CREATE INDEX "proposal_participants_proposal_idx" ON "proposal_participants" ("proposal_id");--> statement-breakpoint
CREATE INDEX "proposal_participants_related_person_idx" ON "proposal_participants" ("related_person_id");--> statement-breakpoint
CREATE INDEX "proposal_status_history_proposal_idx" ON "proposal_status_history" ("proposal_id","occurred_at");--> statement-breakpoint
CREATE INDEX "proposals_opportunity_idx" ON "proposals" ("opportunity_id","created_at");--> statement-breakpoint
CREATE INDEX "proposals_quote_idx" ON "proposals" ("quote_id");--> statement-breakpoint
CREATE INDEX "proposals_number_idx" ON "proposals" ("proposal_number");--> statement-breakpoint
CREATE INDEX "proposals_status_idx" ON "proposals" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "policies_proposal_uniq" ON "policies" ("proposal_id");--> statement-breakpoint
CREATE INDEX "policies_number_idx" ON "policies" ("policy_number");--> statement-breakpoint
CREATE INDEX "policies_status_idx" ON "policies" ("status");--> statement-breakpoint
CREATE INDEX "policy_coverages_policy_idx" ON "policy_coverages" ("policy_id");--> statement-breakpoint
CREATE INDEX "policy_endorsement_items_endorsement_idx" ON "policy_endorsement_items" ("endorsement_id");--> statement-breakpoint
CREATE INDEX "policy_endorsements_policy_idx" ON "policy_endorsements" ("policy_id","created_at");--> statement-breakpoint
CREATE INDEX "commission_adjustments_policy_idx" ON "commission_adjustments" ("policy_id");--> statement-breakpoint
CREATE INDEX "commission_adjustments_endorsement_idx" ON "commission_adjustments" ("policy_id","endorsement_id");--> statement-breakpoint
CREATE INDEX "commission_adjustments_installment_idx" ON "commission_adjustments" ("policy_id","installment_id");--> statement-breakpoint
CREATE INDEX "commission_installment_events_inst_idx" ON "commission_installment_events" ("installment_id","occurred_at");--> statement-breakpoint
CREATE INDEX "commission_installment_events_endorsement_idx" ON "commission_installment_events" ("policy_id","endorsement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commission_installments_schedule_number_uniq" ON "commission_installments" ("schedule_id","installment_number");--> statement-breakpoint
CREATE INDEX "commission_installments_due_idx" ON "commission_installments" ("due_on");--> statement-breakpoint
CREATE INDEX "commission_installments_policy_schedule_idx" ON "commission_installments" ("policy_id","schedule_id");--> statement-breakpoint
CREATE INDEX "commission_receipt_allocations_receipt_idx" ON "commission_receipt_allocations" ("receipt_id");--> statement-breakpoint
CREATE INDEX "commission_receipt_allocations_installment_idx" ON "commission_receipt_allocations" ("policy_id","installment_id");--> statement-breakpoint
CREATE INDEX "commission_receipt_allocations_adjustment_idx" ON "commission_receipt_allocations" ("policy_id","adjustment_id");--> statement-breakpoint
CREATE INDEX "commission_receipts_policy_received_idx" ON "commission_receipts" ("policy_id","received_on");--> statement-breakpoint
CREATE UNIQUE INDEX "commission_rule_versions_number_uniq" ON "commission_rule_versions" ("rule_id","version");--> statement-breakpoint
CREATE INDEX "commission_rules_enterprise_insurer_idx" ON "commission_rules" ("enterprise_insurer_id");--> statement-breakpoint
CREATE INDEX "commission_rules_product_idx" ON "commission_rules" ("product_id");--> statement-breakpoint
CREATE INDEX "commission_schedules_policy_idx" ON "commission_schedules" ("policy_id");--> statement-breakpoint
CREATE INDEX "commission_schedules_endorsement_idx" ON "commission_schedules" ("policy_id","endorsement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "document_files_storage_key_uniq" ON "document_files" ("storage_key");--> statement-breakpoint
CREATE INDEX "document_files_sha256_idx" ON "document_files" ("sha256");--> statement-breakpoint
CREATE INDEX "document_links_file_idx" ON "document_links" ("file_id");--> statement-breakpoint
CREATE INDEX "document_links_proposal_idx" ON "document_links" ("proposal_id");--> statement-breakpoint
CREATE INDEX "document_links_policy_idx" ON "document_links" ("policy_id");--> statement-breakpoint
CREATE UNIQUE INDEX "integration_events_source_external_uniq" ON "integration_events" ("source","external_event_id");--> statement-breakpoint
CREATE INDEX "integration_events_status_idx" ON "integration_events" ("status","received_at");--> statement-breakpoint
CREATE INDEX "operation_history_entity_idx" ON "operation_history" ("entity_type","entity_id","occurred_at");--> statement-breakpoint
ALTER TABLE "asset_bikes" ADD CONSTRAINT "asset_bikes_asset_id_client_assets_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "client_assets"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "asset_equipment" ADD CONSTRAINT "asset_equipment_asset_id_client_assets_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "client_assets"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "asset_pets" ADD CONSTRAINT "asset_pets_asset_id_client_assets_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "client_assets"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "asset_properties" ADD CONSTRAINT "asset_properties_asset_id_client_assets_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "client_assets"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "asset_vehicles" ADD CONSTRAINT "asset_vehicles_asset_id_client_assets_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "client_assets"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "client_assets" ADD CONSTRAINT "client_assets_client_id_clients_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "client_related_people" ADD CONSTRAINT "client_related_people_client_id_clients_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "client_related_people" ADD CONSTRAINT "client_related_people_related_client_id_clients_id_fkey" FOREIGN KEY ("related_client_id") REFERENCES "clients"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "insurance_quotes" ADD CONSTRAINT "insurance_quotes_opportunity_id_opportunities_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "quote_members" ADD CONSTRAINT "quote_members_quote_id_insurance_quotes_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "insurance_quotes"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "quote_members" ADD CONSTRAINT "quote_members_plan_quote_fk" FOREIGN KEY ("quote_id","quote_plan_id") REFERENCES "quote_plans"("quote_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "quote_plans" ADD CONSTRAINT "quote_plans_quote_id_insurance_quotes_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "insurance_quotes"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "lease_contracts" ADD CONSTRAINT "lease_contracts_proposal_id_proposals_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "lease_contracts" ADD CONSTRAINT "lease_contracts_property_asset_id_client_assets_id_fkey" FOREIGN KEY ("property_asset_id") REFERENCES "client_assets"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "lease_participants" ADD CONSTRAINT "lease_participants_lease_contract_id_lease_contracts_id_fkey" FOREIGN KEY ("lease_contract_id") REFERENCES "lease_contracts"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "lease_participants" ADD CONSTRAINT "lease_participants_1JYJrRzZmjR3_fkey" FOREIGN KEY ("related_person_id") REFERENCES "client_related_people"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "proposal_assets" ADD CONSTRAINT "proposal_assets_proposal_id_proposals_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "proposal_assets" ADD CONSTRAINT "proposal_assets_asset_id_client_assets_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "client_assets"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "proposal_assets" ADD CONSTRAINT "proposal_assets_proposal_client_fk" FOREIGN KEY ("proposal_id","client_id") REFERENCES "proposals"("id","client_id") ON DELETE RESTRICT ON UPDATE RESTRICT;--> statement-breakpoint
ALTER TABLE "proposal_assets" ADD CONSTRAINT "proposal_assets_asset_client_fk" FOREIGN KEY ("asset_id","client_id") REFERENCES "client_assets"("id","client_id") ON DELETE RESTRICT ON UPDATE RESTRICT;--> statement-breakpoint
ALTER TABLE "proposal_coverages" ADD CONSTRAINT "proposal_coverages_proposal_id_proposals_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "proposal_participants" ADD CONSTRAINT "proposal_participants_proposal_id_proposals_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "proposal_participants" ADD CONSTRAINT "proposal_participants_13L3IUNMK8RZ_fkey" FOREIGN KEY ("related_person_id") REFERENCES "client_related_people"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "proposal_participants" ADD CONSTRAINT "proposal_participants_proposal_client_fk" FOREIGN KEY ("proposal_id","client_id") REFERENCES "proposals"("id","client_id") ON DELETE RESTRICT ON UPDATE RESTRICT;--> statement-breakpoint
ALTER TABLE "proposal_participants" ADD CONSTRAINT "proposal_participants_person_client_fk" FOREIGN KEY ("related_person_id","client_id") REFERENCES "client_related_people"("id","client_id") ON DELETE RESTRICT ON UPDATE RESTRICT;--> statement-breakpoint
ALTER TABLE "proposal_product_details" ADD CONSTRAINT "proposal_product_details_proposal_id_proposals_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "proposal_status_history" ADD CONSTRAINT "proposal_status_history_proposal_id_proposals_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "proposal_status_history" ADD CONSTRAINT "proposal_status_history_changed_by_user_id_users_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_opportunity_id_opportunities_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_recorded_by_user_id_users_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_opportunity_client_fk" FOREIGN KEY ("opportunity_id","client_id") REFERENCES "opportunities"("id","client_id") ON DELETE RESTRICT ON UPDATE RESTRICT;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_quote_opportunity_fk" FOREIGN KEY ("opportunity_id","quote_id") REFERENCES "insurance_quotes"("opportunity_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_proposal_id_proposals_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "policy_coverages" ADD CONSTRAINT "policy_coverages_policy_id_policies_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "policy_endorsement_items" ADD CONSTRAINT "policy_endorsement_items_kpm1r5ic5sJY_fkey" FOREIGN KEY ("endorsement_id") REFERENCES "policy_endorsements"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "policy_endorsements" ADD CONSTRAINT "policy_endorsements_policy_id_policies_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "policy_endorsements" ADD CONSTRAINT "policy_endorsements_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commission_adjustments" ADD CONSTRAINT "commission_adjustments_policy_id_policies_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commission_adjustments" ADD CONSTRAINT "commission_adjustments_endorsement_policy_fk" FOREIGN KEY ("policy_id","endorsement_id") REFERENCES "policy_endorsements"("policy_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commission_adjustments" ADD CONSTRAINT "commission_adjustments_installment_policy_fk" FOREIGN KEY ("policy_id","installment_id") REFERENCES "commission_installments"("policy_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commission_installment_events" ADD CONSTRAINT "commission_installment_events_inst_policy_fk" FOREIGN KEY ("policy_id","installment_id") REFERENCES "commission_installments"("policy_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commission_installment_events" ADD CONSTRAINT "commission_installment_events_endorsement_policy_fk" FOREIGN KEY ("policy_id","endorsement_id") REFERENCES "policy_endorsements"("policy_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commission_installments" ADD CONSTRAINT "commission_installments_schedule_policy_fk" FOREIGN KEY ("policy_id","schedule_id") REFERENCES "commission_schedules"("policy_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commission_receipt_allocations" ADD CONSTRAINT "commission_receipt_allocations_receipt_policy_fk" FOREIGN KEY ("policy_id","receipt_id") REFERENCES "commission_receipts"("policy_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commission_receipt_allocations" ADD CONSTRAINT "commission_receipt_allocations_installment_policy_fk" FOREIGN KEY ("policy_id","installment_id") REFERENCES "commission_installments"("policy_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commission_receipt_allocations" ADD CONSTRAINT "commission_receipt_allocations_adjustment_policy_fk" FOREIGN KEY ("policy_id","adjustment_id") REFERENCES "commission_adjustments"("policy_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commission_receipts" ADD CONSTRAINT "commission_receipts_policy_id_policies_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commission_receipts" ADD CONSTRAINT "commission_receipts_recorded_by_user_id_users_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commission_rule_versions" ADD CONSTRAINT "commission_rule_versions_rule_id_commission_rules_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "commission_rules"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_IsVnbCisPGDs_fkey" FOREIGN KEY ("enterprise_insurer_id") REFERENCES "enterprise_insurers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commission_schedules" ADD CONSTRAINT "commission_schedules_policy_id_policies_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commission_schedules" ADD CONSTRAINT "commission_schedules_wtMePhTv8nSF_fkey" FOREIGN KEY ("rule_version_id") REFERENCES "commission_rule_versions"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "commission_schedules" ADD CONSTRAINT "commission_schedules_endorsement_policy_fk" FOREIGN KEY ("policy_id","endorsement_id") REFERENCES "policy_endorsements"("policy_id","id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "document_files" ADD CONSTRAINT "document_files_uploaded_by_user_id_users_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "document_links" ADD CONSTRAINT "document_links_file_id_document_files_id_fkey" FOREIGN KEY ("file_id") REFERENCES "document_files"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "document_links" ADD CONSTRAINT "document_links_client_id_clients_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "document_links" ADD CONSTRAINT "document_links_opportunity_id_opportunities_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "document_links" ADD CONSTRAINT "document_links_quote_id_insurance_quotes_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "insurance_quotes"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "document_links" ADD CONSTRAINT "document_links_proposal_id_proposals_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "document_links" ADD CONSTRAINT "document_links_policy_id_policies_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "document_links" ADD CONSTRAINT "document_links_endorsement_id_policy_endorsements_id_fkey" FOREIGN KEY ("endorsement_id") REFERENCES "policy_endorsements"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "operation_history" ADD CONSTRAINT "operation_history_actor_user_id_users_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;