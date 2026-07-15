function measure(ctx, text, font) {
  ctx.font = font;
  return ctx.measureText(text).width;
}

function font(size, family = "Bebas Neue", weight = 900) {
  return `${weight} ${size}px "${family}", Impact, Arial, sans-serif`;
}

function isManual(settings, key) {
  return Boolean(settings?.manualOverrides?.[key]);
}

function upper(value) {
  return String(value || "").trim().toUpperCase();
}

export function splitTitle(metadata = {}) {
  const raw = upper(metadata.videoTitle || "BEACH ESCAPE");
  const explicit = upper(metadata.optionalSubtitle || metadata.campaignName || "");
  if (raw.includes("|")) {
    const [title, subtitle] = raw.split("|").map(item => item.trim()).filter(Boolean);
    return { title: title || raw, subtitle: explicit || subtitle || "" };
  }
  return { title: raw, subtitle: explicit };
}

export function buildTitleLines(ctx, text, maxWidth, startSize, minSize, family = "Bebas Neue", maxLines = 3) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) return { lines: [], size: startSize, lineHeight: startSize * 0.83, score: 1 };

  for (let size = startSize; size >= minSize; size -= 3) {
    const lines = [];
    let current = "";
    words.forEach(word => {
      const next = current ? `${current} ${word}` : word;
      if (measure(ctx, next, font(size, family)) <= maxWidth || !current) current = next;
      else { lines.push(current); current = word; }
    });
    if (current) lines.push(current);
    if (lines.length <= maxLines) return { lines, size, lineHeight: size * 0.83, score: Math.max(0.42, 1 - (startSize - size) / Math.max(1, startSize - minSize) - (lines.length - 1) * 0.08) };
  }

  return { lines: [String(text || "")], size: minSize, lineHeight: minSize * 0.84, score: 0.42 };
}

export function calculateTypography(ctx, box, width, family, metadata, settings = {}, height = width * 9 / 16) {
  const { title, subtitle } = splitTitle(metadata);
  const performer = upper(metadata.performerName);
  const performerCredit = performer;
  const maxWidth = width * box.w;
  const language = family?.graphicLanguage || {};
  const aggression = language.graphic_aggression ?? 0.58;
  const density = language.poster_density ?? 0.58;

  const targetTitleBlockHeight = height * box.h * (0.34 + aggression * 0.14 + density * 0.08);
  const aggressiveStart = Math.max(width * (family?.typography?.titleScale || 0.12) * (1.08 + aggression * 0.42), targetTitleBlockHeight / 1.7);
  const titleStart = isManual(settings, "titleSize") ? Number(settings.titleSize) || aggressiveStart : aggressiveStart;
  const titleMin = isManual(settings, "titleSize") ? titleStart : width * (0.068 + aggression * 0.035);
  const titleBlock = buildTitleLines(ctx, title, maxWidth, titleStart, titleMin, family.typography.titleFont, 4);

  const autoSubtitleSize = Math.max(width * 0.019, Math.min(width * (0.03 + aggression * 0.012), maxWidth / Math.max(10, subtitle.length || 14)));
  const subtitleStart = isManual(settings, "subtitleSize") ? Number(settings.subtitleSize) || autoSubtitleSize : autoSubtitleSize;
  const subtitleBlock = buildTitleLines(ctx, subtitle, maxWidth, subtitleStart, Math.max(width * 0.019, subtitleStart * 0.72), family.typography.accentFont, 2);

  const autoPerformerSize = Math.max(width * 0.03, Math.min(width * (0.048 + aggression * 0.018), maxWidth / Math.max(7, performerCredit.length || 10)));
  const performerStart = isManual(settings, "performerSize") ? Number(settings.performerSize) || autoPerformerSize : autoPerformerSize;
  const performerBlock = buildTitleLines(ctx, performerCredit, maxWidth, performerStart, Math.max(width * 0.03, performerStart * 0.76), "Inter", 2);

  const subtitleHeight = subtitleBlock.lines.length ? subtitleBlock.lines.length * subtitleBlock.lineHeight + subtitleBlock.size * 0.18 : 0;
  const performerHeight = performerBlock.lines.length ? performerBlock.lines.length * performerBlock.lineHeight + performerBlock.size * 0.24 : 0;
  const titleHeight = titleBlock.lines.length * titleBlock.lineHeight;
  const totalHeight = titleHeight + subtitleHeight + performerHeight;
  const titleDominance = Math.min(1, titleHeight / Math.max(1, height * box.h * 0.35));

  return {
    title,
    subtitle,
    performer,
    lines: titleBlock.lines,
    size: titleBlock.size,
    lineHeight: titleBlock.lineHeight,
    subtitleLines: subtitleBlock.lines,
    subtitleSize: subtitleBlock.size,
    subtitleLineHeight: subtitleBlock.lineHeight,
    performerLines: performerBlock.lines,
    performerSize: performerBlock.size,
    performerLineHeight: performerBlock.lineHeight,
    titleHeight,
    totalHeight,
    titleDominance,
    graphicLanguage: language,
    score: Math.min(1, titleBlock.score * 0.42 + titleDominance * 0.44 + (language.strength || 0.62) * 0.14),
  };
}