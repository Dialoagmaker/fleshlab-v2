CREATE TABLE IF NOT EXISTS v3_media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type text NOT NULL CHECK (asset_type IN ('thumbnail','poster','trailer','source')),
  legacy_url text,
  storage_reference text,
  mime_type text,
  byte_size bigint,
  content_hash text,
  processing_state text NOT NULL DEFAULT 'ready' CHECK (processing_state IN ('pending','processing','ready','failed','unavailable')),
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('public','private','internal')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(asset_type, legacy_url)
);
CREATE TABLE IF NOT EXISTS v3_media_asset_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES v3_media_assets(id) ON DELETE CASCADE,
  video_legacy_id text REFERENCES catalog_videos(legacy_id) ON DELETE CASCADE,
  performer_legacy_id text REFERENCES catalog_performers(legacy_id) ON DELETE CASCADE,
  brand_legacy_id text REFERENCES catalog_brands(legacy_id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(video_legacy_id, performer_legacy_id, brand_legacy_id) = 1)
);
CREATE INDEX IF NOT EXISTS v3_media_public_idx ON v3_media_assets(visibility, processing_state, asset_type);
CREATE INDEX IF NOT EXISTS v3_media_video_idx ON v3_media_asset_links(video_legacy_id);
CREATE UNIQUE INDEX IF NOT EXISTS v3_media_asset_video_uq ON v3_media_asset_links(asset_id, video_legacy_id) WHERE video_legacy_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS v3_media_asset_performer_uq ON v3_media_asset_links(asset_id, performer_legacy_id) WHERE performer_legacy_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS v3_media_asset_brand_uq ON v3_media_asset_links(asset_id, brand_legacy_id) WHERE brand_legacy_id IS NOT NULL;

INSERT INTO v3_media_assets(asset_type, legacy_url, processing_state, visibility)
SELECT 'thumbnail', legacy_thumbnail_url, 'ready', 'public'
FROM catalog_videos WHERE legacy_thumbnail_url IS NOT NULL AND legacy_thumbnail_url <> ''
ON CONFLICT (asset_type, legacy_url) DO NOTHING;
INSERT INTO v3_media_assets(asset_type, legacy_url, processing_state, visibility)
SELECT 'trailer', legacy_trailer_url, 'ready', 'public'
FROM catalog_videos WHERE legacy_trailer_url IS NOT NULL AND legacy_trailer_url <> ''
ON CONFLICT (asset_type, legacy_url) DO NOTHING;
INSERT INTO v3_media_assets(asset_type, legacy_url, processing_state, visibility)
SELECT 'source', legacy_source_media_url, 'ready', 'private'
FROM catalog_videos WHERE legacy_source_media_url IS NOT NULL AND legacy_source_media_url <> ''
ON CONFLICT (asset_type, legacy_url) DO NOTHING;
INSERT INTO v3_media_asset_links(asset_id, video_legacy_id, is_primary)
SELECT a.id, v.legacy_id, true FROM v3_media_assets a JOIN catalog_videos v ON a.legacy_url=v.legacy_thumbnail_url AND a.asset_type='thumbnail'
ON CONFLICT DO NOTHING;
INSERT INTO v3_media_asset_links(asset_id, video_legacy_id, is_primary)
SELECT a.id, v.legacy_id, true FROM v3_media_assets a JOIN catalog_videos v ON a.legacy_url=v.legacy_trailer_url AND a.asset_type='trailer'
ON CONFLICT DO NOTHING;
INSERT INTO v3_media_asset_links(asset_id, video_legacy_id, is_primary)
SELECT a.id, v.legacy_id, true FROM v3_media_assets a JOIN catalog_videos v ON a.legacy_url=v.legacy_source_media_url AND a.asset_type='source'
ON CONFLICT DO NOTHING;
