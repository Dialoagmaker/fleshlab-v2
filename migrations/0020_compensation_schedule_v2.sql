CREATE TABLE IF NOT EXISTS v3_compensation_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  version text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','legal_review_required','active','retired')),
  performer_share_percentage numeric(5,2) NOT NULL CHECK (performer_share_percentage >= 0 AND performer_share_percentage <= 100),
  studio_share_percentage numeric(5,2) NOT NULL CHECK (studio_share_percentage >= 0 AND studio_share_percentage <= 100),
  currency char(3) NOT NULL DEFAULT 'USD',
  minimum_payout_minor bigint NOT NULL DEFAULT 5000 CHECK (minimum_payout_minor >= 0),
  recorded_settlement_frequency text NOT NULL DEFAULT 'monthly',
  live_settlement_frequency text NOT NULL DEFAULT '14_days',
  payout_days smallint[] NOT NULL DEFAULT ARRAY[5,20],
  provider_fee_policy text NOT NULL DEFAULT 'studio_borne',
  platform_fee_policy text NOT NULL DEFAULT 'studio_borne',
  production_cost_policy text NOT NULL DEFAULT 'studio_borne',
  refund_policy text NOT NULL DEFAULT 'legal_review_required',
  chargeback_policy text NOT NULL DEFAULT 'legal_review_required',
  effective_from date,
  effective_until date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(name,version),
  CHECK (performer_share_percentage + studio_share_percentage = 100)
);
CREATE TABLE IF NOT EXISTS v3_compensation_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES v3_compensation_plans(id) ON DELETE RESTRICT,
  creator_id uuid REFERENCES v3_creator_records(id) ON DELETE RESTRICT,
  performer_legacy_id text REFERENCES catalog_performers(legacy_id) ON DELETE RESTRICT,
  contract_instance_id uuid REFERENCES v3_contract_instances(id) ON DELETE RESTRICT,
  effective_from date NOT NULL,
  effective_until date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS v3_compensation_assignments_performer_idx ON v3_compensation_assignments(performer_legacy_id,effective_from DESC);
CREATE TABLE IF NOT EXISTS v3_earnings_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('revenue_event','adjustment','performer_earning','carry_forward','payout','reversal')),
  source_type text NOT NULL,
  source_reference text NOT NULL,
  performer_legacy_id text REFERENCES catalog_performers(legacy_id) ON DELETE RESTRICT,
  creator_id uuid REFERENCES v3_creator_records(id) ON DELETE RESTRICT,
  content_legacy_id text REFERENCES catalog_videos(legacy_id) ON DELETE RESTRICT,
  production_id text,
  original_currency char(3) NOT NULL,
  original_amount_minor bigint NOT NULL,
  conversion_rate numeric(20,10),
  conversion_method text,
  converted_usd_amount_minor bigint NOT NULL,
  eligible_revenue_minor bigint NOT NULL DEFAULT 0,
  revenue_share_base_minor bigint NOT NULL DEFAULT 0,
  performer_share_percentage numeric(5,2) NOT NULL,
  performer_amount_minor bigint NOT NULL DEFAULT 0,
  adjustment_reason text,
  settlement_period_start date,
  settlement_period_end date,
  compensation_plan_id uuid REFERENCES v3_compensation_plans(id) ON DELETE RESTRICT,
  audit_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS v3_earnings_ledger_creator_idx ON v3_earnings_ledger(creator_id,created_at DESC);
