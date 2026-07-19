import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

async function sha(value) {
  const data = new TextEncoder().encode(value || 'unknown');
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function getApplicationByToken(base44, applicationId, token) {
  const records = await base44.asServiceRole.entities.ApplicationUploadToken.filter({ token_hash: await sha(token) });
  const record = records?.[0];
  if (!record || record.application_id !== applicationId || record.status !== 'issued') return { error: 'Invalid token or application not found', status: 403 };
  if (new Date(record.expires_at) < new Date()) {
    await base44.asServiceRole.entities.ApplicationUploadToken.update(record.id, { status: 'expired', last_rejection_reason: 'expired' });
    return { error: 'Upload token has expired', status: 403 };
  }
  const application = await base44.asServiceRole.entities.GuestProductionApplication.get(applicationId);
  return { application, tokenRecord: record };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { application_id, token } = await req.json();
    if (!application_id) return Response.json({ error: 'application_id required' }, { status: 400 });

    let application;
    let tokenRecord;
    if (token) {
      const resolved = await getApplicationByToken(base44, application_id, token);
      if (resolved.error) return Response.json({ error: resolved.error }, { status: resolved.status });
      application = resolved.application;
      tokenRecord = resolved.tokenRecord;
    } else {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
      application = await base44.asServiceRole.entities.GuestProductionApplication.get(application_id);
      if (!application) return Response.json({ error: 'Application not found' }, { status: 404 });
    }

    const photoCount = (application.profile_photo_r2_keys || []).length;
    const videoCount = [application.intro_video_r2_key, application.hardcore_video_r2_key].filter(Boolean).length;
    const hasIdFront = !!(application.id_document_front_r2_key || application.id_document_r2_key);
    const hasIdBack = !!application.id_document_back_r2_key;
    const hasSelfie = !!application.selfie_with_id_r2_key;
    const missingItems = [];
    if (photoCount < 5) missingItems.push(`${5 - photoCount} photo${5 - photoCount > 1 ? 's' : ''}`);
    if (!application.intro_video_r2_key) missingItems.push('intro video');
    if (!application.hardcore_video_r2_key) missingItems.push('hardcore video');
    if (!hasIdFront) missingItems.push('ID document');
    if (!hasSelfie) missingItems.push('selfie with ID');
    const allRequiredComplete = missingItems.length === 0;

    let status = allRequiredComplete ? 'ready_for_review' : 'incomplete';
    let statusMessage = allRequiredComplete ? 'Your application is ready for review' : 'Missing required uploads';
    if (allRequiredComplete) {
      if (application.status === 'approved') { status = 'approved'; statusMessage = 'Your application has been approved'; }
      else if (application.status === 'rejected') { status = 'rejected'; statusMessage = 'Your application was rejected'; }
      else if (['reviewing', 'contacted'].includes(application.status)) { status = 'under_review'; statusMessage = 'Your files are under review'; }
      else if (application.status === 'more_info_requested') { status = 'more_info_requested'; statusMessage = 'Admin requested more information'; }
    } else if (application.status === 'media_pending') {
      status = 'media_pending'; statusMessage = 'Waiting for media uploads';
    }

    return Response.json({
      success: true,
      application_id: application.id,
      status: { application_status: application.status, upload_status: status, status_message: statusMessage, token_expires_at: tokenRecord?.expires_at || null },
      upload_counts: {
        photos: { uploaded: photoCount, required: 5, missing: Math.max(0, 5 - photoCount) },
        videos: { uploaded: videoCount, required: 2, missing: 2 - videoCount },
        id_verification: { id_front: hasIdFront, id_back: hasIdBack, selfie: hasSelfie, complete: hasIdFront && hasSelfie }
      },
      missing_items: missingItems,
      admin_feedback: { rejection_reason: application.rejection_reason, more_info_request_message: application.more_info_request_message, admin_notes: application.admin_notes },
      all_required_complete: allRequiredComplete
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});