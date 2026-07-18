import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

function today() { return new Date().toISOString().slice(0, 10); }
function monthKey(d = new Date()) { return d.toISOString().slice(0, 7); }
function safeJson(value) { try { return JSON.stringify(value || null); } catch { return '{}'; } }
function parseJson(value, fallback) { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } }
function sum(items, field) { return (items || []).reduce((t, i) => t + Number(i?.[field] || 0), 0); }
function countBy(items, getter) { const out = {}; for (const item of items || []) { const keys = getter(item); for (const key of Array.isArray(keys) ? keys : [keys]) { if (!key) continue; out[key] = (out[key] || 0) + 1; } } return out; }
function topEntries(obj, limit = 8) { return Object.entries(obj || {}).sort((a,b) => b[1] - a[1]).slice(0, limit).map(([label, value]) => ({ label, value })); }
function firstNumber(v) { const n = Number(v || 0); return Number.isFinite(n) ? n : 0; }

async function validatePerformerSession(base44, performerId, token) {
  if (!performerId || !token) return null;
  const sessions = await base44.asServiceRole.entities.PerformerSession.filter({ performer_id: performerId, token, revoked: false });
  const session = sessions?.[0];
  if (!session || new Date(session.expires_at) < new Date()) return null;
  return await base44.asServiceRole.entities.Performer.get(performerId).catch(() => null);
}

async function assertAdmin(base44) {
  const user = await base44.auth.me().catch(() => null);
  if (!user || user.role !== 'admin') return null;
  return user;
}

async function getPerformerVideoBundle(base44, performerId) {
  const credits = await base44.asServiceRole.entities.VideoPerformer.filter({ performer_id: performerId });
  const videoIds = [...new Set((credits || []).map(c => c.video_id).filter(Boolean))];
  const [videosRaw, statSets, viewsSets, purchasesSets] = await Promise.all([
    Promise.all(videoIds.map(id => base44.asServiceRole.entities.Video.get(id).catch(() => null))),
    Promise.all(videoIds.map(id => base44.asServiceRole.entities.VideoStatSnapshot.filter({ video_id: id }).catch(() => []))),
    Promise.all(videoIds.map(id => base44.asServiceRole.entities.VideoView.filter({ video_id: id }).catch(() => []))),
    Promise.all(videoIds.map(id => base44.asServiceRole.entities.FleshPayPurchase.filter({ video_id: id, status: 'completed' }).catch(() => [])))
  ]);
  const videos = videosRaw.filter(Boolean);
  const stats = statSets.flat();
  const views = viewsSets.flat();
  const purchases = purchasesSets.flat();
  const videoMap = Object.fromEntries(videos.map(v => [v.id, v]));
  return { credits, videoIds, videos, stats, views, purchases, videoMap };
}

function detectSeries(videos) {
  const names = ['Beach Escape', 'Hotel Sessions', 'Tokyo Nights', 'Massage Diaries', 'Summer Tour'];
  const series = [];
  for (const name of names) {
    const lower = name.toLowerCase();
    const matches = videos.filter(v => `${v.title || ''} ${v.description || ''} ${(v.tags || []).join(' ')} ${(v.categories || []).join(' ')}`.toLowerCase().includes(lower.replace(/s$/,'')) || `${v.title || ''}`.toLowerCase().includes(lower));
    if (matches.length) {
      series.push({ name, episodes_detected: matches.length, video_ids: matches.map(v => v.id), missing_next_episode: matches.length < 3 ? matches.length + 1 : null });
    }
  }
  return series;
}

