CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','performer','staff','admin')),
  account_status text NOT NULL DEFAULT 'active' CHECK (account_status IN ('active','disabled','pending_reset')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS web_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS web_sessions_active_idx ON web_sessions (token_hash, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  rate_key text NOT NULL,
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  PRIMARY KEY(rate_key, window_start)
);

CREATE TABLE IF NOT EXISTS account_action_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  purpose text NOT NULL CHECK (purpose IN ('verify_email','reset_password')),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS account_action_tokens_lookup_idx ON account_action_tokens (token_hash, purpose, expires_at) WHERE consumed_at IS NULL;

CREATE TABLE IF NOT EXISTS outbound_email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  template text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed')),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE TABLE IF NOT EXISTS performer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  country text NOT NULL,
  age_confirmed boolean NOT NULL DEFAULT false,
  consent_confirmed boolean NOT NULL DEFAULT false,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','under_review','approved','rejected')),
  idempotency_key text NOT NULL UNIQUE,
  continuation_token_hash text NOT NULL UNIQUE,
  continuation_expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS performer_applications_admin_search_idx ON performer_applications (status, created_at DESC, email);

CREATE TABLE IF NOT EXISTS application_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES performer_applications(id) ON DELETE RESTRICT,
  upload_session_hash text NOT NULL,
  object_key text NOT NULL UNIQUE,
  file_name text NOT NULL,
  content_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size > 0),
  status text NOT NULL CHECK (status IN ('issued','confirmed','rejected')),
  write_expires_at timestamptz NOT NULL,
  confirmed_at timestamptz,
  etag text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS application_uploads_application_idx ON application_uploads (application_id, created_at);
CREATE INDEX IF NOT EXISTS application_uploads_session_idx ON application_uploads (upload_session_hash, created_at);

CREATE TABLE IF NOT EXISTS application_upload_sessions (
  session_hash text PRIMARY KEY,
  application_id uuid REFERENCES performer_applications(id) ON DELETE RESTRICT,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS performer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL UNIQUE REFERENCES performer_applications(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending_contract' CHECK (status IN ('pending_contract','active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now()
);
