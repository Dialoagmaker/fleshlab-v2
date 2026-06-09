/**
 * finalizeTokenUpload
 * After file is uploaded to R2, this endpoint updates the application record with the new file key.
 * Also logs the upload activity.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { format } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const body = await req.json();
    const { token, r2_key, file_type, photo_index } = body;

    if (!token || !r2_key || !file_type) {
      return Response.json({ error: 'Missing required fields: token, r2_key, file_type' }, { status: 400 });
    }

    // Find application by token
    const applications = await base44.asServiceRole.entities.GuestProductionApplication.filter({
      application_upload_token: token,
    });

    if (!applications || applications.length === 0) {
      return Response.json({ error: 'Invalid or expired upload token' }, { status: 403 });
    }

    const application = applications[0];
    const ts = format(new Date(), 'yyyy-MM-dd HH:mm');

    let updateData: any = {};
    let logMessage = '';

    switch (file_type) {
      case 'photo':
        const existingPhotos = application.profile_photo_r2_keys || [];
        if (photo_index !== undefined && photo_index < existingPhotos.length) {
          // Replace existing photo
          existingPhotos[photo_index] = r2_key;
          updateData.profile_photo_r2_keys = existingPhotos;
          logMessage = `Replaced photo ${photo_index + 1}`;
        } else {
          // Add new photo
          updateData.profile_photo_r2_keys = [...existingPhotos, r2_key];
          logMessage = `Uploaded photo ${existingPhotos.length + 1}`;
        }
        break;
      case 'intro_video':
        updateData.intro_video_r2_key = r2_key;
        logMessage = 'Uploaded/replaced body video';
        break;
      case 'hardcore_video':
        updateData.hardcore_video_r2_key = r2_key;
        logMessage = 'Uploaded/replaced hardcore video';
        break;
      case 'id_document_front':
        updateData.id_document_front_r2_key = r2_key;
        logMessage = 'Uploaded ID front';
        break;
      case 'id_document_back':
        updateData.id_document_back_r2_key = r2_key;
        logMessage = 'Uploaded ID back';
        break;
      case 'selfie_with_id':
        updateData.selfie_with_id_r2_key = r2_key;
        logMessage = 'Uploaded selfie with ID';
        break;
      default:
        return Response.json({ error: 'Invalid file_type' }, { status: 400 });
    }

    // Update media upload status
    const newPhotos = updateData.profile_photo_r2_keys || application.profile_photo_r2_keys || [];
    const hasPhotos = newPhotos.length >= 5;
    const hasVideos = (updateData.intro_video_r2_key || application.intro_video_r2_key) && 
                      (updateData.hardcore_video_r2_key || application.hardcore_video_r2_key);
    const hasId = (updateData.id_document_front_r2_key || application.id_document_front_r2_key) ||
                  (updateData.id_document_r2_key || application.id_document_r2_key);
    const hasSelfie = (updateData.selfie_with_id_r2_key || application.selfie_with_id_r2_key);
    
    updateData.media_upload_status = (hasPhotos && hasVideos) ? 'complete' : 
                                      (newPhotos.length > 0 || updateData.intro_video_r2_key || updateData.hardcore_video_r2_key) ? 'partial' : 'none';
    updateData.compliance_upload_status = hasId ? 'uploaded' : 'none';
    updateData.last_activity_at = new Date().toISOString();

    // Update contact log
    const existingLog = application.contact_log || '';
    updateData.contact_log = existingLog 
      ? `${existingLog}\n\n[${ts}] ${logMessage} via upload token`
      : `[${ts}] ${logMessage} via upload token`;

    await base44.asServiceRole.entities.GuestProductionApplication.update(application.id, updateData);

    // Check if application is now ready for review
    const allRequiredComplete = hasPhotos && hasVideos && hasId && hasSelfie;

    return Response.json({
      success: true,
      application_id: application.id,
      file_type,
      r2_key,
      message: logMessage,
      ready_for_review: allRequiredComplete,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});