function buildEvidence(performer, bundle, lineItems, submissions, fanApplications) {
  const { videos, stats, views, purchases, videoMap } = bundle;
  const categories = countBy(videos, v => v.categories || []);
  const tags = countBy(videos, v => v.tags || []);
  const locations = countBy(videos, v => {
    const text = `${v.title || ''} ${v.description || ''} ${(v.tags || []).join(' ')} ${(v.categories || []).join(' ')}`.toLowerCase();
    return ['hotel', 'beach', 'massage', 'gym', 'home', 'studio', 'tokyo', 'manila'].filter(k => text.includes(k));
  });
  const statsByVideo = {};
  for (const s of stats) {
    const id = s.video_id || `external:${s.external_title || s.id}`;
    if (!statsByVideo[id]) statsByVideo[id] = { revenue_usd: 0, views: 0, likes: 0, favourites: 0, sales_count: 0, title: videoMap[id]?.title || s.external_title || id };
    statsByVideo[id].revenue_usd += firstNumber(s.revenue_usd);
    statsByVideo[id].views += firstNumber(s.views);
    statsByVideo[id].likes += firstNumber(s.likes);
    statsByVideo[id].favourites += firstNumber(s.favourites);
    statsByVideo[id].sales_count += firstNumber(s.sales_count);
  }
  const recentVideos = [...videos].sort((a,b) => new Date(b.published_at || b.created_date || 0) - new Date(a.published_at || a.created_date || 0)).slice(0, 12);
  const series = detectSeries(videos);
  const revenueTotal = sum(stats, 'revenue_usd') + sum(lineItems, 'gross_amount_usd') + sum(purchases, 'amount_usd');
  const since24h = new Date(Date.now() - 24 * 86400000);
  const since7d = new Date(Date.now() - 7 * 86400000);
  const recentRevenue = (items, field, since) => (items || []).filter(i => new Date(i.created_date || i.completed_at || i.updated_date || 0) > since).reduce((t, i) => t + firstNumber(i[field]), 0);
  const revenue24h = recentRevenue(purchases, 'amount_usd', since24h) + recentRevenue(lineItems, 'gross_amount_usd', since24h);
  const revenue7d = recentRevenue(purchases, 'amount_usd', since7d) + recentRevenue(lineItems, 'gross_amount_usd', since7d);
  const sales24h = (purchases || []).filter(p => new Date(p.created_date || p.completed_at || 0) > since24h).length;
  const fanRequests7d = (fanApplications || []).filter(a => new Date(a.created_date || a.submitted_at || 0) > since7d).length;
  const viewsByVideo = countBy(views, v => v.video_id);
  const avgWatchSeconds = views.length ? Math.round(sum(views, 'duration_watched_seconds') / views.length) : 0;
  const applicationsText = (fanApplications || []).map(a => `${a.package_interest || ''} ${a.production_package || ''} ${a.message || ''} ${(a.production_preferences || []).join(' ')}`).join(' ').toLowerCase();
  return {
    performer: { id: performer.id, display_name: performer.display_name, revenue_split_pct: performer.revenue_split_pct || 40 },
    library: { video_count: videos.length, published_count: videos.filter(v => v.status === 'published').length, draft_count: videos.filter(v => v.status !== 'published').length, avg_duration_seconds: videos.length ? Math.round(sum(videos, 'duration_seconds') / videos.length) : 0, latest_upload: recentVideos[0]?.published_at || recentVideos[0]?.created_date || null, upload_count_30d: videos.filter(v => new Date(v.created_date || v.published_at || 0) > new Date(Date.now() - 30*86400000)).length },
    performance: { gross_revenue_usd: revenueTotal, revenue_last_24h_usd: revenue24h, revenue_last_7d_usd: revenue7d, stat_revenue_usd: sum(stats, 'revenue_usd'), purchase_revenue_usd: sum(purchases, 'amount_usd'), views: sum(stats, 'views') + views.length, likes: sum(stats, 'likes'), favourites: sum(stats, 'favourites'), sales_count: sum(stats, 'sales_count') + purchases.length, sales_last_24h: sales24h, avg_watch_seconds: avgWatchSeconds, top_videos: topEntries(statsByVideo, 8) },
    taxonomy: { top_categories: topEntries(categories), top_tags: topEntries(tags), locations: topEntries(locations), series },
    activity: { submissions_30d: submissions.filter(s => new Date(s.created_date || 0) > new Date(Date.now() - 30*86400000)).length, fan_requests_total: fanApplications.length, fan_requests_7d: fanRequests7d, fan_request_text_sample: applicationsText.slice(0, 900) },
    recent_videos: recentVideos.map(v => ({ id: v.id, title: v.title, status: v.status, categories: v.categories || [], tags: v.tags || [], duration_seconds: v.duration_seconds || 0, published_at: v.published_at || v.created_date }))
  };
}

