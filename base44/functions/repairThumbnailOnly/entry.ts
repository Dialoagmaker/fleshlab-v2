/**
 * repairThumbnailOnly - Phase 2C.2 Async
 * 
 * DELEGATES TO: triggerThumbnailRegeneration (async)
 * 
 * This function now simply calls triggerThumbnailRegeneration
 * and returns the job_id immediately.
 * 
 * UI should poll getProcessingJobStatus for completion.
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
    const { video_id } = payload;

    if (!video_id) {
      return Response.json({ error: 'Missing required field: video_id' }, { status: 400 });
    }

    // Delegate to async trigger function
    const result = await base44.functions.invoke('triggerThumbnailRegeneration', { video_id });

    return Response.json({
      success: result.data.success,
      job_id: result.data.job_id,
      status: result.data.status,
      message: result.data.message || 'Thumbnail regeneration started',
    });

  } catch (error) {
    console.error('[repairThumbnailOnly] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});