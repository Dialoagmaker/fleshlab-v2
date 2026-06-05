/**
 * getProcessingJobStatus - Phase 2C.2
 * 
 * Returns current status of a video processing job for UI polling.
 * Supports both GET query params and POST JSON body.
 * 
 * Request:
 * - GET: ?job_id=XXX or ?video_id=XXX
 * - POST: { "job_id": "XXX", "video_id": "XXX" }
 * 
 * Response includes:
 * - job_id
 * - job_type
 * - status (queued, processing, callback_received, validating, complete, failed, timeout, thumbnail_invalid)
 * - video_id
 * - created_at, started_at, completed_at
 * - result (JSON with validation report if complete)
 * - error_message (if failed)
 * - elapsed_seconds (for timeout detection)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Log exact request details
    console.log('[getProcessingJobStatus] Request received:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });

    // Support both GET query params and POST JSON body
    let job_id = null;
    let video_id = null;
    
    // Try query params first (GET requests)
    const url = new URL(req.url);
    const queryParams = {
      job_id: url.searchParams.get('job_id'),
      video_id: url.searchParams.get('video_id')
    };
    
    console.log('[getProcessingJobStatus] Query params:', queryParams);
    
    job_id = queryParams.job_id;
    video_id = queryParams.video_id;
    
    // If not found, try POST body
    let body = null;
    let parsedBody = null;
    if (!job_id && !video_id && req.method === 'POST') {
      try {
        body = await req.json();
        parsedBody = body;
        console.log('[getProcessingJobStatus] POST body (raw):', body);
        
        // Support multiple nesting levels (Base44 SDK may wrap payload)
        // Try direct properties first
        job_id = body.job_id;
        video_id = body.video_id;
        
        // Try payload wrapper
        if (!job_id && !video_id && body.payload) {
          job_id = body.payload.job_id;
          video_id = body.payload.video_id;
          console.log('[getProcessingJobStatus] Found in body.payload:', { job_id, video_id });
        }
        
        // Try data wrapper
        if (!job_id && !video_id && body.data) {
          job_id = body.data.job_id;
          video_id = body.data.video_id;
          console.log('[getProcessingJobStatus] Found in body.data:', { job_id, video_id });
        }
        
        console.log('[getProcessingJobStatus] After body parsing:', { job_id, video_id });
      } catch (e) {
        console.error('[getProcessingJobStatus] Body parsing failed:', e.message);
        // Body parsing failed, continue with null values
      }
    }

    console.log('[getProcessingJobStatus] Final parsed values:', {
      method: req.method,
      queryParams,
      body: parsedBody,
      parsedJobId: job_id,
      parsedVideoId: video_id,
      job_id_type: typeof job_id,
      video_id_type: typeof video_id
    });

    if (!job_id && !video_id) {
      console.error('[getProcessingJobStatus] Missing job_id and video_id - returning 400');
      return Response.json({ 
        ok: false, 
        error: 'Missing job_id or video_id',
        method: req.method,
        queryParams,
        body: parsedBody,
        parsedJobId: job_id,
        parsedVideoId: video_id,
        expected: 'Provide job_id or video_id in query params or POST body'
      }, { status: 400 });
    }

    let job;
    if (job_id) {
      console.log('[getProcessingJobStatus] Fetching job by ID:', job_id);
      job = await base44.entities.JobQueue.get(job_id);
    } else if (video_id) {
      console.log('[getProcessingJobStatus] Fetching most recent job for video:', video_id);
      // Get most recent job for this video
      const jobs = await base44.entities.JobQueue.filter(
        { entity_type: 'Video', entity_id: video_id },
        '-created_date',
        1
      );
      job = jobs[0];
    }

    if (!job) {
      console.error('[getProcessingJobStatus] Job not found:', { job_id, video_id });
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    console.log('[getProcessingJobStatus] Job found:', {
      job_id: job.id,
      status: job.status,
      job_type: job.job_type
    });

    // Calculate elapsed time
    const createdAt = new Date(job.created_date).getTime();
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - createdAt) / 1000);

    // Check for timeout (10 minutes = 600 seconds)
    let status = job.status;
    if (status === 'processing' || status === 'queued') {
      if (elapsedSeconds > 600) {
        status = 'timeout';
        console.log('[getProcessingJobStatus] Job timed out:', { elapsedSeconds });
      }
    }

    // Parse result JSON if present
    let result = null;
    if (job.result) {
      try {
        result = JSON.parse(job.result);
      } catch (e) {
        result = { raw: job.result };
      }
    }

    const response = {
      job_id: job.id,
      job_type: job.job_type,
      status,
      video_id: job.entity_id,
      created_at: job.created_date,
      started_at: job.started_at,
      completed_at: job.completed_at,
      result,
      error_message: job.error_message,
      elapsed_seconds: elapsedSeconds,
      is_timeout: status === 'timeout',
    };

    console.log('[getProcessingJobStatus] Returning response:', response);
    return Response.json(response);

  } catch (error) {
    console.error('[getProcessingJobStatus] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});