-- Extend the canonical recruiting state machine for explicit V3 review actions.
-- Existing rows keep their status; no records are created or rewritten.
ALTER TABLE performer_applications DROP CONSTRAINT IF EXISTS performer_applications_status_check;
ALTER TABLE performer_applications ADD CONSTRAINT performer_applications_status_check
  CHECK (status IN ('draft','submitted','under_review','needs_information','approved','rejected','withdrawn'));
