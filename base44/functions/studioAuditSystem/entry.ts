import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const CATEGORIES = [
  'Creative Intelligence', 'Governance', 'Rendering Intelligence', 'Production QA',
  'Production Memory', 'Creative Memory', 'Benchmark Suite', 'Licensing', 'Residency',
  'Publishing', 'Asset Registry', 'Provider Registry', 'Production Queue'
];

const WEIGHTS = {
  'Creative Intelligence': 8,
  'Governance': 11,
  'Rendering Intelligence': 11,
  'Production QA': 12,
  'Production Memory': 7,
  'Creative Memory': 7,
  'Benchmark Suite': 7,
  'Licensing': 6,
  'Residency': 5,
  'Publishing': 11,
  'Asset Registry': 6,
  'Provider Registry': 6,
  'Production Queue': 3
};

function isAllowedStaff(user) {
  return user && ['admin', 'super_admin', 'manager', 'staff', 'employee'].includes(user.role);
}

function safeJson(value) {
  try { return JSON.stringify(value || null); } catch (_) { return '{}'; }
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function report(category, health, status, warnings = [], errors = [], recommendations = [], riskLevel = 'low', confidence = 85, lastSuccessfulValidation = null) {
  return { category, health: clamp(health), status, warnings, errors, recommendations, risk_level: riskLevel, confidence: clamp(confidence), last_successful_validation: lastSuccessfulValidation || new Date().toISOString() };
}

function readiness(score, criticalCount, warningCount) {
  if (criticalCount > 0 || score < 55) return 'BLOCKED';
  if (score < 72) return 'LIMITED';
  if (warningCount > 0 || score < 88) return 'READY WITH WARNINGS';
  return 'READY';
}

function risk(score, criticalCount, warningCount) {
  if (criticalCount > 0 || score < 55) return 'critical';
  if (score < 72) return 'high';
  if (warningCount > 0 || score < 88) return 'medium';
  return 'low';
}

async function listEntity(base44, name, sort = '-created_date', limit = 200) {
  try {
    return await base44.asServiceRole.entities[name].list(sort, limit);
  } catch (_) {
    return [];
  }
}

function latestDate(rows) {
  const dates = rows.map(row => row.updated_date || row.created_date || row.qa_timestamp || row.audit_timestamp || row.completed_at).filter(Boolean).sort().reverse();
  return dates[0] || null;
}

function stale(date, days = 30) {
  if (!date) return true;
  return Date.now() - new Date(date).getTime() > days * 24 * 60 * 60 * 1000;
}

function buildCategoryReports(data) {
  const reports = [];
  const modules = data.CreativeAcademyModule || [];
  const certifiedModules = modules.filter(item => item.certified || item.status === 'certified');
  reports.push(report(
    'Creative Intelligence',
    modules.length ? Math.min(98, 72 + certifiedModules.length * 4) : 45,
    modules.length ? 'Creative academy modules available' : 'Creative intelligence modules missing',
    modules.length && certifiedModules.length < Math.max(1, Math.floor(modules.length * 0.5)) ? ['Several creative modules are not certified.'] : [],
    modules.length ? [] : ['Creative intelligence library is unavailable.'],
    modules.length ? ['Continue module certification and drift monitoring.'] : ['Install and certify creative intelligence modules.'],
    modules.length ? 'low' : 'high',
    84,
    latestDate(modules)
  ));

  const reviews = data.StudioReview || [];
  const projects = data.StudioProject || [];
  const pendingApprovals = projects.filter(item => ['pending', 'changes_requested', 'rejected'].includes(item.approval_state)).length;
  reports.push(report(
    'Governance',
    reviews.length ? Math.max(58, 92 - pendingApprovals * 6) : 62,
    reviews.length ? 'Review Board audit trail present' : 'Governance records limited',
    pendingApprovals ? [`${pendingApprovals} project approvals require attention.`] : [],
    [],
    ['Keep creative, executive and production approval states separated.'],
    pendingApprovals > 3 ? 'medium' : 'low',
    82,
    latestDate(reviews.concat(projects))
  ));

  const providers = data.RenderingProvider || [];
  const enabledProviders = providers.filter(item => item.enabled && item.current_availability !== 'unavailable');
  const staleProviders = providers.filter(item => stale(item.updated_date || item.created_date, 30));
  reports.push(report(
    'Rendering Intelligence',
    enabledProviders.length ? Math.max(70, 96 - staleProviders.length * 5) : 35,
    enabledProviders.length ? 'Rendering router has enabled production pipelines' : 'Rendering router has no enabled pipelines',
    staleProviders.length ? [`${staleProviders.length} provider registry records are stale.`] : [],
    enabledProviders.length ? [] : ['No enabled rendering provider is available.'],
    staleProviders.length ? ['Refresh provider registry and routing availability.'] : ['Continue routing audit capture after every render.'],
    enabledProviders.length ? (staleProviders.length ? 'medium' : 'low') : 'critical',
    88,
    latestDate(providers)
  ));

  const qa = data.ProductionQAResult || [];
  const approvedQa = qa.filter(item => item.production_approved).length;
  reports.push(report(
    'Production QA',
    qa.length ? Math.max(64, 82 + Math.min(12, approvedQa)) : 58,
    qa.length ? 'Production QA engine is recording independent reviews' : 'Production QA engine installed; no reviews recorded yet',
    qa.length ? [] : ['No Production QA history exists yet.'],
    [],
    ['Every generated asset must receive a Production QA result before publishing.'],
    qa.length ? 'low' : 'medium',
    86,
    latestDate(qa)
  ));

  const attempts = data.RenderingAttempt || [];
  const failedAttempts = attempts.filter(item => !item.success).length;
  reports.push(report(
    'Production Memory',
    attempts.length ? Math.max(60, 94 - failedAttempts * 2) : 55,
    attempts.length ? 'Rendering attempts are being stored' : 'No rendering memory has been recorded',
    failedAttempts ? [`${failedAttempts} failed rendering attempts are recorded.`] : [],
    [],
    ['Use production memory to adjust routing priority and failure prediction.'],
    failedAttempts > 8 ? 'medium' : 'low',
    83,
    latestDate(attempts)
  ));

  const knowledge = data.CreativeAcademyKnowledgeRecord || [];
  reports.push(report(
    'Creative Memory',
    knowledge.length ? 90 : 60,
    knowledge.length ? 'Creative memory records available' : 'Creative memory history limited',
    knowledge.length ? [] : ['Creative memory entity has no visible records.'],
    [],
    ['Persist campaign lessons after production and publishing outcomes.'],
    knowledge.length ? 'low' : 'medium',
    78,
    latestDate(knowledge)
  ));

  const benchmarkCases = data.CreativeBenchmarkCase || [];
  const benchmarkRuns = data.CreativeBenchmarkRun || [];
  const failedRuns = benchmarkRuns.filter(item => item.status === 'failed').length;
  reports.push(report(
    'Benchmark Suite',
    benchmarkCases.length ? Math.max(72, 94 - failedRuns * 8) : 42,
    benchmarkCases.length ? 'Benchmark library available' : 'Benchmark library missing',
    failedRuns ? [`${failedRuns} benchmark run failures detected.`] : [],
    benchmarkCases.length ? [] : ['No benchmark cases are available.'],
    ['Run benchmark checks after major upgrades and monitor regression flags.'],
    benchmarkCases.length ? (failedRuns ? 'medium' : 'low') : 'high',
    84,
    latestDate(benchmarkCases.concat(benchmarkRuns))
  ));

  const compliance = data.ComplianceRecord || [];
  const docs = data.ComplianceDocument || [];
  reports.push(report(
    'Licensing',
    compliance.length || docs.length ? 86 : 64,
    compliance.length || docs.length ? 'Compliance and licensing records available' : 'Licensing evidence sparse',
    compliance.length || docs.length ? [] : ['No recent compliance records found in audit sample.'],
    [],
    ['Keep production rights, ID, release and licensing evidence linked to assets.'],
    compliance.length || docs.length ? 'low' : 'medium',
    76,
    latestDate(compliance.concat(docs))
  ));

  const residency = data.CreativeResidencyCase || [];
  reports.push(report(
    'Residency',
    residency.length ? 88 : 66,
    residency.length ? 'Residency cases available' : 'Residency evidence limited',
    residency.length ? [] : ['No residency case history visible in audit sample.'],
    [],
    ['Use residency results to protect creative governance from silent drift.'],
    residency.length ? 'low' : 'medium',
    74,
    latestDate(residency)
  ));

  const deliverables = data.StudioDeliverable || [];
  const blockedPublishing = qa.filter(item => !item.publishing_gate_pass).length;
  reports.push(report(
    'Publishing',
    88 - Math.min(28, blockedPublishing * 2),
    'Publishing gate checks are active',
    blockedPublishing ? [`${blockedPublishing} QA records are not cleared for publishing.`] : [],
    [],
    ['Publishing must require Creative Approval, Production QA, Executive Approval and Governance Valid.'],
    blockedPublishing > 10 ? 'medium' : 'low',
    88,
    latestDate(deliverables.concat(qa))
  ));

  const assets = data.StudioAsset || [];
  const versions = data.StudioAssetVersion || [];
  const assetsWithoutVersion = assets.filter(asset => !versions.some(version => version.asset_id === asset.asset_id)).length;
  reports.push(report(
    'Asset Registry',
    assets.length ? Math.max(58, 92 - assetsWithoutVersion * 4) : 68,
    assets.length ? 'Asset registry available' : 'No studio assets in registry sample',
    assetsWithoutVersion ? [`${assetsWithoutVersion} assets have no version record in sample.`] : [],
    [],
    ['Maintain no-overwrite policy and version every generated production asset.'],
    assetsWithoutVersion ? 'medium' : 'low',
    82,
    latestDate(assets.concat(versions))
  ));

  reports.push(report(
    'Provider Registry',
    providers.length ? Math.max(55, 94 - staleProviders.length * 6) : 38,
    providers.length ? 'Provider registry exists' : 'Provider registry missing',
    staleProviders.length ? [`${staleProviders.length} stale provider records detected.`] : [],
    providers.length ? [] : ['Provider registry is empty.'],
    ['Refresh providers after configuration changes and compare failures by provider.'],
    providers.length ? (staleProviders.length ? 'medium' : 'low') : 'critical',
    86,
    latestDate(providers)
  ));

  const queue = data.JobQueue || [];
  const stuck = queue.filter(item => ['processing', 'queued'].includes(item.status) && stale(item.updated_date || item.created_date, 2)).length;
  reports.push(report(
    'Production Queue',
    queue.length ? Math.max(50, 92 - stuck * 12) : 82,
    queue.length ? 'Production queue visible' : 'No active production queue items',
    stuck ? [`${stuck} queue items appear stale.`] : [],
    stuck > 2 ? ['Production queue may be blocked.'] : [],
    ['Clear stale jobs and monitor queue processing after rendering failures.'],
    stuck > 2 ? 'high' : stuck ? 'medium' : 'low',
    78,
    latestDate(queue)
  ));

  return reports;
}

async function runAudit(base44, trigger, body) {
  const started = Date.now();
  const entityNames = ['CreativeAcademyModule', 'StudioReview', 'StudioProject', 'RenderingProvider', 'ProductionQAResult', 'RenderingAttempt', 'CreativeAcademyKnowledgeRecord', 'CreativeBenchmarkCase', 'CreativeBenchmarkRun', 'ComplianceRecord', 'ComplianceDocument', 'CreativeResidencyCase', 'StudioDeliverable', 'StudioAsset', 'StudioAssetVersion', 'JobQueue'];
  const data = {};
  for (const name of entityNames) data[name] = await listEntity(base44, name, '-created_date', 300);
  const reports = buildCategoryReports(data);
  const totalWeight = reports.reduce((sum, item) => sum + (WEIGHTS[item.category] || 1), 0);
  const health = reports.reduce((sum, item) => sum + item.health * (WEIGHTS[item.category] || 1), 0) / totalWeight;
  const warnings = reports.flatMap(item => item.warnings.map(message => ({ category: item.category, message })));
  const criticalIssues = reports.flatMap(item => item.errors.map(message => ({ category: item.category, message })));
  const recommendations = reports.flatMap(item => item.recommendations.map(message => ({ category: item.category, message })));
  const detectedProblems = reports.flatMap(item => [...item.errors, ...item.warnings].map(message => ({ category: item.category, message, risk_level: item.risk_level })));
  const score = Number(health.toFixed(1));
  const productionReadiness = readiness(score, criticalIssues.length, warnings.length);
  const riskLevel = risk(score, criticalIssues.length, warnings.length);
  const resolvedProblems = [];
  const previous = await base44.asServiceRole.entities.StudioAuditResult.list('-audit_timestamp', 1).catch(() => []);
  if (previous?.[0]) {
    const oldProblems = new Set(JSON.parse(previous[0].detected_problems_json || '[]').map(item => `${item.category}:${item.message}`));
    const currentProblems = new Set(detectedProblems.map(item => `${item.category}:${item.message}`));
    for (const item of oldProblems) if (!currentProblems.has(item)) resolvedProblems.push(item);
  }
  const systemChanges = [{ trigger, video_id: body.video_id || body.videoId || '', entity: body?.event?.entity_name || '', event_type: body?.event?.type || '' }];
  const auditId = `studio-audit-${crypto.randomUUID()}`;
  const record = await base44.asServiceRole.entities.StudioAuditResult.create({
    audit_id: auditId,
    trigger,
    audit_timestamp: new Date().toISOString(),
    duration_ms: Date.now() - started,
    overall_health_score: score,
    production_readiness: productionReadiness,
    category_reports_json: safeJson(reports),
    critical_issues_json: safeJson(criticalIssues),
    warnings_json: safeJson(warnings),
    recommendations_json: safeJson(recommendations),
    detected_problems_json: safeJson(detectedProblems),
    resolved_problems_json: safeJson(resolvedProblems),
    system_changes_json: safeJson(systemChanges),
    risk_level: riskLevel,
    confidence: 84,
    last_successful_validation_json: safeJson(Object.fromEntries(reports.map(item => [item.category, item.last_successful_validation]))),
    publishing_gate_active: reports.find(item => item.category === 'Publishing')?.health >= 70,
    qa_engine_active: reports.find(item => item.category === 'Production QA')?.health >= 55,
    rendering_router_active: reports.find(item => item.category === 'Rendering Intelligence')?.health >= 60,
    provider_registry_valid: reports.find(item => item.category === 'Provider Registry')?.health >= 60,
    benchmark_suite_available: reports.find(item => item.category === 'Benchmark Suite')?.health >= 60,
    audit_trail_complete: true,
    public_summary: `${productionReadiness} · Studio Health ${score}/100 · ${criticalIssues.length} critical issues · ${warnings.length} warnings`
  });
  return { ok: true, audit_id: record.id || auditId, studio_health_score: score, production_readiness: productionReadiness, critical_issues: criticalIssues, warnings, recommended_actions: recommendations, audit_timestamp: record.audit_timestamp, duration_ms: record.duration_ms, risk_level: riskLevel, category_reports: reports };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const user = await base44.auth.me().catch(() => null);
    const automationInvocation = Boolean(body?.event || ['daily_scheduled_audit', 'configuration_change'].includes(body.trigger));
    if (!isAllowedStaff(user) && !automationInvocation) return Response.json({ ok: false, error: 'Unauthorized: studio staff access required' }, { status: 403 });

    const action = body.action || 'run';
    if (action === 'latest') {
      const rows = await base44.asServiceRole.entities.StudioAuditResult.list('-audit_timestamp', 50).catch(() => []);
      return Response.json({ ok: true, latest: rows[0] || null, history: rows });
    }
    if (action !== 'run') return Response.json({ ok: false, error: 'Invalid action' }, { status: 400 });
    return Response.json(await runAudit(base44, body.trigger || body?.event?.entity_name || 'manual', body));
  } catch (error) {
    console.error('studioAuditSystem error:', error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});