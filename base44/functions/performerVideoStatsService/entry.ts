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
    if (action === 'get_performer_video_stats') {
      const { performer_id, period_month, platform, promotion_status } = body;

      if (!performer_id) {
        return Response.json({ error: 'Missing required field: performer_id' }, { status: 400 });
      }

      // Get all video IDs for this performer via VideoPerformer junction
      const videoPerformers = await base44.asServiceRole.entities.VideoPerformer.filter({
        performer_id
      });

      if (!videoPerformers || videoPerformers.length === 0) {
        return Response.json({ success: true, stats: [], total_count: 0 });
      }

      const videoIds = videoPerformers.map(vp => vp.video_id);

      // Get all snapshots for these videos
      const allSnapshots = [];
      for (const videoId of videoIds) {
        const query = { video_id: videoId };
        if (period_month) query.period_month = period_month;
        if (platform) query.platform = platform;
        if (promotion_status) query.promotion_status = promotion_status;

        const snapshots = await base44.asServiceRole.entities.VideoStatSnapshot.filter(query);
        allSnapshots.push(...snapshots);
      }

      // Get video titles
      const statsWithVideos = await Promise.all(allSnapshots.map(async (snap) => {
        const video = await base44.asServiceRole.entities.Video.get(snap.video_id);
        return {
          ...snap,
          video_title: video ? video.title : 'Unknown',
          video_slug: video ? video.slug : null
        };
      }));

      // Sort by period_month descending
      const sorted = statsWithVideos.sort((a, b) => 
        b.period_month.localeCompare(a.period_month)
      );

      return Response.json({ 
        success: true, 
        stats: sorted, 
        total_count: sorted.length 
      });
    }

    // Action 2: create_snapshot (admin-only)
    if (action === 'create_snapshot') {
      const { performer_id, video_id, platform, period_month, views, likes, revenue_usd, promotion_status, admin_note } = body;

      if (!video_id || !platform || !period_month) {
        return Response.json({ error: 'Missing required fields: video_id, platform, period_month' }, { status: 400 });
      }

      // Verify video belongs to performer
      const videoPerformer = await base44.asServiceRole.entities.VideoPerformer.filter({
        performer_id,
        video_id
      });

      if (!videoPerformer || videoPerformer.length === 0) {
        return Response.json({ error: 'Video not linked to this performer' }, { status: 400 });
      }

      // Create snapshot
      const snapshot = await base44.asServiceRole.entities.VideoStatSnapshot.create({
        video_id,
        platform,
        period_month,
        views: views || 0,
        likes: likes || 0,
        favourites: 0,
        revenue_usd: revenue_usd || 0,
        promotion_status: promotion_status || 'none',
        admin_note: admin_note || '',
        import_source: 'manual_admin_entry'
      });

      // Audit log
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'VideoStatSnapshot',
        entity_id: snapshot.id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'video_stat_snapshot_created',
        changes_json: JSON.stringify({ video_id, platform, period_month }),
        ip_address: null,
        notes: `Video stat snapshot created by admin`
      });

      return Response.json({ success: true, snapshot_id: snapshot.id });
    }

    // Action 3: update_snapshot (admin-only)
    if (action === 'update_snapshot') {
      const { snapshot_id, data } = body;

      if (!snapshot_id || !data) {
        return Response.json({ error: 'Missing required fields: snapshot_id, data' }, { status: 400 });
      }

      const oldSnapshot = await base44.asServiceRole.entities.VideoStatSnapshot.get(snapshot_id);
      if (!oldSnapshot) {
        return Response.json({ error: 'Snapshot not found' }, { status: 404 });
      }

      // Track changes for audit
      const changes = {};
      if (oldSnapshot.promotion_status !== data.promotion_status) {
        changes.promotion_status = { before: oldSnapshot.promotion_status, after: data.promotion_status };
      }
      if (oldSnapshot.admin_note !== data.admin_note) {
        changes.admin_note = { changed: true };
      }
      if (oldSnapshot.promotion_note !== data.promotion_note) {
        changes.promotion_note = { changed: true };
      }
      if (oldSnapshot.views !== data.views) changes.views = { before: oldSnapshot.views, after: data.views };
      if (oldSnapshot.revenue_usd !== data.revenue_usd) changes.revenue_usd = { before: oldSnapshot.revenue_usd, after: data.revenue_usd };

      // Update snapshot
      const updated = await base44.asServiceRole.entities.VideoStatSnapshot.update(snapshot_id, data);

      // Audit log
      await base44.asServiceRole.entities.AuditLog.create({
        entity_type: 'VideoStatSnapshot',
        entity_id: snapshot_id,
        actor_id: user.id,
        actor_role: user.role,
        action: 'video_stat_snapshot_updated',
        changes_json: JSON.stringify(changes),
        ip_address: null,
        notes: `Video stat snapshot updated by admin` + 
               (changes.promotion_status ? ` | Promotion: ${changes.promotion_status.before} → ${changes.promotion_status.after}` : '')
      });

      return Response.json({ success: true, snapshot_id: updated.id });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});