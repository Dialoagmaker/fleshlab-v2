import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Validate and Fix Broken Video Assets
 * 
 * This function:
 * 1. Checks if source video exists and is reachable
 * 2. Validates thumbnail and preview URLs (HEAD request)
 * 3. If URLs return 404, triggers re-generation via processor
 * 4. Only saves URLs that return 200/206 with correct content-type
 * 
 * Usage: Call from admin UI when assets show as broken
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
      return Response.json({ error: 'Missing required field: video_id' }, { status: 400 });
    }

    console.log(`🔍 Validating assets for video ${video_id}...`);

    // Step 1: Get video data
    const video = await base44.entities.Video.get(video_id);
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    const result = {
      video_id,
      title: video.title,
      source_video: { checked: false, status: 'unknown', url: video.source_video_url },
      thumbnail: { checked: false, status: 'unknown', url: video.primary_thumbnail_url },
      preview: { checked: false, status: 'unknown', url: video.trailer_url },
      actions_taken: [],
      errors: [],
    };

    // Step 2: Validate source video URL
    if (video.source_video_url) {
      try {
        const sourceRes = await fetch(video.source_video_url, { method: 'HEAD' });
        result.source_video.http_status = sourceRes.status;
        result.source_video.content_type = sourceRes.headers.get('content-type');
        
        if (sourceRes.ok || sourceRes.status === 206) {
          result.source_video.status = 'accessible';
          result.source_video.checked = true;
          console.log(`✅ Source video accessible: ${video.source_video_url}`);
        } else {
          result.source_video.status = 'error';
          result.source_video.checked = true;
          result.errors.push(`Source video returns HTTP ${sourceRes.status}`);
          console.error(`❌ Source video error: ${video.source_video_url} - HTTP ${sourceRes.status}`);
        }
      } catch (err) {
        result.source_video.status = 'error';
        result.source_video.checked = true;
        result.source_video.error = err.message;
        result.errors.push(`Source video fetch failed: ${err.message}`);
        console.error(`❌ Source video fetch error:`, err);
      }
    } else {
      result.source_video.status = 'missing';
      result.errors.push('Source video URL is missing');
      console.error('❌ Source video URL missing');
    }

    // If source is missing, cannot proceed
    if (result.source_video.status === 'missing') {
      return Response.json({
        ...result,
        message: 'Cannot generate assets - source video missing',
        can_publish: false,
      });
    }

    // Step 3: Validate thumbnail URL
    if (video.primary_thumbnail_url) {
      try {
        const thumbRes = await fetch(video.primary_thumbnail_url, { method: 'HEAD' });
        result.thumbnail.http_status = thumbRes.status;
        result.thumbnail.content_type = thumbRes.headers.get('content-type');
        
        // Check if it's actually an image
        const isImage = thumbRes.headers.get('content-type')?.startsWith('image/');
        
        if (thumbRes.ok && isImage) {
          result.thumbnail.status = 'accessible';
          result.thumbnail.checked = true;
          console.log(`✅ Thumbnail accessible: ${video.primary_thumbnail_url}`);
        } else {
          result.thumbnail.status = 'broken';
          result.thumbnail.checked = true;
          result.errors.push(`Thumbnail returns HTTP ${thumbRes.status} or invalid content-type`);
          console.error(`❌ Thumbnail error: ${video.primary_thumbnail_url} - HTTP ${thumbRes.status}, Content-Type: ${result.thumbnail.content_type}`);
        }
      } catch (err) {
        result.thumbnail.status = 'error';
        result.thumbnail.checked = true;
        result.thumbnail.error = err.message;
        result.errors.push(`Thumbnail fetch failed: ${err.message}`);
        console.error(`❌ Thumbnail fetch error:`, err);
      }
    } else {
      result.thumbnail.status = 'missing';
    }

    // Step 4: Validate preview/trailer URL
    const previewUrl = video.trailer_url || video.source_video_url;
    if (previewUrl) {
      try {
        const previewRes = await fetch(previewUrl, { method: 'HEAD' });
        result.preview.http_status = previewRes.status;
        result.preview.content_type = previewRes.headers.get('content-type');
        
        // Check if it's actually a video
        const isVideo = previewRes.headers.get('content-type')?.startsWith('video/');
        
        if (previewRes.ok && isVideo) {
          result.preview.status = 'accessible';
          result.preview.checked = true;
          console.log(`✅ Preview accessible: ${previewUrl}`);
        } else {
          result.preview.status = 'broken';
          result.preview.checked = true;
          result.errors.push(`Preview returns HTTP ${previewRes.status} or invalid content-type`);
          console.error(`❌ Preview error: ${previewUrl} - HTTP ${previewRes.status}, Content-Type: ${result.preview.content_type}`);
        }
      } catch (err) {
        result.preview.status = 'error';
        result.preview.checked = true;
        result.preview.error = err.message;
        result.errors.push(`Preview fetch failed: ${err.message}`);
        console.error(`❌ Preview fetch error:`, err);
      }
    } else {
      result.preview.status = 'missing';
    }

    // Step 5: Determine if we need to regenerate assets
    const needsThumbnailRegen = result.thumbnail.status === 'broken' || result.thumbnail.status === 'missing';
    const needsPreviewRegen = result.preview.status === 'broken' || result.preview.status === 'missing';
    const needsRegen = needsThumbnailRegen || needsPreviewRegen;

    if (needsRegen) {
      console.log(`⚠️ Assets need regeneration: thumbnail=${needsThumbnailRegen}, preview=${needsPreviewRegen}`);
      result.actions_taken.push('Asset regeneration needed');

      // Check if processor webhook is configured
      const webhookUrl = Deno.env.get('PROCESSOR_WEBHOOK_URL');
      if (!webhookUrl) {
        result.errors.push('PROCESSOR_WEBHOOK_URL not configured - cannot trigger regeneration');
        return Response.json({
          ...result,
          message: 'Assets broken but cannot regenerate - webhook not configured',
          can_publish: false,
        });
      }

      // Trigger processor to regenerate assets
      // Note: This assumes the processor can be triggered via webhook
      try {
        const processorPayload = {
          video_id,
          source_url: video.source_video_url,
          regenerate: {
            thumbnail: needsThumbnailRegen,
            preview: needsPreviewRegen,
          },
        };

        const processorRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('PROCESSOR_API_KEY') || ''}`,
          },
          body: JSON.stringify(processorPayload),
        });

        if (processorRes.ok) {
          result.actions_taken.push('Triggered processor regeneration');
          console.log('✅ Triggered processor regeneration');
        } else {
          const processorError = await processorRes.text();
          result.errors.push(`Processor trigger failed: ${processorRes.status} - ${processorError}`);
          console.error('❌ Processor trigger failed:', processorError);
        }
      } catch (err) {
        result.errors.push(`Processor trigger error: ${err.message}`);
        console.error('❌ Processor trigger error:', err);
      }

      return Response.json({
        ...result,
        message: 'Asset regeneration triggered - check back in a few minutes',
        can_publish: false,
        regen_status: 'pending',
      });
    }

    // Step 6: All assets are valid - video can publish (if other checks pass)
    const canPublish = 
      result.source_video.status === 'accessible' &&
      result.thumbnail.status === 'accessible' &&
      result.preview.status === 'accessible';

    result.can_publish = canPublish;
    result.message = canPublish 
      ? 'All assets valid - video ready to publish' 
      : 'Some assets invalid - cannot publish';

    console.log(`✅ Asset validation complete. Can publish: ${canPublish}`);

    return Response.json(result);

  } catch (error) {
    console.error('validateAndFixVideoAssets error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});