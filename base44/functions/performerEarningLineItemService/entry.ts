import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Security: Admin-only access
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // ==========================================
    // ACTION: create_line_item
    // ==========================================
    if (action === 'create_line_item') {
      const {
        performer_id,
        performer_earning_id,
        period_month,
        source_type,
        source_platform,
        source_reference_id,
        description,
        gross_amount_usd,
        performer_share_percent,
        performer_amount_usd,
        studio_amount_usd,
        currency = 'usd',
        exchange_rate = 1,
        status = 'estimated',
        notes
      } = body;

      // Validate required fields
      if (!performer_id || !period_month || !source_type || gross_amount_usd === undefined) {
        return Response.json({ 
          error: 'Missing required fields: performer_id, period_month, source_type, gross_amount_usd' 
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

      // Calculate amounts if not provided
      const finalPerformerShare = performer_share_percent !== undefined ? performer_share_percent : (performer.revenue_split_pct || 70);
      let finalPerformerAmount = performer_amount_usd;
      let finalStudioAmount = studio_amount_usd;

      if (finalPerformerAmount === undefined) {
        finalPerformerAmount = gross_amount_usd * (finalPerformerShare / 100);
      }
      if (finalStudioAmount === undefined) {
        finalStudioAmount = gross_amount_usd - finalPerformerAmount;
      }

      // Validate source_reference_id if source_type is video_platform
      if (source_type === 'video_platform' && !source_reference_id) {
        return Response.json({ 
          error: 'source_reference_id required for video_platform source type (should be VideoStatSnapshot ID)' 
        }, { status: 400 });
      }

      // Create line item
      const lineItemData = {
        performer_id,
        performer_earning_id: performer_earning_id || null,
        period_month,
        source_type,
        source_platform: source_platform || 'other',
        source_reference_id: source_reference_id || null,
        description: description || '',
        gross_amount_usd,
        performer_share_percent: finalPerformerShare,
        performer_amount_usd: parseFloat(finalPerformerAmount.toFixed(2)),
        studio_amount_usd: parseFloat(finalStudioAmount.toFixed(2)),
        currency,
        exchange_rate,
        status,
        notes: notes || null
      };

      const created = await base44.asServiceRole.entities.PerformerEarningLineItem.create(lineItemData);

      // Audit log
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'PerformerEarningLineItem',
        entity_id: created.id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'line_item_created',
        changes_json: JSON.stringify(lineItemData),
        notes: `Line item created: ${source_type} - $${gross_amount_usd} (performer: $${finalPerformerAmount})`
      });

      return Response.json({ 
        success: true, 
        line_item_id: created.id
      });
    }

    // ==========================================
    // ACTION: update_line_item
    // ==========================================
    if (action === 'update_line_item') {
      const { line_item_id, ...updateData } = body;

      if (!line_item_id) {
        return Response.json({ error: 'line_item_id required' }, { status: 400 });
      }

      const lineItem = await base44.asServiceRole.entities.PerformerEarningLineItem.get(line_item_id);
      if (!lineItem) {
        return Response.json({ error: 'Line item not found' }, { status: 404 });
      }

      // Prevent editing paid items
      if (lineItem.status === 'paid') {
        return Response.json({ error: 'Cannot modify paid line items' }, { status: 400 });
      }

      // Calculate amounts if gross or share changed
      if (updateData.gross_amount_usd !== undefined || updateData.performer_share_percent !== undefined) {
        const gross = updateData.gross_amount_usd !== undefined ? updateData.gross_amount_usd : lineItem.gross_amount_usd;
        const share = updateData.performer_share_percent !== undefined ? updateData.performer_share_percent : lineItem.performer_share_percent;
        
        updateData.performer_amount_usd = parseFloat((gross * (share / 100)).toFixed(2));
        updateData.studio_amount_usd = parseFloat((gross - updateData.performer_amount_usd).toFixed(2));
      }

      await base44.asServiceRole.entities.PerformerEarningLineItem.update(line_item_id, updateData);

      // Audit log
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'PerformerEarningLineItem',
        entity_id: line_item_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'line_item_updated',
        changes_json: JSON.stringify(updateData),
        notes: `Line item updated: ${JSON.stringify(updateData)}`
      });

      return Response.json({ success: true, line_item_id });
    }

    // ==========================================
    // ACTION: delete_line_item
    // ==========================================
    if (action === 'delete_line_item') {
      const { line_item_id } = body;

      if (!line_item_id) {
        return Response.json({ error: 'line_item_id required' }, { status: 400 });
      }

      const lineItem = await base44.asServiceRole.entities.PerformerEarningLineItem.get(line_item_id);
      if (!lineItem) {
        return Response.json({ error: 'Line item not found' }, { status: 404 });
      }

      // Prevent deleting paid items
      if (lineItem.status === 'paid') {
        return Response.json({ error: 'Cannot delete paid line items' }, { status: 400 });
      }

      await base44.asServiceRole.entities.PerformerEarningLineItem.delete(line_item_id);

      // Audit log
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'PerformerEarningLineItem',
        entity_id: line_item_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'line_item_deleted',
        changes_json: JSON.stringify({
          source_type: lineItem.source_type,
          gross_amount_usd: lineItem.gross_amount_usd,
          performer_amount_usd: lineItem.performer_amount_usd
        }),
        notes: `Line item deleted: ${lineItem.source_type} - $${lineItem.gross_amount_usd}`
      });

      return Response.json({ success: true, line_item_id });
    }

    // ==========================================
    // ACTION: list_line_items
    // ==========================================
    if (action === 'list_line_items') {
      const { performer_id, period_month, source_type, status } = body;

      if (!performer_id || !period_month) {
        return Response.json({ error: 'Missing required fields: performer_id, period_month' }, { status: 400 });
      }

      const query = { performer_id, period_month };
      if (source_type) query.source_type = source_type;
      if (status) query.status = status;

      let lineItems = await base44.asServiceRole.entities.PerformerEarningLineItem.filter(query);
      if (!Array.isArray(lineItems)) lineItems = [];

      // Sort by created_date descending
      const sorted = lineItems.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

      return Response.json({ success: true, line_items: sorted });
    }

    // ==========================================
    // ACTION: aggregate_period_summary
    // ==========================================
    if (action === 'aggregate_period_summary') {
      const { performer_id, period_month } = body;

      if (!performer_id || !period_month) {
        return Response.json({ error: 'Missing required fields: performer_id, period_month' }, { status: 400 });
      }

      // Fetch line items
      let lineItems = await base44.asServiceRole.entities.PerformerEarningLineItem.filter({
        performer_id,
        period_month
      });
      if (!Array.isArray(lineItems)) lineItems = [];

      // Fetch legacy PerformerEarning records (for backward compatibility)
      let legacyEarnings = await base44.asServiceRole.entities.PerformerEarning.filter({
        performer_id,
        period_month
      });
      if (!Array.isArray(legacyEarnings)) legacyEarnings = [];

      // Aggregate totals
      const summary = {
        performer_id,
        period_month,
        gross_total: 0,
        performer_total: 0,
        studio_total: 0,
        by_source_type: {},
        by_source_platform: {},
        by_status: {},
        line_item_count: lineItems.length,
        legacy_earning_count: legacyEarnings.length
      };

      // Aggregate line items
      lineItems.forEach(item => {
        summary.gross_total += item.gross_amount_usd || 0;
        summary.performer_total += item.performer_amount_usd || 0;
        summary.studio_total += item.studio_amount_usd || 0;

        // By source_type
        if (!summary.by_source_type[item.source_type]) {
          summary.by_source_type[item.source_type] = { gross: 0, performer: 0, studio: 0, count: 0 };
        }
        summary.by_source_type[item.source_type].gross += item.gross_amount_usd || 0;
        summary.by_source_type[item.source_type].performer += item.performer_amount_usd || 0;
        summary.by_source_type[item.source_type].studio += item.studio_amount_usd || 0;
        summary.by_source_type[item.source_type].count += 1;

        // By source_platform
        if (!summary.by_source_platform[item.source_platform]) {
          summary.by_source_platform[item.source_platform] = { gross: 0, performer: 0, studio: 0, count: 0 };
        }
        summary.by_source_platform[item.source_platform].gross += item.gross_amount_usd || 0;
        summary.by_source_platform[item.source_platform].performer += item.performer_amount_usd || 0;
        summary.by_source_platform[item.source_platform].studio += item.studio_amount_usd || 0;
        summary.by_source_platform[item.source_platform].count += 1;

        // By status
        if (!summary.by_status[item.status]) {
          summary.by_status[item.status] = { gross: 0, performer: 0, count: 0 };
        }
        summary.by_status[item.status].gross += item.gross_amount_usd || 0;
        summary.by_status[item.status].performer += item.performer_amount_usd || 0;
        summary.by_status[item.status].count += 1;
      });

      // Add legacy earnings to totals
      legacyEarnings.forEach(earning => {
        summary.gross_total += earning.gross_amount_usd || 0;
        summary.performer_total += earning.net_amount_usd || 0;
        summary.legacy_earning_count += 1;
      });

      return Response.json({ success: true, summary });
    }

    // ==========================================
    // ACTION: create_monthly_closeout
    // ==========================================
    if (action === 'create_monthly_closeout') {
      const { performer_id, period_month, platform = 'all' } = body;

      if (!performer_id || !period_month) {
        return Response.json({ error: 'Missing required fields: performer_id, period_month' }, { status: 400 });
      }

      // Step 1: Get VideoStatSnapshots for this period
      const snapshotQuery = { period_month };
      if (platform && platform !== 'all') {
        snapshotQuery.platform = platform;
      }

      let snapshots = await base44.asServiceRole.entities.VideoStatSnapshot.filter(snapshotQuery);
      if (!Array.isArray(snapshots)) snapshots = [];

      const createdLineItemIds = [];
      const errors = [];
      let videoRevenueCount = 0;

      // Step 2: Create line items for each video snapshot
      for (const snapshot of snapshots) {
        const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({
          video_id: snapshot.video_id
        });

        if (!videoPerformers || videoPerformers.length === 0) {
          continue;
        }

        const performerCount = videoPerformers.length;
        const videoRevenue = snapshot.revenue_usd || 0;

        for (const vp of videoPerformers) {
          if (vp.performer_id !== performer_id) {
            continue;
          }

          const performer = await base44.asServiceRole.entities.Performer.get(vp.performer_id);
          if (!performer) {
            errors.push({
              snapshot_id: snapshot.id,
              performer_id: vp.performer_id,
              error: 'Performer not found'
            });
            continue;
          }

          // Calculate share
          const grossShare = videoRevenue / performerCount;
          const performerSharePct = performer.revenue_split_pct || 70;
          const performerAmount = grossShare * (performerSharePct / 100);
          const studioAmount = grossShare - performerAmount;

          // Get video title
          const video = await base44.asServiceRole.entities.Video.get(snapshot.video_id);
          const videoTitle = video ? video.title : 'Unknown Video';

          // Check for existing line item
          const existingItems = await base44.asServiceRole.entities.PerformerEarningLineItem.filter({
            performer_id,
            period_month,
            source_type: 'video_platform',
            source_reference_id: snapshot.id
          });

          if (existingItems && existingItems.length > 0) {
            continue; // Skip if already exists
          }

          // Create line item
          const lineItem = await base44.asServiceRole.entities.PerformerEarningLineItem.create({
            performer_id,
            performer_earning_id: null,
            period_month,
            source_type: 'video_platform',
            source_platform: snapshot.platform,
            source_reference_id: snapshot.id,
            description: `${videoTitle} - ${snapshot.platform}`,
            gross_amount_usd: parseFloat(grossShare.toFixed(2)),
            performer_share_percent: performerSharePct,
            performer_amount_usd: parseFloat(performerAmount.toFixed(2)),
            studio_amount_usd: parseFloat(studioAmount.toFixed(2)),
            currency: 'usd',
            exchange_rate: 1,
            status: 'estimated',
            notes: `Video revenue from ${snapshot.platform} (${snapshot.views} views)`
          });

          createdLineItemIds.push(lineItem.id);
          videoRevenueCount++;
        }
      }

      // Audit log
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'PerformerEarningLineItem',
        entity_id: createdLineItemIds[0] || 'none',
        actor_id: user.id,
        actor_role: user.role,
        action: 'monthly_closeout_created',
        changes_json: JSON.stringify({
          performer_id,
          period_month,
          platform,
          line_item_count: videoRevenueCount
        }),
        notes: `Monthly closeout created: ${period_month} - ${videoRevenueCount} video revenue line items`
      });

      return Response.json({
        success: true,
        line_item_ids: createdLineItemIds,
        video_revenue_count: videoRevenueCount,
        errors
      });
    }

    // ==========================================
    // ACTION: approve_closeout
    // ==========================================
    if (action === 'approve_closeout') {
      const { performer_id, period_month } = body;

      if (!performer_id || !period_month) {
        return Response.json({ error: 'Missing required fields: performer_id, period_month' }, { status: 400 });
      }

      // Get all line items for this period
      let lineItems = await base44.asServiceRole.entities.PerformerEarningLineItem.filter({
        performer_id,
        period_month,
        status: 'estimated'
      });
      if (!Array.isArray(lineItems)) lineItems = [];

      // Update all to 'approved'
      const approvedIds = [];
      for (const item of lineItems) {
        await base44.asServiceRole.entities.PerformerEarningLineItem.update(item.id, {
          status: 'approved'
        });
        approvedIds.push(item.id);
      }

      // Audit log
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'PerformerEarningLineItem',
        entity_id: approvedIds[0] || 'none',
        actor_id: user.id,
        actor_role: user.role,
        action: 'closeout_approved',
        changes_json: JSON.stringify({
          performer_id,
          period_month,
          approved_count: approvedIds.length
        }),
        notes: `Monthly closeout approved: ${period_month} - ${approvedIds.length} line items`
      });

      return Response.json({
        success: true,
        approved_count: approvedIds.length,
        approved_ids: approvedIds
      });
    }

    // ==========================================
    // ACTION: mark_closeout_paid
    // ==========================================
    if (action === 'mark_closeout_paid') {
      const { performer_id, period_month } = body;

      if (!performer_id || !period_month) {
        return Response.json({ error: 'Missing required fields: performer_id, period_month' }, { status: 400 });
      }

      // Get all approved line items for this period
      let lineItems = await base44.asServiceRole.entities.PerformerEarningLineItem.filter({
        performer_id,
        period_month,
        status: 'approved'
      });
      if (!Array.isArray(lineItems)) lineItems = [];

      // Update all to 'paid'
      const paidIds = [];
      for (const item of lineItems) {
        await base44.asServiceRole.entities.PerformerEarningLineItem.update(item.id, {
          status: 'paid'
        });
        paidIds.push(item.id);
      }

      // Audit log
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'PerformerEarningLineItem',
        entity_id: paidIds[0] || 'none',
        actor_id: user.id,
        actor_role: user.role,
        action: 'closeout_paid',
        changes_json: JSON.stringify({
          performer_id,
          period_month,
          paid_count: paidIds.length
        }),
        notes: `Monthly closeout marked as paid: ${period_month} - ${paidIds.length} line items`
      });

      return Response.json({
        success: true,
        paid_count: paidIds.length,
        paid_ids: paidIds
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});