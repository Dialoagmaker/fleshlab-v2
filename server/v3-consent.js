// Production consent is operational evidence, not a substitute for legal
// execution.  This service keeps the publishing gate explicit and auditable.
export function publishingReadiness(input = {}) {
  const blockers = [];
  if (input.primary_performer_verified !== true) blockers.push('primary_performer_unverified');
  const participants = Array.isArray(input.participants) ? input.participants : [];
  for (const participant of participants) {
    if (participant.age_verified !== true) blockers.push('co_performer_age_unverified');
    if (participant.identity_verified !== true) blockers.push('co_performer_identity_missing');
    if (participant.release_status !== 'accepted') blockers.push('participant_release_missing');
  }
  if (!['acknowledged', 'changed'].includes(input.consent_status)) blockers.push('production_consent_incomplete');
  if (input.prohibited_content_flag === true) blockers.push('prohibited_content_flag');
  if (input.required_rights_available !== true) blockers.push('required_rights_missing');
  return { publishable: blockers.length === 0, blockers: [...new Set(blockers)] };
}

const safeParticipant = row => ({
  id: row.id,
  performer_legacy_id: row.performer_legacy_id,
  display_name: row.display_name,
  role: row.role,
  age_verified: row.age_verified,
  identity_verified: row.identity_verified,
  release_status: row.release_status
});

export class V3ConsentService {
  constructor(db) { this.db = db; }

  async overview() {
    const result = await this.db.query(`SELECT
      (SELECT count(*)::int FROM v3_production_consent_records) consent_records,
      (SELECT count(*)::int FROM v3_production_consent_records WHERE status IN ('draft','blocked')) consent_needing_action,
      (SELECT count(*)::int FROM v3_production_participants) participants,
      (SELECT count(*)::int FROM v3_participant_releases WHERE status='accepted') accepted_releases,
      (SELECT count(*)::int FROM v3_participant_releases WHERE status <> 'accepted') outstanding_releases`);
    return result.rows[0];
  }

  async production(productionId) {
    const consent = await this.db.query(`SELECT id,production_id,performer_legacy_id,creator_id,video_legacy_id,production_date,categories,approved_activities,excluded_activities,notes,status,acknowledged_at,withdrawn_at,created_at,updated_at FROM v3_production_consent_records WHERE production_id=$1 ORDER BY created_at DESC`, [productionId]);
    const records = [];
    for (const row of consent.rows) {
      const participants = await this.db.query(`SELECT id,performer_legacy_id,display_name,role,age_verified,identity_verified,release_status FROM v3_production_participants WHERE consent_record_id=$1 ORDER BY created_at`, [row.id]);
      const readiness = publishingReadiness({ consent_status: row.status, participants: participants.rows });
      records.push({ ...row, participants: participants.rows.map(safeParticipant), publishing: readiness });
    }
    return { production_id: productionId, records };
  }
}
