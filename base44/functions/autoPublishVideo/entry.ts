import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * AUTO-PUBLISH: Fully automated video publishing after upload completes.
 * Call this after finalizeUploadedVideo to handle everything automatically.
 * 
 * Does:
 * - Waits for/checks processor completion
 * - Auto-assigns performer (if only one exists or title match found)
 * - Sets all required URLs
 * - Publishes the video
 */
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

    console.log(`[AutoPublish] Starting for video ${video_id} (${video.title})`);

    // STEP 1: Ensure all URLs are set (fallback if finalizeUploadedVideo didn't set them)
    const cdnBase = (Deno.env.get('R2_PUBLIC_BUCKET_URL') || '').replace(/\/$/, '');
    const sourceAssets = await base44.entities.VideoAsset.filter({ video_id, asset_type: 'source' });
    
    if (sourceAssets.length > 0 && sourceAssets[0].r2_key) {
      const keyParts = sourceAssets[0].r2_key.split('/');
      const studio = keyParts[1] || 'default';
      const uuidDir = keyParts.length >= 4 ? keyParts[keyParts.length - 2] : null;
      const fileBase = keyParts[keyParts.length - 1];
      const basename = (uuidDir && uuidDir !== 'videos') ? uuidDir : fileBase.replace(/\.[^.]+$/, '');
      const ext = fileBase.includes('.') ? fileBase.split('.').pop() : 'mov';

      const updates: Record<string, string> = {};
      
      // Set source URL if missing
      if (!video.source_video_url) {
        updates.source_video_url = `${cdnBase}/studios/${studio}/source/${basename}${ext.startsWith('.') ? ext : '.' + ext}`;
      }
      
      // Set thumbnail URL if missing
      if (!video.primary_thumbnail_url) {
        updates.primary_thumbnail_url = `${cdnBase}/studios/${studio}/thumbnails/${basename}.jpg`;
      }
      
      // Set trailer URL if missing
      if (!video.trailer_url) {
        updates.trailer_url = `${cdnBase}/studios/${studio}/previews/${basename}-preview.mp4`;
      }

      if (Object.keys(updates).length > 0) {
        await base44.entities.Video.update(video_id, updates);
        console.log('[AutoPublish] Set missing URLs:', updates);
      }
    }

    // STEP 2: Check/fix processing status
    let processingStatus = video.processing_status;
    
    // If status is still 'processing' or 'metadata_pending', check if assets exist
    if (['processing', 'metadata_pending'].includes(processingStatus)) {
      const assets = await base44.entities.VideoAsset.filter({ video_id });
      const hasReadySource = assets.some(a => a.asset_type === 'source' && a.status === 'ready');
      const hasReadyThumbnail = assets.some(a => a.asset_type === 'thumbnail' && a.status === 'ready');
      const hasReadyPreview = assets.some(a => a.asset_type === 'preview' && a.status === 'ready');

      // If assets are ready, assume processing is complete
      if (hasReadySource && hasReadyThumbnail && hasReadyPreview) {
        await base44.entities.Video.update(video_id, {
          processing_status: 'draft_ready',
        });
        processingStatus = 'draft_ready';
        console.log('[AutoPublish] Updated processing_status to draft_ready');
      }
    }

    // STEP 3: Auto-assign performer if none assigned
    const videoPerformers = await base44.entities.VideoPerformer.filter({ video_id });
    
    if (!videoPerformers || videoPerformers.length === 0) {
      // Try to auto-assign: get all active performers
      const allPerformers = await base44.entities.Performer.filter({ status: 'active' }, 'display_name', 100);
      
      let assignedPerformerId: string | null = null;

      // Strategy 1: If only ONE performer exists, auto-assign
      if (allPerformers.length === 1) {
        assignedPerformerId = allPerformers[0].id;
        console.log(`[AutoPublish] Auto-assigned single performer: ${allPerformers[0].display_name}`);
      }
      
      // Strategy 2: Try to match video title to performer name
      if (!assignedPerformerId && video.title) {
        const titleLower = video.title.toLowerCase();
        for (const performer of allPerformers) {
          const nameLower = performer.display_name.toLowerCase();
          // Check if performer name appears in video title
          if (titleLower.includes(nameLower) || nameLower.includes(titleLower)) {
            assignedPerformerId = performer.id;
            console.log(`[AutoPublish] Auto-assigned by title match: ${performer.display_name}`);
            break;
          }
        }
      }

      // Create VideoPerformer record if found
      if (assignedPerformerId) {
        await base44.entities.VideoPerformer.create({
          video_id,
          performer_id: assignedPerformerId,
          order: 0,
          lead_performer: true,
        });
        console.log('[AutoPublish] Created VideoPerformer record');
      } else {
        console.warn('[AutoPublish] Could not auto-assign performer - multiple performers exist, no title match');
        // Don't block publishing - admin can assign later
      }
    }

    // STEP 4: Refresh video data
    const updatedVideo = await base44.entities.Video.get(video_id);
    const updatedPerformers = await base44.entities.VideoPerformer.filter({ video_id });

    // STEP 5: Auto-publish if all requirements met
    const errors: string[] = [];
    
    if (!updatedVideo.source_video_url) errors.push('Missing source_video_url');
    if (!updatedVideo.primary_thumbnail_url) errors.push('Missing primary_thumbnail_url');
    if (!updatedVideo.trailer_url) errors.push('Missing trailer_url');
    if (!updatedVideo.title || updatedVideo.title.trim().length < 3) errors.push('Invalid title');
    if (!updatedVideo.access_tier || !['free', 'fanclub', 'ppv'].includes(updatedVideo.access_tier)) {
      errors.push('Invalid access_tier');
    }
    if (updatedVideo.processing_status !== 'draft_ready') {
      errors.push(`Processing status is ${updatedVideo.processing_status}, not draft_ready`);
    }

    if (errors.length > 0) {
      return Response.json({
        status: 'not_ready',
        video_id,
        errors,
        message: 'Video not ready for auto-publish. Missing: ' + errors.join(', '),
      });
    }

    // All checks passed - publish!
    const now = new Date().toISOString();
    
    await base44.entities.Video.update(video_id, {
      status: 'published',
      published_at: now,
      website_published_at: now,
    });

    // Create SEOPage record
    const existingSEOPage = await base44.entities.SEOPage.filter({
      page_type: 'video',
      entity_id: video_id,
    });

    if (!existingSEOPage || existingSEOPage.length === 0) {
      await base44.entities.SEOPage.create({
        page_type: 'video',
        entity_id: video_id,
        slug: updatedVideo.slug,
        meta_title: updatedVideo.meta_title || updatedVideo.title,
        meta_description: updatedVideo.meta_description || updatedVideo.description?.substring(0, 160) || '',
        status: 'approved',
        schema_json: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: updatedVideo.title,
          description: updatedVideo.description,
          thumbnailUrl: updatedVideo.primary_thumbnail_url,
          uploadDate: now,
          duration: updatedVideo.duration_seconds ? `PT${updatedVideo.duration_seconds}S` : undefined,
        }),
      });
    }

    // Create AuditLog
    await base44.entities.AuditLog.create({
      entity_type: 'Video',
      entity_id: video_id,
      actor_id: user.id,
      actor_role: user.role,
      action: 'auto_publish',
      changes_json: JSON.stringify({
        status: { from: updatedVideo.status, to: 'published' },
        auto_published: true,
      }),
      notes: `Auto-published video "${updatedVideo.title}" after upload completion`,
    });

    console.log(`[AutoPublish] SUCCESS: Video ${video_id} published!`);

    return Response.json({
      status: 'published',
      video_id,
      published_at: now,
      performer_assigned: assignedPerformerId || (updatedPerformers.length > 0),
      message: 'Video auto-published successfully!',
    });

  } catch (error) {
    console.error('[AutoPublish] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});