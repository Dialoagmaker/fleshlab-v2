CREATE TABLE IF NOT EXISTS admin_rendering_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id text,
  provider_id text,
  status text NOT NULL DEFAULT 'queued',
  output_reference text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES app_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_qa_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id text, performer_id text, video_id text,
  severity text NOT NULL DEFAULT 'info', status text NOT NULL DEFAULT 'open',
  decision text, reviewer_notes text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES app_users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_studio_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL DEFAULT 'catalogue', status text NOT NULL DEFAULT 'open', severity text NOT NULL DEFAULT 'info',
  findings jsonb NOT NULL DEFAULT '[]'::jsonb, notes text, created_by uuid REFERENCES app_users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), asset_id text, performer_id text, video_id text,
  status text NOT NULL DEFAULT 'pending', evidence jsonb NOT NULL DEFAULT '[]'::jsonb, review_due_at timestamptz,
  reviewer_notes text, created_by uuid REFERENCES app_users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_provider_readiness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider_name text NOT NULL, status text NOT NULL DEFAULT 'unknown',
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb, notes text, created_by uuid REFERENCES app_users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, enabled boolean NOT NULL DEFAULT false,
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb, conditions jsonb NOT NULL DEFAULT '[]'::jsonb, actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_status text, last_run_at timestamptz, created_by uuid REFERENCES app_users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_settings (
  key text PRIMARY KEY, value jsonb NOT NULL DEFAULT '{}'::jsonb, updated_by uuid REFERENCES app_users(id), updated_at timestamptz NOT NULL DEFAULT now()
);
