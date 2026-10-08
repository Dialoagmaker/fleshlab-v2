// Guest Production Compatibility Utility Functions
// Pure compatibility evaluation logic for admin planning tool

export const PRODUCTION_TYPES = [
  "solo", "duo", "group", "interview", "livecam",
  "guest_production", "custom_scene", "fetish_theme",
  "outdoor", "studio", "remote_recording"
];

export const SCENE_STYLES = [
  "soft", "energetic", "dominant", "submissive", "playful",
  "romantic", "rougher_style_on_review", "fetish_focused",
  "cinematic", "amateur_style", "studio_style"
];

export const AVAILABLE_ROLES = [
  "lead_performer", "supporting_performer", "solo_performer",
  "dominant_role", "submissive_role", "versatile_role",
  "host_role", "guest_role"
];

export const CONDITIONAL_THEMES = [
  "bondage", "impact_play", "role_play", "age_play",
  "pet_play", "humiliation", "worship", "sensory_deprivation",
  "restraint", "power_exchange", "custom_fetish"
];

export const PRIVACY_OPTIONS = [
  "face_visible", "face_blur_available", "stage_name_only",
  "no_real_name", "no_location_disclosure", "limited_social_crosspost",
  "no_social_crosspost", "studio_only_distribution"
];

export const SAFETY_REQUIREMENTS = [
  "consent_form_required", "performer_final_approval_required",
  "studio_supervision_required", "health_safety_review_required",
  "guest_identity_verification_required", "no_unapproved_guests",
  "stop_signal_required", "boundaries_confirmed_before_shoot"
];

export function checkGuestProductionCompatibility(performer, request) {
  const result = {
    status: 'compatible_with_review',
    display: { statusLabel: 'Compatible with Review', statusColor: 'bg-green-500/10 text-green-500' },
    info: [],
    hard_blockers: [],
    missing_safety_requirements: [],
    review_required: [],
    matches: {
      production_types: [],
      scene_styles: [],
      roles: [],
      privacy_options: [],
      safety_requirements: []
    }
  };

  const performerProfile = performer || {};
  const profileEnabled = performerProfile.production_profile_enabled || false;
  const reviewStatus = performerProfile.compatibility_review_status || 'not_reviewed';
  const availableTypes = performerProfile.available_production_types || [];
  const preferredStyles = performerProfile.preferred_scene_styles || [];
  const availableRoles = performerProfile.available_roles || [];
  const conditionalThemes = performerProfile.conditional_themes || [];
  const boundaries = performerProfile.not_available_boundaries || [];
  const privacyOptions = performerProfile.privacy_options || [];
  const safetyReqs = performerProfile.safety_requirements || [];

  // A. Profile Not Enabled
  if (!profileEnabled) {
    result.status = 'not_ready';
    result.display = { statusLabel: 'Not Ready', statusColor: 'bg-muted text-muted-foreground' };
    result.info.push('Production Compatibility Profile is not enabled for this performer.');
    result.info.push('Do not proceed without completing and reviewing the profile.');
    return result;
  }

  // B. Profile Not Approved
  if (reviewStatus !== 'approved') {
    result.info.push('Compatibility profile is not approved (current status: ' + reviewStatus.replace(/_/g, ' ') + ').');
    result.info.push('Admin review required before any decision.');
    if (result.status === 'compatible_with_review') {
      result.status = 'review_required';
      result.display = { statusLabel: 'Review Required', statusColor: 'bg-yellow-500/10 text-yellow-500' };
    }
  }

  // C. Production Type Match
  (request.requested_production_types || []).forEach(type => {
    if (availableTypes.includes(type)) {
      result.matches.production_types.push(type);
    } else {
      result.review_required.push({
        field: 'production_type',
        value: type,
        message: `Requested production type "${type.replace(/_/g, ' ')}" is not listed as available. Requires review.`
      });
    }
  });

  // D. Scene Style Match
  (request.requested_scene_styles || []).forEach(style => {
    if (preferredStyles.includes(style)) {
      result.matches.scene_styles.push(style);
    } else {
      result.review_required.push({
        field: 'scene_style',
        value: style,
        message: `Requested scene style "${style.replace(/_/g, ' ')}" is not listed as preferred. Requires review.`
      });
    }
  });

  // E. Role Match
  (request.requested_roles || []).forEach(role => {
    if (availableRoles.includes(role)) {
      result.matches.roles.push(role);
    } else {
      result.review_required.push({
        field: 'role',
        value: role,
        message: `Requested role "${role.replace(/_/g, ' ')}" is not listed as available. Requires review.`
      });
    }
  });

  // F. Conditional Themes & Hard Boundaries
  (request.requested_themes || []).forEach(theme => {
    if (boundaries.includes(theme)) {
      result.hard_blockers.push({
        field: 'theme',
        value: theme,
        message: `Requested theme "${theme.replace(/_/g, ' ')}" conflicts with performer boundary. This is a hard blocker.`
      });
    } else if (conditionalThemes.includes(theme)) {
      result.review_required.push({
        field: 'theme',
        value: theme,
        message: `Requested theme "${theme.replace(/_/g, ' ')}" requires studio review and explicit performer approval.`
      });
    } else {
      result.review_required.push({
        field: 'theme',
        value: theme,
        message: `Requested theme "${theme.replace(/_/g, ' ')}" is not listed. Requires manual review.`
      });
    }
  });

  // G. Privacy Options
  (request.requested_privacy_options || []).forEach(option => {
    if (privacyOptions.includes(option)) {
      result.matches.privacy_options.push(option);
    } else {
      result.review_required.push({
        field: 'privacy',
        value: option,
        message: `Requested privacy option "${option.replace(/_/g, ' ')}" is not listed. Requires review.`
      });
    }
  });

  // H. Safety Requirements
  (SAFETY_REQUIREMENTS || []).forEach(req => {
    if (safetyReqs.includes(req)) {
      if ((request.provided_safety_requirements || []).includes(req)) {
        result.matches.safety_requirements.push(req);
      } else {
        result.missing_safety_requirements.push({
          field: 'safety',
          value: req,
          message: `Performer requires "${req.replace(/_/g, ' ')}" but it is not provided.`
        });
      }
    }
  });

  // I. Determine Overall Recommendation
  if (result.hard_blockers.length > 0) {
    result.status = 'not_compatible';
    result.display = { statusLabel: 'Not Compatible', statusColor: 'bg-destructive/10 text-destructive' };
    result.info.push('This request has hard blockers and cannot proceed without changing the request.');
  } else if (result.missing_safety_requirements.length > 0) {
    result.status = 'not_compatible';
    result.display = { statusLabel: 'Not Compatible', statusColor: 'bg-destructive/10 text-destructive' };
    result.info.push('Missing required safety requirements. All performer safety requirements must be satisfied.');
  } else if (result.review_required.length > 0 && result.status !== 'review_required') {
    result.status = 'review_required';
    result.display = { statusLabel: 'Review Required', statusColor: 'bg-yellow-500/10 text-yellow-500' };
    result.info.push('Some requested items require studio review and explicit performer approval.');
  }

  return result;
}

