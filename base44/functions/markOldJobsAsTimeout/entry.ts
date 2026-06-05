/**
 * markOldJobsAsTimeout - Cleanup Tool
 * 
 * Marks old stuck processing jobs as timeout.
 * Used when callback URL was misconfigured.
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
    const { video_id, mark_all_videos = false } = payload;

    // Build query
    const query = {
      entity_type: 'Video',
      job_type: 'regenerate_thumbnail',
      status: 'processing',
    };

    if (video_id && !mark_all_videos) {
      query.entity_id = video_id;
    }

    console.log('[markOldJobsAsTimeout] Finding stuck jobs:', query);

    // Find all processing jobs (no callback received)
    const stuckJobs = await base44.entities.JobQueue.filter(query, '-created_date', 100);

    console.log('[markOldJobsAsTimeout] Found stuck jobs:', stuckJobs.length);

    if (stuckJobs.length === 0) {
      return Response.json({
        success: true,
        message: 'No stuck jobs found',
        jobs_marked: 0,
      });
    }

    // Mark as timeout
    let markedCount = 0;
    for (const job of stuckJobs) {
      const elapsed = Math.floor((Date.now() - new Date(job.created_date).getTime()) / 1000);
      
      // Only mark jobs older than 5 minutes
      if (elapsed > 300) {
        await base44.entities.JobQueue.update(job.id, {
          status: 'timeout',
          error_message: 'Old job timed out due to wrong callback URL (/api/functions/ path incorrect)',
          completed_at: new Date().toISOString(),
        });
        markedCount++;
        console.log('[markOldJobsAsTimeout] Marked as timeout:', {
          job_id: job.id,
          elapsed_seconds: elapsed,
        });
      }
    }

    return Response.json({
      success: true,
      message: `Marked ${markedCount} stuck jobs as timeout`,
      jobs_marked: markedCount,
      total_stuck_found: stuckJobs.length,
    });

  } catch (error) {
    console.error('[markOldJobsAsTimeout] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});