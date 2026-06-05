/**
 * getProcessingJobStatus - Phase 2C.2
 * 
 * Returns current status of a video processing job for UI polling.
 * Supports both GET query params and POST JSON body with flexible payload formats.
 * 
 * Request:
 * - GET: ?job_id=XXX or ?video_id=XXX
 * - POST: Various formats supported (job_id, jobId, payload.job_id, data.job_id, etc.)
 * 
 * Response includes:
 * - job_id, job_type, status, video_id
 * - created_at, started_at, completed_at
 * - result, error_message, elapsed_seconds
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
    console.log('JOB_STATUS_INPUT_START', {
      method: req.method,
      url: req.url,
      contentType: req.headers.get('content-type')
    });

    // Support both GET query params and POST JSON body
    let job_id = null;
    let video_id = null;
    let body = null;
    let rawBody = null;
    
    // Try query params first (works for both GET and POST)
    const url = new URL(req.url);
    const queryParams = {
      job_id: url.searchParams.get('job_id'),
      video_id: url.searchParams.get('video_id'),
      jobId: url.searchParams.get('jobId'),
      videoId: url.searchParams.get('videoId')
    };
    
    console.log('JOB_STATUS_QUERY_PARAMS', queryParams);
    
    job_id = queryParams.job_id || queryParams.jobId;
    video_id = queryParams.video_id || queryParams.videoId;
    
    // If not found in query params, try POST body
    if (!job_id && !video_id && req.method === 'POST') {
      try {
        const text = await req.text();
        rawBody = text;
        console.log('JOB_STATUS_RAW_BODY', text);
        
        // Try parsing as JSON
        try {
          body = JSON.parse(text);
          console.log('JOB_STATUS_PARSED_BODY', body);
          
          // Support all possible payload formats Base44 might use
          // Direct properties
          job_id = body.job_id || body.jobId;
          video_id = body.video_id || body.videoId;
          
          // payload wrapper
          if (!job_id && !video_id && body.payload) {
            job_id = body.payload.job_id || body.payload.jobId;
            video_id = body.payload.video_id || body.payload.videoId;
            console.log('JOB_STATUS_FOUND_IN_PAYLOAD', { job_id, video_id });
          }
          
          // data wrapper
          if (!job_id && !video_id && body.data) {
            job_id = body.data.job_id || body.data.jobId;
            video_id = body.data.video_id || body.data.videoId;
            console.log('JOB_STATUS_FOUND_IN_DATA', { job_id, video_id });
          }
          
          // request wrapper
          if (!job_id && !video_id && body.request) {
            job_id = body.request.job_id || body.request.jobId;
            video_id = body.request.video_id || body.request.videoId;
            console.log('JOB_STATUS_FOUND_IN_REQUEST', { job_id, video_id });
          }
          
          // params wrapper
          if (!job_id && !video_id && body.params) {
            job_id = body.params.job_id || body.params.jobId;
            video_id = body.params.video_id || body.params.videoId;
            console.log('JOB_STATUS_FOUND_IN_PARAMS', { job_id, video_id });
          }
          
          console.log('JOB_STATUS_AFTER_BODY_PARSING', { job_id, video_id });
        } catch (parseError) {
          console.error('JOB_STATUS_BODY_PARSE_ERROR', parseError.message);
        }
      } catch (readError) {
        console.error('JOB_STATUS_BODY_READ_ERROR', readError.message);
      }
    }

    // Final fallback: if still no IDs, try to extract from URL path
    if (!job_id && !video_id) {
      const pathParts = url.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && (lastPart.length === 24 || lastPart.match(/^[0-9a-f]+$/))) {
        job_id = lastPart;
        console.log('JOB_STATUS_EXTRACTED_FROM_PATH', job_id);
      }
    }

    console.log('JOB_STATUS_INPUT_FINAL', {
      method: req.method,
      queryParams,
      body,
      rawBody,
      parsedJobId: job_id,
      parsedVideoId: video_id,
      job_id_type: typeof job_id,
      video_id_type: typeof video_id,
      job_id_length: job_id?.length,
      video_id_length: video_id?.length
    });

    if (!job_id && !video_id) {
      console.error('JOB_STATUS_MISSING_IDS - returning 400');
      return Response.json({ 
        ok: false, 
        error: 'Missing job_id or video_id',
        method: req.method,
        queryParams,
        body,
        rawBody,
        parsedJobId: job_id,
        parsedVideoId: video_id,
        expected: 'Provide job_id or video_id in query params or POST body',
        supportedFormats: [
          'job_id', 'jobId',
          'payload.job_id', 'payload.jobId',
          'data.job_id', 'data.jobId',
          'request.job_id', 'request.jobId',
          'params.job_id', 'params.jobId'
        ]
      }, { status: 400 });
    }

    let job;
    if (job_id) {
      console.log('JOB_STATUS_FETCHING_BY_ID', job_id);
      job = await base44.entities.JobQueue.get(job_id);
    } else if (video_id) {
      console.log('JOB_STATUS_FETCHING_BY_VIDEO', video_id);
      // Get most recent job for this video
      const jobs = await base44.entities.JobQueue.filter(
        { entity_type: 'Video', entity_id: video_id },
        '-created_date',
        1
      );
      job = jobs[0];
    }

    if (!job) {
      console.error('JOB_STATUS_NOT_FOUND', { job_id, video_id });
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    console.log('JOB_STATUS_FOUND', {
      job_id: job.id,
      status: job.status,
      job_type: job.job_type,
      entity_id: job.entity_id
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
        console.log('JOB_STATUS_TIMEOUT', { elapsedSeconds });
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

    console.log('JOB_STATUS_RESPONSE', response);
    return Response.json(response);

  } catch (error) {
    console.error('JOB_STATUS_ERROR', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});