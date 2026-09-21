ALTER TABLE v3_contract_instances DROP CONSTRAINT IF EXISTS v3_contract_instances_status_check;
ALTER TABLE v3_contract_instances ADD CONSTRAINT v3_contract_instances_status_check
  CHECK (status IN ('internal_draft','ready_for_review','assigned','viewed','signed','cancelled','superseded','legacy_imported'));
ALTER TABLE v3_contract_instances ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES v3_contract_templates(id) ON DELETE RESTRICT;
ALTER TABLE v3_contract_instances ADD COLUMN IF NOT EXISTS performer_legacy_id text REFERENCES catalog_performers(legacy_id) ON DELETE RESTRICT;
ALTER TABLE v3_contract_instances ADD COLUMN IF NOT EXISTS effective_date date;
ALTER TABLE v3_contract_instances ADD COLUMN IF NOT EXISTS variables jsonb NOT NULL DEFAULT '{}'::jsonb;
