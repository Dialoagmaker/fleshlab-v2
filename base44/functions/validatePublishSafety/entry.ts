import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { video_id } = await req.json();
    if (!video_id) {
      return Response.json({ error: 'video_id required' }, { status: 400 });
    }

    // Fetch video
    const video = await base44.entities.Video.get(video_id);
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    const errors = [];
    const warnings = [];

    // === REQUIRED VALIDATIONS (block publishing) ===

    // 1. Source video URL
    if (!video.source_video_url || video.source_video_url.trim() === '') {
      errors.push('Source video URL is missing');
    }

    // 2. Thumbnail URL
    if (!video.primary_thumbnail_url || video.primary_thumbnail_url.trim() === '') {
      errors.push('Thumbnail URL is missing');
    }

    // 3. Preview/Trailer URL
    if (!video.trailer_url || video.trailer_url.trim() === '') {
      errors.push('Preview/trailer URL is missing');
    }

    // 4. Title (min 3 chars)
    if (!video.title || video.title.trim().length < 3) {
      errors.push('Title is required (minimum 3 characters)');
    }

    // 5. Access tier
    if (!video.access_tier || !['free', 'fanclub', 'ppv'].includes(video.access_tier)) {
      errors.push('Access tier must be set (free, fanclub, or ppv)');
    }

    // 6. Status must be draft
    if (video.status !== 'draft') {
      errors.push('Video must be in draft status to publish');
    }

    // 7. Processing status must be exactly "draft_ready"
    if (video.processing_status !== 'draft_ready') {
      errors.push('Video processing must be complete before publishing (status must be "draft_ready")');
    }

    // 8. CRITICAL: At least one performer must be assigned
    const videoPerformers = await base44.entities.VideoPerformer.filter({ video_id });
    if (!videoPerformers || videoPerformers.length === 0) {
      errors.push('At least one performer must be assigned before publishing');
    }

    // === WARNING VALIDATIONS (notify but allow publishing) ===

    // 1. Description length
    if (!video.description || video.description.trim().length < 50) {
      warnings.push('Description is short (recommended: at least 50 characters)');
    }

    // 2. No AI metadata draft
    if (!video.ai_metadata_draft) {
      warnings.push('No AI metadata draft generated');
    }

    // 3. No promo kit generated
    if (!video.promo_kit_generated_at) {
      warnings.push('No promo kit generated yet');
    }

    // 4. Check asset health (optional warnings)
    const assets = await base44.entities.VideoAsset.filter({ video_id });
    const hasSource = assets?.some(a => a.asset_type === 'source' && a.status === 'ready');
    const hasThumbnail = assets?.some(a => a.asset_type === 'thumbnail' && a.status === 'ready');
    const hasPreview = assets?.some(a => a.asset_type === 'preview' && a.status === 'ready');
    const hasCover = assets?.some(a => a.asset_type === 'cover' && a.is_approved_cover);

    if (!hasSource) warnings.push('Source asset not marked as ready');
    if (!hasThumbnail) warnings.push('Thumbnail asset not marked as ready');
    if (!hasPreview) warnings.push('Preview asset not marked as ready');
    if (!hasCover) warnings.push('Cover asset not approved');

    return Response.json({
      can_publish: errors.length === 0,
      errors,
      warnings,
      validation_summary: {
        error_count: errors.length,
        warning_count: warnings.length,
        video_id: video_id,
        video_title: video.title,
        processing_status: video.processing_status,
        status: video.status,
        performer_count: videoPerformers?.length || 0,
      },
    });

  } catch (error) {
    console.error('validatePublishSafety error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});