async function generateAIDecision(base44, evidence) {
  const schema = {
    type: 'object',
    properties: {
      briefing: { type: 'object', properties: { headline: {type:'string'}, summary: {type:'string'}, today_mission: {type:'string'}, revenue_potential_usd: {type:'number'}, trends: {type:'array', items:{type:'string'}}, open_tasks: {type:'array', items:{type:'string'}} }, required: ['headline','summary','today_mission','revenue_potential_usd','trends','open_tasks'] },
      library_intelligence: { type: 'object', properties: { library_diversity:{type:'string'}, library_freshness:{type:'string'}, genre_balance:{type:'string'}, series_progress:{type:'string'}, missing_categories:{type:'array', items:{type:'string'}}, overused_locations:{type:'array', items:{type:'string'}}, content_saturation:{type:'array', items:{type:'string'}} }, required: ['library_diversity','library_freshness','genre_balance','series_progress','missing_categories','overused_locations','content_saturation'] },
      mission: { type:'object', properties:{ mission_type:{type:'string'}, title:{type:'string'}, description:{type:'string'}, expected_revenue_usd:{type:'number'}, difficulty:{type:'string'}, production_time_hours:{type:'number'}, priority:{type:'string'}, reason:{type:'string'} }, required:['mission_type','title','description','expected_revenue_usd','difficulty','production_time_hours','priority','reason'] },
      recommendations: { type:'array', items:{ type:'object', properties:{ recommendation_type:{type:'string'}, title:{type:'string'}, recommendation:{type:'string'}, revenue_impact_usd:{type:'number'}, revenue_impact_label:{type:'string'}, confidence:{type:'number'}, reason:{type:'string'}, priority:{type:'string'}, expiration_days:{type:'integer'}, evidence_keys:{type:'array', items:{type:'string'}} }, required:['recommendation_type','title','recommendation','revenue_impact_usd','revenue_impact_label','confidence','reason','priority','expiration_days','evidence_keys'] } }
    },
    required: ['briefing','library_intelligence','mission','recommendations']
  };
  const prompt = `You are the FLESHLAB Creator Operating System analyst. Use ONLY the supplied JSON evidence. Do not invent statistics, fans, comments, CTR, retention, or revenue. If a metric is missing, explicitly base the recommendation on available nearby signals and lower confidence. Produce operational adult-creator studio recommendations: what to film, continue, improve, or study. Avoid explicit graphic wording. Evidence JSON:\n${JSON.stringify(evidence).slice(0, 18000)}`;
  return await base44.asServiceRole.integrations.Core.InvokeLLM({
    model: 'automatic',
    prompt,
    response_json_schema: schema
  });
}

async function expireOldRecommendations(base44, performerId) {
  const active = await base44.asServiceRole.entities.ContentRecommendation.filter({ performer_id: performerId, status: 'active' }).catch(() => []);
  const now = today();
  await Promise.all((active || []).filter(r => r.expiration_date && r.expiration_date < now).map(r => base44.asServiceRole.entities.ContentRecommendation.update(r.id, { status: 'expired' }).catch(() => null)));
}

