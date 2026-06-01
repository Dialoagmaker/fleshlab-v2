import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { video_id, platform } = await req.json();
    if (!video_id || !platform) {
      return Response.json({ error: 'video_id and platform required' }, { status: 400 });
    }

    const validPlatforms = ['xhamster', 'twitter', 'reddit', 'telegram'];
    if (!validPlatforms.includes(platform)) {
      return Response.json({ error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` }, { status: 400 });
    }

    // Fetch video
    const video = await base44.entities.Video.get(video_id);
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    // Get previous value for audit
    const updateField = `${platform}_posted_at`;
    const previousValue = video[updateField];

    // Update platform timestamp
    const now = new Date().toISOString();
    await base44.entities.Video.update(video_id, {
      [updateField]: now,
    });

    // Update promotion_status if at least one platform is posted
    const platforms = ['xhamster', 'twitter', 'reddit', 'telegram'];
    const postedPlatforms = await Promise.all(
      platforms.map(p => base44.entities.Video.get(video_id).then(v => v[`${p}_posted_at`]))
    );
    
    const hasAnyPosted = platforms.some((p, i) => postedPlatforms[i]);
    
    let promotionStatus = video.promotion_status;
    if (hasAnyPosted && promotionStatus === 'none') {
      promotionStatus = 'active';
      await base44.entities.Video.update(video_id, {
        promotion_status: 'active',
      });
    }

    // Create AuditLog entry
    await base44.entities.AuditLog.create({
      entity_type: 'Video',
      entity_id: video_id,
      actor_id: user.id,
      actor_role: user.role,
      action: 'external_post',
      changes_json: JSON.stringify({
        [updateField]: { from: previousValue, to: now },
        promotion_status: { from: video.promotion_status, to: promotionStatus },
      }),
      notes: `Marked video "${video.title}" as posted on ${platform}`,
    });

    return Response.json({
      status: 'ok',
      video_id: video_id,
      platform: platform,
      posted_at: now,
      promotion_status: promotionStatus,
      message: `Marked as posted on ${platform}`,
    });

  } catch (error) {
    console.error('markExternalPosted error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});