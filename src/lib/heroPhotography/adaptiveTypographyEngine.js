function compact(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function px(zone, width, height) {
  return { x: zone.x * width, y: zone.y * height, w: zone.w * width, h: zone.h * height };
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function isWeakBreak(words, index) {
  const before = String(words[index - 1] || "").toLowerCase();
  const after = String(words[index] || "").toLowerCase();
  return ["in", "on", "at", "with", "until", "and", "or", "the", "a", "he", "his"].includes(before) || ["in", "on", "at", "with", "until", "and", "or", "the", "a"].includes(after);
}

function linePenalty(line) {
  const trimmed = line.trim();
  let penalty = 0;
  if (/^[,.;:!?]/.test(trimmed)) penalty += 80;
  if (/[([{]$/.test(trimmed)) penalty += 60;
  if (/\b(and|or|with|until|in|on|at|the|a)$/i.test(trimmed)) penalty += 28;
  if (/^(and|or|with|until|in|on|at|the|a)\b/i.test(trimmed)) penalty += 28;
  return penalty;
}

function candidateBreaks(words, count) {
  const candidates = [];
  function walk(start, remaining, breaks) {
    if (remaining === 1) {
      candidates.push([...breaks, words.length]);
      return;
    }
    const remainingWords = words.length - start;
    const ideal = remainingWords / remaining;
    const minEnd = start + 1;
    const maxEnd = words.length - remaining + 1;
    for (let end = minEnd; end <= maxEnd; end += 1) {
      if (Math.abs((end - start) - ideal) <= Math.max(3, ideal * 0.65)) walk(end, remaining - 1, [...breaks, end]);
    }
  }
  walk(0, count, []);
  return candidates;
}

function linesFromBreaks(words, breaks) {
  let start = 0;
  return breaks.map(end => {
    const line = words.slice(start, end).join(" ");
    start = end;
    return line;
  });
}

function scoreLines(ctx, lines, maxWidth) {
  const widths = lines.map(line => ctx.measureText(line).width);
  if (widths.some(width => width > maxWidth)) return -Infinity;
  const widest = Math.max(...widths, 1);
  const narrowest = Math.min(...widths, 1);
  const balance = 1 - ((widest - narrowest) / Math.max(maxWidth, 1));
  const fill = widest / Math.max(maxWidth, 1);
  const penalties = lines.reduce((sum, line) => sum + linePenalty(line), 0);
  return balance * 120 + fill * 42 - penalties - lines.length * 5;
}

function chooseLines(ctx, title, maxWidth, maxLines) {
  const words = compact(title).split(" ").filter(Boolean);
  if (words.length <= 1) return [compact(title)];
  let best = null;
  const maxCount = Math.min(maxLines, Math.max(2, Math.ceil(words.length / 3)));
  for (let count = 2; count <= maxCount; count += 1) {
    for (const breaks of candidateBreaks(words, count)) {
      if (breaks.some((end, index) => index > 0 && isWeakBreak(words, end))) continue;
      const lines = linesFromBreaks(words, breaks);
      const score = scoreLines(ctx, lines, maxWidth);
      if (!best || score > best.score) best = { lines, score };
    }
  }
  return best?.lines || [compact(title)];
}

export function planAdaptiveTypography({ ctx, title, width, height, format = {}, compositionPlan = {}, logoBottom = 0, collection = "", performerName = "" }) {
  const exactTitle = compact(title || "PRIVATE ACCESS");
  const titleOnLeft = compositionPlan.titleZone !== "RIGHT";
  const graphic = px(compositionPlan.graphicZone || { x: titleOnLeft ? 0 : 0.5, y: 0, w: 0.5, h: 1 }, width, height);
  const marginX = Math.max(width * 0.055, 34);
  const topMargin = Math.max(height * 0.07, 34);
  const bottomReserve = Math.max(height * 0.18, 74);
  const face = {
    x: width * clamp((compositionPlan.subjectFocus?.x ?? 0.58) - 0.17, 0, 1),
    y: height * clamp((compositionPlan.subjectFocus?.y ?? 0.46) - 0.28, 0, 1),
    w: width * 0.34,
    h: height * 0.56
  };
  let box = {
    x: titleOnLeft ? graphic.x + marginX : graphic.x + graphic.w * 0.08,
    y: Math.max(logoBottom + height * 0.11, topMargin),
    w: Math.min(graphic.w - marginX * 1.35, width * (format.height > format.width ? 0.72 : 0.44)),
    h: height - bottomReserve - Math.max(logoBottom + height * 0.11, topMargin)
  };
  if (!titleOnLeft) box.x = graphic.x + graphic.w - marginX - box.w;
  if (intersects(box, face)) {
    const shifted = titleOnLeft ? face.x - marginX - box.w : face.x + face.w + marginX;
    if (shifted > marginX && shifted + box.w < width - marginX) box.x = shifted;
  }

  const words = exactTitle.split(" ").filter(Boolean).length;
  const maxLines = clamp(Math.ceil(words / 4), 2, format.height > format.width ? 6 : 5);
  const metadataReserve = collection || performerName ? height * 0.12 : height * 0.06;
  const availableTitleH = Math.max(height * 0.22, box.h - metadataReserve);
  const maxSize = Math.min(height * (format.role === "cover" ? 0.08 : 0.11), width * (format.height > format.width ? 0.105 : 0.078));
  const minSize = Math.max(24, width * (format.height > format.width ? 0.035 : 0.026));

  for (let size = maxSize; size >= minSize; size -= Math.max(1.8, maxSize * 0.035)) {
    ctx.font = `900 ${Math.round(size)}px "Bebas Neue", "Inter", Impact, Arial, sans-serif`;
    const lines = chooseLines(ctx, exactTitle, box.w, maxLines);
    const lineHeight = size * (lines.length > 3 ? 1.16 : 1.1);
    const totalH = lineHeight * lines.length;
    if (lines.every(line => ctx.measureText(line).width <= box.w) && totalH <= availableTitleH) {
      return { title: exactTitle, lines, fontSize: size, lineHeight, x: titleOnLeft ? box.x : box.x + box.w, y: box.y, width: box.w, align: titleOnLeft ? "left" : "right", preservesTitle: lines.join(" ") === exactTitle, avoidsFace: !intersects({ ...box, h: totalH }, face), box };
    }
  }

  ctx.font = `900 ${Math.round(minSize)}px "Bebas Neue", "Inter", Impact, Arial, sans-serif`;
  const lines = chooseLines(ctx, exactTitle, box.w, maxLines + 1);
  return { title: exactTitle, lines, fontSize: minSize, lineHeight: minSize * 1.18, x: titleOnLeft ? box.x : box.x + box.w, y: box.y, width: box.w, align: titleOnLeft ? "left" : "right", preservesTitle: lines.join(" ") === exactTitle, avoidsFace: !intersects({ ...box, h: minSize * 1.18 * lines.length }, face), box };
}