async function generateForPerformer(base44, performerId, reason) {
  const performer = await base44.asServiceRole.entities.Performer.get(performerId);
  if (!performer) throw new Error('Performer not found');
  await expireOldRecommendations(base44, performerId);
  const bundle = await getPerformerVideoBundle(base44, performerId);
  const [lineItems, submissions, fanApplications] = await Promise.all([
    base44.asServiceRole.entities.PerformerEarningLineItem.filter({ performer_id: performerId }).catch(() => []),
    base44.asServiceRole.entities.ContentSubmission.filter({ performer_id: performerId }).catch(() => []),
    base44.asServiceRole.entities.GuestProductionApplication.filter({ preferred_performer: performer.display_name }).catch(() => [])
  ]);
  const evidence = buildEvidence(performer, bundle, lineItems || [], submissions || [], fanApplications || []);
  const runId = `${performerId}-${Date.now()}`;
  const ai = await generateAIDecision(base44, evidence);
  const now = new Date().toISOString();
  const briefing = await base44.asServiceRole.entities.CreatorDailyBriefing.create({
    performer_id: performerId,
    run_id: runId,
    briefing_date: today(),
    greeting: `Good Morning, ${performer.display_name || 'Creator'}.`,
    headline: ai.briefing.headline,
    summary: ai.briefing.summary,
    today_mission: ai.briefing.today_mission,
    revenue_last_24h_usd: firstNumber(evidence.performance.revenue_last_24h_usd),
    revenue_last_7d_usd: firstNumber(evidence.performance.revenue_last_7d_usd),
    new_sales_count: firstNumber(evidence.performance.sales_last_24h),
    new_fans_count: firstNumber(evidence.activity.fan_requests_7d),
    revenue_potential_usd: firstNumber(ai.briefing.revenue_potential_usd),
    trends_json: safeJson(ai.briefing.trends),
    open_tasks_json: safeJson(ai.briefing.open_tasks),
    evidence_json: safeJson(evidence),
    generated_at: now
  });
  const mission = await base44.asServiceRole.entities.CreatorProductionMission.create({
    performer_id: performerId,
    run_id: runId,
    mission_date: today(),
    mission_type: ['film','continue_series','record_bts','improve_asset','collaborate','restock_fanclub'].includes(ai.mission.mission_type) ? ai.mission.mission_type : 'film',
    title: ai.mission.title,
    description: ai.mission.description,
    expected_revenue_usd: firstNumber(ai.mission.expected_revenue_usd),
    difficulty: ['easy','medium','hard'].includes(ai.mission.difficulty) ? ai.mission.difficulty : 'medium',
    production_time_hours: firstNumber(ai.mission.production_time_hours),
    priority: ['critical','high','medium','low'].includes(ai.mission.priority) ? ai.mission.priority : 'medium',
    reason: ai.mission.reason,
    evidence_json: safeJson(evidence),
    generated_at: now
  });
  const lib = await base44.asServiceRole.entities.CreatorLibraryIntelligence.create({
    performer_id: performerId,
    run_id: runId,
    analysis_date: today(),
    library_diversity: ai.library_intelligence.library_diversity,
    library_freshness: ai.library_intelligence.library_freshness,
    genre_balance: ai.library_intelligence.genre_balance,
    series_progress: ai.library_intelligence.series_progress,
    missing_categories_json: safeJson(ai.library_intelligence.missing_categories),
    overused_locations_json: safeJson(ai.library_intelligence.overused_locations),
    content_saturation_json: safeJson(ai.library_intelligence.content_saturation),
    series_json: safeJson(evidence.taxonomy.series),
    evidence_json: safeJson(evidence),
    generated_at: now
  });
  const recPayloads = (ai.recommendations || []).slice(0, 8).map(r => {
    const expiry = new Date(Date.now() + Math.max(1, firstNumber(r.expiration_days) || 14) * 86400000).toISOString().slice(0, 10);
    return {
      performer_id: performerId,
      scope: 'performer',
      recommendation_type: ['content_strategy','production_plan','creative_director','revenue','chemistry','opportunity','academy','fan_intelligence','library','series'].includes(r.recommendation_type) ? r.recommendation_type : 'content_strategy',
      title: r.title,
      recommendation: r.recommendation,
      revenue_impact_label: r.revenue_impact_label,
      revenue_impact_usd: firstNumber(r.revenue_impact_usd),
      confidence: Math.max(0, Math.min(100, firstNumber(r.confidence))),
      reason: r.reason,
      priority: ['critical','high','medium','low'].includes(r.priority) ? r.priority : 'medium',
      expiration_date: expiry,
      status: 'active',
      source_run_id: runId,
      source_data_json: safeJson(evidence),
      evidence_json: safeJson({ evidence_keys: r.evidence_keys || [], generated_reason: reason }),
      generated_at: now
    };
  });
  const recs = recPayloads.length ? await base44.asServiceRole.entities.ContentRecommendation.bulkCreate(recPayloads) : [];
  return { run_id: runId, briefing_id: briefing.id, mission_id: mission.id, library_id: lib.id, recommendation_count: recs.length, evidence_summary: evidence };
}

