function compact(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

const EXPLICIT_COPY = /hole|ass|finger|fingers|fingering|hardcore|porn|cum|fuck|fucks|explicit/i;

function cleanMarketingCopy(value, maxLength = 44) {
  const text = compact(value);
  if (!text || EXPLICIT_COPY.test(text) || text.length > maxLength) return "";
  return text;
}

export function shouldUseFleshlabKeyArtLanguage(text = "") {
  return /fleshlab|campaign|release|poster|cover|key art|hero|kraken|beach|welcome|new|bathroom|shower|steam|solo|exclusive|amateur|loyalfans|fan|twink|filipino/i.test(text);
}

export function resolveCampaignHeadline(campaign = {}) {
  const curated = cleanMarketingCopy(
    campaign.posterTitle ||
    campaign.displayTitle ||
    campaign.safeCampaignTitle ||
    campaign.marketingTitle ||
    campaign.campaignConceptTitle ||
    campaign.releaseName ||
    campaign.collection
  );
  if (curated) return curated;

  const raw = compact(campaign.campaignTitle || campaign.primaryTitle || "");
  const text = `${raw} ${campaign.collection || ""} ${campaign.releaseName || ""} ${campaign.campaignLabel || ""}`.toLowerCase();
  if (!EXPLICIT_COPY.test(raw) && raw.length <= 44) return raw;
  if (/beach|ocean|island|summer|shore|coast/.test(text)) return "BEACH ESCAPE";
  if (/wild|outdoor|jungle|river|nature|forest|mountain/.test(text)) return "INTO THE WILD";
  if (/welcome|loyal|official/.test(text)) return "WELCOME";
  if (/new|release|drop|premiere/.test(text)) return "NEW RELEASE";
  if (/bathroom|shower|steam|soap/.test(text)) return "STEAM CUT";
  if (/solo/.test(text)) return "SOLO DROP";
  return "FEATURE PRESENTATION";
}

export function resolveCampaignSubtitle(campaign = {}) {
  return cleanMarketingCopy(
    campaign.posterSubtitle ||
    campaign.subtitle ||
    campaign.optionalSubtitle ||
    campaign.tagline ||
    campaign.campaignLabel,
    64
  );
}

export function resolveCampaignBadges(campaign = {}) {
  const provided = Array.isArray(campaign.badges) ? campaign.badges.map(item => cleanMarketingCopy(item, 28)).filter(Boolean) : [];
  if (provided.length) return provided.slice(0, 4);
  const text = `${campaign.contentType || ""} ${campaign.campaignTitle || ""} ${campaign.collection || ""}`.toLowerCase();
  const badges = [];
  if (/behind|bts|real|documentary|raw/.test(text)) badges.push("Behind The Scenes");
  if (/video|premium|4k|hd|quality/.test(text)) badges.push("High Quality Video");
  if (/fan|exclusive|ppv|private/.test(text)) badges.push("Fan Exclusives");
  if (/new|release|weekly|drop/.test(text)) badges.push("New Videos");
  return (badges.length ? badges : ["Exclusive Content", "Premium Quality", "Only On FLESHLAB"]).slice(0, 4);
}