/**
 * resolvePerformerRevenueModel - Shared Helper
 * 
 * Determines the correct revenue share percentage for a performer based on:
 * 1. Explicit contract model (if available)
 * 2. Performer profile revenue_split_pct field
 * 3. Default fallback: Studio Managed (40% performer / 60% studio)
 * 
 * DO NOT default to 70% - that is ONLY for Established/Network performers explicitly assigned that model.
 */

export function resolvePerformerRevenueModel(performer) {
  if (!performer) {
    // Default to Studio Managed if no performer data
    return {
      model_key: 'studio_managed',
      model_label: 'Studio Managed',
      performer_share_percentage: 40,
      studio_share_percentage: 60,
      source: 'default'
    };
  }

  // Check if performer has explicit revenue_model field (future enhancement)
  if (performer.revenue_model) {
    if (performer.revenue_model === 'established_network') {
      return {
        model_key: 'established_network',
        model_label: 'Established/Network',
        performer_share_percentage: 70,
        studio_share_percentage: 30,
        source: 'explicit_contract'
      };
    }
    // Default to studio_managed for any other value
    return {
      model_key: 'studio_managed',
      model_label: 'Studio Managed',
      performer_share_percentage: 40,
      studio_share_percentage: 60,
      source: 'explicit_contract'
    };
  }

  // Check performer.revenue_split_pct (current implementation)
  // If explicitly set to 70, they are Established/Network
  // Otherwise default to Studio Managed 40%
  if (performer.revenue_split_pct !== undefined && performer.revenue_split_pct !== null) {
    const splitPct = parseFloat(performer.revenue_split_pct);
    
    // Only treat as Established/Network if explicitly set to 70
    if (splitPct === 70) {
      return {
        model_key: 'established_network',
        model_label: 'Established/Network',
        performer_share_percentage: 70,
        studio_share_percentage: 30,
        source: 'performer_profile'
      };
    }
    
    // If set to any other value (including 40), use that value but label as Studio Managed
    return {
      model_key: 'studio_managed',
      model_label: 'Studio Managed',
      performer_share_percentage: splitPct,
      studio_share_percentage: 100 - splitPct,
      source: 'performer_profile'
    };
  }

  // DEFAULT FALLBACK: Studio Managed 40/60 split
  // This is the CORRECT default - NOT 70%
  return {
    model_key: 'studio_managed',
    model_label: 'Studio Managed',
    performer_share_percentage: 40,
    studio_share_percentage: 60,
    source: 'default'
  };
}