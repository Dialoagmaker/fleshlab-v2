import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;
    const data = body;

    // Action 1: create_earning
    if (action === 'create_earning') {
      const {
        performer_id,
        video_id,
        earning_type,
        gross_amount_usd,
        split_pct,
        net_amount_usd,
        period_month,
        status = 'pending',
        notes,
        source_ref_type,
        source_ref_id
      } = data;

      // Validate required fields
      if (!performer_id || !earning_type || !gross_amount_usd || !period_month) {
        return Response.json({ 
          error: 'Missing required fields: performer_id, earning_type, gross_amount_usd, period_month' 
        }, { status: 400 });
      }

      // Validate period_month format YYYY-MM
      const periodRegex = /^\d{4}-\d{2}$/;
      if (!periodRegex.test(period_month)) {
        return Response.json({ error: 'period_month must be in YYYY-MM format' }, { status: 400 });
      }

      // Validate performer exists
      const performer = await base44.asServiceRole.entities.Performer.get(performer_id);
      if (!performer) {
        return Response.json({ error: 'Performer not found' }, { status: 404 });
      }

      // Validate video_id if provided
      if (video_id) {
        const video = await base44.asServiceRole.entities.Video.get(video_id);
        if (!video) {
          return Response.json({ error: 'Video not found' }, { status: 404 });
        }
      }

      // Validate split_pct
      const finalSplitPct = split_pct !== undefined ? split_pct : performer.revenue_split_pct || 70;
      if (finalSplitPct < 0 || finalSplitPct > 100) {
        return Response.json({ error: 'split_pct must be between 0 and 100' }, { status: 400 });
      }

      // Calculate net_amount_usd if not provided (for bonus/adjustment it might be manual)
      let finalNetAmount = net_amount_usd;
      if (finalNetAmount === undefined) {
        finalNetAmount = (gross_amount_usd * finalSplitPct) / 100;
      }

      // Check if performer has outstanding balance - default to held
      let finalStatus = status;
      if (performer.outstanding_balance_usd > 0 && status === 'pending') {
        finalStatus = 'held';
      }

      // Create the earning record
      const earningData = {
        performer_id,
        video_id: video_id || null,
        earning_type,
        gross_amount_usd,
        split_pct: finalSplitPct,
        net_amount_usd: finalNetAmount,
        period_month,
        status: finalStatus,
        notes: notes || null,
        source_ref_type: source_ref_type || null,
        source_ref_id: source_ref_id || null
      };

      const created = await base44.asServiceRole.entities.PerformerEarning.create(earningData);

      // Create AuditLog entry
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'PerformerEarning',
        entity_id: created.id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'earning_created',
        changes_json: JSON.stringify({
          earning_type,
          gross_amount_usd,
          split_pct: finalSplitPct,
          net_amount_usd: finalNetAmount,
          period_month,
          status: finalStatus
        }),
        ip_address: null,
        notes: `Earning created: ${earning_type} - $${gross_amount_usd} (net: $${finalNetAmount})`
      });

      return Response.json({ 
        success: true, 
        earning_id: created.id,
        split_pct: finalSplitPct,
        net_amount_usd: finalNetAmount,
        status: finalStatus
      });
    }

    // Action 2: update_earning_status
    if (action === 'update_earning_status') {
      const { earning_id, status, reason } = data;

      if (!earning_id || !status) {
        return Response.json({ error: 'Missing required fields: earning_id, status' }, { status: 400 });
      }

      const earning = await base44.asServiceRole.entities.PerformerEarning.get(earning_id);
      if (!earning) {
        return Response.json({ error: 'Earning not found' }, { status: 404 });
      }

      // Validate reason for held/disputed
      if ((status === 'held' || status === 'disputed') && !reason) {
        return Response.json({ error: 'reason required for held/disputed status' }, { status: 400 });
      }

      const updateData = { status };
      if (status === 'held' || status === 'disputed') {
        updateData.hold_reason = reason;
      }
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      await base44.asServiceRole.entities.PerformerEarning.update(earning_id, updateData);

      // Create AuditLog entry
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'PerformerEarning',
        entity_id: earning_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'earning_status_changed',
        changes_json: JSON.stringify({
          status: { before: earning.status, after: status },
          reason: reason || null
        }),
        ip_address: null,
        notes: `Earning status changed from ${earning.status} to ${status}`
      });

      return Response.json({ success: true, earning_id, status });
    }

    // Action 2.5: list_earnings_for_period
    if (action === 'list_earnings_for_period') {
      const { performer_id, period_month } = data;

      if (!performer_id || !period_month) {
        return Response.json({ error: 'Missing required fields: performer_id, period_month' }, { status: 400 });
      }

      // Validate period_month format
      const periodRegex = /^\d{4}-\d{2}$/;
      if (!periodRegex.test(period_month)) {
        return Response.json({ error: 'period_month must be in YYYY-MM format' }, { status: 400 });
      }

      // Fetch earnings for this performer + period only
      const earnings = await base44.asServiceRole.entities.PerformerEarning.filter({
        performer_id,
        period_month
      });

      // Sort by created_date descending and limit
      const sorted = earnings.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      const limited = sorted.slice(0, 50);

      return Response.json({ success: true, earnings: limited });
    }

    // Action 3: calculate_period_summary
    if (action === 'calculate_period_summary') {
      const { performer_id, period_month } = data;

      if (!performer_id || !period_month) {
        return Response.json({ error: 'Missing required fields: performer_id, period_month' }, { status: 400 });
      }

      // Validate period_month format
      const periodRegex = /^\d{4}-\d{2}$/;
      if (!periodRegex.test(period_month)) {
        return Response.json({ error: 'period_month must be in YYYY-MM format' }, { status: 400 });
      }

      // Fetch earnings for this performer + period only
      const earnings = await base44.asServiceRole.entities.PerformerEarning.filter({
        performer_id,
        period_month
      });

      // Calculate totals
      const summary = {
        performer_id,
        period_month,
        gross_total: 0,
        net_total: 0,
        pending_total: 0,
        approved_total: 0,
        paid_total: 0,
        held_total: 0,
        disputed_total: 0,
        breakdown_by_type: {}
      };

      earnings.forEach(earning => {
        summary.gross_total += earning.gross_amount_usd || 0;
        summary.net_total += earning.net_amount_usd || 0;

        const netAmount = earning.net_amount_usd || 0;
        if (earning.status === 'pending') summary.pending_total += netAmount;
        else if (earning.status === 'approved') summary.approved_total += netAmount;
        else if (earning.status === 'paid') summary.paid_total += netAmount;
        else if (earning.status === 'held') summary.held_total += netAmount;
        else if (earning.status === 'disputed') summary.disputed_total += netAmount;

        // Breakdown by type
        if (!summary.breakdown_by_type[earning.earning_type]) {
          summary.breakdown_by_type[earning.earning_type] = { count: 0, gross: 0, net: 0 };
        }
        summary.breakdown_by_type[earning.earning_type].count += 1;
        summary.breakdown_by_type[earning.earning_type].gross += earning.gross_amount_usd || 0;
        summary.breakdown_by_type[earning.earning_type].net += earning.net_amount_usd || 0;
      });

      return Response.json({ success: true, summary });
    }

    // Action 4: update_outstanding_balance
    if (action === 'update_outstanding_balance') {
      const { performer_id, outstanding_balance_usd, reason } = data;

      if (!performer_id || outstanding_balance_usd === undefined || !reason) {
        return Response.json({ error: 'Missing required fields: performer_id, outstanding_balance_usd, reason' }, { status: 400 });
      }

      const performer = await base44.asServiceRole.entities.Performer.get(performer_id);
      if (!performer) {
        return Response.json({ error: 'Performer not found' }, { status: 404 });
      }

      const oldBalance = performer.outstanding_balance_usd || 0;
      await base44.asServiceRole.entities.Performer.update(performer_id, { outstanding_balance_usd });

      // Create AuditLog entry
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'Performer',
        entity_id: performer_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'outstanding_balance_updated',
        changes_json: JSON.stringify({
          outstanding_balance_usd: { before: oldBalance, after: outstanding_balance_usd },
          reason
        }),
        ip_address: null,
        notes: `Outstanding balance updated: $${oldBalance} → $${outstanding_balance_usd}. Reason: ${reason}`
      });

      return Response.json({ success: true, performer_id, old_balance: oldBalance, new_balance: outstanding_balance_usd });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});