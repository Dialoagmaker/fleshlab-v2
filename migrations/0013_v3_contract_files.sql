CREATE TABLE IF NOT EXISTS v3_contract_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES v3_contract_instances(id) ON DELETE RESTRICT,
  signer_role text NOT NULL CHECK (signer_role IN ('studio','creator')),
  signer_user_id uuid REFERENCES app_users(id) ON DELETE RESTRICT,
  signature_reference text,
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(contract_id, signer_role)
);
CREATE TABLE IF NOT EXISTS v3_contract_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES v3_contract_instances(id) ON DELETE RESTRICT,
  attachment_type text NOT NULL CHECK (attachment_type IN ('rendered_snapshot','legacy_original','evidence')),
  object_key text NOT NULL,
  content_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
