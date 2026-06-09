/**
 * getApplicationUploadStatus
 * Returns upload status for an application, including counts, missing items, and admin feedback.
 * Access control: Only the applicant (via token) or admin can access.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { application_id, token } = body;

    if (!application_id) {
      return Response.json({ error: 'application_id required' }, { status: 400 });
    }

    // Access control: Either token-based (applicant) or admin
    let application;
    
    if (token) {
      // Token-based access (applicant)
      const applications = await base44.asServiceRole.entities.GuestProductionApplication.filter({
        id: application_id,
        application_upload_token: token
      });
      
      if (!applications || applications.length === 0) {
        return Response.json({ error: 'Invalid token or application not found' }, { status: 403 });
      }
      
      application = applications[0];
    } else {
      // Admin access
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Admin access required' }, { status: 403 });
      }
      
      application = await base44.asServiceRole.entities.GuestProductionApplication.get(application_id);
      
      if (!application) {
        return Response.json({ error: 'Application not found' }, { status: 404 });
      }
    }

    // Calculate upload counts
    const photoCount = (application.profile_photo_r2_keys || []).length;
    const videoCount = [application.intro_video_r2_key, application.hardcore_video_r2_key].filter(Boolean).length;
    const hasIdFront = !!(application.id_document_front_r2_key || application.id_document_r2_key);
    const hasIdBack = !!application.id_document_back_r2_key;
    const hasSelfie = !!application.selfie_with_id_r2_key;

    // Determine missing items
    const missingItems = [];
    if (photoCount < 5) {
      missingItems.push(`${5 - photoCount} photo${5 - photoCount > 1 ? 's' : ''}`);
    }
    if (!application.intro_video_r2_key) {
      missingItems.push('intro video');
    }
    if (!application.hardcore_video_r2_key) {
      missingItems.push('hardcore video');
    }
    if (!hasIdFront) {
      missingItems.push('ID document');
    }
    if (!hasSelfie) {
      missingItems.push('selfie with ID');
    }

    // Determine status
    const allRequiredComplete = missingItems.length === 0;
    let status = 'incomplete';
    let statusMessage = 'Missing required uploads';
    
    if (allRequiredComplete) {
      if (application.status === 'approved') {
        status = 'approved';
        statusMessage = 'Your application has been approved';
      } else if (application.status === 'rejected') {
        status = 'rejected';
        statusMessage = 'Your application was rejected';
      } else if (application.status === 'reviewing' || application.status === 'contacted') {
        status = 'under_review';
        statusMessage = 'Your files are under review';
      } else if (application.status === 'more_info_requested') {
        status = 'more_info_requested';
        statusMessage = 'Admin requested more information';
      } else {
        status = 'ready_for_review';
        statusMessage = 'Your application is ready for review';
      }
    } else {
      if (application.status === 'media_pending') {
        status = 'media_pending';
        statusMessage = 'Waiting for media uploads';
      } else if (application.compliance_upload_status === 'uploaded' && !hasIdFront) {
        status = 'id_pending';
        statusMessage = 'Waiting for ID verification';
      } else {
        status = 'incomplete';
        statusMessage = 'Missing required uploads';
      }
    }

    // Admin feedback
    const adminFeedback = {
      rejection_reason: application.rejection_reason,
      more_info_request_message: application.more_info_request_message,
      admin_notes: application.admin_notes
    };

    // Token expiry
    const tokenExpiresAt = application.application_upload_token_expires_at;

    return Response.json({
      success: true,
      application_id: application.id,
      status: {
        application_status: application.status,
        upload_status: status,
        status_message: statusMessage,
        token_expires_at: tokenExpiresAt
      },
      upload_counts: {
        photos: {
          uploaded: photoCount,
          required: 5,
          missing: Math.max(0, 5 - photoCount)
        },
        videos: {
          uploaded: videoCount,
          required: 2,
          missing: 2 - videoCount
        },
        id_verification: {
          id_front: hasIdFront,
          id_back: hasIdBack,
          selfie: hasSelfie,
          complete: hasIdFront && hasSelfie
        }
      },
      missing_items: missingItems,
      admin_feedback: adminFeedback,
      all_required_complete: allRequiredComplete
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});