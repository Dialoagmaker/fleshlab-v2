import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

async function sha(value) {
  const data = new TextEncoder().encode(value || 'unknown');
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function tokenAccess(base44, applicationId, token) {
  const records = await base44.asServiceRole.entities.ApplicationUploadToken.filter({ token_hash: await sha(token) });
  const record = records?.[0];
  if (!record || record.application_id !== applicationId || record.status !== 'issued') return { error: 'Invalid token or application not found', status: 403 };
  if (new Date(record.expires_at) < new Date()) {
    await base44.asServiceRole.entities.ApplicationUploadToken.update(record.id, { status: 'expired', last_rejection_reason: 'expired' });
    return { error: 'Upload token has expired', status: 403 };
  }
  return { tokenRecord: record };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { application_id, token } = await req.json();
    if (!application_id) return Response.json({ error: 'Missing application_id' }, { status: 400 });

    let application;
    let tokenRecord;
    if (token) {
      const resolved = await tokenAccess(base44, application_id, token);
      if (resolved.error) return Response.json({ error: resolved.error }, { status: resolved.status });
      tokenRecord = resolved.tokenRecord;
      application = await base44.asServiceRole.entities.GuestProductionApplication.get(application_id);
    } else {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      application = await base44.asServiceRole.entities.GuestProductionApplication.get(application_id);
      if (!application) return Response.json({ error: 'Application not found' }, { status: 404 });
      const isOwner = application.applicant_user_id === user.id || application.linked_user_id === user.id || application.email === user.email;
      if (!isOwner && user.role !== 'admin') return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const photos = application.profile_photo_r2_keys || [];
    const hasIdFront = !!application.id_document_front_r2_key || !!application.id_document_r2_key;
    const hasIdBack = !!application.id_document_back_r2_key;
    const hasSelfie = !!application.selfie_with_id_r2_key;
    const hasIntroVideo = !!application.intro_video_r2_key;
    const hasHardcoreVideo = !!application.hardcore_video_r2_key;
    const photoCount = photos.length;
    const photoMissing = Math.max(0, 5 - photoCount);
    const videoCount = (hasIntroVideo ? 1 : 0) + (hasHardcoreVideo ? 1 : 0);
    const videoMissing = 2 - videoCount;
    const missingItems = [];
    if (photoMissing > 0) missingItems.push(`${photoMissing} photo${photoMissing > 1 ? 's' : ''}`);
    if (videoMissing > 0) missingItems.push(`${videoMissing} video${videoMissing > 1 ? 's' : ''}`);
    if (!hasIdFront) missingItems.push('ID document');
    if (hasIdFront && !hasSelfie) missingItems.push('Selfie with ID');
    const allRequiredComplete = photoCount >= 5 && videoCount >= 2 && hasIdFront && hasSelfie;

    let status = allRequiredComplete ? 'review_ready' : 'incomplete';
    let statusMessage = allRequiredComplete ? 'Your application is ready for review.' : `Missing: ${missingItems.join(', ')}`;
    if (allRequiredComplete && ['reviewing', 'contacted', 'more_info_requested'].includes(application.status)) { status = 'under_review'; statusMessage = 'Your files are under review by our team.'; }
    if (allRequiredComplete && application.status === 'approved') { status = 'approved'; statusMessage = 'Your application has been approved.'; }
    if (application.status === 'rejected') { status = 'rejected'; statusMessage = application.rejection_reason || 'Your application was rejected.'; }

    return Response.json({
      success: true,
      application_id: application.id,
      status,
      status_message: statusMessage,
      upload_counts: {
        photos: { uploaded: photoCount, required: 5, missing: photoMissing },
        videos: { uploaded: videoCount, required: 2, missing: videoMissing },
        id_verification: { id_front: hasIdFront, id_back: hasIdBack, selfie: hasSelfie, complete: hasIdFront && hasSelfie }
      },
      missing_items: missingItems,
      all_required_complete: allRequiredComplete,
      application_status: application.status,
      admin_feedback: { rejection_reason: application.rejection_reason, more_info_request_message: application.more_info_request_message, admin_notes: application.admin_notes, performer_visible_message: application.performer_visible_message },
      last_activity_at: application.last_activity_at || application.updated_date,
      token_expires_at: tokenRecord?.expires_at || null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});