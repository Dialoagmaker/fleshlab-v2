-- Canonical public-catalogue records imported from an auditable Base44 export.
-- Legacy identifiers are preserved as immutable natural keys so that imports
-- can be safely replayed without creating duplicate performers or videos.
CREATE TABLE IF NOT EXISTS import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL,
  source_sha256 text NOT NULL,
  dry_run boolean NOT NULL DEFAULT false,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_name, source_sha256)
);

CREATE TABLE IF NOT EXISTS catalog_brands (
  legacy_id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  logo_url text,
  cover_image_url text,
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('active','inactive')),
  source_payload jsonb NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_performers (
  legacy_id text PRIMARY KEY,
  display_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  bio text,
  nationality text,
  profile_image_url text,
  cover_image_url text,
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('active','inactive','pending')),
  featured boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  source_payload jsonb NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_videos (
  legacy_id text PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  short_summary text,
  brand_legacy_id text REFERENCES catalog_brands(legacy_id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','unlisted','archived')),
  access_tier text NOT NULL DEFAULT 'free' CHECK (access_tier IN ('free','fanclub','ppv')),
  release_date date,
  duration_seconds integer,
  thumbnail_url text,
  trailer_url text,
  source_media_url text,
  source_payload jsonb NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_video_performers (
  video_legacy_id text NOT NULL REFERENCES catalog_videos(legacy_id) ON DELETE CASCADE,
  performer_legacy_id text NOT NULL REFERENCES catalog_performers(legacy_id) ON DELETE RESTRICT,
  role_name text,
  display_order integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  lead_performer boolean NOT NULL DEFAULT false,
  PRIMARY KEY(video_legacy_id, performer_legacy_id)
);
