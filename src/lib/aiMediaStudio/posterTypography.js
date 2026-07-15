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

export function calculateTypography(ctx, box, width, family, metadata, settings = {}) {
  const { title, subtitle } = splitTitle(metadata);
  const performer = upper(metadata.performerName);
  const performerCredit = performer ? `STARRING ${performer}` : "";
  const maxWidth = width * box.w;

  const titleStart = isManual(settings, "titleSize") ? Number(settings.titleSize) || width * family.typography.titleScale : width * family.typography.titleScale * 1.18;
  const titleMin = isManual(settings, "titleSize") ? titleStart : width * 0.07;
  const titleBlock = buildTitleLines(ctx, title, maxWidth, titleStart, titleMin, family.typography.titleFont, 3);

  const autoSubtitleSize = Math.max(width * 0.026, Math.min(width * 0.054, maxWidth / Math.max(7, subtitle.length || 9)));
  const subtitleStart = isManual(settings, "subtitleSize") ? Number(settings.subtitleSize) || autoSubtitleSize : autoSubtitleSize;
  const subtitleBlock = buildTitleLines(ctx, subtitle, maxWidth, subtitleStart, Math.max(width * 0.022, subtitleStart * 0.72), family.typography.accentFont, 2);

  const autoPerformerSize = Math.max(width * 0.026, Math.min(width * 0.044, maxWidth / Math.max(9, performerCredit.length || 12)));
  const performerStart = isManual(settings, "performerSize") ? Number(settings.performerSize) || autoPerformerSize : autoPerformerSize;
  const performerBlock = buildTitleLines(ctx, performerCredit, maxWidth, performerStart, Math.max(width * 0.02, performerStart * 0.72), "Inter", 2);

  const subtitleHeight = subtitleBlock.lines.length ? subtitleBlock.lines.length * subtitleBlock.lineHeight + subtitleBlock.size * 0.18 : 0;
  const performerHeight = performerBlock.lines.length ? performerBlock.lines.length * performerBlock.lineHeight + performerBlock.size * 0.36 : 0;
  const totalHeight = titleBlock.lines.length * titleBlock.lineHeight + subtitleHeight + performerHeight;

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
    totalHeight,
    score: titleBlock.score,
  };
}