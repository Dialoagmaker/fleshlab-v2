-- Phase 5A: additive system administration primitives.
-- Secrets, passwords, password hashes and session tokens are intentionally not
-- represented in any of these operational projections.

ALTER TABLE web_sessions ADD COLUMN IF NOT EXISTS user_agent text;
ALTER TABLE web_sessions ADD COLUMN IF NOT EXISTS ip_address inet;

ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS checksum text;

ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'operational';
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'all';
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS sensitive boolean NOT NULL DEFAULT false;
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS read_only boolean NOT NULL DEFAULT false;

ALTER TABLE v3_audit_events ADD COLUMN IF NOT EXISTS domain text NOT NULL DEFAULT 'v3';
ALTER TABLE v3_audit_events ADD COLUMN IF NOT EXISTS result text NOT NULL DEFAULT 'success';
ALTER TABLE v3_audit_events ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE v3_audit_events ADD COLUMN IF NOT EXISTS ip_address inet;
CREATE INDEX IF NOT EXISTS v3_audit_events_system_idx ON v3_audit_events(domain, action, created_at DESC);

CREATE TABLE IF NOT EXISTS v3_feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  environment text NOT NULL DEFAULT 'all',
  enabled boolean NOT NULL DEFAULT false,
  description text NOT NULL,
  risk_level text NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low','medium','high')),
  updated_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(key, environment)
);
CREATE INDEX IF NOT EXISTS v3_feature_flags_lookup_idx ON v3_feature_flags(environment, key);

CREATE TABLE IF NOT EXISTS v3_integration_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  category text NOT NULL,
  configured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'unknown' CHECK (status IN ('healthy','degraded','unavailable','not_configured','unknown')),
  safe_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  updated_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v3_backup_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type text NOT NULL CHECK (backup_type IN ('database','files','snapshot','other')),
  status text NOT NULL CHECK (status IN ('completed','failed','in_progress','unknown')),
  completed_at timestamptz,
  location_reference text,
  restore_tested boolean NOT NULL DEFAULT false,
  notes text,
  observed_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS v3_backup_records_recent_idx ON v3_backup_records(completed_at DESC NULLS LAST, created_at DESC);

INSERT INTO v3_feature_flags(key,environment,enabled,description,risk_level)
VALUES
  ('v3_rendering_execution','all',false,'Allow external or worker rendering execution after a verified service is configured.','high'),
  ('v3_commerce_execution','all',false,'Allow commerce mutations after provider, webhook and reconciliation controls are verified.','high'),
  ('v3_external_email_delivery','all',false,'Allow outbound delivery through the configured email worker.','medium'),
  ('v3_analytics_reporting','all',false,'Allow external analytics reporting after a verified provider is connected.','low')
ON CONFLICT(key,environment) DO NOTHING;

INSERT INTO v3_integration_status(key,label,category)
VALUES
  ('azure_storage','Azure Storage','storage'),
  ('email_delivery','Email delivery','communications'),
  ('analytics','Analytics provider','analytics'),
  ('payments','Payment providers','commerce'),
  ('external_media','External media services','media'),
  ('rendering','Rendering service','production')
ON CONFLICT(key) DO NOTHING;
