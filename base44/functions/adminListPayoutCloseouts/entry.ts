/**
 * adminListPayoutCloseouts — Admin-Only Read-Only List
 * Returns existing PerformerEarning (closeout draft) records with enriched performer info.
 * No mutations. Filters by month / performer / status.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { month, performer_id, status = 'all' } = body;

    // Fetch all earnings + performers in parallel
    const [allEarnings, allPerformers] = await Promise.all([
      base44.asServiceRole.entities.PerformerEarning.filter({}),
      base44.asServiceRole.entities.Performer.list(),
    ]);

    const performerMap = {};
    allPerformers.forEach(p => { performerMap[p.id] = p; });

    // Apply filters
    let earnings = allEarnings;
    if (month) earnings = earnings.filter(e => e.period_month === month);
    if (performer_id) earnings = earnings.filter(e => e.performer_id === performer_id);
    if (status && status !== 'all') earnings = earnings.filter(e => e.status === status);

    // Enrich each record
    const closeouts = earnings.map(e => {
      const performer = performerMap[e.performer_id] || {};

      // Parse metadata from notes JSON if available
      let meta = {};
      try { meta = JSON.parse(e.notes || '{}'); } catch {}

      return {
        closeout_id: e.id,
        month: e.period_month,
        performer_id: e.performer_id,
        performer_name: performer.display_name || 'Unknown',
        stage_name: performer.display_name || 'Unknown',
        gross_revenue_total: e.total_gross_usd || 0,
        performer_share_total: e.total_performer_usd || 0,
        studio_share_total: e.total_studio_usd || 0,
        line_item_count: e.line_item_count || 0,
        revenue_line_item_ids: meta.line_item_ids || [],
        source_breakdown: meta.source_breakdown || null,
        status: e.status,
        created_date: e.created_date,
        generated_by: meta.generated_by || null,
        generated_by_id: meta.generated_by_id || null,
        // Approval
        approved_by: meta.approved_by || null,
        approved_by_id: meta.approved_by_id || null,
        approved_date: meta.approved_date || null,
        // Hold
        hold_reason: meta.hold_reason || null,
        hold_date: meta.hold_date || null,
        held_by: meta.held_by || null,
        previous_status_before_hold: meta.previous_status_before_hold || null,
        // Payment
        paid_date: meta.paid_date || null,
        paid_reference: meta.paid_reference || null,
        paid_by: meta.paid_by || null,
        // Revert
        revert_reason: meta.revert_reason || null,
        // Audit trail
        status_history: meta.status_history || [],
        admin_notes: meta.admin_notes || null,
        payout_threshold_usd: meta.payout_threshold_usd || 100,
      };
    });

    // Sort newest first
    closeouts.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    return Response.json({
      success: true,
      count: closeouts.length,
      filters: { month, performer_id, status },
      closeouts,
    });

  } catch (error) {
    console.error('[adminListPayoutCloseouts] Error:', error);
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});