-- V3 Performer Operations, additive only.  A performer remains a canonical
-- catalogue identity and is intentionally independent from Creator and User.
ALTER TABLE catalog_performers
  ADD COLUMN IF NOT EXISTS operational_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS public_visibility boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS internal_admin_notes text,
  ADD COLUMN IF NOT EXISTS availability_notes text,
  ADD COLUMN IF NOT EXISTS profile_media_asset_id uuid REFERENCES v3_media_assets(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS cover_media_asset_id uuid REFERENCES v3_media_assets(id) ON DELETE RESTRICT;

ALTER TABLE catalog_performers
  ADD CONSTRAINT catalog_performers_operational_status_check
  CHECK (operational_status IN ('active','inactive','archived'));

-- Existing public catalogue records retain their existing public behaviour.
UPDATE catalog_performers
SET operational_status = CASE
  WHEN v3_lifecycle = 'archived' THEN 'archived'
  WHEN status = 'inactive' THEN 'inactive'
  ELSE 'active'
END,
public_visibility = (status = 'active' AND v3_lifecycle = 'active')
WHERE operational_status = 'active' AND public_visibility = true;

CREATE TABLE IF NOT EXISTS v3_performer_user_links (
  performer_legacy_id text PRIMARY KEY REFERENCES catalog_performers(legacy_id) ON DELETE RESTRICT,
  user_id uuid NOT NULL UNIQUE REFERENCES app_users(id) ON DELETE RESTRICT,
  linked_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  linked_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS catalog_performers_operations_idx
  ON catalog_performers(operational_status, public_visibility, featured, verified, imported_at DESC);
CREATE INDEX IF NOT EXISTS v3_performer_user_links_user_idx
  ON v3_performer_user_links(user_id);
