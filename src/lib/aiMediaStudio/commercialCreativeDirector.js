function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function pick(list, seed) {
  return list[Math.abs(Math.round(seed * 1000)) % list.length];
}

function looksLikeFilename(value = "") {
  const text = String(value).trim();
  if (!text) return false;
  if (/\.(mp4|mov|m4v|webm|avi)$/i.test(text)) return true;
  if (/^[A-Z]{1,4}[_-]?\d[_-]?\d{8,}$/i.test(text)) return true;
  if (/^[a-f0-9-]{16,}$/i.test(text)) return true;
  if (/^[A-Z0-9_-]{8,}$/i.test(text) && /\d{5,}/.test(text)) return true;
  if ((text.match(/[_-]/g) || []).length >= 2 && /\d/.test(text)) return true;
  return false;
}

function narrativeFromAnalysis(analysis = {}) {
  const brightness = clamp(analysis.averageBrightness ?? analysis.brightness ?? analysis.sceneBrightness ?? 0.42);
  const curiosity = clamp(analysis.visualCuriosity ?? analysis.clickPotential ?? 0.58);
  const interaction = clamp(analysis.interactionStrength ?? analysis.emotionalPresence ?? 0.56);
  const background = clamp(analysis.backgroundComplexity ?? 0.44);
  const subject = clamp(analysis.subjectSeparation ?? analysis.subjectVisibility ?? 0.58);
  const privateRoom = background < 0.58;
  const night = brightness < 0.48;
  const secret = curiosity > 0.54 || night;
  const closeEncounter = interaction > 0.52;
  const premium = subject > 0.56 && curiosity > 0.5;
  const location = privateRoom ? (night ? "hidden hotel room" : "private room") : "undisclosed location";
  const emotionalHook = secret && closeEncounter ? "secret encounter" : closeEncounter ? "intimate encounter" : secret ? "forbidden late-night meeting" : "private invitation";
  const atmosphere = night ? "after-hours tension" : premium ? "polished intimacy" : "raw curiosity";
  return { brightness, curiosity, interaction, background, subject, location, emotionalHook, atmosphere, privateRoom, night, secret, closeEncounter, premium };
}

function conceptPool(narrative) {
  if (narrative.privateRoom && narrative.night) {
    return {
      titles: ["ROOM 204", "CHECK IN", "AFTER HOURS", "LOCKED DOOR", "HOTEL SINS", "MIDNIGHT GUEST", "PRIVATE ENTRY", "ONE NIGHT ONLY", "NO VACANCY", "THE LAST ROOM"],
      subtitles: ["Episode 1: The Check In", "A Secret Encounter", "No One Must Know", "Behind Closed Doors", "Late Night Arrival", "The Door Stays Locked"],
      hooks: ["A hidden room. A late arrival. A secret that changes the night.", "Behind one locked door, the night stops being ordinary.", "What happens after check-in was never meant to be seen."],
    };
  }
  if (narrative.secret) {
    return {
      titles: ["BEHIND CLOSED DOORS", "PRIVATE ENTRY", "NO ONE MUST KNOW", "THE SECRET ROOM", "AFTER DARK", "OFF THE RECORD", "HIDDEN HEAT", "THE INVITATION"],
      subtitles: ["A Secret Encounter", "No One Must Know", "Behind Closed Doors", "Late Night Arrival", "Private Access Only", "The Risk Is the Point"],
      hooks: ["Every secret needs a door. This one just opened.", "A private moment turns into a dangerous invitation.", "The less anyone knows, the harder it is to look away."],
    };
  }
  if (narrative.premium) {
    return {
      titles: ["PRIVATE EDITION", "THE INVITATION", "SELECT ROOM", "CLOSE RANGE", "THE ENCOUNTER", "ONE NIGHT ONLY", "OPEN DOOR", "FIRST LOOK"],
      subtitles: ["A Premium Original", "Private Access", "The New Encounter", "A Night in Focus", "An Intimate Original", "Watch What Happens Next"],
      hooks: ["A polished private encounter built for the spotlight.", "Premium intimacy, framed like a campaign.", "One night. One room. One reason to click."],
    };
  }
  return {
    titles: ["AFTER HOURS", "PRIVATE ENTRY", "THE ENCOUNTER", "LOCKED DOOR", "ONE NIGHT ONLY", "MIDNIGHT GUEST", "CHECK IN", "THE INVITATION"],
    subtitles: ["A Secret Encounter", "Behind Closed Doors", "Late Night Arrival", "Private Access", "Episode 1", "No One Must Know"],
    hooks: ["A private story with a commercial hook.", "One frame becomes a campaign built for clicks.", "The encounter is only the beginning."],
  };
}

export function createCommercialCampaign({ analysis = {}, metadata = {} } = {}) {
  const narrative = narrativeFromAnalysis(analysis);
  const pool = conceptPool(narrative);
  const seed = narrative.curiosity * 0.37 + narrative.interaction * 0.29 + narrative.subject * 0.23 + narrative.brightness * 0.11;
  const ignoredTitle = metadata.videoTitle || metadata.title || metadata.fileName || "";
  const title = pick(pool.titles, seed);
  const subtitle = pick(pool.subtitles, seed + 0.173);
  const hook = pick(pool.hooks, seed + 0.317);
  return {
    title,
    subtitle,
    hook,
    headline: title,
    logline: hook,
    source: "visual_narrative_extraction",
    ignoredFilename: looksLikeFilename(ignoredTitle) ? ignoredTitle : "metadata title intentionally ignored",
    visualNarrative: {
      subjects: narrative.closeEncounter ? "two-person encounter" : "human-led private scene",
      location: narrative.location,
      emotionalHook: narrative.emotionalHook,
      atmosphere: narrative.atmosphere,
      commercialPromise: "a streaming-quality key art concept designed for curiosity and clicks",
    },
    hierarchy: ["campaign title", "emotional subtitle", "hero image", "brand anchor", "supporting proof points"],
    clickScore: Math.round((0.42 + narrative.curiosity * 0.25 + narrative.interaction * 0.18 + narrative.subject * 0.15) * 100),
  };
}