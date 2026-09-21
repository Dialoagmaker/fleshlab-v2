ALTER TABLE catalog_brands ADD COLUMN IF NOT EXISTS v3_lifecycle text NOT NULL DEFAULT 'active' CHECK (v3_lifecycle IN ('draft','active','archived'));
ALTER TABLE catalog_performers ADD COLUMN IF NOT EXISTS v3_lifecycle text NOT NULL DEFAULT 'active' CHECK (v3_lifecycle IN ('draft','active','archived'));
ALTER TABLE catalog_videos ADD COLUMN IF NOT EXISTS v3_lifecycle text NOT NULL DEFAULT 'draft' CHECK (v3_lifecycle IN ('draft','metadata_ready','media_ready','qa_review','certification_review','publishable','published','archived'));
UPDATE catalog_videos SET v3_lifecycle=CASE WHEN status='published' THEN 'published' WHEN status='archived' THEN 'archived' ELSE 'draft' END WHERE v3_lifecycle='draft';
CREATE TABLE IF NOT EXISTS v3_catalogue_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, slug text NOT NULL UNIQUE, description text, cover_asset_reference text,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','public','archived')),
  display_order integer NOT NULL DEFAULT 0, created_by uuid REFERENCES app_users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS v3_catalogue_collection_videos (
  collection_id uuid NOT NULL REFERENCES v3_catalogue_collections(id) ON DELETE CASCADE,
  video_legacy_id text NOT NULL REFERENCES catalog_videos(legacy_id) ON DELETE RESTRICT,
  display_order integer NOT NULL DEFAULT 0, PRIMARY KEY(collection_id,video_legacy_id)
);
CREATE TABLE IF NOT EXISTS v3_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid REFERENCES app_users(id), action text NOT NULL,
  entity_type text NOT NULL, entity_id text NOT NULL, before_summary jsonb, after_summary jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS v3_audit_events_entity_idx ON v3_audit_events(entity_type,entity_id,created_at DESC);
CREATE INDEX IF NOT EXISTS v3_catalogue_videos_lifecycle_idx ON catalog_videos(v3_lifecycle,status);
