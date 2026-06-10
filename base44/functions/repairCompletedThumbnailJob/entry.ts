/**
 * repairCompletedThumbnailJob
 *
 * Admin-only repair function.
 * When a thumbnail job shows "completed" in the DB but Video.primary_thumbnail_url is still null,
 * this function:
 *   1. Reads the completed job's stored result
 *   2. Extracts the thumbnail URL (handles multiple possible field names)
 *   3. Validates the URL is an accessible image
 *   4. Writes it to Video.primary_thumbnail_url
 *
 * If the job result has no URL, it re-triggers thumbnail generation.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    const { video_id, job_id } = payload;

    if (!video_id) {
      return Response.json({ error: 'Missing required field: video_id' }, { status: 400 });
    }

    // Load the video
    const video = await base44.entities.Video.get(video_id);
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    const diagnostics = {
      video_id,
      video_current_thumbnail: video.primary_thumbnail_url || null,
      job_id: null,
      job_status: null,
      job_result_raw: null,
      thumbnail_url_found: null,
      thumbnail_url_source_field: null,
      thumbnail_validation: null,
      action_taken: null,
      final_video_thumbnail: null,
    };

    // Find the job — use provided job_id or find most recent completed job for this video
    let job = null;
    if (job_id) {
      job = await base44.entities.JobQueue.get(job_id);
    } else {
      const jobs = await base44.entities.JobQueue.filter(
        { entity_type: 'Video', entity_id: video_id },
        '-created_date',
        20
      );
      // Prefer 'completed' jobs, then any job
      job = jobs.find(j => j.status === 'completed') || jobs[0];
    }

    if (!job) {
      diagnostics.action_taken = 'no_job_found_will_retrigger';
      // No completed job — trigger fresh thumbnail generation
      const retrigger = await base44.functions.invoke('triggerThumbnailRegeneration', { video_id });
      return Response.json({
        success: true,
        action: 'retriggered',
        message: 'No completed job found — triggered fresh thumbnail generation',
        diagnostics,
        retrigger: retrigger.data,
      });
    }

    diagnostics.job_id = job.id;
    diagnostics.job_status = job.status;
    diagnostics.job_result_raw = job.result;

    // Parse stored result
    let result = null;
    if (job.result) {
      try { result = JSON.parse(job.result); } catch (_) { result = null; }
    }

    // Extract thumbnail URL from every possible field name
    const thumbnailUrl = (
      result?.thumbnail_url ||
      result?.thumbnailUrl ||
      result?.poster_url ||
      result?.output_url ||
      result?.assets?.thumbnail?.url ||
      result?.thumbnail ||
      null
    );

    diagnostics.thumbnail_url_found = thumbnailUrl;

    // Identify which field it came from (for diagnostics)
    if (result) {
      for (const field of ['thumbnail_url', 'thumbnailUrl', 'poster_url', 'output_url', 'thumbnail']) {
        if (result[field]) { diagnostics.thumbnail_url_source_field = field; break; }
      }
      if (!diagnostics.thumbnail_url_source_field && result?.assets?.thumbnail?.url) {
        diagnostics.thumbnail_url_source_field = 'assets.thumbnail.url';
      }
    }

    if (!thumbnailUrl) {
      // No URL in the completed job result — re-trigger
      diagnostics.action_taken = 'no_url_in_result_will_retrigger';
      const retrigger = await base44.functions.invoke('triggerThumbnailRegeneration', { video_id });
      return Response.json({
        success: true,
        action: 'retriggered',
        message: `Job ${job.id} is completed but contains no thumbnail URL — triggered fresh thumbnail generation`,
        diagnostics,
        retrigger: retrigger.data,
      });
    }

    // Validate the URL is actually accessible
    let validationOk = false;
    let validationReason = '';
    try {
      const headRes = await fetch(thumbnailUrl, { method: 'HEAD', redirect: 'follow' });
      if ([200, 206, 304].includes(headRes.status)) {
        const ct = headRes.headers.get('content-type') || '';
        validationOk = ct.startsWith('image/');
        validationReason = validationOk ? `HTTP ${headRes.status} ${ct}` : `Invalid content-type: ${ct}`;
      } else {
        validationReason = `HTTP ${headRes.status}`;
      }
    } catch (err) {
      validationReason = `Fetch error: ${err.message}`;
    }

    diagnostics.thumbnail_validation = { ok: validationOk, reason: validationReason };

    if (!validationOk) {
      // URL not accessible — re-trigger
      diagnostics.action_taken = 'url_not_accessible_will_retrigger';
      const retrigger = await base44.functions.invoke('triggerThumbnailRegeneration', { video_id });
      return Response.json({
        success: true,
        action: 'retriggered',
        message: `Thumbnail URL from job is not accessible (${validationReason}) — triggered fresh thumbnail generation`,
        diagnostics,
        retrigger: retrigger.data,
      });
    }

    // URL is valid — write it to the Video entity
    await base44.entities.Video.update(video_id, {
      primary_thumbnail_url: thumbnailUrl,
      processing_status: 'metadata_pending',
    });

    diagnostics.action_taken = 'wrote_thumbnail_url';
    diagnostics.final_video_thumbnail = thumbnailUrl;

    // Also mark the job result with repair metadata
    await base44.entities.JobQueue.update(job.id, {
      result: JSON.stringify({
        ...(result || {}),
        repaired_at: new Date().toISOString(),
        repaired_by: user.id,
        thumbnail_written: thumbnailUrl,
      }),
    });

    console.log('[repairCompletedThumbnailJob] SUCCESS', {
      video_id,
      job_id: job.id,
      thumbnail_url: thumbnailUrl,
      validation: validationReason,
    });

    return Response.json({
      success: true,
      action: 'thumbnail_url_written',
      message: `Thumbnail URL successfully written to Video.primary_thumbnail_url`,
      thumbnail_url: thumbnailUrl,
      diagnostics,
    });

  } catch (error) {
    console.error('[repairCompletedThumbnailJob] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});