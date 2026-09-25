-- Creator submission probe hardening. Additive only: failed evidence remains queryable.
ALTER TABLE v3_creator_submissions
  ADD COLUMN IF NOT EXISTS processing_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processing_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS processing_finished_at timestamptz,
  ADD COLUMN IF NOT EXISTS processing_last_error_code text,
  ADD COLUMN IF NOT EXISTS processing_last_error_message text,
  ADD COLUMN IF NOT EXISTS processing_last_error_at timestamptz;

CREATE TABLE IF NOT EXISTS v3_creator_submission_processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL UNIQUE REFERENCES v3_creator_submissions(id) ON DELETE RESTRICT,
  job_type text NOT NULL DEFAULT 'creator_submission_probe' CHECK (job_type='creator_submission_probe'),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','retryable_failure','succeeded','permanent_failure')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  lease_id uuid,
  lease_expires_at timestamptz,
  available_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,
  last_error_code text,
  last_error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS v3_creator_submission_processing_jobs_queue_idx
  ON v3_creator_submission_processing_jobs(status, available_at, updated_at);

-- Recover real unfinished submissions into explicit jobs without fabricating completed history.
INSERT INTO v3_creator_submission_processing_jobs(submission_id, status, available_at, created_at, updated_at)
SELECT id, 'queued', now(), created_at, updated_at
FROM v3_creator_submissions
WHERE status='processing'
ON CONFLICT (submission_id) DO NOTHING;
