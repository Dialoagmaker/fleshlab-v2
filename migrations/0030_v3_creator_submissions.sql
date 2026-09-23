-- Phase 6B: private creator acquisition, identity verification and paid submissions.
-- This is additive. Original files remain private in the existing Azure container.

ALTER TABLE v3_media_assets ADD COLUMN IF NOT EXISTS parent_asset_id uuid REFERENCES v3_media_assets(id) ON DELETE RESTRICT;
ALTER TABLE v3_payout_profiles ADD COLUMN IF NOT EXISTS private_ciphertext text;
ALTER TABLE v3_payout_profiles ADD COLUMN IF NOT EXISTS private_iv text;
ALTER TABLE v3_payout_profiles ADD COLUMN IF NOT EXISTS private_tag text;

CREATE TABLE IF NOT EXISTS v3_creator_identity_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL UNIQUE REFERENCES v3_creator_records(id) ON DELETE RESTRICT,
  document_kind text,
  age_confirmed boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','submitted','under_review','approved','rejected','resubmission_required')),
  reviewed_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v3_creator_identity_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES v3_creator_identity_verifications(id) ON DELETE RESTRICT,
  creator_id uuid NOT NULL REFERENCES v3_creator_records(id) ON DELETE RESTRICT,
  document_type text NOT NULL CHECK (document_type IN ('id_front','id_back','verification_selfie')),
  object_key text NOT NULL UNIQUE,
  file_name text NOT NULL,
  content_type text NOT NULL,
  expected_byte_size bigint NOT NULL CHECK (expected_byte_size > 0),
  actual_byte_size bigint,
  etag text,
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','uploaded','replaced','rejected')),
  document_version integer NOT NULL DEFAULT 1,
  replaced_document_id uuid REFERENCES v3_creator_identity_documents(id) ON DELETE RESTRICT,
  uploaded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS v3_identity_documents_creator_idx ON v3_creator_identity_documents(creator_id,document_type,created_at DESC);

CREATE TABLE IF NOT EXISTS v3_creator_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES v3_creator_records(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','uploading','processing','submitted','under_review','action_required','approved','rejected','ready_for_payout','payout_processing','paid','cancelled')),
  original_runtime_seconds integer,
  verified_runtime_seconds integer,
  approved_runtime_seconds integer,
  base_rate_minor_per_minute integer NOT NULL DEFAULT 100 CHECK (base_rate_minor_per_minute=100),
  base_value_minor bigint NOT NULL DEFAULT 0,
  adjustment_total_minor bigint NOT NULL DEFAULT 0,
  approved_payout_minor bigint,
  currency char(3) NOT NULL DEFAULT 'USD',
  rights_confirmed boolean NOT NULL DEFAULT false,
  consent_confirmed boolean NOT NULL DEFAULT false,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  approved_at timestamptz,
  reviewed_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  rejection_reason text,
  idempotency_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS v3_creator_submissions_creator_idx ON v3_creator_submissions(creator_id,created_at DESC);
CREATE INDEX IF NOT EXISTS v3_creator_submissions_status_idx ON v3_creator_submissions(status,updated_at DESC);

CREATE TABLE IF NOT EXISTS v3_creator_submission_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES v3_creator_submissions(id) ON DELETE RESTRICT,
  media_asset_id uuid REFERENCES v3_media_assets(id) ON DELETE RESTRICT,
  asset_type text NOT NULL CHECK (asset_type IN ('original_video','thumbnail','review_preview','release')),
  object_key text NOT NULL UNIQUE,
  file_name text NOT NULL,
  content_type text NOT NULL,
  expected_byte_size bigint NOT NULL CHECK (expected_byte_size > 0),
  actual_byte_size bigint,
  etag text,
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','uploaded','processing','ready','failed','rejected')),
  technical_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(submission_id,asset_type)
);

CREATE TABLE IF NOT EXISTS v3_creator_submission_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES v3_creator_submissions(id) ON DELETE RESTRICT,
  creator_id uuid REFERENCES v3_creator_records(id) ON DELETE RESTRICT,
  display_name text NOT NULL,
  relationship_to_submission text,
  age_confirmed boolean NOT NULL DEFAULT false,
  consent_confirmed boolean NOT NULL DEFAULT false,
  release_asset_id uuid REFERENCES v3_creator_submission_assets(id) ON DELETE RESTRICT,
  verification_status text NOT NULL DEFAULT 'required' CHECK (verification_status IN ('required','submitted','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS v3_submission_participants_submission_idx ON v3_creator_submission_participants(submission_id);

CREATE TABLE IF NOT EXISTS v3_creator_submission_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES v3_creator_submissions(id) ON DELETE RESTRICT,
  reviewer_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  outcome text NOT NULL CHECK (outcome IN ('approved','rejected','action_required')),
  approved_runtime_seconds integer,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v3_creator_submission_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES v3_creator_submissions(id) ON DELETE RESTRICT,
  adjustment_code text NOT NULL CHECK (adjustment_code IN ('unusable_footage','severe_blur','insufficient_lighting','corrupted_video_audio','duplicate_content','unapproved_sections','missing_rights_segment','excessive_unusable_sections','technical_quality_reduction')),
  amount_minor bigint NOT NULL CHECK (amount_minor <= 0),
  reason text NOT NULL CHECK (length(reason) > 0),
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS v3_submission_adjustments_submission_idx ON v3_creator_submission_adjustments(submission_id,created_at DESC);

CREATE TABLE IF NOT EXISTS v3_creator_submission_payouts (
  submission_id uuid PRIMARY KEY REFERENCES v3_creator_submissions(id) ON DELETE RESTRICT,
  ledger_entry_id uuid UNIQUE REFERENCES v3_earnings_ledger(id) ON DELETE RESTRICT,
  payout_request_id uuid UNIQUE REFERENCES v3_payout_requests(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v3_payout_method_configs (
  method text PRIMARY KEY CHECK (method IN ('gcash','paypal','bank_transfer','other')),
  enabled boolean NOT NULL DEFAULT false,
  label text NOT NULL,
  updated_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO v3_payout_method_configs(method,enabled,label) VALUES
  ('gcash',false,'GCash'),('paypal',false,'PayPal'),('bank_transfer',false,'Bank transfer'),('other',false,'Other approved method')
ON CONFLICT(method) DO NOTHING;

INSERT INTO v3_feature_flags(key,environment,enabled,description,risk_level)
VALUES ('v3_creator_submissions','all',true,'Enable private creator identity verification and video submission operations.','high')
ON CONFLICT(key,environment) DO NOTHING;