CREATE INDEX IF NOT EXISTS v3_earnings_ledger_performer_idx ON v3_earnings_ledger(performer_legacy_id,created_at DESC);
CREATE TABLE IF NOT EXISTS v3_compensation_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES v3_creator_records(id) ON DELETE RESTRICT,
  performer_legacy_id text REFERENCES catalog_performers(legacy_id) ON DELETE RESTRICT,
  plan_id uuid NOT NULL REFERENCES v3_compensation_plans(id) ON DELETE RESTRICT,
  period_start date NOT NULL,
  period_end date NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('monthly','14_days')),
  eligible_revenue_minor bigint NOT NULL DEFAULT 0,
  revenue_share_base_minor bigint NOT NULL DEFAULT 0,
  performer_amount_minor bigint NOT NULL DEFAULT 0,
  carry_forward_minor bigint NOT NULL DEFAULT 0,
  payable_amount_minor bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','calculated','reviewed','payable','paid','reversed')),
  paid_event_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(performer_legacy_id,period_start,period_end,plan_id)
);
CREATE INDEX IF NOT EXISTS v3_compensation_settlements_creator_idx ON v3_compensation_settlements(creator_id,period_end DESC);
CREATE TABLE IF NOT EXISTS v3_compensation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id uuid REFERENCES v3_compensation_settlements(id) ON DELETE RESTRICT,
  ledger_entry_id uuid REFERENCES v3_earnings_ledger(id) ON DELETE RESTRICT,
  actor_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

