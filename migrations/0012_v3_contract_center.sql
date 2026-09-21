CREATE TABLE IF NOT EXISTS v3_contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  contract_type text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'legal_review_required' CHECK (status IN ('draft','legal_review_required','approved','retired')),
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS v3_contract_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES v3_contract_templates(id) ON DELETE RESTRICT,
  version text NOT NULL,
  body text NOT NULL,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  body_hash text NOT NULL,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(template_id, version)
);
CREATE TABLE IF NOT EXISTS v3_contract_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_version_id uuid REFERENCES v3_contract_template_versions(id) ON DELETE RESTRICT,
  creator_id uuid REFERENCES v3_creator_records(id) ON DELETE RESTRICT,
  contract_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','viewed','signed','cancelled','superseded','legacy_imported')),
  rendered_snapshot text NOT NULL,
  snapshot_hash text NOT NULL,
  creator_legal_name text,
  performer_name text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  viewed_at timestamptz,
  signed_at timestamptz,
  source text NOT NULL DEFAULT 'v3_template',
  legacy_contract_date date,
  legacy_file_hash text,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS v3_contract_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES v3_contract_instances(id) ON DELETE RESTRICT,
  template_id uuid REFERENCES v3_contract_templates(id) ON DELETE RESTRICT,
  actor_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS v3_contract_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO v3_contract_settings(key,value) VALUES ('contract_signing_enabled','false'::jsonb)
ON CONFLICT(key) DO NOTHING;

INSERT INTO v3_contract_templates(template_key,contract_type,title,status) VALUES
('performer_services','performer_services_agreement','Performer Services Agreement','legal_review_required'),
('content_rights_release','content_rights_performer_release','Content Rights & Performer Release','legal_review_required'),
('consent_standards','consent_production_standards','Consent & Production Standards','legal_review_required'),
('confidentiality_data','confidentiality_data_protection','Confidentiality & Data Protection Agreement','legal_review_required'),
('compensation_schedule','compensation_schedule','Compensation Schedule','legal_review_required'),
('management_optional','management_agreement','Optional Management Agreement','legal_review_required')
ON CONFLICT(template_key) DO NOTHING;

INSERT INTO v3_contract_template_versions(template_id,version,body,sections,variables,body_hash)
SELECT id,'1.0',
  'FLESHLAB STUDIOS\nA division of Dialogmakers International Ltd.\n\nPARTIES\nFLESHLAB Studios, a division of Dialogmakers International Ltd., Company No. 83273694, Taiwan.\n\nROLE\nIndependent Contractor. Adult performers/models only. Minimum age 18.\n\nTERMS\nThis draft contains structured business terms and remains LEGAL_REVIEW_REQUIRED. The precise net revenue basis, rights structure, consent wording, termination and governing-law language require counsel approval.\n\nCOMPENSATION\nThe proposed schedule is 30% performer / 70% studio in USD, subject to a legally defined compensation basis and approval.\n\nSIGNATURE READINESS\nSigning is disabled until this template is approved and contract_signing_enabled is enabled.',
  '["Parties","Role","Terms","Compensation","Signature readiness"]'::jsonb,
  '["company_legal_name","company_address","company_number","creator_legal_name","performer_name","contract_number","effective_date","compensation_plan","payment_cycle","license_term","territory","governing_law"]'::jsonb,
  encode(digest('FLESHLAB STUDIOS\nA division of Dialogmakers International Ltd.\n\nPARTIES\nFLESHLAB Studios, a division of Dialogmakers International Ltd., Company No. 83273694, Taiwan.\n\nROLE\nIndependent Contractor. Adult performers/models only. Minimum age 18.\n\nTERMS\nThis draft contains structured business terms and remains LEGAL_REVIEW_REQUIRED. The precise net revenue basis, rights structure, consent wording, termination and governing-law language require counsel approval.\n\nCOMPENSATION\nThe proposed schedule is 30% performer / 70% studio in USD, subject to a legally defined compensation basis and approval.\n\nSIGNATURE READINESS\nSigning is disabled until this template is approved and contract_signing_enabled is enabled.','sha256'),'hex')
FROM v3_contract_templates WHERE template_key='performer_services'
ON CONFLICT(template_id,version) DO NOTHING;

WITH drafts AS (
  SELECT id, title, title || E'\n\nFLESHLAB STUDIOS\nA division of Dialogmakers International Ltd.\n\nThis structured draft is LEGAL_REVIEW_REQUIRED. Final rights, consent, compensation, confidentiality and dispute language require legal approval.' AS body
  FROM v3_contract_templates WHERE template_key <> 'performer_services'
)
INSERT INTO v3_contract_template_versions(template_id,version,body,sections,variables,body_hash)
SELECT id,'1.0',body,'["Parties","Terms","Legal review","Signatures"]'::jsonb,
  '["company_legal_name","company_address","company_number","creator_legal_name","performer_name","contract_number","effective_date"]'::jsonb,
  encode(digest(body,'sha256'),'hex') FROM drafts
ON CONFLICT(template_id,version) DO NOTHING;
