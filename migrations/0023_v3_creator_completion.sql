-- Phase 3 creator completion. Additive and V2-compatible.
CREATE TABLE IF NOT EXISTS v3_creator_profiles (
  creator_id uuid PRIMARY KEY REFERENCES v3_creator_records(id) ON DELETE RESTRICT,
  preferred_name text,
  contact_email text,
  contact_phone text,
  locale text,
  timezone text,
  notification_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE v3_creator_documents ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE v3_creator_documents ADD COLUMN IF NOT EXISTS replaced_document_id uuid REFERENCES v3_creator_documents(id) ON DELETE RESTRICT;
ALTER TABLE v3_creator_notifications ADD COLUMN IF NOT EXISTS action_state text NOT NULL DEFAULT 'open';
ALTER TABLE v3_creator_notifications ADD COLUMN IF NOT EXISTS completed_at timestamptz;
CREATE INDEX IF NOT EXISTS v3_creator_documents_version_idx ON v3_creator_documents(creator_id, document_type, version DESC);
CREATE INDEX IF NOT EXISTS v3_creator_notifications_action_idx ON v3_creator_notifications(creator_id, action_state, created_at DESC);
INSERT INTO v3_creator_profiles(creator_id,preferred_name,locale,timezone)
SELECT id,private_profile->>'preferred_name',private_profile->>'locale',private_profile->>'timezone'
FROM v3_creator_records
ON CONFLICT(creator_id) DO NOTHING;
