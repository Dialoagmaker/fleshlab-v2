/**
 * submitPerformerApplication
 * Creates a GuestProductionApplication record from the public form.
 * Accepts both legacy (text-only) and new (structured + media) payloads.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const payload = await req.json();

    const {
      // Core
      applicant_name, email, phone, nationality, city, legal_name,
      experience, social_links, interests, package_interest,
      // Media R2 keys (new)
      profile_photo_r2_keys, intro_video_r2_key, hardcore_video_r2_key, id_document_r2_key,
      media_upload_status, compliance_upload_status,
      // Legacy fallback
      message, id_document_url,
    } = payload;

    if (!applicant_name || !email) {
      return Response.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Determine media upload completeness
    const hasPhotos = profile_photo_r2_keys?.length >= 5;
    const hasVideos = intro_video_r2_key && hardcore_video_r2_key;
    const hasId = !!id_document_r2_key;
    const computedMediaStatus = (hasPhotos && hasVideos) ? 'complete' : (profile_photo_r2_keys?.length > 0 || intro_video_r2_key || hardcore_video_r2_key) ? 'partial' : 'none';
    const computedComplianceStatus = hasId ? 'uploaded' : 'none';

    // Determine initial status
    const initialStatus = (computedMediaStatus === 'complete' && computedComplianceStatus === 'uploaded') ? 'pending' : 'media_pending';

    const application = await base44.asServiceRole.entities.GuestProductionApplication.create({
      applicant_name,
      legal_name: legal_name || null,
      email,
      phone: phone || null,
      nationality: nationality || null,
      city: city || null,
      experience: experience || null,
      social_links: social_links || null,
      interests: interests || [],
      package_interest: package_interest || 'not_sure',
      // Media
      profile_photo_r2_keys: profile_photo_r2_keys || [],
      intro_video_r2_key: intro_video_r2_key || null,
      hardcore_video_r2_key: hardcore_video_r2_key || null,
      id_document_r2_key: id_document_r2_key || null,
      media_upload_status: media_upload_status || computedMediaStatus,
      compliance_upload_status: compliance_upload_status || computedComplianceStatus,
      // Legacy
      message: message || null,
      id_document_url: id_document_url || null,
      status: initialStatus,
      submitted_at: new Date().toISOString(),
      admin_notes: `Source: become_performer\nPreferred Path: ${package_interest || 'Not specified'}`,
    });

    return Response.json({
      success: true,
      application_id: application.id,
      status: initialStatus,
      message: 'Application submitted successfully',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});