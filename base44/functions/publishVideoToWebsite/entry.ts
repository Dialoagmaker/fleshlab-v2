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

    // IMPORTANT: Publish safety rules are intentionally duplicated in validatePublishSafety.js
    // and publishVideoToWebsite.js because shared helper modules are not supported reliably
    // in this Base44 deployment. Any future change to publish safety rules must be applied
    // to BOTH files. These rules must stay identical.

    // Fetch video
    const video = await base44.entities.Video.get(video_id);
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    // === SERVER-SIDE VALIDATION (same logic as validatePublishSafety.js) ===
    const errors = [];
    const warnings = [];

    // BLOCKING CHECKS
    if (!video.source_video_url || video.source_video_url.trim() === '') {
      errors.push('Source video URL is missing');
    }
    if (!video.primary_thumbnail_url || video.primary_thumbnail_url.trim() === '') {
      errors.push('Primary thumbnail URL is missing');
    }
    if (!video.trailer_url || video.trailer_url.trim() === '') {
      errors.push('Trailer URL is missing');
    }
    if (!video.title || video.title.trim().length < 3) {
      errors.push('Video title must be at least 3 characters long');
    }
    if (!video.access_tier || !['free', 'fanclub', 'ppv'].includes(video.access_tier)) {
      errors.push('Access tier must be set (free, fanclub, or ppv)');
    }
    if (video.status !== 'draft') {
      errors.push('Video must be in draft status to publish');
    }
    if (video.processing_status !== 'draft_ready') {
      errors.push('Video processing must be complete before publishing (status must be \'draft_ready\')');
    }

    const videoPerformers = await base44.entities.VideoPerformer.filter({ video_id });
    if (!videoPerformers || videoPerformers.length === 0) {
      errors.push('At least one performer must be assigned before publishing');
    }

    const qaResults = await base44.entities.ProductionQAResult.filter({ video_id }, '-qa_timestamp', 10);
    const latestQa = qaResults?.[0] || null;
    const creativeApproved = video.creative_approval_status === 'approved' || latestQa?.creative_approval_pass === true;
    const productionQaApproved = latestQa?.production_approved === true && latestQa?.final_decision === 'APPROVED';
    const executiveApproved = video.executive_approval_status === 'approved' || latestQa?.executive_approval_pass === true;
    const governanceValid = video.governance_status === 'valid' || latestQa?.governance_valid === true;

    if (!creativeApproved) errors.push('Creative approval is required before publishing');
    if (!productionQaApproved) errors.push('Production QA approval is required before publishing');
    if (!executiveApproved) errors.push('Executive approval is required before publishing');
    if (!governanceValid) errors.push('Governance validation is required before publishing');

    let studioAudit = null;
    try {
      const auditResponse = await base44.functions.invoke('studioAuditSystem', { action: 'run', trigger: 'before_publishing', video_id });
      studioAudit = auditResponse.data;
      if (!studioAudit?.ok) errors.push('Studio Audit could not complete before publishing');
      if (studioAudit?.production_readiness === 'BLOCKED') errors.push('Studio Audit blocked publishing due to critical platform risk');
    } catch (auditError) {
      errors.push('Studio Audit could not complete before publishing');
    }

    // WARNING CHECKS (non-blocking)
    if (!video.description || video.description.trim().length < 50) {
      warnings.push('Description is short (recommended: at least 50 characters)');
    }
    if (!video.ai_metadata_draft) {
      warnings.push('No AI metadata draft generated');
    }
    if (!video.promo_kit_generated_at) {
      warnings.push('No promo kit generated yet');
    }

    const assets = await base44.entities.VideoAsset.filter({ video_id });
    const hasSource = assets?.some(a => a.asset_type === 'source' && a.status === 'ready');
    const hasThumbnail = assets?.some(a => a.asset_type === 'thumbnail' && a.status === 'ready');
    const hasPreview = assets?.some(a => a.asset_type === 'preview' && a.status === 'ready');
    const hasCover = assets?.some(a => a.asset_type === 'cover' && a.is_approved_cover);

    if (!hasSource) warnings.push('Source asset not marked as ready');
    if (!hasThumbnail) warnings.push('Thumbnail asset not marked as ready');
    if (!hasPreview) warnings.push('Preview asset not marked as ready');
    if (!hasCover) warnings.push('Cover asset not approved');

    // BLOCK PUBLISHING IF ANY ERRORS
    if (errors.length > 0) {
      return Response.json({
        error: 'Publish validation failed',
        details: errors,
        warnings: warnings,
        production_qa: latestQa ? {
          qa_result_id: latestQa.qa_result_id,
          final_decision: latestQa.final_decision,
          overall_score: latestQa.overall_score,
          creative_approval: creativeApproved,
          production_qa_approval: productionQaApproved,
          executive_approval: executiveApproved,
          governance_valid: governanceValid
        } : null,
        studio_audit: studioAudit ? {
          studio_health_score: studioAudit.studio_health_score,
          production_readiness: studioAudit.production_readiness,
          critical_issue_count: studioAudit.critical_issues?.length || 0,
          warning_count: studioAudit.warnings?.length || 0
        } : null,
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // STEP 3: Update video status to published
    await base44.entities.Video.update(video_id, {
      status: 'published',
      published_at: now,
      website_published_at: now,
    });

    // STEP 4: Create SEOPage record (only if doesn't exist)
    const existingSEOPage = await base44.entities.SEOPage.filter({
      page_type: 'video',
      entity_id: video_id,
    });

    if (!existingSEOPage || existingSEOPage.length === 0) {
      await base44.entities.SEOPage.create({
        page_type: 'video',
        entity_id: video_id,
        slug: video.slug,
        meta_title: video.meta_title || video.title,
        meta_description: video.meta_description || video.description?.substring(0, 160) || '',
        status: 'approved',
        schema_json: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: video.title,
          description: video.description,
          thumbnailUrl: video.primary_thumbnail_url,
          uploadDate: now,
          duration: video.duration_seconds ? `PT${video.duration_seconds}S` : undefined,
        }),
      });
    } else {
      // Update existing SEOPage
      await base44.entities.SEOPage.update(existingSEOPage[0].id, {
        status: 'approved',
        meta_title: video.meta_title || video.title,
        meta_description: video.meta_description || video.description?.substring(0, 160) || '',
      });
    }

    // STEP 5: Create AuditLog entry
    await base44.entities.AuditLog.create({
      entity_type: 'Video',
      entity_id: video_id,
      actor_id: user.id,
      actor_role: user.role,
      action: 'publish',
      changes_json: JSON.stringify({
        status: { from: video.status, to: 'published' },
        published_at: { from: video.published_at, to: now },
        website_published_at: { from: video.website_published_at, to: now },
      }),
      notes: `Published video "${video.title}" to website`,
    });

    // STEP 6: Update promotion_status if needed
    let newPromotionStatus = video.promotion_status;
    if (video.promotion_status === 'none') {
      newPromotionStatus = 'planned';
      await base44.entities.Video.update(video_id, {
        promotion_status: 'planned',
      });
    }

    return Response.json({
      status: 'ok',
      video_id: video_id,
      published_at: now,
      promotion_status: newPromotionStatus,
      message: 'Video published successfully',
    });

  } catch (error) {
    console.error('publishVideoToWebsite error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});