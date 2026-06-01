// performerEarningsService — Service layer for performer earnings calculations.
// This is the foundation for the Earnings tab and revenue reporting.
//
// Methods:
//   calculateEarnings(performerId, periodStart, periodEnd) — Calculates total earnings
//   getEarningsBreakdown(performerId) — Returns earnings by source (fanclub, PPV, tips)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, performer_id } = body;

    if (!performer_id) {
      return Response.json({ error: 'performer_id is required' }, { status: 400 });
    }

    if (action === 'calculate') {
      const { period_start, period_end } = body;
      
      // Fetch all videos for this performer
      const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({ performer_id });
      const videoIds = videoPerformers.map(vp => vp.video_id);

      // In Phase 1, return stub data — will be extended with real payment logic
      return Response.json({
        success: true,
        performer_id,
        period: { start: period_start, end: period_end },
        total_earnings_usd: 0,
        breakdown: {
          fanclub_revenue: 0,
          ppv_revenue: 0,
          tips: 0,
        },
        note: 'Phase 1 stub — earnings calculation to be implemented',
      });
    }

    if (action === 'breakdown') {
      // Return earnings breakdown by source
      return Response.json({
        success: true,
        performer_id,
        breakdown: {
          fanclub_revenue: 0,
          ppv_revenue: 0,
          tips: 0,
        },
        note: 'Phase 1 stub — earnings breakdown to be implemented',
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});