WITH target AS (SELECT id FROM v3_contract_templates WHERE template_key='compensation_schedule'), document AS (
  SELECT $$FLESHLAB STUDIOS
A division of Dialogmakers International Ltd.
05
COMPENSATION SCHEDULE
REVENUE SHARE & PAYOUT TERMS
Performer: {{performer_name}}
Contract: {{contract_number}}
Effective: {{effective_date}}
Version: {{template_version}}

LEGAL_REVIEW_REQUIRED — TEMPLATE PREVIEW / NOT A SIGNED CONTRACT

1. Purpose
This Compensation Schedule defines the current standard economic model for covered FLESHLAB activity.
2. Relationship to Performer Services Agreement
It supplements, and does not replace, the Performer Services Agreement or other Contract Pack instruments.
3. Definitions
Revenue Share Base, Eligible Revenue, Settlement, Carry-Forward, Adjustment and Payout have the controlled accounting meanings in this Schedule and the applicable plan version.
4. Standard Revenue Split
The standard plan is 30% Performer and 70% Studio.
5. Revenue Share Base
The Revenue Share Base starts with attributable eligible revenue actually recognized or received for the applicable Content, Performer, Live session or Custom Content, subject only to explicit, auditable adjustments.
6. Eligible Revenue
Eligible sources include subscriptions, individual sales, fanclub revenue, tips, Live Content, Live Cam, Custom Content, advertising, licensing and third-party distribution.
7. Revenue Attribution
Revenue is attributable to a Performer, Content, Live session or Custom Content record where applicable. Unattributed Studio revenue is not allocated arbitrarily.
8. Multiple Performer Productions
The production Performer pool is allocated individually. Every allocation must be explicit and mathematically valid; no equal or automatic 30% allocation is implied.
9. Studio Costs
Studio production, equipment, editing, photography, makeup and approved travel or accommodation costs do not reduce the Performer Revenue Share Base under the standard plan.
10. Payment Provider Fees
Payment-provider processing fees are Studio-borne under the standard plan and are not silently deducted from Performer compensation.
11. Third-Party Platform Fees
Third-party platform commissions are Studio-borne under the standard plan and are not silently deducted from Performer compensation.
12. Production Expenses
Production expenses are Studio costs unless a separately approved written term expressly provides otherwise.
13. Taxes and Withholding
Each Party is responsible for its own taxes subject to mandatory lawful withholding. Any Performer withholding is separately identified on the statement.
14. Recorded Content Settlement
Recorded video and streaming revenue is settled monthly with its period, events, attribution, adjustments, Revenue Share Base, earnings and carry-forward retained.
15. Live Cam Settlement
Live Cam is settled every 14 days and remains separately identifiable from recorded-content settlement.
16. Payout Processing Dates
The intended processing dates are the 5th and 20th. These are processing dates, not a guarantee of external-provider settlement.
17. Minimum Payout
The minimum payout is USD 50. Amounts below the threshold are carried forward and are not forfeited.
18. Carry-Forward
Carry-forward remains attributable to the Performer and is shown on later statements.
19. Payment Methods
Supported methods currently include GCash, PayPal and Bank Transfer. The model remains extensible for future methods.
20. Currency and Conversion
Contract accounting currency is USD. Original currency, amount, conversion rate/source, timestamp and converted USD amount are retained where conversion occurs.
21. Refunds
Refund treatment follows applicable Terms of Use and remains LEGAL_REVIEW_REQUIRED. No arbitrary deduction is authorized.
22. Chargebacks
Chargeback treatment is LEGAL_REVIEW_REQUIRED. Every adjustment must identify reason, source transaction, amount, settlement and audit reference.
23. Adjustments
No deduction affects Performer compensation unless expressly permitted, represented, auditable and visible on the statement.
24. Statements
Statements show settlement period, revenue source, references, eligible revenue, adjustments, Revenue Share Base, share percentage, earnings, carry-forward, payable amount and payout status.
25. Records and Audit
Revenue events, adjustments, earnings, carry-forwards, payouts and reversals retain source, attribution, plan version, timestamps and audit references.
26. Compensation Plan Version
Every event and settlement records the immutable Compensation Plan version that applied.
27. Changes to Compensation
Future changes require a new plan version and do not rewrite historical earnings or snapshots.
28. Termination
Termination does not silently eliminate already earned compensation or valid carry-forward.
29. Post-Termination Earnings
During the valid five-year post-termination exploitation period under the Content Rights agreement, the applicable 30% Performer share continues under this Schedule.
30. Governing Law
Taiwan law, a Taiwan forum and English controlling language are intended. Tax, FX, revenue-recognition, refund, chargeback and international enforceability language remain LEGAL_REVIEW_REQUIRED.

COMPENSATION SUMMARY
30% PERFORMER
70% STUDIO
Currency: USD
Minimum payout: USD 50
Recorded Content: Monthly
Live Cam: Every 14 days
Payout processing: 5th / 20th
STUDIO-BORNE COSTS: provider fees, platform commissions and production expenses do not reduce the standard Performer share.

SIGNATURE PAGE
FOR FLESHLAB STUDIOS
Authorized Representative: {{studio_signer_name}}
Signature: {{studio_signature}}
Date: {{studio_signed_at}}

PERFORMER
Legal Name: {{creator_legal_name}}
Stage Name: {{performer_name}}
Signature: {{creator_signature}}
Date: {{creator_signed_at}}

DOCUMENT VERIFICATION
Contract Number: {{contract_number}}
Version: {{template_version}}
Document Hash: {{document_hash}}
This is a legal-review draft. No signature is asserted by this preview.$$ AS body
)
INSERT INTO v3_contract_template_versions(template_id,version,body,sections,variables,body_hash)
SELECT target.id,'2.0',document.body,
  to_jsonb(ARRAY['Purpose','Relationship to Performer Services Agreement','Definitions','Standard Revenue Split','Revenue Share Base','Eligible Revenue','Revenue Attribution','Multiple Performer Productions','Studio Costs','Payment Provider Fees','Third-Party Platform Fees','Production Expenses','Taxes and Withholding','Recorded Content Settlement','Live Cam Settlement','Payout Processing Dates','Minimum Payout','Carry-Forward','Payment Methods','Currency and Conversion','Refunds','Chargebacks','Adjustments','Statements','Records and Audit','Compensation Plan Version','Changes to Compensation','Termination','Post-Termination Earnings','Governing Law','Compensation Summary','Signature Page','Document Verification']),
  to_jsonb(ARRAY['company_legal_name','company_address','company_number','creator_legal_name','creator_address','performer_name','contract_number','effective_date','template_version','studio_signer_name','studio_signature','studio_signed_at','creator_signature','creator_signed_at','document_hash']),
  encode(digest(document.body,'sha256'),'hex')
FROM target,document ON CONFLICT(template_id,version) DO NOTHING;

INSERT INTO v3_compensation_plans(name,version,status,performer_share_percentage,studio_share_percentage,currency,minimum_payout_minor,recorded_settlement_frequency,live_settlement_frequency,payout_days)
VALUES ('FLESHLAB Standard','1.0','legal_review_required',30.00,70.00,'USD',5000,'monthly','14_days',ARRAY[5,20])
ON CONFLICT(name,version) DO NOTHING;