export function formatCompatibilitySummary(result, performerName) {
  const lines = [
    `Guest Production Compatibility Check - ${performerName}`,
    `Result: ${result.display.statusLabel}`,
    ''
  ];

  if (result.info.length > 0) {
    lines.push('Summary:');
    result.info.forEach(item => lines.push(`- ${item}`));
    lines.push('');
  }

  if (result.hard_blockers.length > 0) {
    lines.push('Hard Blockers:');
    result.hard_blockers.forEach(item => lines.push(`❌ ${item.message}`));
    lines.push('');
  }

  if (result.missing_safety_requirements.length > 0) {
    lines.push('Missing Safety Requirements:');
    result.missing_safety_requirements.forEach(item => lines.push(`❌ ${item.message}`));
    lines.push('');
  }

  if (result.review_required.length > 0) {
    lines.push('Items Requiring Review:');
    result.review_required.forEach(item => lines.push(`⚠️ ${item.message}`));
    lines.push('');
  }

  if (Object.values(result.matches).some(arr => arr.length > 0)) {
    lines.push('Matched Items:');
    if (result.matches.production_types.length > 0) {
      lines.push(`✓ Production Types: ${result.matches.production_types.map(t => t.replace(/_/g, ' ')).join(', ')}`);
    }
    if (result.matches.scene_styles.length > 0) {
      lines.push(`✓ Scene Styles: ${result.matches.scene_styles.map(s => s.replace(/_/g, ' ')).join(', ')}`);
    }
    if (result.matches.roles.length > 0) {
      lines.push(`✓ Roles: ${result.matches.roles.map(r => r.replace(/_/g, ' ')).join(', ')}`);
    }
    if (result.matches.privacy_options.length > 0) {
      lines.push(`✓ Privacy Options: ${result.matches.privacy_options.map(p => p.replace(/_/g, ' ')).join(', ')}`);
    }
    if (result.matches.safety_requirements.length > 0) {
      lines.push(`✓ Safety Requirements: ${result.matches.safety_requirements.map(s => s.replace(/_/g, ' ')).join(', ')}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('DISCLAIMER: This compatibility check is an internal planning aid only.');
  lines.push('It does not replace performer approval, updated consent confirmation,');
  lines.push('contract review, or studio safety review.');

  return lines.join('\n');
}