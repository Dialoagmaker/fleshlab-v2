-- Phase 2 catalogue operations. Additive only; legacy catalogue rows remain canonical.
CREATE TABLE IF NOT EXISTS v3_catalogue_video_meta (
  video_legacy_id text PRIMARY KEY REFERENCES catalog_videos(legacy_id) ON DELETE CASCADE,
  seo_title text,
  seo_description text,
  internal_publishing_notes text,
  validation_state text NOT NULL DEFAULT 'not_checked' CHECK (validation_state IN ('not_checked','blocked','warning','ready')),
  validation_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES app_users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS v3_catalogue_video_meta_validation_idx ON v3_catalogue_video_meta(validation_state);
CREATE INDEX IF NOT EXISTS v3_media_video_primary_idx ON v3_media_asset_links(video_legacy_id, is_primary);
