import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Security: Admin-only access
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    // ==========================================
    // ACTION: get_closeout_preview
    // ==========================================
    if (action === 'get_closeout_preview') {
      const { period_month, platform, performer_id } = body;
      
      if (!period_month) {
        return Response.json({ error: 'period_month required' }, { status: 400 });
      }

      // Query snapshots for period + platform
      const snapshotQuery = { period_month };
      if (platform && platform !== 'all') {
        snapshotQuery.platform = platform;
      }

      const snapshots = await base44.asServiceRole.entities.VideoStatSnapshot.filter(snapshotQuery);
      
      if (!snapshots || snapshots.length === 0) {
        return Response.json({ 
          success: true, 
          preview: [], 
          summary: {
            total_snapshots: 0,
            total_revenue_usd: 0,
            estimated_performer_payout: 0,
            studio_share: 0,
            duplicate_count: 0,
            new_earnings_to_create: 0
          }
        });
      }

      const preview = [];
      let totalRevenue = 0;
      let totalPerformerPayout = 0;
      let totalStudioShare = 0;
      let duplicateCount = 0;

      for (const snapshot of snapshots) {
        // Get video performers for this video
        const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({
          video_id: snapshot.video_id
        });

        if (!videoPerformers || videoPerformers.length === 0) {
          continue; // Skip videos without credited performers
        }

        const performerCount = videoPerformers.length;
        const videoRevenue = snapshot.revenue_usd || 0;

        for (const vp of videoPerformers) {
          // Filter by performer_id if provided
          if (performer_id && vp.performer_id !== performer_id) {
            continue;
          }

          // Get performer data
          const performer = await base44.asServiceRole.entities.Performer.get(vp.performer_id);
          if (!performer) {
            continue;
          }

          // Get video title
          const video = await base44.asServiceRole.entities.Video.get(snapshot.video_id);
          const videoTitle = video ? video.title : 'Unknown Video';

          // Calculate gross share (equal split among performers)
          const grossShare = videoRevenue / performerCount;

          // Get performer's split percentage (default to 70% if not set)
          const splitPct = performer.revenue_split_pct || 70;

          // Calculate net amount
          const netAmount = grossShare * (splitPct / 100);

          // Calculate studio share
          const studioShare = grossShare - netAmount;

          // Check for existing earning (duplicate prevention)
          const existingEarnings = await base44.asServiceRole.entities.PerformerEarning.filter({
            source_ref_type: 'VideoStatSnapshot',
            source_ref_id: snapshot.id,
            performer_id: vp.performer_id,
            period_month: period_month
          });

          const alreadyExists = existingEarnings && existingEarnings.length > 0;
          const existingEarningId = alreadyExists ? existingEarnings[0].id : null;

          if (alreadyExists) {
            duplicateCount++;
          }

          // Add to preview
          preview.push({
            snapshot_id: snapshot.id,
            video_id: snapshot.video_id,
            video_title: videoTitle,
            performer_id: vp.performer_id,
            performer_name: performer.display_name,
            platform: snapshot.platform,
            period_month: period_month,
            video_revenue_usd: videoRevenue,
            performer_count: performerCount,
            gross_share_usd: parseFloat(grossShare.toFixed(2)),
            split_pct: splitPct,
            net_amount_usd: parseFloat(netAmount.toFixed(2)),
            studio_share_usd: parseFloat(studioShare.toFixed(2)),
            already_exists: alreadyExists,
            existing_earning_id: existingEarningId
          });

          // Accumulate totals (only for non-duplicates)
          if (!alreadyExists) {
            totalRevenue += videoRevenue / performerCount;
            totalPerformerPayout += netAmount;
            totalStudioShare += studioShare;
          }
        }
      }

      return Response.json({
        success: true,
        preview,
        summary: {
          total_snapshots: snapshots.length,
          total_revenue_usd: parseFloat(totalRevenue.toFixed(2)),
          estimated_performer_payout: parseFloat(totalPerformerPayout.toFixed(2)),
          studio_share: parseFloat(totalStudioShare.toFixed(2)),
          duplicate_count: duplicateCount,
          new_earnings_to_create: preview.length - duplicateCount
        }
      });
    }

    // ==========================================
    // ACTION: generate_draft_earnings
    // ==========================================
    if (action === 'generate_draft_earnings') {
      const { period_month, platform, performer_id } = body;
      
      if (!period_month) {
        return Response.json({ error: 'period_month required' }, { status: 400 });
      }

      // Re-run preview calculation
      const snapshotQuery = { period_month };
      if (platform && platform !== 'all') {
        snapshotQuery.platform = platform;
      }

      const snapshots = await base44.asServiceRole.entities.VideoStatSnapshot.filter(snapshotQuery);
      
      if (!snapshots || snapshots.length === 0) {
        return Response.json({ 
          success: true, 
          created_count: 0, 
          skipped_count: 0, 
          failed_count: 0,
          created_earning_ids: [],
          skipped_rows: [],
          errors: []
        });
      }

      const createdEarningIds = [];
      const skippedRows = [];
      const errors = [];
      let createdCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

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
          if (performer_id && vp.performer_id !== performer_id) {
            continue;
          }

          const performer = await base44.asServiceRole.entities.Performer.get(vp.performer_id);
          if (!performer) {
            errors.push({
              snapshot_id: snapshot.id,
              performer_id: vp.performer_id,
              error: 'Performer not found'
            });
            failedCount++;
            continue;
          }

          // Calculate earnings
          const grossShare = videoRevenue / performerCount;
          const splitPct = performer.revenue_split_pct || 70;
          const netAmount = grossShare * (splitPct / 100);

          // Duplicate check
          const existingEarnings = await base44.asServiceRole.entities.PerformerEarning.filter({
            source_ref_type: 'VideoStatSnapshot',
            source_ref_id: snapshot.id,
            performer_id: vp.performer_id,
            period_month: period_month
          });

          if (existingEarnings && existingEarnings.length > 0) {
            skippedRows.push({
              snapshot_id: snapshot.id,
              performer_id: vp.performer_id,
              performer_name: performer.display_name,
              reason: 'Earning already exists for this snapshot/performer/period'
            });
            skippedCount++;
            continue;
          }

          // Determine earning_type based on platform
          let earningType = 'video_sale';
          if (snapshot.platform === 'xhamster') {
            earningType = 'xhamster_share';
          } else if (snapshot.platform === 'faphouse') {
            earningType = 'faphouse_share';
          }

          try {
            // Create PerformerEarning record
            const earning = await base44.asServiceRole.entities.PerformerEarning.create({
              performer_id: vp.performer_id,
              video_id: snapshot.video_id,
              earning_type: earningType,
              gross_amount_usd: parseFloat(grossShare.toFixed(2)),
              split_pct: splitPct,
              net_amount_usd: parseFloat(netAmount.toFixed(2)),
              period_month: period_month,
              status: 'pending',
              source_ref_type: 'VideoStatSnapshot',
              source_ref_id: snapshot.id,
              notes: 'Generated from monthly closeout'
            });

            createdEarningIds.push(earning.id);
            createdCount++;

            // Audit log
            await base44.asServiceRole.entities.AuditLog.create({
              entity_type: 'PerformerEarning',
              entity_id: earning.id,
              actor_id: user.id,
              actor_role: user.role,
              action: 'closeout_earning_created',
              changes_json: JSON.stringify({
                source_ref_type: 'VideoStatSnapshot',
                source_ref_id: snapshot.id,
                period_month,
                gross_amount_usd: parseFloat(grossShare.toFixed(2)),
                split_pct: splitPct,
                net_amount_usd: parseFloat(netAmount.toFixed(2)),
                earning_type: earningType
              }),
              notes: `Auto-generated via Monthly Closeout: ${period_month}`
            });
          } catch (error) {
            errors.push({
              snapshot_id: snapshot.id,
              performer_id: vp.performer_id,
              performer_name: performer.display_name,
              error: error.message
            });
            failedCount++;
          }
        }
      }

      // Log batch creation
      if (createdCount > 0) {
        await base44.asServiceRole.entities.AuditLog.create({
          entity_type: 'PerformerEarning',
          entity_id: createdEarningIds[0],
          actor_id: user.id,
          actor_role: user.role,
          action: 'closeout_batch_created',
          changes_json: JSON.stringify({
            period_month,
            platform,
            created_count: createdCount,
            earning_ids: createdEarningIds
          }),
          notes: `Batch closeout creation: ${createdCount} earnings for ${period_month}`
        });
      }

      return Response.json({
        success: true,
        created_count: createdCount,
        skipped_count: skippedCount,
        failed_count: failedCount,
        created_earning_ids: createdEarningIds,
        skipped_rows: skippedRows,
        errors
      });
    }

    // ==========================================
    // ACTION: batch_update_status
    // ==========================================
    if (action === 'batch_update_status') {
      const { earning_ids, status, reason } = body;

      if (!earning_ids || !Array.isArray(earning_ids) || earning_ids.length === 0) {
        return Response.json({ error: 'earning_ids array required' }, { status: 400 });
      }

      if (!status) {
        return Response.json({ error: 'status required' }, { status: 400 });
      }

      // Validate status
      const validStatuses = ['approved', 'held', 'disputed'];
      if (!validStatuses.includes(status)) {
        return Response.json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        }, { status: 400 });
      }

      // Validate reason for held/disputed
      if ((status === 'held' || status === 'disputed') && !reason) {
        return Response.json({ 
          error: 'reason required for held or disputed status' 
        }, { status: 400 });
      }

      let updatedCount = 0;
      const errors = [];

      for (const earningId of earning_ids) {
        try {
          // Get current earning
          const earning = await base44.asServiceRole.entities.PerformerEarning.get(earningId);
          
          if (!earning) {
            errors.push({
              earning_id: earningId,
              error: 'Earning not found'
            });
            continue;
          }

          const oldStatus = earning.status;

          // Update status
          await base44.asServiceRole.entities.PerformerEarning.update(earningId, {
            status,
            ...(status === 'held' || status === 'disputed' ? { hold_reason: reason } : {}),
            ...(status === 'approved' ? { paid_at: null } : {}) // Clear paid_at if re-approved
          });

          updatedCount++;

          // Audit log
          await base44.asServiceRole.entities.AuditLog.create({
            entity_type: 'PerformerEarning',
            entity_id: earningId,
            actor_id: user.id,
            actor_role: user.role,
            action: 'earning_status_changed',
            changes_json: JSON.stringify({
              status: { before: oldStatus, after: status },
              reason: reason || null
            }),
            notes: `Status changed via batch update: ${oldStatus} → ${status}${reason ? ` (${reason})` : ''}`
          });
        } catch (error) {
          errors.push({
            earning_id: earningId,
            error: error.message
          });
        }
      }

      // Log batch status update
      if (updatedCount > 0) {
        await base44.asServiceRole.entities.AuditLog.create({
          entity_type: 'PerformerEarning',
          entity_id: earning_ids[0],
          actor_id: user.id,
          actor_role: user.role,
          action: 'closeout_batch_status_updated',
          changes_json: JSON.stringify({
            updated_count: updatedCount,
            new_status: status,
            reason: reason || null
          }),
          notes: `Batch status update: ${updatedCount} earnings set to ${status}`
        });
      }

      return Response.json({
        success: true,
        updated_count: updatedCount,
        status,
        errors
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});