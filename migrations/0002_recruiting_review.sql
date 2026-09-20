ALTER TABLE performer_applications ADD COLUMN IF NOT EXISTS admin_notes jsonb;
ALTER TABLE performer_profiles ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES app_users(id) ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS performer_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL UNIQUE REFERENCES performer_applications(id) ON DELETE RESTRICT,
  template_version text NOT NULL,
  status text NOT NULL CHECK (status IN ('signed','void')),
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
