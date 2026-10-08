/**
 * Performer SEO Utility Functions
 * Generates safe, compliant SEO titles and meta descriptions for performer profiles
 */

/**
 * Check if nationality indicates Filipino/Pinoy
 */
export function isFilipino(nationality) {
  if (!nationality) return false;
  const lower = nationality.toLowerCase();
  return lower.includes('philippine') || 
         lower.includes('filipino') || 
         lower.includes('pinoy') ||
         lower.includes('philippines');
}

/**
 * Check if nationality indicates Asian
 */
export function isAsian(nationality) {
  if (!nationality) return false;
  const lower = nationality.toLowerCase();
  const asianCountries = [
    'philippines', 'filipino', 'pinoy',
    'thailand', 'thai',
    'vietnam', 'vietnamese',
    'indonesia', 'indonesian',
    'malaysia', 'malaysian',
    'singapore', 'singaporean',
    'china', 'chinese',
    'japan', 'japanese',
    'korea', 'korean',
    'taiwan', 'taiwanese',
    'cambodia', 'cambodian',
    'laos', 'laotian',
    'myanmar', 'burmese',
    'india', 'indian',
    'pakistan', 'pakistani',
    'bangladesh', 'bangladeshi'
  ];
  return asianCountries.some(country => lower.includes(country));
}

/**
 * Extract role from bio if clearly stated
 */
export function extractRoleFromBio(bio) {
  if (!bio) return null;
  const lower = bio.toLowerCase();
  if (lower.includes(' top ') || lower.startsWith('top ') || lower.includes(' top')) return 'top';
  if (lower.includes(' bottom ') || lower.startsWith('bottom ') || lower.includes(' bottom')) return 'bottom';
  if (lower.includes(' vers ') || lower.includes('versatile') || lower.startsWith('vers ')) return 'versatile';
  return null;
}

/**
 * Generate SEO title for performer profile
 */
export function generatePerformerTitle(performer) {
  const name = performer?.display_name || 'Performer';
  const nationality = performer?.nationality;
  const verified = performer?.verified;
  const fanclubEnabled = performer?.fanclub_enabled;
  
  // Build title parts based on available data
  const parts = [name];
  
  // Add descriptor if we have safe data
  const isFil = isFilipino(nationality);
  const isAs = isAsian(nationality);
  
  if (verified && isFil) {
    parts.push('Verified Filipino Performer');
  } else if (verified && isAs) {
    parts.push('Verified Asian Performer');
  } else if (isFil) {
    parts.push('Filipino Performer');
  } else if (isAs) {
    parts.push('Asian Performer');
  } else if (verified) {
    parts.push('Verified Performer');
  }
  
  parts.push('FLESHLAB Studios');
  
  // Keep under ~60 characters for optimal display
  const title = parts.join(' | ');
  return title.length > 70 ? `${name} | FLESHLAB Studios` : title;
}

/**
 * Generate meta description for performer profile
 */
export function generatePerformerMetaDescription(performer) {
  const name = performer?.display_name || 'Performer';
  const nationality = performer?.nationality;
  const bio = performer?.bio;
  const fanclubEnabled = performer?.fanclub_enabled;
  const verified = performer?.verified;
  
  // Base description
  let description = `Meet ${name}, a ${verified ? 'verified 18+ ' : ''}FLESHLAB Studios performer`;
  
  // Add nationality-based descriptor if safe
  const isFil = isFilipino(nationality);
  const isAs = isAsian(nationality);
  
  if (isFil) {
    description += ` and Filipino gay content creator`;
  } else if (isAs) {
    description += ` featured in Asian gay adult content`;
  }
  
  // Extract role from bio if available
  const role = extractRoleFromBio(bio);
  if (role) {
    description += `, ${role} performer`;
  }
  
  // Add fanclub if enabled
  if (fanclubEnabled) {
    description += ` with exclusive fanclub content`;
  }
  
  // Add general keywords
  description += `. Featured in studio productions, solo scenes, and premium gay adult videos.`;
  
  // Truncate to ~155 characters
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }
  
  return description;
}

/**
 * Generate SEO intro paragraph for performer profile page
 */
export function generatePerformerSEOBio(performer) {
  const name = performer?.display_name || 'Performer';
  const nationality = performer?.nationality;
  const verified = performer?.verified;
  const fanclubEnabled = performer?.fanclub_enabled;
  
  let intro = `${name} is a ${verified ? 'verified 18+ ' : ''}FLESHLAB Studios performer`;
  
  const isFil = isFilipino(nationality);
  const isAs = isAsian(nationality);
  
  if (isFil) {
    intro += ` and Filipino gay content creator`;
  } else if (isAs) {
    intro += ` featured in Asian gay adult productions`;
  } else {
    intro += ` featured in gay adult content`;
  }
  
  intro += `, solo scenes, fanclub updates and studio-produced adult content`;
  
  if (fanclubEnabled) {
    intro += ` with exclusive fanclub access available`;
  }
  
  intro += '.';
  
  return intro;
}