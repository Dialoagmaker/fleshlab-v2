/**
 * queueBrokenAssetRepairs - PHASE 2C.3B
 * Creates JobQueue records for broken asset repairs.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { dryRun = true, maxJobs = 50, modes = ['thumbnail_only', 'preview_only', 'full_assets'] } = await req.json().catch(() => ({}));

    // Fetch videos
    const videos = await base44.entities.Video.filter({ status: { $in: ['published', 'draft'] } }, 'created_date', 500);

    const jobs = [];
    let queued = 0;

    for (const video of videos) {
      if (queued >= maxJobs) break;

      const audit = await auditVideo(video);
      
      if (!audit.canRepair || audit.recommendedMode === 'source_required_error' || !modes.includes(audit.recommendedMode)) {
        continue;
      }

      const existingJobs = await base44.entities.JobQueue.filter({
        entity_type: 'Video',
        entity_id: video.id,
        status: { $in: ['pending', 'running', 'callback_received', 'validating'] }
      });

      if (existingJobs && existingJobs.length > 0) continue;

      const jobPayload = {
        operation: audit.recommendedMode,
        video_id: video.id,
        video_title: video.title,
        reason: audit.blockingReason,
        priority: video.status === 'published' ? 1 : 5,
      };

      if (!dryRun) {
        const job = await base44.entities.JobQueue.create({
          job_type: audit.recommendedMode === 'thumbnail_only' ? 'regenerate_thumbnail' :
                    audit.recommendedMode === 'preview_only' ? 'regenerate_preview' :
                    'process_video',
          status: 'pending',
          priority: jobPayload.priority,
          payload: JSON.stringify(jobPayload),
          entity_type: 'Video',
          entity_id: video.id,
        });

        jobs.push({ job_id: job.id, video_id: video.id, title: video.title, mode: audit.recommendedMode, status: 'pending' });
        queued++;
      } else {
        jobs.push({ video_id: video.id, title: video.title, mode: audit.recommendedMode, status: 'proposed' });
        queued++;
      }
    }

    return Response.json({ dryRun, queued, jobs });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function auditVideo(video) {
  const classify = (url) => {
    if (!url) return { type: 'missing', isLegacy: false };
    if (/r2\.dev/i.test(url)) return { type: 'legacy', isLegacy: true };
    if (url.includes('video.fleshlab.online')) return { type: 'canonical', isLegacy: false };
    return { type: 'external', isLegacy: false };
  };

  const validate = async (url, type) => {
    if (!url) return { status: 'missing' };
    try {
      const res = await fetch(url, { method: 'HEAD' });
      const ct = res.headers.get('content-type') || '';
      if (res.status === 404) return { status: '404' };
      if (type === 'image' && !ct.startsWith('image/')) {
        const t = await (await fetch(url)).text();
        if (t.includes('<!doctype html')) return { status: 'corrupt' };
      }
      return { status: 'valid' };
    } catch { return { status: 'error' }; }
  };

  const sc = classify(video.source_video_url);
  const tc = classify(video.primary_thumbnail_url);
  const pc = classify(video.trailer_url);

  const sv = await validate(video.source_video_url, 'video');
  const tv = await validate(video.primary_thumbnail_url, 'image');
  const pv = await validate(video.trailer_url, 'video');

  const sh = sv.status === 'valid' ? (sc.isLegacy ? 'legacy_healthy' : 'canonical_healthy') : `source_${sv.status}`;
  const th = tv.status === 'valid' ? (tc.isLegacy ? 'legacy_healthy' : 'canonical_healthy') : `thumbnail_${tv.status}`;
  const ph = pv.status === 'valid' ? (pc.isLegacy ? 'legacy_healthy' : 'canonical_healthy') : `preview_${pv.status}`;

  const broken = sh.includes('missing') || sh.includes('invalid') || th.includes('missing') || th.includes('corrupt') || ph.includes('missing') || ph.includes('invalid');
  
  if (!broken) return { canRepair: true, recommendedMode: 'no_action', blockingReason: null };
  if (sh.includes('missing') || sh.includes('invalid')) return { canRepair: false, recommendedMode: 'source_required_error', blockingReason: 'Source invalid' };
  
  const nt = th.includes('missing') || th.includes('corrupt');
  const np = ph.includes('missing') || ph.includes('invalid');
  
  if (nt && np) return { canRepair: true, recommendedMode: 'full_assets', blockingReason: 'Both broken' };
  if (nt) return { canRepair: true, recommendedMode: 'thumbnail_only', blockingReason: 'Thumbnail broken' };
  if (np) return { canRepair: true, recommendedMode: 'preview_only', blockingReason: 'Preview broken' };
  
  return { canRepair: false, recommendedMode: 'no_action', blockingReason: 'Unknown' };
}