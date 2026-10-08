// V3 operational projections deliberately expose only state FLESHLAB owns.
// Provider credentials, financial values and generated outcomes are never
// inferred by this read-only service.
export class V3OperationsService {
  constructor(db) { this.db = db; }

  async production() {
    const result = await this.db.query(`SELECT
      (SELECT count(*)::int FROM admin_rendering_jobs) rendering_jobs,
      (SELECT count(*)::int FROM admin_rendering_jobs WHERE status IN ('queued','running')) rendering_active,
      (SELECT count(*)::int FROM admin_qa_records WHERE status IN ('open','needs_review')) qa_open,
      (SELECT count(*)::int FROM admin_studio_audits WHERE status IN ('open','in_progress')) audits_open,
      (SELECT count(*)::int FROM admin_certifications WHERE status IN ('pending','needs_review')) certifications_open,
      (SELECT count(*)::int FROM catalog_videos WHERE status='published') published_videos,
      (SELECT count(*)::int FROM catalog_videos WHERE status <> 'published') unpublished_videos`);
    const counts = result.rows[0];
    return { counts, workstreams: [
      { key: 'rendering', label: 'Rendering', count: counts.rendering_jobs, attention: counts.rendering_active, empty: 'No self-hosted render jobs have been recorded.' },
      { key: 'qa', label: 'Quality review', count: counts.qa_open, attention: counts.qa_open, empty: 'No QA findings are recorded.' },
      { key: 'audit', label: 'Studio audit', count: counts.audits_open, attention: counts.audits_open, empty: 'No open studio audits are recorded.' },
      { key: 'certification', label: 'Certification', count: counts.certifications_open, attention: counts.certifications_open, empty: 'No certification reviews are awaiting action.' }
    ], lifecycle: { published: counts.published_videos, not_published: counts.unpublished_videos } };
  }

  async growth() {
    const result = await this.db.query(`SELECT
      (SELECT count(*)::int FROM recruitment_campaigns) campaigns,
      (SELECT count(*)::int FROM performer_applications WHERE answers->>'recruitment_campaign_id' IS NOT NULL) attributed_applications,
      (SELECT count(*)::int FROM news_articles) articles,
      (SELECT count(*)::int FROM news_articles WHERE status='published' AND published_at<=now()) published_articles,
      (SELECT count(*)::int FROM catalog_videos WHERE status='published') published_videos`);
    const counts = result.rows[0];
    return { counts, channels: [
      { key: 'campaigns', label: 'Campaigns', state: counts.campaigns ? 'ACTIVE_DATA' : 'NO_RECORDS', detail: counts.campaigns ? 'Campaign configuration and application attribution are stored in PostgreSQL.' : 'No self-hosted campaign records are available.' },
      { key: 'editorial', label: 'Editorial', state: counts.articles ? 'ACTIVE_DATA' : 'NO_RECORDS', detail: counts.articles ? 'News records are managed in the self-hosted editorial domain.' : 'No self-hosted news records are available.' },
      { key: 'analytics', label: 'External analytics', state: 'NOT_CONFIGURED', detail: 'GA4 and Search Console are not connected; no external metrics are shown.' },
      { key: 'outreach', label: 'Social and email', state: 'NOT_CONFIGURED', detail: 'No social or email provider is connected; delivery actions remain unavailable.' }
    ] };
  }

  async system() {
    const result = await this.db.query(`SELECT
      (SELECT count(*)::int FROM schema_migrations) migration_count,
      (SELECT count(*)::int FROM app_users WHERE role='admin') admins,
      (SELECT count(*)::int FROM app_users WHERE role='staff') staff,
      (SELECT count(*)::int FROM admin_automations) automations,
      (SELECT count(*)::int FROM admin_automations WHERE enabled) automations_enabled,
      (SELECT count(*)::int FROM admin_settings) settings,
      (SELECT count(*)::int FROM v3_audit_events) audit_events`);
    const counts = result.rows[0];
    return { counts, services: [
      { key: 'identity', label: 'Identity and roles', state: 'ACTIVE', detail: 'Self-hosted sessions and server-side roles are active.' },
      { key: 'audit', label: 'V3 audit trail', state: counts.audit_events ? 'ACTIVE_DATA' : 'READY_EMPTY', detail: counts.audit_events ? 'V3 mutations have recorded audit events.' : 'The append-only V3 audit store is ready; no events have been recorded yet.' },
      { key: 'automation', label: 'Automation', state: counts.automations_enabled ? 'ACTIVE_DATA' : 'DISABLED', detail: counts.automations_enabled ? 'Only configured local automations are enabled.' : 'No local automation is enabled.' },
      { key: 'integrations', label: 'External integrations', state: 'NOT_CONFIGURED', detail: 'Providers are kept separate from application settings and secrets are never shown here.' }
    ] };
  }
}
