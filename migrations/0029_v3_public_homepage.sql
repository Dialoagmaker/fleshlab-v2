-- Phase 6A: a deliberately small, auditable public-homepage curation record.
-- All referenced records are revalidated against their public lifecycle at read time.
CREATE TABLE IF NOT EXISTS v3_public_homepage_config (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  hero_video_legacy_id text REFERENCES catalog_videos(legacy_id) ON DELETE SET NULL,
  hero_performer_legacy_id text REFERENCES catalog_performers(legacy_id) ON DELETE SET NULL,
  hero_collection_id uuid REFERENCES v3_catalogue_collections(id) ON DELETE SET NULL,
  hero_eyebrow text NOT NULL DEFAULT 'FLESHLAB / INDEPENDENT STUDIO',
  hero_title text NOT NULL DEFAULT 'Stories with presence.',
  hero_summary text NOT NULL DEFAULT 'Creator-led films, real chemistry and a catalogue made with intention.',
  hero_cta_label text NOT NULL DEFAULT 'Explore videos',
  hero_cta_target text NOT NULL DEFAULT '/v3/videos',
  featured_video_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  featured_performer_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  featured_collection_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  section_visibility jsonb NOT NULL DEFAULT '{"featured_videos":true,"new_releases":true,"performers":true,"collections":true,"creator_cta":true,"trust":true}'::jsonb,
  updated_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO v3_public_homepage_config(singleton)
VALUES(true)
ON CONFLICT(singleton) DO NOTHING;