async function getCreatorOS(base44, performerId) {
  const [briefings, recs, libs, missions] = await Promise.all([
    base44.asServiceRole.entities.CreatorDailyBriefing.filter({ performer_id: performerId }).catch(() => []),
    base44.asServiceRole.entities.ContentRecommendation.filter({ performer_id: performerId, status: 'active' }).catch(() => []),
    base44.asServiceRole.entities.CreatorLibraryIntelligence.filter({ performer_id: performerId }).catch(() => []),
    base44.asServiceRole.entities.CreatorProductionMission.filter({ performer_id: performerId, status: 'active' }).catch(() => [])
  ]);
  const sortNew = arr => [...(arr || [])].sort((a,b) => new Date(b.generated_at || b.created_date || 0) - new Date(a.generated_at || a.created_date || 0));
  return {
    briefing: sortNew(briefings)[0] || null,
    recommendations: sortNew(recs).slice(0, 8),
    library: sortNew(libs)[0] || null,
    mission: sortNew(missions)[0] || null
  };
}

async function analyzeVideo(base44, videoId, reason) {
  const video = await base44.asServiceRole.entities.Video.get(videoId).catch(() => null);
  if (!video) return { skipped: true, reason: 'video_not_found' };
  const credits = await base44.asServiceRole.entities.VideoPerformer.filter({ video_id: videoId }).catch(() => []);
  const performers = await Promise.all((credits || []).map(c => base44.asServiceRole.entities.Performer.get(c.performer_id).catch(() => null)));
  const ctx = { title: video.title, description: video.description, categories: video.categories || [], tags: video.tags || [], duration_seconds: video.duration_seconds || 0, thumbnail: !!video.primary_thumbnail_url, performers: performers.filter(Boolean).map(p => p.display_name) };
  const schema = { type:'object', properties:{ categories:{type:'array',items:{type:'string'}}, locations:{type:'array',items:{type:'string'}}, series_name:{type:'string'}, episode_number:{type:'integer'}, creative_notes:{type:'string'}, quality_notes:{type:'array',items:{type:'string'}}, improvement_suggestions:{type:'array',items:{type:'string'}} }, required:['categories','locations','creative_notes','quality_notes','improvement_suggestions'] };
  const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({ model:'automatic', prompt:`Analyze this FLESHLAB video metadata for library intelligence only. Do not invent visual facts not present in title/description/tags. JSON context:\n${JSON.stringify(ctx)}`, response_json_schema: schema });
  const now = new Date().toISOString();
  const rows = [];
  for (const c of credits || []) {
    rows.push(await base44.asServiceRole.entities.CreatorVideoAIAnalysis.create({
      video_id: videoId,
      performer_id: c.performer_id,
      analysis_status: 'complete',
      detected_categories_json: safeJson(ai.categories),
      detected_locations_json: safeJson(ai.locations),
      series_name: ai.series_name || null,
      episode_number: ai.episode_number || null,
      creative_notes: ai.creative_notes,
      quality_notes_json: safeJson(ai.quality_notes),
      improvement_suggestions_json: safeJson(ai.improvement_suggestions),
      evidence_json: safeJson({ reason, video: ctx }),
      generated_at: now
    }));
    await generateForPerformer(base44, c.performer_id, 'video_upload_analysis');
  }
  return { analyzed: rows.length, video_id: videoId };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'get_creator_os';

    if (action === 'get_creator_os') {
      const performer = await validatePerformerSession(base44, body.performer_id, body.performer_token);
      if (!performer) return Response.json({ error: 'Invalid performer session' }, { status: 401 });
      const data = await getCreatorOS(base44, performer.id);
      return Response.json({ success: true, ...data });
    }

    if (action === 'set_recommendation_status') {
      const performer = await validatePerformerSession(base44, body.performer_id, body.performer_token);
      if (!performer) return Response.json({ error: 'Invalid performer session' }, { status: 401 });
      if (!['accepted','ignored'].includes(body.status)) return Response.json({ error: 'Invalid status' }, { status: 400 });
      const rec = await base44.asServiceRole.entities.ContentRecommendation.get(body.recommendation_id);
      if (!rec || rec.performer_id !== performer.id) return Response.json({ error: 'Recommendation not found' }, { status: 404 });
      const patch = body.status === 'accepted' ? { status: 'accepted', accepted_at: new Date().toISOString() } : { status: 'ignored', ignored_at: new Date().toISOString() };
      await base44.asServiceRole.entities.ContentRecommendation.update(rec.id, patch);
      return Response.json({ success: true });
    }

    if (action === 'generate_for_performer') {
      let performer = await validatePerformerSession(base44, body.performer_id, body.performer_token);
      if (!performer) {
        const admin = await assertAdmin(base44);
        if (!admin && body.source !== 'automation') return Response.json({ error: 'Unauthorized' }, { status: 401 });
        performer = await base44.asServiceRole.entities.Performer.get(body.performer_id).catch(() => null);
      }
      if (!performer) return Response.json({ error: 'Performer not found' }, { status: 404 });
      const result = await generateForPerformer(base44, performer.id, body.reason || 'manual');
      return Response.json({ success: true, ...result });
    }

    if (action === 'admin_update_recommendation') {
      const admin = await assertAdmin(base44);
      if (!admin) return Response.json({ error: 'Admin access required' }, { status: 403 });
      const rec = await base44.asServiceRole.entities.ContentRecommendation.get(body.recommendation_id);
      if (!rec) return Response.json({ error: 'Recommendation not found' }, { status: 404 });
      const patch = {};
      if (body.priority) patch.studio_priority_override = body.priority;
      if (body.studio_override !== undefined) patch.studio_override = String(body.studio_override || '');
      if (body.hidden === true) { patch.status = 'hidden'; patch.hidden_by_admin = true; patch.hidden_reason = String(body.hidden_reason || 'Hidden by studio'); }
      await base44.asServiceRole.entities.ContentRecommendation.update(rec.id, patch);
      return Response.json({ success: true });
    }

    if (action === 'run_daily_for_all') {
      const admin = await assertAdmin(base44);
      if (!admin && body.source !== 'automation') return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const performers = await base44.asServiceRole.entities.Performer.filter({ account_status: 'active' }).catch(() => []);
      if (body.dry_run) return Response.json({ success: true, dry_run: true, active_performers: performers.length });
      const limit = Math.min(Number(body.limit || 20), 50);
      const results = [];
      for (const performer of performers.slice(0, limit)) {
        try { results.push({ performer_id: performer.id, ...(await generateForPerformer(base44, performer.id, 'daily_creator_os')) }); }
        catch (e) { results.push({ performer_id: performer.id, error: e.message }); }
      }
      return Response.json({ success: true, processed: results.length, results });
    }

    if (action === 'analyze_video_upload') {
      const admin = await assertAdmin(base44);
      const eventVideoId = body.video_id || body?.event?.entity_id || body?.data?.id;
      if (!admin && body.source !== 'automation' && !body.event) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const result = await analyzeVideo(base44, eventVideoId, body.reason || 'video_entity_event');
      return Response.json({ success: true, ...result });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('creatorOSService error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});