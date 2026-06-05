/**
 * checkStuckProcessingJobs - Timeout Handler
 * 
 * Scheduled automation to detect and mark stuck processing jobs.
 * Runs every 5 minutes, checks for jobs in 'processing' status for >10 minutes.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Admin-only check
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const now = Date.now();
    const timeoutThresholdMs = 10 * 60 * 1000; // 10 minutes

    console.log('[checkStuckProcessingJobs] Starting timeout check...');

    // Get all processing jobs
    const processingJobs = await base44.entities.JobQueue.filter(
      { status: 'processing' },
      '-created_date',
      100
    );

    let timeoutCount = 0;
    let checkedCount = 0;

    for (const job of processingJobs) {
      checkedCount++;
      const createdAt = new Date(job.created_date).getTime();
      const elapsedMs = now - createdAt;
      const elapsedMinutes = Math.floor(elapsedMs / 60000);

      console.log(`[checkStuckProcessingJobs] Job ${job.id}:`, {
        status: job.status,
        elapsed_minutes: elapsedMinutes,
        job_type: job.job_type,
        entity_id: job.entity_id,
      });

      // Check if timeout exceeded
      if (elapsedMs > timeoutThresholdMs) {
        console.warn(`[checkStuckProcessingJobs] Job ${job.id} TIMEOUT after ${elapsedMinutes} minutes`);

        // Update job to timeout
        await base44.entities.JobQueue.update(job.id, {
          status: 'timeout',
          error_message: `External processor accepted job but did not send callback within ${elapsedMinutes} minutes.`,
          completed_at: new Date().toISOString(),
          result: JSON.stringify({
            timeout: true,
            elapsed_seconds: Math.floor(elapsedMs / 1000),
            elapsed_minutes: elapsedMinutes,
            timeout_threshold_minutes: 10,
            reason: 'No callback received from external processor',
          }),
        });

        timeoutCount++;
      }
    }

    console.log(`[checkStuckProcessingJobs] Complete: checked=${checkedCount}, timeout=${timeoutCount}`);

    return Response.json({
      success: true,
      checked_count: checkedCount,
      timeout_count: timeoutCount,
      timeout_threshold_minutes: 10,
    });

  } catch (error) {
    console.error('[checkStuckProcessingJobs] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});