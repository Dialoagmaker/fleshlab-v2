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

    // Action 1: create_snapshot
    if (action === 'create_snapshot') {
      const {
        video_id,
        platform,
        period_month,
        views = 0,
        likes = 0,
        favourites = 0,
        revenue_usd = 0,
        sales_count = 0,
        tips_usd = 0,
        promotion_status = 'none',
        promotion_note,
        admin_note,
        raw_data_json,
        import_source = 'manual',
        notes
      } = data;

      // Validate required fields
      if (!video_id || !platform || !period_month) {
        return Response.json({ 
          error: 'Missing required fields: video_id, platform, period_month' 
        }, { status: 400 });
      }

      // Validate video exists
      const video = await base44.asServiceRole.entities.Video.get(video_id);
      if (!video) {
        return Response.json({ error: 'Video not found' }, { status: 404 });
      }

      // Validate platform
      const validPlatforms = ['xhamster', 'faphouse', 'internal', 'pornhub', 'other'];
      if (!validPlatforms.includes(platform)) {
        return Response.json({ error: 'Invalid platform' }, { status: 400 });
      }

      // Validate period_month format YYYY-MM
      const periodRegex = /^\d{4}-\d{2}$/;
      if (!periodRegex.test(period_month)) {
        return Response.json({ error: 'period_month must be in YYYY-MM format' }, { status: 400 });
      }

      // Validate promotion_status
      const validPromotionStatus = ['none', 'planned', 'active', 'ended'];
      if (promotion_status && !validPromotionStatus.includes(promotion_status)) {
        return Response.json({ error: 'Invalid promotion_status' }, { status: 400 });
      }

      // Check if snapshot already exists for this video + platform + period
      const existing = await base44.asServiceRole.entities.VideoStatSnapshot.filter({
        video_id,
        platform,
        period_month
      });

      const snapshotData = {
        video_id,
        platform,
        period_month,
        views,
        likes,
        favourites,
        revenue_usd,
        sales_count,
        tips_usd,
        promotion_status,
        promotion_note: promotion_note || null,
        admin_note: admin_note || null,
        raw_data_json: raw_data_json || null,
        import_source,
        notes: notes || null
      };

      let result;
      let actionType = 'created';
      if (existing && existing.length > 0) {
        // Update existing - track changes for audit
        const oldSnapshot = existing[0];
        const changes = {};
        
        // Track promotion_status changes specifically
        if (oldSnapshot.promotion_status !== promotion_status) {
          changes.promotion_status = { before: oldSnapshot.promotion_status, after: promotion_status };
        }
        if (oldSnapshot.admin_note !== (admin_note || null)) {
          changes.admin_note = { changed: true }; // Don't log content
        }
        if (oldSnapshot.promotion_note !== (promotion_note || null)) {
          changes.promotion_note = { changed: true };
        }
        if (oldSnapshot.views !== views) changes.views = { before: oldSnapshot.views, after: views };
        if (oldSnapshot.revenue_usd !== revenue_usd) changes.revenue_usd = { before: oldSnapshot.revenue_usd, after: revenue_usd };

        result = await base44.asServiceRole.entities.VideoStatSnapshot.update(existing[0].id, snapshotData);
        actionType = 'updated';

        // Create AuditLog entry with detailed changes
        await base44.asServiceRole.entities.AuditLog.create({
          entity_type: 'VideoStatSnapshot',
          entity_id: existing[0].id,
          actor_id: user.id,
          actor_role: user.role,
          action: 'video_stat_snapshot_updated',
          changes_json: JSON.stringify(changes),
          ip_address: null,
          notes: `Video stat snapshot updated: ${video.title} - ${platform} - ${period_month}` + 
                 (changes.promotion_status ? ` | Promotion: ${changes.promotion_status.before} → ${changes.promotion_status.after}` : '')
        });

        return Response.json({ success: true, snapshot_id: existing[0].id, action: 'updated' });
      } else {
        // Create new
        result = await base44.asServiceRole.entities.VideoStatSnapshot.create(snapshotData);

        // Create AuditLog entry
        await base44.asServiceRole.entities.AuditLog.create({
          entity_type: 'VideoStatSnapshot',
          entity_id: result.id,
          actor_id: user.id,
          actor_role: user.role,
          action: 'video_stat_snapshot_created',
          changes_json: JSON.stringify({
            promotion_status,
            views,
            revenue_usd
          }),
          ip_address: null,
          notes: `Video stat snapshot created: ${video.title} - ${platform} - ${period_month}`
        });

        return Response.json({ success: true, snapshot_id: result.id, action: 'created' });
      }
    }

    // Action 2: list_snapshots_for_video
    if (action === 'list_snapshots_for_video') {
      const { video_id, platform, period_month, promotion_status } = data;

      if (!video_id) {
        return Response.json({ error: 'Missing required field: video_id' }, { status: 400 });
      }

      // Build filter query
      const query = { video_id };
      if (platform) query.platform = platform;
      if (period_month) query.period_month = period_month;
      if (promotion_status) query.promotion_status = promotion_status;

      const snapshots = await base44.asServiceRole.entities.VideoStatSnapshot.filter(query);

      // Limit results to prevent large payloads
      const limited = snapshots.slice(0, 100);

      return Response.json({ success: true, snapshots: limited, total_count: snapshots.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});