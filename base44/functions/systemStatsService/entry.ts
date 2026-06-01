// systemStatsService — Computes and caches platform-wide counters in a SystemStat singleton.
// This function is the ONLY place that runs unbounded entity counts.
// The Dashboard reads from SystemStat — it never runs its own counts.
//
// Actions:
//   refresh_dashboard_stats — recomputes all counters and upserts SystemStat

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'refresh_dashboard_stats';

    if (action !== 'refresh_dashboard_stats') {
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // --- Count each entity (server-side, runs once and is cached) ---
    const [videos, performers, brands, news, videoPerformers] = await Promise.all([
      base44.asServiceRole.entities.Video.list('-created_date', 10000),
      base44.asServiceRole.entities.Performer.list('-created_date', 10000),
      base44.asServiceRole.entities.Brand.list('-created_date', 10000),
      base44.asServiceRole.entities.NewsArticle.list('-created_date', 10000),
      base44.asServiceRole.entities.VideoPerformer.list('-created_date', 50000),
    ]);

    const totalVideos = videos.length;
    const totalPerformers = performers.length;
    const totalBrands = brands.length;
    const totalNewsArticles = news.length;

    const assignedVideoIds = new Set(videoPerformers.map(vp => vp.video_id));
    const assignedCount = assignedVideoIds.size;
    const unassignedVideoCount = Math.max(0, totalVideos - assignedCount);
    const assignmentCoveragePct = totalVideos > 0
      ? parseFloat(((assignedCount / totalVideos) * 100).toFixed(1))
      : 100;

    const statsPayload = {
      total_videos: totalVideos,
      total_performers: totalPerformers,
      total_brands: totalBrands,
      total_news_articles: totalNewsArticles,
      unassigned_video_count: unassignedVideoCount,
      assignment_coverage_pct: assignmentCoveragePct,
      last_refreshed_at: new Date().toISOString(),
    };

    // Upsert: update the first existing record, or create one if none exists
    const existing = await base44.asServiceRole.entities.SystemStat.list('-created_date', 1);
    if (existing.length > 0) {
      await base44.asServiceRole.entities.SystemStat.update(existing[0].id, statsPayload);
    } else {
      await base44.asServiceRole.entities.SystemStat.create(statsPayload);
    }

    return Response.json({
      success: true,
      stats: statsPayload,
      message: 'SystemStat refreshed successfully',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});