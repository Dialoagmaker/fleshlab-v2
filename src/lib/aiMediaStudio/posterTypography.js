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
  const raw = String(metadata.videoTitle || "BEACH ESCAPE").trim();
  const explicit = upper(metadata.optionalSubtitle || metadata.campaignName || "");
  if (raw.includes("|")) {
    const [title, subtitle] = raw.split("|").map(item => item.trim()).filter(Boolean);
    return { title: title || raw, subtitle: explicit || upper(subtitle || "") };
  }
  return { title: raw, subtitle: explicit };
}

function lineBreakBonus(lastWord = "") {
  if (/[,;:!?]$/.test(lastWord)) return 0.16;
  if (/^(In|Into|Until|With|After|Before|While|And|But|For|From|Inside|Outside|The|A)$/i.test(lastWord)) return -0.08;
  return 0;
}

function balancedCandidates(words, lineCount) {
  const results = [];
  function walk(start, remaining, lines) {
    if (remaining === 1) {
      results.push([...lines, words.slice(start).join(" ")]);
      return;
    }
    const minEnd = start + 1;
    const maxEnd = words.length - remaining + 1;
    for (let end = minEnd; end <= maxEnd; end += 1) walk(end, remaining - 1, [...lines, words.slice(start, end).join(" ")]);
  }
  walk(0, lineCount, []);
  return results;
}

function scoreLines(ctx, lines, maxWidth) {
  const widths = lines.map(line => ctx.measureText(line).width);
  if (widths.some(width => width > maxWidth)) return -Infinity;
  const average = widths.reduce((sum, width) => sum + width, 0) / Math.max(1, widths.length);
  const variance = widths.reduce((sum, width) => sum + Math.abs(width - average), 0) / Math.max(1, widths.length);
  const fill = Math.max(...widths) / maxWidth;
  const rhythm = lines.reduce((sum, line) => sum + lineBreakBonus(line.split(/\s+/).pop()), 0);
  return fill * 0.42 - (variance / maxWidth) * 0.42 - Math.abs(0.78 - fill) * 0.16 + rhythm;
}

function chooseBalancedLines(ctx, words, maxWidth, maxLines) {
  const upperLimit = Math.min(maxLines, words.length);
  let best = null;
  for (let count = 1; count <= upperLimit; count += 1) {
    const candidates = balancedCandidates(words, count);
    candidates.forEach(lines => {
      const score = scoreLines(ctx, lines, maxWidth) - Math.max(0, count - 3) * 0.04;
      if (!best || score > best.score) best = { lines, score };
    });
  }
  return best?.lines || [words.join(" ")];
}

function greedyExactLines(ctx, words, maxWidth) {
  const lines = [];
  let current = "";
  words.forEach(word => {
    const next = current ? `${current} ${word}` : word;
    if (!current || ctx.measureText(next).width <= maxWidth) current = next;
    else { lines.push(current); current = word; }
  });
  if (current) lines.push(current);
  return lines;
}

export function buildTitleLines(ctx, text, maxWidth, startSize, minSize, family = "Bebas Neue", maxLines = 3) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return { lines: [], size: startSize, lineHeight: startSize * 1.02, score: 1 };
  const adaptiveMaxLines = Math.min(Math.max(maxLines, words.length > 12 ? 5 : words.length > 8 ? 4 : maxLines), 6);

  for (let size = startSize; size >= minSize; size -= 3) {
    ctx.font = font(size, family, 900);
    const lines = chooseBalancedLines(ctx, words, maxWidth, adaptiveMaxLines);
    if (lines.length <= adaptiveMaxLines && lines.every(line => ctx.measureText(line).width <= maxWidth)) {
      return { lines, size, lineHeight: size * 1.02, score: Math.max(0.48, 1 - (startSize - size) / Math.max(1, startSize - minSize) - (lines.length - 1) * 0.045) };
    }
  }

  ctx.font = font(minSize, family, 900);
  const lines = greedyExactLines(ctx, words, maxWidth);
  return { lines, size: minSize, lineHeight: minSize * 1.06, score: 0.52 };
}

export function calculateTypography(ctx, box, width, family, metadata, settings = {}, height = width * 9 / 16) {
  const { title, subtitle } = splitTitle(metadata);
  const performer = upper(metadata.performerName);
  const performerCredit = performer;
  const maxWidth = width * box.w;
  const language = family?.graphicLanguage || {};
  const aggression = language.graphic_aggression ?? 0.58;
  const density = language.poster_density ?? 0.58;

  const targetTitleBlockHeight = height * box.h * (0.4 + aggression * 0.1 + density * 0.08);
  const titleWordCount = title.trim().split(/\s+/).filter(Boolean).length;
  const longTitleFactor = titleWordCount > 14 ? 0.58 : titleWordCount > 10 ? 0.68 : titleWordCount > 7 ? 0.82 : 1;
  const aggressiveStart = Math.max(width * (family?.typography?.titleScale || 0.12) * (1.02 + aggression * 0.28) * longTitleFactor, targetTitleBlockHeight / Math.max(2.1, titleWordCount > 12 ? 3.6 : 2.4));
  const titleStart = isManual(settings, "titleSize") ? Number(settings.titleSize) || aggressiveStart : aggressiveStart;
  const titleMin = isManual(settings, "titleSize") ? titleStart : width * (titleWordCount > 12 ? 0.038 : 0.052 + aggression * 0.02);
  const titleBlock = buildTitleLines(ctx, title, maxWidth, titleStart, titleMin, titleWordCount > 10 ? "Inter" : family.typography.titleFont, titleWordCount > 12 ? 6 : 5);

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