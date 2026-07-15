function measure(ctx, text, font) {
  ctx.font = font;
  return ctx.measureText(text).width;
}

function font(size, family = "Bebas Neue", weight = 900) {
  return `${weight} ${size}px "${family}", Impact, Arial, sans-serif`;
}

export function splitTitle(metadata = {}) {
  const raw = String(metadata.videoTitle || "BEACH ESCAPE").trim().toUpperCase();
  const explicit = String(metadata.optionalSubtitle || metadata.campaignName || "").trim().toUpperCase();
  if (raw.includes("|")) {
    const [title, subtitle] = raw.split("|").map(item => item.trim()).filter(Boolean);
    return { title: title || raw, subtitle: explicit || subtitle || "" };
  }
  if (explicit) return { title: raw, subtitle: explicit };
  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length <= 2) return { title: raw, subtitle: "" };
  return { title: words.slice(0, Math.ceil(words.length / 2)).join(" "), subtitle: words.slice(Math.ceil(words.length / 2)).join(" ") };
}

export function buildTitleLines(ctx, text, maxWidth, startSize, minSize, family = "Bebas Neue") {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  for (let size = startSize; size >= minSize; size -= 3) {
    const lines = [];
    let current = "";
    words.forEach(word => {
      const next = current ? `${current} ${word}` : word;
      if (measure(ctx, next, font(size, family)) <= maxWidth || !current) current = next;
      else { lines.push(current); current = word; }
    });
    if (current) lines.push(current);
    if (lines.length <= 3) return { lines, size, lineHeight: size * 0.83, score: Math.max(0.42, 1 - (startSize - size) / Math.max(1, startSize - minSize) - (lines.length - 1) * 0.08) };
  }
  return { lines: [String(text || "")], size: minSize, lineHeight: minSize * 0.84, score: 0.42 };
}

export function calculateTypography(ctx, box, width, family, metadata) {
  const { title, subtitle } = splitTitle(metadata);
  const maxWidth = width * box.w;
  const titleStart = width * family.typography.titleScale;
  const titleMin = width * 0.052;
  const titleBlock = buildTitleLines(ctx, title, maxWidth, titleStart, titleMin, family.typography.titleFont);
  const subtitleSize = Math.max(width * 0.036, Math.min(width * family.typography.accentScale, maxWidth / Math.max(4, subtitle.length || 8)));
  return { title, subtitle, ...titleBlock, subtitleSize, score: titleBlock.score };
}