import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// PROTECTED endpoint — requires authenticated user + entitlement check.
// Only returns source_video_url (or signed playback URL) when entitled.
// Never expose playback URLs to anonymous or un-entitled users.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth required
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { videoId } = body;
    if (!videoId) return Response.json({ error: 'videoId required' }, { status: 400 });

    // Fetch the video (any status — admin may preview drafts)
    const video = await base44.asServiceRole.entities.Video.get(videoId);
    if (!video) return Response.json({ error: 'not_found' }, { status: 404 });

    // Published check for non-admins
    if (video.status !== 'published' && user.role !== 'admin') {
      return Response.json({ error: 'not_found' }, { status: 404 });
    }

    let entitled = false;
    let reason = null;

    // --- Entitlement checks ---

    // 1. Admin always has full access
    if (user.role === 'admin') {
      entitled = true;
      reason = 'admin';
    }

    // 2. Free-tier videos: any authenticated user can watch
    if (!entitled && video.access_tier === 'free') {
      entitled = true;
      reason = 'free_tier';
    }

    // 3. Active subscription (covers fanclub + subscription tiers)
    if (!entitled) {
      const subs = await base44.asServiceRole.entities.Subscription.filter({
        user_id: user.id,
        status: 'active',
      });
      if (subs.length > 0) {
        entitled = true;
        reason = 'active_subscription';
      }
    }

    // 4. Direct PPV purchase check
    if (!entitled && video.access_tier === 'ppv') {
      const purchases = await base44.asServiceRole.entities.Payment.filter({
        user_id: user.id,
        related_entity_type: 'Video',
        related_entity_id: videoId,
        status: 'completed',
      });
      if (purchases.length > 0) {
        entitled = true;
        reason = 'ppv_purchase';
      }
    }

    if (!entitled) {
      const message =
        video.access_tier === 'fanclub' ? 'Fanclub membership required to watch this video.' :
        video.access_tier === 'ppv' ? 'Purchase required to watch this video.' :
        'Subscription required to watch this video.';
      return Response.json({
        entitled: false,
        access_tier: video.access_tier,
        message,
      }, { status: 403 });
    }

    // Return the playback URL — only to entitled users
    // Future: replace with a short-lived signed R2 URL here
    if (!video.source_video_url) {
      return Response.json({ error: 'Video file not yet available' }, { status: 404 });
    }

    return Response.json({
      entitled: true,
      playback_url: video.source_video_url,
      access_tier: video.access_tier,
      reason,
    });
  } catch (error) {
    console.error('getVideoPlaybackUrl error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});