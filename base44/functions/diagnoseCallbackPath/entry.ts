/**
 * diagnoseCallbackPath - Phase 2C.2 Debug
 * 
 * Tests the callback path from processor to Base44.
 * Used to verify:
 * - callback_url is reachable
 * - auth token is valid
 * - payload validation works
 * - processor can access Base44 endpoint
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
    const { job_id, video_id, test_callback } = payload;

    // Get job details
    const job = job_id ? await base44.entities.JobQueue.get(job_id) : null;
    const video = video_id ? await base44.entities.Video.get(video_id) : null;

    if (!job && !video) {
      return Response.json({ error: 'Job or video not found' }, { status: 404 });
    }

    const targetJob = job || (await base44.entities.JobQueue.filter(
      { entity_type: 'Video', entity_id: video_id },
      '-created_date',
      1
    ))[0];

    if (!targetJob) {
      return Response.json({ error: 'No job found for this video' }, { status: 404 });
    }

    // Parse job payload
    let jobPayload;
    try {
      jobPayload = JSON.parse(targetJob.payload);
    } catch (e) {
      jobPayload = { raw: targetJob.payload };
    }

    // Build callback URL
    const processorApiKey = Deno.env.get('PROCESSOR_API_KEY');
    const appBaseUrl = (Deno.env.get('APP_BASE_URL') || '').replace(/\/$/, '');
    const callbackUrl = `${appBaseUrl}/api/functions/updateVideoProcessingResult?processor_key=${encodeURIComponent(processorApiKey)}`;

    // Test callback endpoint
    let callbackTestResult = null;
    if (test_callback) {
      try {
        const testPayload = {
          job_id: targetJob.id,
          video_id: targetJob.entity_id,
          source_asset_id: jobPayload.source_asset_id,
          thumbnail_url: 'https://video.fleshlab.online/test-thumbnail.jpg',
          preview_url: null,
          status: 'test',
          validation_result: {
            test: true,
            timestamp: new Date().toISOString()
          }
        };

        const callbackResponse = await fetch(callbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload),
        });

        const callbackBody = await callbackResponse.text();
        callbackTestResult = {
          url: callbackUrl,
          status: callbackResponse.status,
          body: callbackBody.substring(0, 500),
          reachable: callbackResponse.ok,
        };
      } catch (callbackError) {
        callbackTestResult = {
          url: callbackUrl,
          error: callbackError.message,
          reachable: false,
        };
      }
    }

    // Calculate elapsed time
    const createdAt = new Date(targetJob.created_date).getTime();
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - createdAt) / 1000);
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    // Check for timeout
    const isTimeout = elapsedSeconds > 600;

    return Response.json({
      job_id: targetJob.id,
      video_id: targetJob.entity_id,
      job_type: targetJob.job_type,
      job_status: targetJob.status,
      job_payload: jobPayload,
      
      // Processor request details
      processor_request: {
        job_id: targetJob.id,
        video_id: targetJob.entity_id,
        mode: jobPayload.operation || 'thumbnail_only',
        source_url: 'Signed R2 URL (1-hour TTL)',
        source_r2_key: jobPayload.source_r2_key,
        source_asset_id: jobPayload.source_asset_id,
        output_prefix: 'studios/{studio_id}/thumbnails/',
        callback_url: callbackUrl,
      },
      
      // Callback URL verification
      callback_url_verification: {
        full_url: callbackUrl,
        base_url: appBaseUrl,
        endpoint: '/api/functions/updateVideoProcessingResult',
        auth_method: 'query_param',
        auth_param: 'processor_key',
        auth_configured: !!processorApiKey,
        is_publicly_reachable: appBaseUrl.startsWith('https://'),
      },
      
      // Callback test result
      callback_test: callbackTestResult,
      
      // Timing
      timing: {
        created_at: targetJob.created_date,
        started_at: targetJob.started_at,
        elapsed_seconds: elapsedSeconds,
        elapsed_minutes: elapsedMinutes,
        timeout_threshold_seconds: 600,
        is_timeout: isTimeout,
      },
      
      // Current state
      current_state: {
        video_thumbnail_url: video?.primary_thumbnail_url || '(empty)',
        job_result: targetJob.result,
        job_error_message: targetJob.error_message,
        job_completed_at: targetJob.completed_at,
      },
      
      // Recommendations
      recommendations: [
        isTimeout ? '⚠️ Job has exceeded 10-minute timeout' : '✅ Job within timeout window',
        callbackTestResult?.reachable ? '✅ Callback endpoint is reachable' : '⚠️ Callback endpoint test not run or failed',
        processorApiKey ? '✅ Processor API key configured' : '❌ Processor API key missing',
        appBaseUrl ? '✅ APP_BASE_URL configured' : '❌ APP_BASE_URL missing',
      ].filter(Boolean),
    });

  } catch (error) {
    console.error('[diagnoseCallbackPath] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});