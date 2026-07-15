export const POSTER_FAMILIES = [
  {
    id: "fleshlab-beach",
    label: "FLESHLAB Beach",
    titles: ["BEACH", "ESCAPE"],
    typography: { titleFont: "Bebas Neue", accentFont: "Permanent Marker", titleScale: 0.15, accentScale: 0.105 },
    gradient: "directional-panel",
    footer: "minimal",
    mood: "sunlit, premium, travel heat",
  },
  {
    id: "hotel-sessions",
    label: "Hotel Sessions",
    typography: { titleFont: "Bebas Neue", accentFont: "Permanent Marker", titleScale: 0.145, accentScale: 0.095 },
    gradient: "room-shadow",
    footer: "hidden-if-crowded",
    mood: "room key, night, private story",
  },
  {
    id: "documentary",
    label: "FLESHLAB Documentary",
    typography: { titleFont: "Bebas Neue", accentFont: "Inter", titleScale: 0.132, accentScale: 0.032 },
    gradient: "cinema-vignette",
    footer: "none",
    mood: "raw, human, behind the scenes",
  },
  {
    id: "first-time",
    label: "FLESHLAB First Time",
    typography: { titleFont: "Bebas Neue", accentFont: "Permanent Marker", titleScale: 0.14, accentScale: 0.09 },
    gradient: "soft-red-edge",
    footer: "minimal",
    mood: "nervous, intimate, beginning",
  },
  {
    id: "raw-amateur",
    label: "FLESHLAB Raw Amateur",
    typography: { titleFont: "Bebas Neue", accentFont: "Permanent Marker", titleScale: 0.155, accentScale: 0.082 },
    gradient: "hard-shadow",
    footer: "stamp",
    mood: "direct, gritty, real",
  },
  {
    id: "couples",
    label: "FLESHLAB Couples",
    typography: { titleFont: "Bebas Neue", accentFont: "Permanent Marker", titleScale: 0.128, accentScale: 0.082 },
    gradient: "balanced-wide",
    footer: "hidden-if-crowded",
    mood: "chemistry, two-person, story",
  },
];

export function choosePosterFamily(analysis, metadata = {}) {
  const text = [metadata.videoTitle, metadata.optionalSubtitle, metadata.campaignName, metadata.contentType].filter(Boolean).join(" ").toLowerCase();
  if (/beach|outdoor|wild|island|cebu|summer/.test(text)) return POSTER_FAMILIES[0];
  if (/hotel|room|night|302|suite/.test(text)) return POSTER_FAMILIES[1];
  if (/first|virgin|new|debut/.test(text)) return POSTER_FAMILIES[3];
  if (/couple|boyfriend|real couple|duo/.test(text)) return POSTER_FAMILIES[5];
  if (analysis.backgroundComplexity > 0.56) return POSTER_FAMILIES[2];
  if (analysis.subjectDominance > 0.58) return POSTER_FAMILIES[4];
  return POSTER_FAMILIES[0];
}