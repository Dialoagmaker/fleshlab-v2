/**
 * getApplicantUploadStatus
 * Returns upload status for applicant/performer to see what's missing.
 * Access control: Only applicant themselves (via token) or linked user can access.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    const { application_id, token } = body;

    if (!application_id) {
      return Response.json({ error: 'Missing application_id' }, { status: 400 });
    }

    let application;
    
    // Access control: Either via upload token OR via logged-in user who owns the application
    if (token) {
      // Token-based access (applicant without login)
      const applications = await base44.asServiceRole.entities.GuestProductionApplication.filter({
        id: application_id,
        application_upload_token: token
      });
      
      if (!applications || applications.length === 0) {
        return Response.json({ error: 'Invalid token or application not found' }, { status: 403 });
      }
      
      application = applications[0];
    } else {
      // User-based access (logged-in user)
      const user = await base44.auth.me();
      
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      application = await base44.asServiceRole.entities.GuestProductionApplication.get(application_id);
      
      if (!application) {
        return Response.json({ error: 'Application not found' }, { status: 404 });
      }
      
      // Verify user owns this application
      const isOwner = 
        application.applicant_user_id === user.id || 
        application.linked_user_id === user.id ||
        application.email === user.email;
      
      if (!isOwner && user.role !== 'admin') {
        return Response.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Calculate upload status
    const photos = application.profile_photo_r2_keys || [];
    const hasIdFront = !!application.id_document_front_r2_key || !!application.id_document_r2_key;
    const hasIdBack = !!application.id_document_back_r2_key;
    const hasSelfie = !!application.selfie_with_id_r2_key;
    const hasIntroVideo = !!application.intro_video_r2_key;
    const hasHardcoreVideo = !!application.hardcore_video_r2_key;

    const photoCount = photos.length;
    const photoRequired = 5;
    const photoMissing = Math.max(0, photoRequired - photoCount);
    
    const videoCount = (hasIntroVideo ? 1 : 0) + (hasHardcoreVideo ? 1 : 0);
    const videoRequired = 2;
    const videoMissing = videoRequired - videoCount;
    
    const idMissing = !hasIdFront ? 'ID document' : (!hasSelfie ? 'Selfie with ID' : null);
    
    const allRequiredComplete = photoCount >= photoRequired && videoCount >= videoRequired && hasIdFront && hasSelfie;

    // Determine overall status
    let status = 'incomplete';
    let statusMessage = '';
    const missingItems = [];
    
    if (photoMissing > 0) {
      missingItems.push(`${photoMissing} photo${photoMissing > 1 ? 's' : ''}`);
    }
    if (videoMissing > 0) {
      missingItems.push(`${videoMissing} video${videoMissing > 1 ? 's' : ''}`);
    }
    if (idMissing) {
      missingItems.push(idMissing);
    }
    
    if (allRequiredComplete) {
      if (application.status === 'pending' || application.status === 'media_pending') {
        status = 'review_ready';
        statusMessage = 'Your application is ready for review.';
      } else if (['reviewing', 'contacted', 'more_info_requested'].includes(application.status)) {
        status = 'under_review';
        statusMessage = 'Your files are under review by our team.';
      } else if (application.status === 'approved') {
        status = 'approved';
        statusMessage = 'Your application has been approved.';
      } else if (application.status === 'rejected') {
        status = 'rejected';
        statusMessage = application.rejection_reason || 'Your application was rejected.';
      } else {
        status = 'complete';
        statusMessage = 'All required files uploaded.';
      }
    } else {
      status = 'incomplete';
      statusMessage = `Missing: ${missingItems.join(', ')}`;
    }

    // Get admin feedback if any
    const adminFeedback = {
      rejection_reason: application.rejection_reason,
      more_info_request_message: application.more_info_request_message,
      admin_notes: application.admin_notes,
      performer_visible_message: application.performer_visible_message
    };

    return Response.json({
      success: true,
      application_id: application.id,
      status,
      status_message: statusMessage,
      upload_counts: {
        photos: { uploaded: photoCount, required: photoRequired, missing: photoMissing },
        videos: { uploaded: videoCount, required: videoRequired, missing: videoMissing },
        id_verification: { 
          id_front: hasIdFront, 
          id_back: hasIdBack, 
          selfie: hasSelfie,
          complete: hasIdFront && hasSelfie
        }
      },
      missing_items: missingItems,
      all_required_complete: allRequiredComplete,
      application_status: application.status,
      admin_feedback: adminFeedback,
      last_activity_at: application.last_activity_at || application.updated_date,
      token_expires_at: application.application_upload_token_expires_at
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});