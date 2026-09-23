-- Phase 5C: additive Commerce operations. No historical financial rows are created.

CREATE TABLE IF NOT EXISTS v3_commerce_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
  currency char(3) NOT NULL,
  interval text NOT NULL CHECK (interval IN ('one_time','week','month','year')),
  active boolean NOT NULL DEFAULT false,
  provider text,
  provider_price_ref text,
  effective_from timestamptz,
  effective_until timestamptz,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE v3_commerce_subscriptions ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES v3_commerce_plans(id) ON DELETE RESTRICT;
ALTER TABLE v3_commerce_subscriptions ADD COLUMN IF NOT EXISTS plan_key text;
ALTER TABLE v3_commerce_subscriptions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES app_users(id) ON DELETE RESTRICT;
ALTER TABLE v3_commerce_subscriptions ADD COLUMN IF NOT EXISTS amount_minor bigint;
ALTER TABLE v3_commerce_subscriptions ADD COLUMN IF NOT EXISTS currency char(3);
ALTER TABLE v3_commerce_subscriptions ADD COLUMN IF NOT EXISTS current_period_start timestamptz;
ALTER TABLE v3_commerce_subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;
ALTER TABLE v3_commerce_subscriptions ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE v3_commerce_subscriptions ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE v3_commerce_subscriptions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE v3_commerce_subscriptions DROP CONSTRAINT IF EXISTS v3_commerce_subscriptions_status_check;
ALTER TABLE v3_commerce_subscriptions ADD CONSTRAINT v3_commerce_subscriptions_status_check CHECK (status IN ('created','inactive','trialing','active','paused','past_due','failed','cancelled','expired'));

ALTER TABLE v3_commerce_payment_intents ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES v3_commerce_customers(id) ON DELETE RESTRICT;
ALTER TABLE v3_commerce_payment_intents ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES v3_commerce_subscriptions(id) ON DELETE RESTRICT;
ALTER TABLE v3_commerce_payment_intents ADD COLUMN IF NOT EXISTS failure_reason text;
ALTER TABLE v3_commerce_payment_intents ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE v3_commerce_payment_intents DROP CONSTRAINT IF EXISTS v3_commerce_payment_intents_status_check;
ALTER TABLE v3_commerce_payment_intents ADD CONSTRAINT v3_commerce_payment_intents_status_check CHECK (status IN ('created','initiated','pending','processing','succeeded','failed','cancelled'));

ALTER TABLE v3_commerce_payments ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES v3_commerce_customers(id) ON DELETE RESTRICT;
ALTER TABLE v3_commerce_payments ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES v3_commerce_subscriptions(id) ON DELETE RESTRICT;
ALTER TABLE v3_commerce_payments ADD COLUMN IF NOT EXISTS failure_reason text;
ALTER TABLE v3_commerce_payments ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE v3_commerce_payments ADD COLUMN IF NOT EXISTS refunded_at timestamptz;
ALTER TABLE v3_commerce_payments ADD COLUMN IF NOT EXISTS disputed_at timestamptz;
ALTER TABLE v3_commerce_payments ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;
ALTER TABLE v3_commerce_payments DROP CONSTRAINT IF EXISTS v3_commerce_payments_status_check;
ALTER TABLE v3_commerce_payments ADD CONSTRAINT v3_commerce_payments_status_check CHECK (status IN ('initiated','pending','succeeded','failed','refunded','disputed','cancelled'));

ALTER TABLE v3_commerce_provider_events ADD COLUMN IF NOT EXISTS event_type text;
ALTER TABLE v3_commerce_provider_events ADD COLUMN IF NOT EXISTS payload jsonb;
ALTER TABLE v3_commerce_provider_events ADD COLUMN IF NOT EXISTS processed_at timestamptz;
ALTER TABLE v3_commerce_provider_events ADD COLUMN IF NOT EXISTS processing_result text;
ALTER TABLE v3_commerce_provider_events ADD COLUMN IF NOT EXISTS processing_error text;
ALTER TABLE v3_commerce_provider_events DROP CONSTRAINT IF EXISTS v3_commerce_provider_events_status_check;
ALTER TABLE v3_commerce_provider_events ADD CONSTRAINT v3_commerce_provider_events_status_check CHECK (status IN ('received','processed','ignored','failed','duplicate'));

