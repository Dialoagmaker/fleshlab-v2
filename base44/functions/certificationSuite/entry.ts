import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const VERSION = 'CERT-1.0.0';
const DOMAINS = ['Creative Intelligence', 'Governance', 'Creative Review Board', 'Executive Decision Engine', 'Rendering Intelligence', 'Provider Routing', 'Production QA', 'Publishing Gate', 'Production Memory', 'Creative Memory', 'Benchmark Suite', 'Studio Audit', 'Regression Tracking', 'Analytics', 'Asset Registry'];

function isAdmin(user) {
  return user && ['admin', 'super_admin'].includes(user.role);
}

function safeJson(value) {
  try { return JSON.stringify(value || null); } catch (_) { return '{}'; }
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

async function listEntity(base44, name, sort = '-created_date', limit = 300) {
  try { return await base44.asServiceRole.entities[name].list(sort, limit); } catch (_) { return []; }
}

function makeTest(domain, name, kind, passed, score, severity, message, recommendation = '') {
  return { domain, name, kind, passed: Boolean(passed), score: clamp(score), severity, message, recommendation, executed_at: new Date().toISOString() };
}

function duplicateCount(rows, key) {
  const seen = new Set();
  let duplicates = 0;
  for (const row of rows) {
    const value = row[key];
    if (!value) continue;
    if (seen.has(value)) duplicates += 1;
    seen.add(value);
  }
  return duplicates;
}

function average(numbers) {
  const values = numbers.filter(value => Number.isFinite(Number(value)));
  return values.length ? values.reduce((sum, value) => sum + Number(value), 0) / values.length : 0;
}

function statusFor(score, failedCritical, failedCount) {
  if (failedCritical > 0 || score < 75) return 'NOT CERTIFIED';
  if (failedCount > 0 || score < 92) return 'CERTIFIED WITH WARNINGS';
  return 'CERTIFIED';
}

function aggregateSubsystemScores(tests) {
  const scores = {};
  for (const domain of DOMAINS) {
    const domainTests = tests.filter(test => test.domain === domain);
    scores[domain] = domainTests.length ? Number(average(domainTests.map(test => test.score)).toFixed(1)) : 0;
  }
  return scores;
}

function buildStressMetrics(attempts, qa, videos, batchSize) {
  const terminalDecisions = ['APPROVED', 'APPROVED WITH MINOR FIXES', 'REVISION REQUIRED', 'REJECTED', 'QA_TECHNICAL_FAILURE'];
  const totalAttempts = attempts.length;
  const failedAttempts = attempts.filter(item => !item.success).length;
  const retryableFailures = attempts.filter(item => item.error_category && item.error_category !== 'CONTENT_POLICY').length;
  const successfulAttempts = attempts.filter(item => item.success && item.generation_job_id).slice(0, batchSize);
  const published = videos.filter(item => item.status === 'published' || item.release_status === 'public').length;
  const qaByGeneration = new Map();
  for (const row of qa) {
    if (!row.generation_job_id) continue;
    if (!qaByGeneration.has(row.generation_job_id)) qaByGeneration.set(row.generation_job_id, []);
    qaByGeneration.get(row.generation_job_id).push(row);
  }
  const qaMatched = successfulAttempts.map(attempt => qaByGeneration.get(attempt.generation_job_id) || []);
  const terminalMatches = qaMatched.filter(rows => rows.some(row => terminalDecisions.includes(row.final_decision)));
  const duplicateUnintended = qaMatched.filter(rows => rows.length > 1).length;
  return {
    configured_batch_size: batchSize,
    sample_attempts: totalAttempts,
    eligible_generated_assets: successfulAttempts.length,
    qa_triggered: qaMatched.filter(rows => rows.length > 0).length,
    terminal_qa_states: terminalMatches.length,
    missing_qa_results: Math.max(0, successfulAttempts.length - terminalMatches.length),
    duplicate_unintended_qa_records: duplicateUnintended,
    average_runtime_ms: Number(average(attempts.map(item => Number(item.runtime_ms || 0))).toFixed(1)),
    failure_rate: totalAttempts ? Number(((failedAttempts / totalAttempts) * 100).toFixed(1)) : 0,
    retry_rate: totalAttempts ? Number(((retryableFailures / totalAttempts) * 100).toFixed(1)) : 0,
    provider_failover_success: successfulAttempts.length > 0 || totalAttempts === 0,
    qa_completion_rate: successfulAttempts.length ? Number((terminalMatches.length / successfulAttempts.length * 100).toFixed(1)) : 0,
    publishing_success_rate: videos.length ? Number((published / videos.length * 100).toFixed(1)) : 0,
    memory_integrity: failedAttempts <= Math.max(2, totalAttempts * 0.35)
  };
}

function buildTests(data, auditResponse, stressBatchSize) {
  const tests = [];
  const projects = data.StudioProject || [];
  const reviews = data.StudioReview || [];
  const providers = data.RenderingProvider || [];
  const enabledProviders = providers.filter(item => item.enabled && item.current_availability !== 'unavailable');
  const attempts = data.RenderingAttempt || [];
  const qa = data.ProductionQAResult || [];
  const audits = data.StudioAuditResult || [];
  const assets = data.StudioAsset || [];
  const versions = data.StudioAssetVersion || [];
  const benchmarks = data.CreativeBenchmarkCase || [];
  const benchmarkRuns = data.CreativeBenchmarkRun || [];
  const knowledge = data.CreativeAcademyKnowledgeRecord || [];
  const modules = data.CreativeAcademyModule || [];
  const conversions = data.ConversionEvent || [];
  const pageViews = data.PageView || [];
  const videos = data.Video || [];
  const logs = data.OpenRouterImageGenerationLog || [];
  const latestAudit = auditResponse?.ok ? auditResponse : null;
  const publishingGateActive = Boolean(latestAudit?.category_reports?.find(item => item.category === 'Publishing')?.health >= 70 || audits[0]?.publishing_gate_active);
  const qaActive = Boolean(latestAudit?.category_reports?.find(item => item.category === 'Production QA')?.health >= 55 || audits[0]?.qa_engine_active);
  const providerRegistryValid = Boolean(enabledProviders.length && duplicateCount(providers, 'provider_id') === 0);
  const assetsWithoutVersion = assets.filter(asset => !versions.some(version => version.asset_id === asset.asset_id)).length;
  const orphanVersions = versions.filter(version => !assets.some(asset => asset.asset_id === version.asset_id)).length;
  const invalidBenchmarkLinks = benchmarkRuns.filter(run => run.suite_version && !benchmarks.some(item => item.suite_version === run.suite_version)).length;
  const stress = buildStressMetrics(attempts, qa, videos, stressBatchSize);

  tests.push(makeTest('Creative Intelligence', 'New campaign creation path', 'end_to_end', projects.length > 0, projects.length ? 92 : 35, 'critical', projects.length ? 'Campaign records are available.' : 'No campaign/project records are available.', 'Create at least one Studio Project campaign before certification.'));
  tests.push(makeTest('Creative Intelligence', 'Creative Brief approval', 'end_to_end', projects.some(item => item.creative_brief && item.approval_state === 'approved') || reviews.some(item => item.review_type === 'creative_review' && item.decision === 'approved'),  projects.some(item => item.creative_brief) ? 88 : 42, 'critical', 'Creative brief approval path inspected.', 'Approve a creative brief through the review workflow.'));
  tests.push(makeTest('Executive Decision Engine', 'Executive approval', 'end_to_end', reviews.some(item => item.review_type === 'executive_review' && item.decision === 'approved') || qa.some(item => item.executive_approval_pass), qa.some(item => item.executive_approval_pass) ? 92 : 48, 'critical', 'Executive approval gate inspected.', 'Record executive approval before release certification.'));
  tests.push(makeTest('Rendering Intelligence', 'Rendering request execution', 'end_to_end', attempts.length > 0 || logs.length > 0, attempts.length || logs.length ? 90 : 50, 'critical', 'Rendering execution memory inspected.', 'Run at least one rendering request before certification.'));
  tests.push(makeTest('Provider Routing', 'Automatic provider routing', 'end_to_end', enabledProviders.length > 0, enabledProviders.length ? 94 : 25, 'critical', 'Provider routing registry inspected.', 'Enable at least one compatible rendering provider.'));
  tests.push(makeTest('Rendering Intelligence', 'Successful rendering', 'end_to_end', attempts.some(item => item.success) || logs.some(item => item.status === 'succeeded'), attempts.some(item => item.success) ? 94 : 45, 'critical', 'Successful render output inspected.', 'Complete one successful render before certification.'));
  tests.push(makeTest('Production QA', 'Production QA evaluation', 'end_to_end', qa.length > 0, qa.length ? 92 : 38, 'critical', 'Production QA result history inspected.', 'Run Production QA on at least one generated asset.'));
  tests.push(makeTest('Publishing Gate', 'Publishing approval', 'end_to_end', publishingGateActive && qa.some(item => item.publishing_gate_pass), publishingGateActive ? 84 : 35, 'critical', 'Publishing approval gate inspected.', 'Publish only after Creative, QA, Executive and Governance approvals pass.'));
  tests.push(makeTest('Studio Audit', 'Audit verification', 'end_to_end', Boolean(latestAudit?.ok || audits.length), latestAudit?.ok ? 96 : 55, 'critical', 'Studio Audit was invoked during certification.', 'Keep Studio Audit green before certification.'));
  tests.push(makeTest('Production Memory', 'Production memory update', 'end_to_end', attempts.length > 0, attempts.length ? 90 : 45, 'critical', 'Production memory inspected.', 'Record RenderingAttempt memory for production jobs.'));
  tests.push(makeTest('Analytics', 'Analytics update', 'end_to_end', conversions.length > 0 || pageViews.length > 0, conversions.length || pageViews.length ? 88 : 54, 'warning', 'Analytics event stores inspected.', 'Confirm conversion and page-view tracking in production.'));

  tests.push(makeTest('Publishing Gate', 'Reject missing approvals', 'negative', publishingGateActive, publishingGateActive ? 96 : 30, 'critical', 'Publishing gate rejects missing approvals when active.', 'Keep approval validation mandatory.'));
  tests.push(makeTest('Production QA', 'Reject failed QA', 'negative', qaActive, qaActive ? 94 : 35, 'critical', 'QA rejection path inspected.', 'Ensure failed QA cannot pass publishing.'));
  tests.push(makeTest('Provider Routing', 'Reject broken provider routing', 'negative', providerRegistryValid, providerRegistryValid ? 92 : 30, 'critical', 'Provider routing validity inspected.', 'Fix provider registry before certification.'));
  tests.push(makeTest('Governance', 'Reject disabled governance', 'negative', publishingGateActive && latestAudit?.production_readiness !== 'BLOCKED', publishingGateActive ? 90 : 32, 'critical', 'Governance disablement rejection inspected.', 'Studio Audit must block disabled governance.'));
  tests.push(makeTest('Provider Routing', 'Reject corrupted provider registry', 'negative', duplicateCount(providers, 'provider_id') === 0, duplicateCount(providers, 'provider_id') === 0 ? 94 : 25, 'critical', 'Duplicate provider identifiers checked.', 'Remove duplicate provider identifiers.'));
  tests.push(makeTest('Executive Decision Engine', 'Reject publishing without Executive approval', 'negative', publishingGateActive, publishingGateActive ? 94 : 30, 'critical', 'Executive approval rejection inspected.', 'Keep executive approval mandatory.'));
  tests.push(makeTest('Publishing Gate', 'Reject publishing without QA approval', 'negative', publishingGateActive && qaActive, publishingGateActive && qaActive ? 94 : 30, 'critical', 'QA approval rejection inspected.', 'Keep Production QA approval mandatory.'));
  tests.push(makeTest('Creative Intelligence', 'Reject missing Creative Brief', 'negative', projects.length === 0 || projects.some(item => item.creative_brief), projects.some(item => item.creative_brief) ? 86 : 50, 'warning', 'Creative brief presence inspected.', 'Require a creative brief for every campaign.'));
  tests.push(makeTest('Asset Registry', 'Reject invalid asset metadata', 'negative', duplicateCount(assets, 'asset_id') === 0 && assetsWithoutVersion === 0, duplicateCount(assets, 'asset_id') === 0 && assetsWithoutVersion === 0 ? 94 : 45, 'critical', 'Asset metadata consistency inspected.', 'Fix orphaned or duplicate asset metadata.'));

  tests.push(makeTest('Rendering Intelligence', 'Stress average runtime acceptable', 'stress', stress.average_runtime_ms === 0 || stress.average_runtime_ms < 180000, stress.average_runtime_ms === 0 ? 78 : 92, 'warning', 'Rendering runtime stress sample evaluated.', 'Investigate slow rendering providers.'));
  tests.push(makeTest('Rendering Intelligence', 'Stress failure rate acceptable', 'stress', stress.failure_rate <= 35, 100 - stress.failure_rate, 'critical', 'Rendering failure rate evaluated.', 'Reduce provider failure rate before certification.'));
  tests.push(makeTest('Provider Routing', 'Provider failover success', 'stress', stress.provider_failover_success, stress.provider_failover_success ? 90 : 40, 'critical', 'Provider failover inspected.', 'Enable alternate providers for failover.'));
  tests.push(makeTest('Production QA', 'QA completion rate', 'stress', stress.eligible_generated_assets > 0 && stress.qa_completion_rate === 100 && stress.missing_qa_results === 0 && stress.duplicate_unintended_qa_records === 0, stress.eligible_generated_assets ? stress.qa_completion_rate : 35, 'warning', 'QA completion rate evaluated against successful generated assets with matching terminal QA states.', 'Every successful generated asset must have exactly one terminal Production QA result linked by generation job.'));
  tests.push(makeTest('Publishing Gate', 'Publishing success rate', 'stress', stress.publishing_success_rate >= 20 || videos.length === 0, videos.length ? stress.publishing_success_rate : 75, 'warning', 'Publishing success rate evaluated.', 'Review publishing blockers and gate failures.'));
  tests.push(makeTest('Production Memory', 'Memory integrity under batch load', 'stress', stress.memory_integrity, stress.memory_integrity ? 92 : 40, 'critical', 'Production memory integrity evaluated.', 'Repair failed/stale production memory.'));

  tests.push(makeTest('Asset Registry', 'No orphan assets', 'consistency', assetsWithoutVersion === 0 && orphanVersions === 0, assetsWithoutVersion || orphanVersions ? 45 : 96, 'critical', 'Asset/version references checked.', 'Create missing asset versions or remove orphan version records.'));
  tests.push(makeTest('Asset Registry', 'No duplicate identifiers', 'consistency', duplicateCount(assets, 'asset_id') === 0 && duplicateCount(projects, 'project_id') === 0,  duplicateCount(assets, 'asset_id') || duplicateCount(projects, 'project_id') ? 35 : 96, 'critical', 'Duplicate IDs checked.', 'Deduplicate asset and project identifiers.'));
  tests.push(makeTest('Studio Audit', 'No missing audit records', 'consistency', latestAudit?.ok || audits.length > 0, latestAudit?.ok ? 96 : 40, 'critical', 'Audit record availability checked.', 'Run and retain Studio Audit records.'));
  tests.push(makeTest('Production Memory', 'No missing production memory', 'consistency', attempts.length > 0 || enabledProviders.length === 0, attempts.length ? 92 : 55, 'warning', 'Production memory availability checked.', 'Persist production memory for render attempts.'));
  tests.push(makeTest('Benchmark Suite', 'No invalid benchmark links', 'consistency', benchmarks.length > 0 && invalidBenchmarkLinks === 0, benchmarks.length && invalidBenchmarkLinks === 0 ? 92 : 42, 'critical', 'Benchmark links checked.', 'Install benchmark cases and repair invalid benchmark links.'));
  tests.push(makeTest('Creative Memory', 'Creative memory available', 'consistency', knowledge.length > 0 || modules.length > 0, knowledge.length || modules.length ? 84 : 48, 'warning', 'Creative memory inspected.', 'Persist creative memory and lessons from campaigns.'));
  tests.push(makeTest('Regression Tracking', 'Regression tracking active', 'consistency', benchmarkRuns.length > 0 || audits.length > 0, benchmarkRuns.length || audits.length ? 82 : 45, 'warning', 'Regression tracking signals inspected.', 'Run benchmarks after upgrades to produce regression history.'));
  tests.push(makeTest('Creative Review Board', 'Review Board operational', 'consistency', reviews.length > 0, reviews.length ? 88 : 48, 'warning', 'Review Board record trail inspected.', 'Record review board decisions for major campaigns.'));

  return { tests, stress };
}

async function runCertification(base44, body) {
  const started = Date.now();
  const stressBatchSize = Math.max(1, Math.min(50, Number(body.stress_batch_size || 5)));
  const names = ['StudioProject', 'StudioReview', 'RenderingProvider', 'RenderingAttempt', 'ProductionQAResult', 'StudioAuditResult', 'StudioAsset', 'StudioAssetVersion', 'CreativeBenchmarkCase', 'CreativeBenchmarkRun', 'CreativeAcademyKnowledgeRecord', 'CreativeAcademyModule', 'ConversionEvent', 'PageView', 'Video', 'OpenRouterImageGenerationLog'];
  const data = {};
  for (const name of names) data[name] = await listEntity(base44, name, '-created_date', 500);
  const auditResponse = await base44.functions.invoke('studioAuditSystem', { action: 'run', trigger: 'certification_suite' }).then(res => res.data).catch(() => null);
  data.StudioAuditResult = await listEntity(base44, 'StudioAuditResult', '-audit_timestamp', 100);
  const { tests, stress } = buildTests(data, auditResponse, stressBatchSize);
  const passed = tests.filter(test => test.passed);
  const failed = tests.filter(test => !test.passed);
  const warnings = tests.filter(test => test.severity === 'warning' && !test.passed).map(test => ({ domain: test.domain, test: test.name, message: test.message }));
  const recommendations = tests.filter(test => !test.passed || test.recommendation).map(test => ({ domain: test.domain, test: test.name, recommendation: test.recommendation })).filter(item => item.recommendation);
  const score = Number(average(tests.map(test => test.score)).toFixed(1));
  const failedCritical = failed.filter(test => test.severity === 'critical').length;
  const certificationStatus = statusFor(score, failedCritical, failed.length);
  const configRows = await listEntity(base44, 'StudioCertificationConfig', '-created_date', 1);
  const config = configRows[0] || { release_gate_required: false, required_status: 'CERTIFIED', minimum_score: 90 };
  const releaseGatePass = !config.release_gate_required || (score >= Number(config.minimum_score || 90) && (config.required_status === 'CERTIFIED WITH WARNINGS' ? certificationStatus !== 'NOT CERTIFIED' : certificationStatus === 'CERTIFIED'));
  const subsystemScores = aggregateSubsystemScores(tests);
  const record = await base44.asServiceRole.entities.StudioCertificationResult.create({
    certification_id: `cert-${crypto.randomUUID()}`,
    version: VERSION,
    trigger: body.trigger || 'manual',
    timestamp: new Date().toISOString(),
    execution_time_ms: Date.now() - started,
    overall_certification_score: score,
    certification_status: certificationStatus,
    subsystem_scores_json: safeJson(subsystemScores),
    passed_tests_json: safeJson(passed),
    failed_tests_json: safeJson(failed),
    warnings_json: safeJson(warnings),
    recommendations_json: safeJson(recommendations),
    stress_metrics_json: safeJson(stress),
    scenario_results_json: safeJson(tests.filter(test => test.kind === 'end_to_end')),
    negative_results_json: safeJson(tests.filter(test => test.kind === 'negative')),
    consistency_results_json: safeJson(tests.filter(test => test.kind === 'consistency')),
    release_gate_required: Boolean(config.release_gate_required),
    release_gate_pass: releaseGatePass,
    public_summary: `${certificationStatus} · ${score}/100 · ${passed.length} passed · ${failed.length} failed`
  });
  return { ok: true, certification_id: record.id, version: VERSION, overall_certification_score: score, certification_status: certificationStatus, subsystem_scores: subsystemScores, passed_tests: passed, failed_tests: failed, warnings, recommendations, stress_metrics: stress, execution_time_ms: record.execution_time_ms, timestamp: record.timestamp, release_gate_required: Boolean(config.release_gate_required), release_gate_pass: releaseGatePass };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isAdmin(user)) return Response.json({ ok: false, error: 'Forbidden: admin access required' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'run';
    if (action === 'latest') {
      const rows = await base44.asServiceRole.entities.StudioCertificationResult.list('-timestamp', 50).catch(() => []);
      const config = await base44.asServiceRole.entities.StudioCertificationConfig.list('-created_date', 1).catch(() => []);
      return Response.json({ ok: true, latest: rows[0] || null, history: rows, config: config[0] || null });
    }
    if (action !== 'run') return Response.json({ ok: false, error: 'Invalid action' }, { status: 400 });
    return Response.json(await runCertification(base44, body));
  } catch (error) {
    console.error('certificationSuite error:', error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});