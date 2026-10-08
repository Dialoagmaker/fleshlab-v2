/**
 * Shared upload readiness computation logic.
 * Used by both admin UI and applicant/performer-facing components.
 * DO NOT modify application.status - this is computed/read-only.
 */

export function computeUploadReadiness(application) {
  if (!application) {
    return {
      readiness_status: 'unknown',
      all_required_complete: false,
      missing_items: [],
      upload_counts: {
        photos: { uploaded: 0, required: 5, missing: 5 },
        videos: { uploaded: 0, required: 2, missing: 2 },
        id_verification: { id_front: false, id_back: false, selfie: false, complete: false }
      },
      last_activity_at: null,
      token_expires_at: null
    };
  }

  // Calculate upload counts
  const photoCount = (application.profile_photo_r2_keys || []).length;
  const videoCount = [application.intro_video_r2_key, application.hardcore_video_r2_key].filter(Boolean).length;
  const hasIdFront = !!(application.id_document_front_r2_key || application.id_document_r2_key);
  const hasIdBack = !!application.id_document_back_r2_key;
  const hasSelfie = !!application.selfie_with_id_r2_key;

  // Determine missing items
  const missingItems = [];
  if (photoCount < 5) missingItems.push(`${5 - photoCount} photo${5 - photoCount > 1 ? 's' : ''}`);
  if (!application.intro_video_r2_key) missingItems.push('intro video');
  if (!application.hardcore_video_r2_key) missingItems.push('hardcore video');
  if (!hasIdFront) missingItems.push('ID document');
  if (!hasSelfie) missingItems.push('selfie with ID');

  const allRequiredComplete = missingItems.length === 0;

  // Determine readiness status (computed, does NOT modify application.status)
  let readinessStatus = 'incomplete';
  
  if (allRequiredComplete) {
    if (application.status === 'approved') {
      readinessStatus = 'approved';
    } else if (application.status === 'rejected') {
      readinessStatus = 'rejected';
    } else if (['reviewing', 'contacted', 'more_info_requested'].includes(application.status)) {
      readinessStatus = 'under_review';
    } else {
      readinessStatus = 'ready_for_review';
    }
  } else {
    if (application.status === 'media_pending') {
      readinessStatus = 'media_pending';
    } else if (!hasIdFront && application.compliance_upload_status === 'uploaded') {
      readinessStatus = 'id_pending';
    } else {
      readinessStatus = 'incomplete';
    }
  }

  return {
    readiness_status: readinessStatus,
    all_required_complete: allRequiredComplete,
    missing_items: missingItems,
    upload_counts: {
      photos: { uploaded: photoCount, required: 5, missing: Math.max(0, 5 - photoCount) },
      videos: { uploaded: videoCount, required: 2, missing: 2 - videoCount },
      id_verification: { id_front: hasIdFront, id_back: hasIdBack, selfie: hasSelfie, complete: hasIdFront && hasSelfie }
    },
    last_activity_at: application.last_activity_at || application.updated_date,
    token_expires_at: application.application_upload_token_expires_at
  };
}

export function getReadinessBadgeColor(status) {
  const colors = {
    incomplete: "bg-gray-500/10 text-gray-500 border-gray-500/30",
    media_pending: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    id_pending: "bg-red-500/10 text-red-500 border-red-500/30",
    ready_for_review: "bg-green-500/10 text-green-500 border-green-500/30",
    under_review: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    rejected: "bg-red-500/10 text-red-500 border-red-500/30",
    unknown: "bg-gray-500/10 text-gray-500 border-gray-500/30"
  };
  return colors[status] || colors.incomplete;
}

export function formatMissingItems(missingItems, maxLength = 50) {
  if (!missingItems || missingItems.length === 0) return '';
  
  const summary = missingItems.join(', ');
  if (summary.length <= maxLength) return summary;
  
  // Truncate with ellipsis
  return summary.slice(0, maxLength - 3) + '...';
}