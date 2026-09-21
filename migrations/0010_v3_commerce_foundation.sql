-- V3 Commerce foundation.  This establishes empty, constrained ledgers for
-- future provider-backed data.  It deliberately imports no financial history
-- and exposes no financial mutation endpoint.
CREATE TABLE IF NOT EXISTS v3_commerce_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES app_users(id) ON DELETE RESTRICT,
  external_reference text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS v3_commerce_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid NOT NULL REFERENCES v3_commerce_customers(id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('draft','pending','paid','cancelled','refunded')), currency text NOT NULL, total_minor bigint NOT NULL CHECK(total_minor>=0), idempotency_key text UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS v3_commerce_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid NOT NULL REFERENCES v3_commerce_customers(id) ON DELETE RESTRICT,
  provider text NOT NULL, provider_subscription_id text NOT NULL, status text NOT NULL, current_period_end timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(provider,provider_subscription_id)
);
CREATE TABLE IF NOT EXISTS v3_commerce_payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid REFERENCES v3_commerce_orders(id) ON DELETE RESTRICT,
  provider text NOT NULL, provider_intent_id text NOT NULL, status text NOT NULL, amount_minor bigint NOT NULL CHECK(amount_minor>=0), currency text NOT NULL, idempotency_key text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(provider,provider_intent_id)
);
CREATE TABLE IF NOT EXISTS v3_commerce_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), payment_intent_id uuid NOT NULL REFERENCES v3_commerce_payment_intents(id) ON DELETE RESTRICT,
  provider text NOT NULL, provider_payment_id text NOT NULL, status text NOT NULL, amount_minor bigint NOT NULL CHECK(amount_minor>=0), currency text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(provider,provider_payment_id)
);
CREATE TABLE IF NOT EXISTS v3_commerce_provider_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider text NOT NULL, provider_event_id text NOT NULL, received_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz, status text NOT NULL DEFAULT 'received', payload_hash text NOT NULL, UNIQUE(provider,provider_event_id)
);
CREATE TABLE IF NOT EXISTS v3_commerce_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid NOT NULL UNIQUE REFERENCES v3_commerce_customers(id) ON DELETE RESTRICT, currency text NOT NULL, status text NOT NULL DEFAULT 'inactive' CHECK(status IN ('inactive','active','locked')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS v3_commerce_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), wallet_id uuid NOT NULL REFERENCES v3_commerce_wallets(id) ON DELETE RESTRICT, direction text NOT NULL CHECK(direction IN ('credit','debit')), amount_minor bigint NOT NULL CHECK(amount_minor>0), currency text NOT NULL, reference_type text NOT NULL, reference_id text NOT NULL, idempotency_key text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS v3_creator_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), creator_id uuid NOT NULL REFERENCES v3_creator_records(id) ON DELETE RESTRICT, currency text NOT NULL, amount_minor bigint NOT NULL, source_type text NOT NULL, source_id text NOT NULL, status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(source_type,source_id,creator_id)
);
CREATE TABLE IF NOT EXISTS v3_payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), creator_id uuid NOT NULL REFERENCES v3_creator_records(id) ON DELETE RESTRICT, currency text NOT NULL, amount_minor bigint NOT NULL CHECK(amount_minor>0), status text NOT NULL DEFAULT 'disabled' CHECK(status IN ('disabled','requested','approved','paid','rejected')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS v3_payout_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), status text NOT NULL DEFAULT 'disabled' CHECK(status IN ('disabled','draft','approved','paid','cancelled')), created_at timestamptz NOT NULL DEFAULT now()
);
