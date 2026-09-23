-- Phase 4 integrity and scheduling support. Additive only; no V2/catalogue rows
-- are rewritten and no production data is removed.
CREATE INDEX IF NOT EXISTS v3_production_consent_production_idx
  ON v3_production_consent_records(production_id, created_at DESC);
CREATE INDEX IF NOT EXISTS v3_production_rights_production_idx
  ON v3_content_rights_records(production_id, created_at DESC);
CREATE INDEX IF NOT EXISTS v3_production_shoot_schedule_idx
  ON v3_production_shoots(scheduled_at, status);
CREATE INDEX IF NOT EXISTS v3_production_milestone_schedule_idx
  ON v3_production_milestones(due_at, status);
CREATE INDEX IF NOT EXISTS v3_production_render_queue_idx
  ON v3_production_render_jobs(status, created_at)
  WHERE status IN ('queued', 'running');
