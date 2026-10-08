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
  if (input.required_rights_available === false) blockers.push('required_rights_missing');
  const rights = rightsReadiness(input.rights || (input.required_rights_available === true ? { rights_status: 'active' } : { rights_status: 'missing' }));
  blockers.push(...rights.blockers);
  return { publishable: blockers.length === 0, blockers: [...new Set(blockers)] };
}

export function rightsReadiness(rights = {}) {
  const blockers = [];
  if (rights.rights_status === 'legacy_unknown') blockers.push('legacy_rights_status_unknown');
  else if (rights.rights_status !== 'active') blockers.push(rights.rights_status === 'expired' ? 'rights_expired' : rights.rights_status === 'blocked' ? 'rights_blocked' : 'rights_documentation_missing');
  if (rights.commercial_exploitation_allowed !== undefined && rights.commercial_exploitation_allowed !== true) blockers.push('commercial_exploitation_not_authorized');
  if (rights.participant_rights_complete === false) blockers.push('participant_rights_missing');
  return { ready: blockers.length === 0, blockers: [...new Set(blockers)] };
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
      (SELECT count(*)::int FROM v3_participant_releases WHERE status <> 'accepted') outstanding_releases,
      (SELECT count(*)::int FROM v3_content_rights_records) rights_records,
      (SELECT count(*)::int FROM v3_content_rights_records WHERE rights_status='active') active_rights,
      (SELECT count(*)::int FROM v3_content_rights_records WHERE rights_status IN ('missing','pending','blocked','legacy_unknown')) rights_needing_action`);
    return result.rows[0];
  }

  async production(productionId) {
    const consent = await this.db.query(`SELECT id,production_id,performer_legacy_id,creator_id,video_legacy_id,production_date,categories,approved_activities,excluded_activities,notes,status,acknowledged_at,withdrawn_at,created_at,updated_at FROM v3_production_consent_records WHERE production_id=$1 OR production_id=(SELECT reference FROM v3_productions WHERE id=$1) ORDER BY created_at DESC`, [productionId]);
    const records = [];
    for (const row of consent.rows) {
      const participants = await this.db.query(`SELECT id,performer_legacy_id,display_name,role,age_verified,identity_verified,release_status FROM v3_production_participants WHERE consent_record_id=$1 ORDER BY created_at`, [row.id]);
      const rights = await this.rights(productionId, row.video_legacy_id);
      const readiness = publishingReadiness({ consent_status: row.status, participants: participants.rows, rights: rights.records[0] || { rights_status: row.video_legacy_id ? 'legacy_unknown' : 'missing' } });
      records.push({ ...row, participants: participants.rows.map(safeParticipant), rights: rights.records, publishing: readiness });
    }
    return { production_id: productionId, records };
  }

  async rights(productionId, contentId = null) {
    const args = contentId ? [productionId, contentId] : [productionId];
    const result = await this.db.query(`SELECT id,production_id,content_legacy_id,performer_legacy_id,creator_id,rights_source,rights_contract_instance_id,rights_status,exclusive,territory,rights_start_at,rights_end_at,post_termination_end_at,commercial_exploitation_allowed,marketing_allowed,editing_allowed,sublicensing_allowed,notes,created_at,updated_at FROM v3_content_rights_records WHERE (production_id=$1 OR production_id=(SELECT reference FROM v3_productions WHERE id=$1)) ${contentId ? 'AND content_legacy_id=$2' : ''} ORDER BY created_at DESC`, args);
    return { production_id: productionId, status: result.rowCount ? 'RECORDED' : 'LEGACY_RIGHTS_STATUS_UNKNOWN', records: result.rows.map(row => ({ ...row, readiness: rightsReadiness(row) })) };
  }
}