ALTER TABLE v3_commerce_wallets ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES v3_creator_records(id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX IF NOT EXISTS v3_commerce_wallets_creator_unique ON v3_commerce_wallets(creator_id) WHERE creator_id IS NOT NULL;

ALTER TABLE v3_earnings_ledger ADD COLUMN IF NOT EXISTS adjustment_of uuid REFERENCES v3_earnings_ledger(id) ON DELETE RESTRICT;
ALTER TABLE v3_earnings_ledger ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;
ALTER TABLE v3_earnings_ledger ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE v3_earnings_ledger ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES app_users(id) ON DELETE SET NULL;

ALTER TABLE v3_compensation_settlements ADD COLUMN IF NOT EXISTS currency char(3) NOT NULL DEFAULT 'USD';
ALTER TABLE v3_compensation_settlements ADD COLUMN IF NOT EXISTS reviewer_id uuid REFERENCES app_users(id) ON DELETE SET NULL;
ALTER TABLE v3_compensation_settlements ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE v3_compensation_settlements ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES app_users(id) ON DELETE SET NULL;
ALTER TABLE v3_compensation_settlements ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE v3_compensation_settlements ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE v3_compensation_settlements ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;
ALTER TABLE v3_compensation_settlements DROP CONSTRAINT IF EXISTS v3_compensation_settlements_status_check;
ALTER TABLE v3_compensation_settlements ADD CONSTRAINT v3_compensation_settlements_status_check CHECK (status IN ('open','calculated','reviewed','approved','payable','paid','cancelled','reversed'));

ALTER TABLE v3_payout_requests ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;
ALTER TABLE v3_payout_requests ADD COLUMN IF NOT EXISTS reviewer_id uuid REFERENCES app_users(id) ON DELETE SET NULL;
ALTER TABLE v3_payout_requests ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE v3_payout_requests ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES app_users(id) ON DELETE SET NULL;
ALTER TABLE v3_payout_requests ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE v3_payout_requests ADD COLUMN IF NOT EXISTS processed_by uuid REFERENCES app_users(id) ON DELETE SET NULL;
ALTER TABLE v3_payout_requests ADD COLUMN IF NOT EXISTS processed_at timestamptz;
ALTER TABLE v3_payout_requests ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE v3_payout_requests ADD COLUMN IF NOT EXISTS provider_payout_ref text;
ALTER TABLE v3_payout_requests ADD COLUMN IF NOT EXISTS failure_reason text;
ALTER TABLE v3_payout_requests DROP CONSTRAINT IF EXISTS v3_payout_requests_status_check;
ALTER TABLE v3_payout_requests ADD CONSTRAINT v3_payout_requests_status_check CHECK (status IN ('disabled','requested','under_review','approved','processing','paid','failed','rejected','cancelled'));

CREATE TABLE IF NOT EXISTS v3_payout_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL UNIQUE REFERENCES v3_creator_records(id) ON DELETE RESTRICT,
  method text NOT NULL CHECK (method IN ('paypal','bank_transfer','gcash','other')),
  account_last4 text,
  provider_customer_ref text,
  status text NOT NULL DEFAULT 'missing' CHECK (status IN ('missing','pending_review','verified','disabled')),
  safe_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v3_commerce_reconciliation_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL CHECK (domain IN ('payment','subscription','settlement','payout','provider_event')),
  provider text,
  local_reference text,
  provider_reference text,
  state text NOT NULL CHECK (state IN ('matched','missing_local','missing_provider','amount_mismatch','currency_mismatch','status_mismatch','orphan_event','needs_review')),
  local_amount_minor bigint,
  provider_amount_minor bigint,
  currency char(3),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewed_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(domain,provider,local_reference,provider_reference)
);

CREATE INDEX IF NOT EXISTS v3_commerce_subscriptions_status_idx ON v3_commerce_subscriptions(status,updated_at DESC);
CREATE INDEX IF NOT EXISTS v3_commerce_payments_status_idx ON v3_commerce_payments(status,created_at DESC);
CREATE INDEX IF NOT EXISTS v3_commerce_provider_events_processing_idx ON v3_commerce_provider_events(status,received_at DESC);
CREATE INDEX IF NOT EXISTS v3_payout_requests_status_idx ON v3_payout_requests(status,created_at DESC);
CREATE INDEX IF NOT EXISTS v3_commerce_reconciliation_state_idx ON v3_commerce_reconciliation_records(state,created_at DESC);

CREATE OR REPLACE FUNCTION v3_earnings_ledger_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'v3_earnings_ledger is immutable; use an adjustment entry';
END;
$$;
DROP TRIGGER IF EXISTS v3_earnings_ledger_immutable_guard ON v3_earnings_ledger;
CREATE TRIGGER v3_earnings_ledger_immutable_guard
  BEFORE UPDATE OR DELETE ON v3_earnings_ledger
  FOR EACH ROW EXECUTE FUNCTION v3_earnings_ledger_immutable();

INSERT INTO v3_integration_status(key,label,category,configured,status,safe_metadata)
VALUES ('payments','Payment providers','commerce',false,'not_configured','{"execution_enabled":false}'::jsonb)
ON CONFLICT(key) DO UPDATE SET configured=false,status='not_configured',safe_metadata=v3_integration_status.safe_metadata || '{"execution_enabled":false}'::jsonb,updated_at=now();

INSERT INTO v3_feature_flags(key,environment,enabled,description,risk_level)
VALUES ('v3_commerce_execution','all',false,'Allow provider-backed commerce execution only after credentials, webhook verification, idempotency and reconciliation are proven.','high')
ON CONFLICT(key,environment) DO UPDATE SET enabled=false,updated_at=now();
