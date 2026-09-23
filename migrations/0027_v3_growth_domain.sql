-- Phase 5B: additive Growth domain primitives.
-- Existing recruitment, catalogue media and editorial rows remain intact.

CREATE TABLE IF NOT EXISTS v3_growth_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_recruitment_campaign_id uuid UNIQUE REFERENCES recruitment_campaigns(id) ON DELETE SET NULL,
  name text NOT NULL,
  internal_reference text NOT NULL UNIQUE,
  campaign_type text NOT NULL CHECK (campaign_type IN ('recruitment','content_promotion','creator_promotion','collection_promotion','external_platform_promotion','editorial_news_promotion')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','active','paused','completed','archived')),
  starts_at timestamptz,
  ends_at timestamptz,
  owner_user_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  target_destination text,
  notes text,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at)
);
CREATE INDEX IF NOT EXISTS v3_growth_campaigns_status_idx ON v3_growth_campaigns(status, campaign_type, updated_at DESC);
CREATE INDEX IF NOT EXISTS v3_growth_campaigns_dates_idx ON v3_growth_campaigns(starts_at, ends_at);

CREATE TABLE IF NOT EXISTS v3_growth_attribution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES v3_growth_campaigns(id) ON DELETE SET NULL,
  source text,
  medium text,
  campaign_name text,
  content text,
  term text,
  referrer text,
  landing_route text,
  application_id uuid REFERENCES performer_applications(id) ON DELETE SET NULL,
  user_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  content_legacy_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(application_id, campaign_id)
);
CREATE INDEX IF NOT EXISTS v3_growth_attribution_campaign_idx ON v3_growth_attribution(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS v3_growth_attribution_source_idx ON v3_growth_attribution(source, medium, created_at DESC);

CREATE TABLE IF NOT EXISTS v3_growth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  campaign_id uuid REFERENCES v3_growth_campaigns(id) ON DELETE SET NULL,
  attribution_id uuid REFERENCES v3_growth_attribution(id) ON DELETE SET NULL,
  application_id uuid REFERENCES performer_applications(id) ON DELETE SET NULL,
  user_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  entity_type text,
  entity_id text,
  landing_route text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS v3_growth_events_type_idx ON v3_growth_events(event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS v3_growth_events_campaign_idx ON v3_growth_events(campaign_id, occurred_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS v3_growth_events_application_uq ON v3_growth_events(event_type, application_id) WHERE event_type='application' AND application_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS v3_growth_promo_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_asset_id uuid REFERENCES v3_media_assets(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES v3_growth_campaigns(id) ON DELETE SET NULL,
  asset_kind text NOT NULL CHECK (asset_kind IN ('image','banner','thumbnail','trailer','teaser','social_copy','landing_copy','platform_variant')),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','archived')),
  brand_legacy_id text REFERENCES catalog_brands(legacy_id) ON DELETE SET NULL,
  performer_legacy_id text REFERENCES catalog_performers(legacy_id) ON DELETE SET NULL,
  video_legacy_id text REFERENCES catalog_videos(legacy_id) ON DELETE SET NULL,
  collection_id uuid REFERENCES v3_catalogue_collections(id) ON DELETE SET NULL,
  social_copy text,
  landing_copy text,
  platform_variants jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS v3_growth_promo_assets_campaign_idx ON v3_growth_promo_assets(campaign_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS v3_growth_promo_assets_links_idx ON v3_growth_promo_assets(brand_legacy_id, performer_legacy_id, video_legacy_id, collection_id);

CREATE TABLE IF NOT EXISTS v3_growth_promo_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES v3_growth_campaigns(id) ON DELETE SET NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','archived')),
  cta text,
  destination_url text,
  platform_notes text,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS v3_growth_promo_kit_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id uuid NOT NULL REFERENCES v3_growth_promo_kits(id) ON DELETE CASCADE,
  promo_asset_id uuid NOT NULL REFERENCES v3_growth_promo_assets(id) ON DELETE RESTRICT,
  usage_status text NOT NULL DEFAULT 'selected' CHECK (usage_status IN ('selected','approved','retired')),
  UNIQUE(kit_id, promo_asset_id)
);
CREATE TABLE IF NOT EXISTS v3_growth_promo_kit_copies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id uuid NOT NULL REFERENCES v3_growth_promo_kits(id) ON DELETE CASCADE,
  channel text NOT NULL,
  variant_name text NOT NULL,
  copy_text text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  UNIQUE(kit_id, channel, variant_name)
);
CREATE INDEX IF NOT EXISTS v3_growth_promo_kits_campaign_idx ON v3_growth_promo_kits(campaign_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS v3_growth_distribution_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES v3_growth_campaigns(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('website','xhamster','faphouse','social','email','referral','direct','other')),
  platform text,
  promo_asset_id uuid REFERENCES v3_growth_promo_assets(id) ON DELETE SET NULL,
  promo_kit_id uuid REFERENCES v3_growth_promo_kits(id) ON DELETE SET NULL,
  destination_url text,
  published_at timestamptz,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','published','paused','archived')),
  external_reference text,
  external_url text,
  notes text,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS v3_growth_distribution_idx ON v3_growth_distribution_records(campaign_id, channel, status, published_at DESC);

ALTER TABLE news_articles DROP CONSTRAINT IF EXISTS news_articles_status_check;
ALTER TABLE news_articles ADD CONSTRAINT news_articles_status_check CHECK (status IN ('draft','review','published','archived'));
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES v3_growth_campaigns(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS news_articles_workflow_idx ON news_articles(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS news_articles_campaign_idx ON news_articles(campaign_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS v3_growth_funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  steps jsonb NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO v3_growth_funnels(funnel_key,name,description,steps)
VALUES
  ('campaign_application','Campaign to application','Only captured campaign attribution and submitted applications are reported.', '[{"key":"campaign","label":"Campaign"},{"key":"landing","label":"Landing activity"},{"key":"application","label":"Application"}]'::jsonb),
  ('promo_catalogue','Promotion to catalogue','Catalogue stages are reported only when corresponding events exist.', '[{"key":"promotion","label":"Promotion"},{"key":"catalogue_view","label":"Catalogue view"},{"key":"content_detail","label":"Content detail"}]'::jsonb),
  ('creator_recruitment','Creator recruitment','Approval is reported from the existing recruiting record.', '[{"key":"campaign","label":"Recruitment campaign"},{"key":"application","label":"Application"},{"key":"approval","label":"Approval"}]'::jsonb)
ON CONFLICT(funnel_key) DO NOTHING;

-- Bridge existing captured recruitment attribution. No synthetic landing or
-- impression events are created.
INSERT INTO v3_growth_campaigns(legacy_recruitment_campaign_id,name,internal_reference,campaign_type,status,channels,target_destination,notes,created_at,updated_at)
SELECT r.id,r.name,r.slug,'recruitment',CASE r.status WHEN 'active' THEN 'active' WHEN 'paused' THEN 'paused' ELSE 'archived' END,
       jsonb_build_array(r.channel),r.landing_page,r.notes,r.created_at,r.updated_at
FROM recruitment_campaigns r
ON CONFLICT(legacy_recruitment_campaign_id) DO NOTHING;

INSERT INTO v3_growth_attribution(campaign_id,source,medium,campaign_name,content,term,application_id,created_at)
SELECT c.id,r.source,r.medium,r.campaign,r.content,r.term,a.id,a.created_at
FROM performer_applications a
JOIN recruitment_campaigns r ON r.slug=a.answers->>'recruitment_campaign_id'
JOIN v3_growth_campaigns c ON c.legacy_recruitment_campaign_id=r.id
WHERE a.answers->>'recruitment_campaign_id' IS NOT NULL
ON CONFLICT(application_id,campaign_id) DO NOTHING;

INSERT INTO v3_growth_events(event_type,campaign_id,attribution_id,application_id,occurred_at)
SELECT 'application',a.campaign_id,a.id,a.application_id,a.created_at
FROM v3_growth_attribution a
WHERE a.application_id IS NOT NULL;
