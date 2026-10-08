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

    // Action 1: get_performer_video_stats
    // Returns both internal video stats AND external-only stats for this performer
    if (action === 'get_performer_video_stats') {
      const { performer_id, period_month, platform, promotion_status } = body;

      if (!performer_id) {
        return Response.json({ error: 'Missing required field: performer_id' }, { status: 400 });
      }

      const allSnapshots = [];

      // Part A: Get snapshots linked to internal videos for this performer
      const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({ performer_id });

      if (videoPerformers && videoPerformers.length > 0) {
        const videoIds = videoPerformers.map(vp => vp.video_id);

        for (const videoId of videoIds) {
          const query = { video_id: videoId };
          if (period_month) query.period_month = period_month;
          if (platform) query.platform = platform;
          if (promotion_status) query.promotion_status = promotion_status;

          const snapshots = await base44.asServiceRole.entities.VideoStatSnapshot.filter(query);
          allSnapshots.push(...snapshots);
        }

        // Enrich with video titles - handle deleted videos gracefully
        const videoMap = {};
        for (const vp of videoPerformers) {
          try {
            const video = await base44.asServiceRole.entities.Video.get(vp.video_id);
            if (video) videoMap[video.id] = { title: video.title, slug: video.slug };
          } catch (err) {
            // Video was deleted - skip enrichment for this video
            console.warn('[performerVideoStatsService] Video not found for enrichment:', vp.video_id);
          }
        }

        for (const snap of allSnapshots) {
          const v = videoMap[snap.video_id];
          snap.video_title = v ? v.title : (snap.external_title || 'Unknown');
          snap.video_slug = v ? v.slug : null;
          snap._is_external_only = false;
        }
      }

      // Part B: Get external-only snapshots (performer_id set, no video_id)
      const extQuery = { performer_id, source_type: 'external_manual' };
      if (period_month) extQuery.period_month = period_month;
      if (platform) extQuery.platform = platform;
      if (promotion_status) extQuery.promotion_status = promotion_status;

      const externalSnapshots = await base44.asServiceRole.entities.VideoStatSnapshot.filter(extQuery);
      for (const snap of externalSnapshots) {
        snap.video_title = snap.external_title || 'External';
        snap.video_slug = null;
        snap._is_external_only = true;
      }
      allSnapshots.push(...externalSnapshots);

      // Sort by period_month descending
      const sorted = allSnapshots.sort((a, b) =>
        b.period_month.localeCompare(a.period_month)
      );

      return Response.json({
        success: true,
        stats: sorted,
        total_count: sorted.length
      });
    }

    // Action 2: create_snapshot (internal video — existing path)
    if (action === 'create_snapshot') {
      const { performer_id, video_id, platform, period_month, views, likes, favourites, revenue_usd, promotion_status, admin_note } = body;

      if (!video_id || !platform || !period_month) {
        return Response.json({ error: 'Missing required fields: video_id, platform, period_month' }, { status: 400 });
      }

      // Verify video belongs to performer
      const videoPerformer = await base44.asServiceRole.entities.VideoPerformer.filter({ performer_id, video_id });
      if (!videoPerformer || videoPerformer.length === 0) {
        return Response.json({ error: 'Video not linked to this performer' }, { status: 400 });
      }

      const snapshot = await base44.asServiceRole.entities.VideoStatSnapshot.create({
        video_id,
        platform,
        period_month,
        views: views || 0,
        likes: likes || 0,
        favourites: favourites || 0,
        revenue_usd: revenue_usd || 0,
        promotion_status: promotion_status || 'none',
        admin_note: admin_note || '',
        import_source: 'manual_admin_entry',
        source_type: 'internal'
      });

      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'VideoStatSnapshot',
        entity_id: snapshot.id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'video_stat_snapshot_created',
        changes_json: JSON.stringify({ video_id, platform, period_month }),
        notes: 'Video stat snapshot created by admin'
      });

      return Response.json({ success: true, snapshot_id: snapshot.id });
    }

    // Action 3: create_external_snapshot — external-only stat not tied to an internal Video
    if (action === 'create_external_snapshot') {
      const {
        performer_id, video_id, platform, period_month,
        external_title, external_url,
        views, likes, favourites, revenue_usd,
        promotion_status, notes, admin_note
      } = body;

      if (!performer_id || !platform || !period_month) {
        return Response.json({ error: 'Missing required fields: performer_id, platform, period_month' }, { status: 400 });
      }

      // If no internal video and no external_title, reject
      if (!video_id && !external_title) {
        return Response.json({ 
          success: false,
          error: 'validation_error',
          message: 'Either video_id or external_title is required',
          details: { video_id, external_title, performer_id, platform, period_month }
        }, { status: 400 });
      }

      // Validate period_month format
      if (!/^\d{4}-\d{2}$/.test(period_month)) {
        return Response.json({ 
          success: false,
          error: 'validation_error',
          message: 'period_month must be in YYYY-MM format',
          details: { period_month, format: 'YYYY-MM' }
        }, { status: 400 });
      }

      // Validate numeric fields
      const revenueVal = parseFloat(revenue_usd) || 0;
      const viewsVal = parseInt(views) || 0;
      const likesVal = parseInt(likes) || 0;
      const favsVal = parseInt(favourites) || 0;
      if (revenueVal < 0 || viewsVal < 0 || likesVal < 0 || favsVal < 0) {
        return Response.json({ 
          success: false,
          error: 'validation_error',
          message: 'Numeric fields must be >= 0',
          details: { revenue_usd: revenueVal, views: viewsVal, likes: likesVal, favourites: favsVal }
        }, { status: 400 });
      }

      // Validate video_id exists if provided (but don't require performer link for external stats)
      if (video_id) {
        try {
          const video = await base44.asServiceRole.entities.Video.get(video_id);
          if (!video) {
            return Response.json({
              success: false,
              error: 'invalid_video_id',
              message: `Video with ID ${video_id} does not exist`,
              details: { video_id, performer_id }
            }, { status: 400 });
          }
        } catch (err) {
          return Response.json({
            success: false,
            error: 'invalid_video_id',
            message: `Video with ID ${video_id} does not exist`,
            details: { video_id, performer_id, error: err.message }
          }, { status: 400 });
        }
      }

      // Deduplication check — return existing_record in 409 so frontend can highlight it
      const buildExistingRecord = (ex) => ({
        id: ex.id,
        video_id: ex.video_id || null,
        performer_id: ex.performer_id || null,
        platform: ex.platform,
        period_month: ex.period_month,
        external_title: ex.external_title || null,
        external_url: ex.external_url || null,
        revenue_usd: ex.revenue_usd || 0,
        views: ex.views || 0,
        likes: ex.likes || 0,
        favourites: ex.favourites || 0,
        source_type: ex.source_type
      });

      if (video_id) {
        // Internal video: dedupe by video_id + platform + period_month
        const existing = await base44.asServiceRole.entities.VideoStatSnapshot.filter({
          video_id, platform, period_month
        });
        if (existing && existing.length > 0) {
          return Response.json({
            success: false,
            error: 'duplicate_stat_snapshot',
            message: `A stat entry already exists for this video + platform + period (ID: ${existing[0].id})`,
            existing_record: buildExistingRecord(existing[0])
          }, { status: 409 });
        }
      } else {
        // External only: dedupe by performer_id + platform + period_month + (external_url or external_title)
        const extExisting = await base44.asServiceRole.entities.VideoStatSnapshot.filter({
          performer_id, platform, period_month, source_type: 'external_manual'
        });
        if (extExisting && extExisting.length > 0) {
          for (const ex of extExisting) {
            const urlMatch = external_url && ex.external_url && ex.external_url === external_url;
            const titleMatch = !external_url && ex.external_title === external_title;
            if (urlMatch || titleMatch) {
              return Response.json({
                success: false,
                error: 'duplicate_stat_snapshot',
                message: `A stat entry already exists for this performer + platform + period + title/URL (ID: ${ex.id})`,
                existing_record: buildExistingRecord(ex)
              }, { status: 409 });
            }
          }
        }
      }

      const snapshotData = {
        performer_id,
        platform,
        period_month,
        views: viewsVal,
        likes: likesVal,
        favourites: favsVal,
        revenue_usd: revenueVal,
        promotion_status: promotion_status || 'none',
        notes: notes || '',
        admin_note: admin_note || '',
        import_source: 'manual_admin_entry',
        source_type: video_id ? 'internal' : 'external_manual'
      };

      if (video_id) snapshotData.video_id = video_id;
      if (external_title) snapshotData.external_title = external_title;
      if (external_url) snapshotData.external_url = external_url;

      let snapshot;
      try {
        snapshot = await base44.asServiceRole.entities.VideoStatSnapshot.create(snapshotData);
      } catch (err) {
        console.error('[performerVideoStatsService] Failed to create snapshot:', {
          performer_id,
          video_id,
          platform,
          period_month,
          source_type: snapshotData.source_type,
          error: err.message
        });
        return Response.json({
          success: false,
          error: 'creation_failed',
          message: 'Failed to create video stat snapshot',
          details: { error: err.message, payload_keys: Object.keys(snapshotData) }
        }, { status: 500 });
      }

      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'VideoStatSnapshot',
        entity_id: snapshot.id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'external_video_stat_created',
        changes_json: JSON.stringify({ performer_id, platform, period_month, external_title }),
        notes: `External video stat created by admin: ${external_title || video_id}`
      });

      return Response.json({ success: true, snapshot_id: snapshot.id });
    }

    // Action 4: update_snapshot (admin-only)
    if (action === 'update_snapshot') {
      const { snapshot_id, data } = body;

      if (!snapshot_id || !data) {
        return Response.json({ error: 'Missing required fields: snapshot_id, data' }, { status: 400 });
      }

      const oldSnapshot = await base44.asServiceRole.entities.VideoStatSnapshot.get(snapshot_id);
      if (!oldSnapshot) {
        return Response.json({ error: 'Snapshot not found' }, { status: 404 });
      }

      const changes = {};
      for (const key of ['promotion_status', 'views', 'likes', 'favourites', 'revenue_usd', 'external_title', 'external_url', 'notes']) {
        if (oldSnapshot[key] !== data[key]) {
          changes[key] = { before: oldSnapshot[key], after: data[key] };
        }
      }

      const updated = await base44.asServiceRole.entities.VideoStatSnapshot.update(snapshot_id, data);

      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'VideoStatSnapshot',
        entity_id: snapshot_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'video_stat_snapshot_updated',
        changes_json: JSON.stringify(changes),
        notes: 'Video stat snapshot updated by admin'
      });

      return Response.json({ success: true, snapshot_id: updated.id });
    }

    // Action 5: delete_snapshot — only for external_manual entries
    if (action === 'delete_snapshot') {
      const { snapshot_id } = body;

      if (!snapshot_id) {
        return Response.json({ error: 'Missing required field: snapshot_id' }, { status: 400 });
      }

      const snapshot = await base44.asServiceRole.entities.VideoStatSnapshot.get(snapshot_id);
      if (!snapshot) {
        return Response.json({ error: 'Snapshot not found' }, { status: 404 });
      }

      if (snapshot.source_type !== 'external_manual' && snapshot.import_source !== 'manual_admin_entry') {
        return Response.json({ error: 'Only manually created snapshots can be deleted through this service' }, { status: 403 });
      }

      await base44.asServiceRole.entities.VideoStatSnapshot.delete(snapshot_id);

      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'VideoStatSnapshot',
        entity_id: snapshot_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'video_stat_snapshot_deleted',
        changes_json: JSON.stringify({ snapshot_id }),
        notes: 'Video stat snapshot deleted by admin'
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[performerVideoStatsService] Unexpected error:', {
      action,
      performer_id: body.performer_id,
      error: error.message,
      stack: error.stack
    });
    return Response.json({ 
      success: false,
      error: 'internal_server_error',
      message: 'An unexpected error occurred',
      details: { error: error.message }
    }, { status: 500 });
  }
});