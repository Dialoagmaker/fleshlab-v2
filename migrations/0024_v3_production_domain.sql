-- Phase 4 Production domain. Additive only; catalogue, V2 and existing consent/rights rows remain canonical.
CREATE TABLE IF NOT EXISTS v3_productions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  internal_title text,
  reference text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','ready','shooting','post_production','qa','ready_to_publish','published','archived','cancelled')),
  brand_legacy_id text REFERENCES catalog_brands(legacy_id) ON DELETE RESTRICT,
  production_type text NOT NULL DEFAULT 'recorded_content',
  owner_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  description text,
  internal_notes text,
  planned_date date,
  actual_shoot_date date,
  location_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS v3_productions_status_idx ON v3_productions(status, planned_date);

CREATE TABLE IF NOT EXISTS v3_production_shoots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id uuid NOT NULL REFERENCES v3_productions(id) ON DELETE CASCADE,
  scheduled_at timestamptz,
  location_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','scheduled','active','completed','cancelled')),
  notes text,
  responsible_staff_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  completed_at timestamptz,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v3_production_scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id uuid NOT NULL REFERENCES v3_productions(id) ON DELETE CASCADE,
  shoot_id uuid REFERENCES v3_production_shoots(id) ON DELETE SET NULL,
  scene_number integer NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','ready','shooting','shot','qa','complete','cancelled')),
  internal_notes text,
  planned_duration_seconds integer CHECK (planned_duration_seconds IS NULL OR planned_duration_seconds > 0),
  actual_duration_seconds integer CHECK (actual_duration_seconds IS NULL OR actual_duration_seconds > 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(production_id, scene_number)
);
CREATE INDEX IF NOT EXISTS v3_production_scenes_order_idx ON v3_production_scenes(production_id, sort_order, scene_number);

CREATE TABLE IF NOT EXISTS v3_production_participant_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id uuid NOT NULL REFERENCES v3_productions(id) ON DELETE CASCADE,
  scene_id uuid REFERENCES v3_production_scenes(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES v3_creator_records(id) ON DELETE RESTRICT,
  performer_legacy_id text REFERENCES catalog_performers(legacy_id) ON DELETE RESTRICT,
  role text NOT NULL DEFAULT 'performer',
  participation_status text NOT NULL DEFAULT 'planned' CHECK (participation_status IN ('planned','confirmed','completed','withdrawn','blocked')),
  consent_record_id uuid REFERENCES v3_production_consent_records(id) ON DELETE SET NULL,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (creator_id IS NOT NULL OR performer_legacy_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS v3_production_participant_assignment_idx ON v3_production_participant_assignments(production_id, scene_id);

CREATE TABLE IF NOT EXISTS v3_production_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id uuid NOT NULL REFERENCES v3_productions(id) ON DELETE CASCADE,
  scene_id uuid REFERENCES v3_production_scenes(id) ON DELETE SET NULL,
  asset_id uuid NOT NULL REFERENCES v3_media_assets(id) ON DELETE RESTRICT,
  asset_role text NOT NULL CHECK (asset_role IN ('raw_source','still','thumbnail_candidate','trailer_candidate','edited_master','render_output','supporting')),
  source_asset_id uuid REFERENCES v3_production_assets(id) ON DELETE SET NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  lifecycle text NOT NULL DEFAULT 'active' CHECK (lifecycle IN ('active','superseded','rejected')),
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(production_id, asset_id, asset_role, version)
);
CREATE INDEX IF NOT EXISTS v3_production_assets_idx ON v3_production_assets(production_id, asset_role, lifecycle);

CREATE TABLE IF NOT EXISTS v3_production_qa_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id uuid NOT NULL REFERENCES v3_productions(id) ON DELETE CASCADE,
  scene_id uuid REFERENCES v3_production_scenes(id) ON DELETE SET NULL,
  production_asset_id uuid REFERENCES v3_production_assets(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','passed','failed','needs_changes')),
  issue_type text NOT NULL DEFAULT 'general',
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  notes text,
  reviewer_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v3_production_render_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id uuid NOT NULL REFERENCES v3_productions(id) ON DELETE CASCADE,
  input_asset_id uuid NOT NULL REFERENCES v3_media_assets(id) ON DELETE RESTRICT,
  output_asset_id uuid REFERENCES v3_media_assets(id) ON DELETE SET NULL,
  preset text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','succeeded','failed','cancelled')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  failure_reason text,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v3_production_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id uuid NOT NULL REFERENCES v3_productions(id) ON DELETE CASCADE,
  name text NOT NULL,
  due_at timestamptz,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','complete','blocked','cancelled')),
  notes text,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v3_production_catalogue_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id uuid NOT NULL UNIQUE REFERENCES v3_productions(id) ON DELETE CASCADE,
  video_legacy_id text NOT NULL UNIQUE REFERENCES catalog_videos(legacy_id) ON DELETE RESTRICT,
  handoff_status text NOT NULL DEFAULT 'linked' CHECK (handoff_status IN ('linked','metadata_copied','ready_for_catalogue','published','superseded')),
  metadata_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  linked_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  linked_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v3_production_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id uuid NOT NULL REFERENCES v3_productions(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS v3_production_events_idx ON v3_production_events(production_id, created_at DESC);
