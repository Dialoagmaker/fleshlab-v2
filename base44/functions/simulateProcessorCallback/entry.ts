/**
 * simulateProcessorCallback
 * 
 * Test function to simulate a processor callback and verify the callback endpoint is working.
 * Creates a test job and sends a callback to updateVideoProcessingResult.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Admin-only
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { video_id, test_mode = true } = await req.json();

    console.log('[simulateProcessorCallback] Starting callback simulation...', { video_id, test_mode });

    // Create a test job if no video_id provided
    let testJob;
    if (test_mode) {
      // Create minimal test video if needed
      const testVideo = await base44.entities.Video.create({
        title: `TEST CALLBACK ${new Date().toISOString()}`,
        slug: `test-callback-${Date.now()}`,
        status: 'draft',
        brand_id: null,
      });

      console.log('[simulateProcessorCallback] Created test video:', testVideo.id);

      // Create test job
      testJob = await base44.entities.JobQueue.create({
        job_type: 'regenerate_thumbnail',
        status: 'processing',
        priority: 5,
        payload: JSON.stringify({
          video_id: testVideo.id,
          operation: 'thumbnail_only',
          test_mode: true,
        }),
        entity_type: 'Video',
        entity_id: testVideo.id,
        started_at: new Date().toISOString(),
      });

      console.log('[simulateProcessorCallback] Created test job:', testJob.id);
    } else {
      if (!video_id) {
        return Response.json({ error: 'video_id required when test_mode=false' }, { status: 400 });
      }
      
      // Find existing job for this video
      const existingJobs = await base44.entities.JobQueue.filter(
        { entity_type: 'Video', entity_id: video_id },
        '-created_date',
        1
      );

      if (!existingJobs || existingJobs.length === 0) {
        return Response.json({ error: 'No job found for this video' }, { status: 404 });
      }

      testJob = existingJobs[0];
    }

    // Build callback payload
    const callbackPayload = {
      job_id: testJob.id,
      video_id: testJob.entity_id,
      status: 'success',
      thumbnail_url: 'https://example.com/test-thumbnail.jpg',
      preview_url: test_mode ? null : undefined,
      source_url: 'https://example.com/test-source.mov',
      metadata: {
        test_mode: true,
        simulated_at: new Date().toISOString(),
      },
    };

    // Get callback URL
    const processorApiKey = Deno.env.get('PROCESSOR_API_KEY');
    const appBaseUrl = (Deno.env.get('APP_BASE_URL') || '').replace(/\/$/, '');
    const callbackUrl = `${appBaseUrl}/functions/updateVideoProcessingResult?processor_key=${encodeURIComponent(processorApiKey)}`;

    console.log('[simulateProcessorCallback] Sending callback to:', callbackUrl);
    console.log('[simulateProcessorCallback] Callback payload:', callbackPayload);

    // Send callback
    const callbackResponse = await fetch(callbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(callbackPayload),
    });

    let callbackResponseBody;
    try {
      callbackResponseBody = await callbackResponse.json();
    } catch {
      callbackResponseBody = await callbackResponse.text();
    }

    console.log('[simulateProcessorCallback] Callback response:', {
      status: callbackResponse.status,
      body: callbackResponseBody,
    });

    // Get updated job status
    const updatedJob = await base44.entities.JobQueue.get(testJob.id);

    const result = {
      success: callbackResponse.ok,
      callback_url: callbackUrl,
      callback_http_status: callbackResponse.status,
      callback_response_body: callbackResponseBody,
      payload_sent: callbackPayload,
      job_before: {
        id: testJob.id,
        status: 'processing',
      },
      job_after: {
        id: updatedJob.id,
        status: updatedJob.status,
        callback_received_at: updatedJob.callback_received_at,
        callback_attempts: updatedJob.callback_attempts,
      },
    };

    console.log('[simulateProcessorCallback] Complete:', result);

    return Response.json(result);

  } catch (error) {
    console.error('[simulateProcessorCallback] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});