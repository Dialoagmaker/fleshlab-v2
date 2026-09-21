-- V3 Creator domain.  These records add an operational projection over the
-- canonical recruiting and catalogue tables; they never rewrite source data.
CREATE TABLE IF NOT EXISTS v3_creator_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL UNIQUE REFERENCES performer_applications(id) ON DELETE RESTRICT,
  performer_profile_id uuid UNIQUE REFERENCES performer_profiles(id) ON DELETE RESTRICT,
  user_id uuid UNIQUE REFERENCES app_users(id) ON DELETE RESTRICT,
  lifecycle text NOT NULL DEFAULT 'onboarding' CHECK (lifecycle IN ('onboarding','active','inactive','blocked')),
  private_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v3_creator_performer_links (
  creator_id uuid NOT NULL REFERENCES v3_creator_records(id) ON DELETE RESTRICT,
  performer_legacy_id text NOT NULL REFERENCES catalog_performers(legacy_id) ON DELETE RESTRICT,
  linked_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  linked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (creator_id, performer_legacy_id)
);

CREATE TABLE IF NOT EXISTS v3_creator_onboarding_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES v3_creator_records(id) ON DELETE RESTRICT,
  requirement_key text NOT NULL CHECK (requirement_key IN ('profile','private_upload','contract','account_link')),
  state text NOT NULL DEFAULT 'needs_review' CHECK (state IN ('complete','incomplete','needs_review','blocked')),
  note text,
  reviewed_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creator_id, requirement_key)
);

CREATE TABLE IF NOT EXISTS v3_creator_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES v3_creator_records(id) ON DELETE RESTRICT,
  application_upload_id uuid NOT NULL UNIQUE REFERENCES application_uploads(id) ON DELETE RESTRICT,
  document_type text NOT NULL,
  classification text NOT NULL DEFAULT 'creator_private' CHECK (classification IN ('creator_private','admin_internal')),
  review_state text NOT NULL DEFAULT 'needs_review' CHECK (review_state IN ('needs_review','accepted','rejected')),
  reviewer_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  expires_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v3_creator_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES v3_creator_records(id) ON DELETE RESTRICT,
  performer_contract_id uuid NOT NULL UNIQUE REFERENCES performer_contracts(id) ON DELETE RESTRICT,
  lifecycle text NOT NULL CHECK (lifecycle IN ('signed','cancelled')),
  template_version text NOT NULL,
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v3_creator_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES v3_creator_records(id) ON DELETE RESTRICT,
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  action_path text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS v3_creator_records_user_idx ON v3_creator_records(user_id);
CREATE INDEX IF NOT EXISTS v3_creator_records_lifecycle_idx ON v3_creator_records(lifecycle, updated_at DESC);
CREATE INDEX IF NOT EXISTS v3_creator_documents_creator_idx ON v3_creator_documents(creator_id, review_state, created_at DESC);
CREATE INDEX IF NOT EXISTS v3_creator_contracts_creator_idx ON v3_creator_contracts(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS v3_creator_notifications_creator_idx ON v3_creator_notifications(creator_id, read_at, created_at DESC);

-- Backfill only existing factual relationships: approved-profile records,
-- confirmed uploads and existing contract records.  No creator, document or
-- signature is invented by this migration.
INSERT INTO v3_creator_records(application_id, performer_profile_id, user_id, lifecycle)
SELECT p.application_id, p.id, p.user_id,
       CASE WHEN p.status='active' THEN 'active' WHEN p.status='inactive' THEN 'inactive' ELSE 'onboarding' END
FROM performer_profiles p
ON CONFLICT(application_id) DO UPDATE SET
  performer_profile_id=EXCLUDED.performer_profile_id,
  user_id=COALESCE(v3_creator_records.user_id, EXCLUDED.user_id),
  updated_at=now();

INSERT INTO v3_creator_onboarding_items(creator_id,requirement_key,state,note)
SELECT c.id, req.key,
  CASE
    WHEN req.key='profile' AND a.full_name<>'' AND a.country<>'' THEN 'complete'
    WHEN req.key='private_upload' AND EXISTS (SELECT 1 FROM application_uploads u WHERE u.application_id=a.id AND u.status='confirmed') THEN 'needs_review'
    WHEN req.key='contract' AND EXISTS (SELECT 1 FROM performer_contracts pc WHERE pc.application_id=a.id AND pc.status='signed') THEN 'complete'
    WHEN req.key='account_link' AND c.user_id IS NOT NULL THEN 'complete'
    ELSE 'incomplete'
  END,
  CASE WHEN req.key='private_upload' THEN 'Confirmed private uploads require an admin review before completion.' ELSE NULL END
FROM v3_creator_records c
JOIN performer_applications a ON a.id=c.application_id
CROSS JOIN (VALUES ('profile'),('private_upload'),('contract'),('account_link')) AS req(key)
ON CONFLICT(creator_id,requirement_key) DO NOTHING;

INSERT INTO v3_creator_documents(creator_id,application_upload_id,document_type)
SELECT c.id,u.id,COALESCE(u.content_type,'other')
FROM v3_creator_records c
JOIN application_uploads u ON u.application_id=c.application_id
WHERE u.status='confirmed'
ON CONFLICT(application_upload_id) DO NOTHING;

INSERT INTO v3_creator_contracts(creator_id,performer_contract_id,lifecycle,template_version,signed_at)
SELECT c.id,pc.id,CASE WHEN pc.status='signed' THEN 'signed' ELSE 'cancelled' END,pc.template_version,pc.signed_at
FROM v3_creator_records c
JOIN performer_contracts pc ON pc.application_id=c.application_id
ON CONFLICT(performer_contract_id) DO NOTHING;
