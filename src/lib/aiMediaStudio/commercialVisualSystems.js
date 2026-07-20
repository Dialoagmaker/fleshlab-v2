const OFFICIAL_LOGO_URL = "https://media.base44.com/images/public/6a1bc26018a7bec38bc6ac4a/a1f9333f9_ChatGPTImageJul14202612_16_43AM.png";

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function upper(value) {
  return String(value || "").trim().toUpperCase();
}

function font(size, family = "Bebas Neue", weight = 900) {
  return `${weight} ${size}px "${family}", Impact, Arial, sans-serif`;
}

function renderBoxForCrop(crop, x, y, width, height) {
  const sourceAspect = crop.sw / crop.sh;
  if (crop.fitMode === "portraitEditorial") {
    const h = height * 0.98;
    const w = h * sourceAspect;
    const centerX = width * clamp(crop.portraitX || 0.64, 0.32, 0.72);
    return { x: clamp(centerX - w * 0.5, width * -0.02, width - w + width * 0.02), y: height * 0.01, w, h };
  }
  if (crop.fitMode !== "contain") return { x, y, w: width, h: height };
  const targetAspect = width / height;
  let w = width;
  let h = height;
  if (sourceAspect > targetAspect) h = width / sourceAspect;
  else w = height * sourceAspect;
  return { x: x + (width - w) / 2, y: y + (height - h) / 2, w, h };
}

function coverImage(ctx, image, crop, x, y, width, height) {
  const box = renderBoxForCrop(crop, x, y, width, height);
  ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, box.x, box.y, box.w, box.h);
  return box;
}

function fillImage(ctx, image, crop, x, y, width, height) {
  const sourceAspect = crop.sw / crop.sh;
  const targetAspect = width / height;
  let sx = crop.sx;
  let sy = crop.sy;
  let sw = crop.sw;
  let sh = crop.sh;
  if (sourceAspect > targetAspect) {
    sw = crop.sh * targetAspect;
    sx = crop.sx + (crop.sw - sw) / 2;
  } else {
    sh = crop.sw / targetAspect;
    sy = crop.sy + (crop.sh - sh) / 2;
  }
  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

function outpaintClip(ctx, map, width, height) {
  ctx.beginPath();
  ctx.rect(0, 0, Math.max(0, map.renderBox.x), height);
  ctx.rect(map.renderBox.x + map.renderBox.w, 0, Math.max(0, width - map.renderBox.x - map.renderBox.w), height);
  ctx.clip();
}

function paintSceneExtensionSide(ctx, image, map, width, height, direction, side) {
  const gutterW = side === "left" ? map.renderBox.x : width - map.renderBox.x - map.renderBox.w;
  if (gutterW <= 1) return;
  const x = side === "left" ? 0 : map.renderBox.x + map.renderBox.w;
  const stripW = Math.max(12, map.crop.sw * 0.18);
  const sx = side === "left" ? map.crop.sx : map.crop.sx + map.crop.sw - stripW;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, 0, gutterW, height);
  ctx.clip();
  ctx.filter = `blur(${Math.round(width * 0.018)}px) brightness(74%) contrast(128%) saturate(92%)`;
  if (side === "left") {
    ctx.translate(gutterW, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(image, sx, map.crop.sy, stripW, map.crop.sh, 0, map.renderBox.y - height * 0.015, gutterW * 1.14, map.renderBox.h + height * 0.03);
  } else {
    ctx.drawImage(image, sx, map.crop.sy, stripW, map.crop.sh, x - gutterW * 0.14, map.renderBox.y - height * 0.015, gutterW * 1.14, map.renderBox.h + height * 0.03);
  }
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, 0, gutterW, height);
  ctx.clip();
  const depth = ctx.createLinearGradient(side === "left" ? gutterW : x, 0, side === "left" ? 0 : width, height);
  depth.addColorStop(0, "rgba(255,255,255,0.04)");
  depth.addColorStop(0.44, `rgba(${direction.accent},0.08)`);
  depth.addColorStop(1, "rgba(0,0,0,0.58)");
  ctx.fillStyle = depth;
  ctx.fillRect(x, 0, gutterW, height);
  ctx.restore();
}

function paintSceneArchitecture(ctx, map, width, height, direction) {
  ctx.save();
  outpaintClip(ctx, map, width, height);
  const lineAlpha = direction.environment === "bathroom" ? 0.16 : 0.09;
  ctx.strokeStyle = `rgba(${direction.secondary},${lineAlpha})`;
  ctx.lineWidth = Math.max(1, width * 0.0012);
  if (direction.environment === "bathroom") {
    const tile = height * 0.115;
    for (let y = height * 0.08; y < height; y += tile) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y + height * 0.012);
      ctx.stroke();
    }
    for (let x = -width * 0.1; x < width * 1.1; x += tile * 1.35) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + width * 0.08, height);
      ctx.stroke();
    }
  } else if (direction.environment === "hotel") {
    for (let x = 0; x < width; x += width * 0.085) {
      ctx.fillStyle = "rgba(255,205,130,0.035)";
      ctx.fillRect(x, 0, width * 0.018, height);
    }
    const lamp = ctx.createRadialGradient(map.titleX, height * 0.26, 0, map.titleX, height * 0.26, width * 0.25);
    lamp.addColorStop(0, "rgba(255,180,90,0.22)");
    lamp.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = lamp;
    ctx.fillRect(0, 0, width, height);
  } else {
    for (let i = 0; i < 12; i += 1) {
      const x = width * ((i * 0.137 + direction.seed) % 1);
      ctx.beginPath();
      ctx.moveTo(x, height * 0.02);
      ctx.lineTo(x + width * 0.06, height * 0.95);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function paintSceneAtmosphere(ctx, map, width, height, direction) {
  ctx.save();
  outpaintClip(ctx, map, width, height);
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 42; i += 1) {
    const x = width * (((i * 41 + Math.round(direction.seed * 100)) % 100) / 100);
    const y = height * (((i * 67 + 13) % 100) / 100);
    const r = width * (0.01 + (i % 4) * 0.006);
    const haze = ctx.createRadialGradient(x, y, 0, x, y, r);
    haze.addColorStop(0, `rgba(${direction.secondary},${direction.environment === "bathroom" ? 0.075 : 0.045})`);
    haze.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = haze;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
}

function paintOriginalFrameUntouched(ctx, image, map) {
  ctx.save();
  ctx.filter = "none";
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(image, map.crop.sx, map.crop.sy, map.crop.sw, map.crop.sh, map.renderBox.x, map.renderBox.y, map.renderBox.w, map.renderBox.h);
  ctx.restore();
}

function paintCinematicCanvasExtension(ctx, image, map, width, height, direction) {
  ctx.fillStyle = direction.bg;
  ctx.fillRect(0, 0, width, height);
  paintSceneExtensionSide(ctx, image, map, width, height, direction, "left");
  paintSceneExtensionSide(ctx, image, map, width, height, direction, "right");
  paintSceneArchitecture(ctx, map, width, height, direction);
  paintSceneAtmosphere(ctx, map, width, height, direction);
  ctx.save();
  outpaintClip(ctx, map, width, height);
  const floorShadow = ctx.createRadialGradient(map.hero.x + map.hero.w * 0.5, height * 0.86, 0, map.hero.x + map.hero.w * 0.5, height * 0.86, width * 0.42);
  floorShadow.addColorStop(0, "rgba(0,0,0,0.42)");
  floorShadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = floorShadow;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
  paintOriginalFrameUntouched(ctx, image, map);
}

function manualValue(settings, key, fallback) {
  return settings?.manualOverrides?.[key] ? Number(settings[key]) : fallback;
}

function adjustedCrop(image, crop, settings = {}) {
  if ((crop.fitMode === "contain" || crop.fitMode === "portraitEditorial") && !settings?.manualOverrides?.zoom && !settings?.manualOverrides?.x && !settings?.manualOverrides?.y) return crop;
  const zoom = clamp(manualValue(settings, "zoom", 1), 0.7, 2.2);
  const sw = crop.sw / zoom;
  const sh = crop.sh / zoom;
  const cx = crop.sx + crop.sw * 0.5 + (manualValue(settings, "x", 0) / 100) * crop.sw * 0.42;
  const cy = crop.sy + crop.sh * 0.5 + (manualValue(settings, "y", 0) / 100) * crop.sh * 0.42;
  return {
    ...crop,
    fitMode: settings?.manualOverrides?.zoom ? "cover" : crop.fitMode,
    sx: clamp(cx - sw * 0.5, 0, Math.max(0, image.width - sw)),
    sy: clamp(cy - sh * 0.5, 0, Math.max(0, image.height - sh)),
    sw,
    sh,
  };
}

function imageFilter(settings = {}, brightness = 100, contrast = 120, saturation = 100) {
  return `brightness(${Math.round(manualValue(settings, "brightness", brightness))}%) contrast(${Math.round(manualValue(settings, "contrast", contrast))}%) saturate(${Math.round(manualValue(settings, "saturation", saturation))}%)`;
}

function sourceBoxToCanvas(image, source, crop, width, height) {
  const renderBox = renderBoxForCrop(crop, 0, 0, width, height);
  return {
    x: renderBox.x + ((source.x * image.width - crop.sx) / crop.sw) * renderBox.w,
    y: renderBox.y + ((source.y * image.height - crop.sy) / crop.sh) * renderBox.h,
    w: (source.w * image.width / crop.sw) * renderBox.w,
    h: (source.h * image.height / crop.sh) * renderBox.h,
  };
}

function heroBox(image, analysis, crop, width, height) {
  const source = analysis.subjectBox || { x: 0.5, y: 0.16, w: 0.34, h: 0.66 };
  return sourceBoxToCanvas(image, source, crop, width, height);
}

function seedFromPlan(plan) {
  const campaign = plan.campaign || {};
  const philosophy = plan.philosophy || {};
  const text = `${plan.candidateId || ""}${plan.renderPlanHash || ""}${plan.conceptId || ""}${philosophy.id || ""}${philosophy.visualSystemId || ""}${campaign.campaignName || ""}${campaign.episodeTitle || ""}${campaign.product || ""}${campaign.fantasy || ""}`;
  const base = [...text].reduce((total, char, index) => total + char.charCodeAt(0) * (index + 3), 0);
  const analysis = plan.analysis || {};
  return ((base % 997) / 997 + (analysis.visualCuriosity || 0.51) * 0.37 + (analysis.subjectSeparation || 0.57) * 0.21) % 1;
}

function artDirection(plan, attempt = 0) {
  const campaign = plan.campaign || {};
  const philosophy = plan.philosophy || {};
  const seed = (seedFromPlan(plan) + attempt * 0.193) % 1;
  const fantasy = campaign.fantasy || "Private";
  const product = campaign.product || "Feature Release";
  const category = campaign.category || "Streaming Cover";
  const setting = campaign.visualNarrative?.setting || "";
  const bathroom = setting.includes("bathroom") || philosophy.atmosphere === "cold-steam";
  const gym = setting.includes("gym") || philosophy.atmosphere === "hard-steel";
  const outdoor = setting.includes("outdoor") || setting.includes("natural");
  const night = setting.includes("night") || philosophy.atmosphere === "neon-night";
  const warm = setting.includes("hotel") || philosophy.atmosphere === "warm-haze" || fantasy === "Vacation" || product === "Vacation";
  const danger = philosophy.atmosphere === "impact-red" || ["Forbidden", "Danger", "Secret", "Public Risk"].includes(fantasy);
  const editorial = philosophy.id === "a24_minimal_tension" || philosophy.id === "album_cover_luxury" || ["Luxury Magazine", "Fashion Editorial", "Documentary Style"].includes(category);
  const documentary = philosophy.id === "outdoor_natural_wide";
  return {
    seed,
    bg: bathroom ? "#07090b" : gym ? "#060708" : outdoor ? "#07110b" : night ? "#030512" : editorial ? "#11100d" : documentary ? "#06080c" : "#030303",
    paper: bathroom ? "238,242,244" : gym ? "218,222,224" : warm ? "246,224,184" : outdoor ? "220,232,205" : night ? "220,230,255" : editorial ? "230,220,205" : documentary ? "230,235,244" : "255,246,235",
    accent: bathroom ? "210,24,42" : gym ? "191,24,38" : night ? "58,118,255" : danger ? "208,0,18" : warm ? "226,106,42" : outdoor ? "78,122,72" : documentary ? "230,235,244" : "208,0,18",
    brandAccent: "208,0,18",
    secondary: bathroom ? "255,255,255" : gym ? "188,198,202" : warm ? "255,189,88" : outdoor ? "167,202,138" : night ? "255,45,68" : editorial ? "230,220,205" : documentary ? "180,195,218" : "255,255,255",
    density: bathroom ? 0.34 + seed * 0.18 : editorial ? 0.36 + seed * 0.22 : documentary ? 0.46 + seed * 0.18 : gym ? 0.58 + seed * 0.18 : 0.62 + seed * 0.3,
    contrast: night ? 1.42 : gym ? 1.38 : danger ? 1.36 : editorial ? 1.18 : documentary ? 1.24 : 1.3,
    warmth: warm ? 1 : outdoor ? 0.42 : bathroom ? 0.08 : night ? 0.2 : editorial ? 0.5 : documentary ? 0.24 : 0.72,
    environment: bathroom ? "bathroom" : gym ? "gym" : outdoor ? "outdoor" : night ? "night" : warm ? "hotel" : "cinematic",
    editorial,
  };
}

function compositionMap(plan, image, width, height, attempt = 0, settings = {}) {
  const crop = adjustedCrop(image, plan.selected.crop, settings);
  const hero = heroBox(image, plan.analysis, crop, width, height);
  const renderBox = renderBoxForCrop(crop, 0, 0, width, height);
  const face = plan.analysis?.detections?.face ? sourceBoxToCanvas(image, plan.analysis.detections.face, crop, width, height) : null;
  const protectedZone = face || hero;
  const philosophy = plan.philosophy || {};
  const seed = (seedFromPlan(plan) + attempt * 0.231) % 1;
  const heroCx = clamp((hero.x + hero.w * 0.5) / width, 0.12, 0.88);
  const heroCy = clamp((hero.y + hero.h * 0.45) / height, 0.14, 0.82);
  const protectComposition = crop.fitMode === "contain";
  const portraitEditorial = crop.fitMode === "portraitEditorial";
  const negativeSide = protectComposition ? (heroCx >= 0.5 ? "left" : "right") : philosophy.titleSide === "right" ? "right" : philosophy.titleSide === "left" || philosophy.titleSide === "bottom-left" ? "left" : heroCx > 0.52 ? "left" : "right";
  const topSpace = heroCy > 0.47;
  const geometryTension = {
    "documentary-motion": "edge-whisper",
    "thumbnail-burst": "center-crush",
    "editorial-frame": "floating-offset",
    "monumental-arc": "poster-stack",
  };
  const tensionModes = ["diagonal-rise", "low-anchor", "floating-offset", "center-crush", "edge-whisper", "poster-stack"];
  const tension = protectComposition ? "composition-preserve" : geometryTension[philosophy.geometry] || tensionModes[Math.floor(seed * tensionModes.length) % tensionModes.length];
  const gutterLeft = renderBox.x;
  const gutterRight = width - (renderBox.x + renderBox.w);
  const useLeftGutter = negativeSide === "left" && gutterLeft >= width * 0.18;
  const useRightGutter = negativeSide === "right" && gutterRight >= width * 0.18;
  const titleX = protectComposition
    ? useRightGutter ? renderBox.x + renderBox.w + width * 0.035 : width * 0.045
    : philosophy.titleSide === "right"
      ? width * (0.56 + seed * 0.04)
      : width * (0.05 + seed * 0.05);
  const titleY = protectComposition
    ? height * 0.24
    : philosophy.titleSide === "bottom"
      ? height * (0.64 + seed * 0.08)
      : philosophy.titleSide === "bottom-left"
        ? height * (0.5 + seed * 0.09)
        : tension === "edge-whisper"
          ? height * (0.2 + seed * 0.12)
          : topSpace
            ? height * (0.12 + seed * 0.12)
            : height * (0.44 + seed * 0.14);
  const titleMaxW = protectComposition
    ? Math.max(width * 0.18, (useRightGutter ? gutterRight : gutterLeft) - width * 0.08)
    : philosophy.titleSide === "bottom"
      ? width * 0.82
      : negativeSide === "left"
        ? Math.min(width * 0.56, Math.max(width * 0.34, hero.x - width * 0.02))
        : Math.min(width * 0.5, Math.max(width * 0.34, width - titleX - width * 0.05));
  const safeTitleY = face && !protectComposition ? (titleY < face.y + face.h && titleY + height * 0.18 > face.y ? Math.max(height * 0.12, face.y - height * 0.16) : titleY) : titleY;
  const manualTitleY = settings?.manualOverrides?.titleY ? height * (settings.titleY / 100) : safeTitleY;
  const manualTitleX = titleX + (manualValue(settings, "x", 0) / 100) * width * 0.08;
  const logoBaseX = protectComposition ? manualTitleX : philosophy.logo === "top-right" ? width * 0.79 : philosophy.logo === "top-left" ? width * 0.055 : manualTitleX;
  const logoBaseY = protectComposition ? height * 0.07 : philosophy.logo === "under-title" ? Math.min(height * 0.86, manualTitleY + height * 0.24) : height * 0.07;
  const logoX = clamp(logoBaseX + (manualValue(settings, "logoX", 0) / 100) * width * 0.28, width * 0.02, width * 0.9);
  const logoY = clamp(logoBaseY + (manualValue(settings, "logoY", 0) / 100) * height * 0.28, height * 0.02, height * 0.88);
  const ctaX = manualTitleX;
  const ctaY = manualTitleY > height * 0.5 ? height * 0.5 : Math.min(height * 0.86, manualTitleY + height * 0.34);
  return { crop, hero, face, protectedZone, renderBox, protectComposition, portraitEditorial, heroCx, heroCy, negativeSide, topSpace, tension, titleX: manualTitleX, titleY: manualTitleY, titleMaxW, logoX, logoY, ctaX, ctaY, visualSystemId: philosophy.visualSystemId, renderPlanHash: plan.renderPlanHash };
}

function wrapTitle(ctx, text, maxWidth, startSize, family = "Bebas Neue", maxLines = 3) {
  const words = upper(text).split(/\s+/).filter(Boolean);
  for (let size = startSize; size >= startSize * 0.42; size -= 3) {
    ctx.font = font(size, family, 900);
    const lines = [];
    let current = "";
    words.forEach(word => {
      const next = current ? `${current} ${word}` : word;
      if (!current || ctx.measureText(next).width <= maxWidth) current = next;
      else { lines.push(current); current = word; }
    });
    if (current) lines.push(current);
    if (lines.length <= maxLines) return { lines, size, lineHeight: size * 0.78 };
  }
  return { lines: words.slice(0, maxLines), size: startSize * 0.48, lineHeight: startSize * 0.38 };
}

let logoPromise;
function getLogo() {
  if (!logoPromise) {
    logoPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = OFFICIAL_LOGO_URL;
    });
  }
  return logoPromise;
}

async function paintLogo(ctx, map, width, direction, settings = {}) {
  const logo = await getLogo();
  const scale = clamp(manualValue(settings, "logoScale", 100) / 100, 0.34, 2.4);
  const w = width * (0.078 + direction.seed * 0.018) * scale;
  const h = w * (logo.height / logo.width);
  ctx.save();
  ctx.globalAlpha = 0.74;
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = width * 0.01;
  ctx.drawImage(logo, map.logoX, map.logoY, w, h);
  ctx.fillStyle = `rgba(${direction.brandAccent || direction.accent},0.52)`;
  ctx.fillRect(map.logoX, map.logoY + h + width * 0.007, w * (0.34 + direction.seed * 0.22), Math.max(1.5, width * 0.002));
  ctx.restore();
  return { w, h };
}

function paintBackgroundLayer(ctx, image, map, width, height, direction, settings = {}) {
  if (map.protectComposition) {
    paintCinematicCanvasExtension(ctx, image, map, width, height, direction);
    return;
  }
  ctx.fillStyle = direction.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.filter = `blur(${Math.round(width * 0.018)}px) brightness(${Math.round(manualValue(settings, "brightness", 42))}%) contrast(${Math.round(manualValue(settings, "contrast", 130))}%) saturate(${Math.round(manualValue(settings, "saturation", 92))}%)`;
  fillImage(ctx, image, map.crop, -width * 0.035, -height * 0.035, width * 1.07, height * 1.07);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = direction.editorial ? 0.76 : 0.86;
  ctx.filter = imageFilter(settings, 84 + direction.warmth * 12, direction.contrast * 100, 88 + direction.warmth * 34);
  coverImage(ctx, image, map.crop, 0, 0, width, height);
  ctx.restore();
}

function paintLightShaping(ctx, map, width, height, direction) {
  ctx.save();
  if (map.protectComposition) outpaintClip(ctx, map, width, height);
  const heroGlow = ctx.createRadialGradient(map.hero.x + map.hero.w * 0.5, map.hero.y + map.hero.h * 0.28, 0, map.hero.x + map.hero.w * 0.5, map.hero.y + map.hero.h * 0.28, Math.max(map.hero.w, map.hero.h) * 0.78);
  heroGlow.addColorStop(0, `rgba(${direction.secondary},${direction.editorial ? 0.13 : 0.22})`);
  heroGlow.addColorStop(0.42, `rgba(${direction.accent},${direction.editorial ? 0.08 : 0.18})`);
  heroGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = heroGlow;
  ctx.fillRect(0, 0, width, height);

  const typographyDarkness = ctx.createRadialGradient(map.titleX, map.titleY, 0, map.titleX, map.titleY, width * 0.42);
  typographyDarkness.addColorStop(0, "rgba(0,0,0,0.76)");
  typographyDarkness.addColorStop(0.62, "rgba(0,0,0,0.34)");
  typographyDarkness.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = typographyDarkness;
  ctx.fillRect(0, 0, width, height);

  const edge = ctx.createLinearGradient(0, 0, width, height);
  edge.addColorStop(0, "rgba(0,0,0,0.66)");
  edge.addColorStop(0.52, "rgba(0,0,0,0.04)");
  edge.addColorStop(1, "rgba(0,0,0,0.7)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function paintDepthLayer(ctx, map, width, height, direction) {
  if (map.protectComposition) return;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.42)";
  ctx.beginPath();
  ctx.ellipse(map.hero.x + map.hero.w * 0.52, map.hero.y + map.hero.h * 0.93, map.hero.w * 0.58, map.hero.h * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `rgba(${direction.accent},${0.16 + direction.density * 0.18})`;
  ctx.lineWidth = width * (0.002 + direction.seed * 0.004);
  ctx.beginPath();
  if (map.tension === "diagonal-rise") {
    ctx.moveTo(width * -0.05, height * 0.78);
    ctx.bezierCurveTo(width * 0.26, height * 0.48, width * 0.58, height * 0.6, width * 1.05, height * 0.16);
  } else if (map.tension === "floating-offset") {
    ctx.moveTo(width * 0.08, height * 0.18);
    ctx.bezierCurveTo(width * 0.42, height * 0.08, width * 0.68, height * 0.34, width * 0.92, height * 0.78);
  } else {
    ctx.moveTo(width * 0.06, height * 0.52);
    ctx.bezierCurveTo(width * 0.28, height * 0.36, width * 0.72, height * 0.66, width * 0.95, height * 0.44);
  }
  ctx.stroke();
  ctx.restore();
}

function paintHeroEnhancement(ctx, image, map, width, height, direction, settings = {}) {
  if (map.protectComposition) return;
  ctx.save();
  if (!map.protectComposition) {
    ctx.beginPath();
    ctx.ellipse(map.hero.x + map.hero.w * 0.5, map.hero.y + map.hero.h * 0.46, Math.max(40, map.hero.w * 0.62), Math.max(60, map.hero.h * 0.55), 0, 0, Math.PI * 2);
    ctx.clip();
  }
  ctx.filter = imageFilter(settings, 102 + direction.warmth * 8, 116 + direction.density * 18, 96 + direction.warmth * 22);
  coverImage(ctx, image, map.crop, 0, 0, width, height);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `rgba(${direction.secondary},${0.12 + direction.density * 0.12})`;
  ctx.lineWidth = width * 0.003;
  ctx.beginPath();
  ctx.ellipse(map.hero.x + map.hero.w * 0.5, map.hero.y + map.hero.h * 0.46, Math.max(40, map.hero.w * 0.67), Math.max(60, map.hero.h * 0.59), 0, Math.PI * 0.72, Math.PI * 1.55);
  ctx.stroke();
  ctx.restore();
}

function paintAtmosphere(ctx, map, width, height, direction) {
  if (map.protectComposition) return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < Math.round(28 + direction.density * 76); i += 1) {
    const x = width * (((i * 37 + Math.round(direction.seed * 100)) % 100) / 100);
    const y = height * (((i * 61 + Math.round(direction.seed * 73)) % 100) / 100);
    const atmosphereAlpha = direction.environment === "bathroom" ? 0.05 : direction.environment === "outdoor" ? 0.045 : 0.08;
    ctx.fillStyle = i % 5 === 0 ? `rgba(${direction.accent},0.18)` : `rgba(${direction.secondary},${atmosphereAlpha})`;
    ctx.fillRect(x, y, width * (0.001 + (i % 3) * 0.0007), width * (0.001 + (i % 3) * 0.0007));
  }
  const haze = ctx.createRadialGradient(map.titleX, map.titleY, 0, map.titleX, map.titleY, width * 0.36);
  haze.addColorStop(0, `rgba(${direction.accent},0.12)`);
  haze.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function paintEntertainmentComposition(ctx, map, width, height, direction) {
  if (map.protectComposition) return;
  ctx.save();
  const heroCx = map.hero.x + map.hero.w * 0.5;
  const heroCy = map.hero.y + map.hero.h * 0.38;
  const titleCx = map.titleX + map.titleMaxW * 0.42;
  const titleCy = map.titleY + height * 0.12;

  ctx.globalCompositeOperation = "screen";
  const heroKey = ctx.createRadialGradient(heroCx, heroCy, 0, heroCx, heroCy, Math.max(map.hero.w, map.hero.h) * 0.82);
  heroKey.addColorStop(0, "rgba(255,255,255,0.18)");
  heroKey.addColorStop(0.32, `rgba(${direction.secondary},0.14)`);
  heroKey.addColorStop(0.72, `rgba(${direction.accent},0.08)`);
  heroKey.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = heroKey;
  ctx.fillRect(0, 0, width, height);

  const eyeLine = ctx.createLinearGradient(heroCx, heroCy, titleCx, titleCy);
  eyeLine.addColorStop(0, `rgba(${direction.secondary},0.0)`);
  eyeLine.addColorStop(0.42, `rgba(${direction.secondary},0.11)`);
  eyeLine.addColorStop(1, `rgba(${direction.accent},0.16)`);
  ctx.strokeStyle = eyeLine;
  ctx.lineWidth = width * 0.018;
  ctx.beginPath();
  ctx.moveTo(heroCx, heroCy);
  ctx.bezierCurveTo(width * (map.negativeSide === "left" ? 0.34 : 0.66), height * 0.28, width * (map.negativeSide === "left" ? 0.22 : 0.78), height * 0.62, titleCx, titleCy);
  ctx.stroke();

  ctx.globalCompositeOperation = "multiply";
  const storyMask = ctx.createRadialGradient(heroCx, heroCy, Math.max(map.hero.w, map.hero.h) * 0.2, heroCx, heroCy, width * 0.72);
  storyMask.addColorStop(0, "rgba(0,0,0,0)");
  storyMask.addColorStop(0.48, "rgba(0,0,0,0.1)");
  storyMask.addColorStop(1, "rgba(0,0,0,0.74)");
  ctx.fillStyle = storyMask;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.beginPath();
  if (map.negativeSide === "left") {
    ctx.moveTo(0, height);
    ctx.lineTo(width * 0.42, height);
    ctx.bezierCurveTo(width * 0.24, height * 0.62, width * 0.18, height * 0.34, 0, height * 0.18);
  } else {
    ctx.moveTo(width, height);
    ctx.lineTo(width * 0.58, height);
    ctx.bezierCurveTo(width * 0.76, height * 0.62, width * 0.82, height * 0.34, width, height * 0.18);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function paintBrandAccents(ctx, map, width, height, direction) {
  ctx.save();
  ctx.fillStyle = `rgba(${direction.brandAccent || direction.accent},0.58)`;
  const markW = width * (0.006 + direction.seed * 0.006);
  if (map.protectComposition) {
    ctx.fillRect(map.titleX, height * 0.16, Math.min(map.titleMaxW, width * 0.2), markW);
  } else if (map.tension === "edge-whisper") {
    ctx.fillRect(width * 0.045, height * 0.12, markW, height * 0.62);
    ctx.fillRect(width * 0.045, height * 0.12, width * 0.13, markW);
  } else if (map.tension === "center-crush") {
    ctx.translate(width * 0.5, height * 0.5);
    ctx.rotate(-0.18 - direction.seed * 0.1);
    ctx.fillRect(-width * 0.36, -height * 0.006, width * 0.72, height * 0.012);
  } else {
    ctx.translate(map.titleX, map.titleY - height * 0.055);
    ctx.rotate(map.negativeSide === "left" ? -0.12 : 0.12);
    ctx.fillRect(0, 0, width * (0.16 + direction.seed * 0.13), markW);
  }
  ctx.restore();
}

function paintTitleBlock(ctx, map, width, height, plan, direction, settings = {}) {
  const campaign = plan.campaign || {};
  const title = upper(campaign.mainTitle || campaign.title || "");
  const words = title.split(/\s+/).filter(Boolean);
  const brushWord = !map.protectComposition && !direction.editorial && words.length > 1 ? words.pop() : "";
  const blockTitle = words.length ? words.join(" ") : title;
  const titleFamily = direction.editorial || map.protectComposition ? "Inter" : "Bebas Neue";
  const baseSize = manualValue(settings, "titleSize", map.protectComposition ? width * 0.05 : direction.editorial ? width * 0.061 : width * 0.118);
  const block = wrapTitle(ctx, blockTitle, map.titleMaxW, baseSize, titleFamily, map.protectComposition ? 5 : direction.editorial ? 4 : 2);
  let y = map.titleY;
  ctx.save();
  const shear = map.protectComposition ? 0 : map.negativeSide === "left" ? -0.035 : 0.035;
  ctx.transform(1, shear, 0, 1, 0, 0);
  ctx.shadowColor = "rgba(0,0,0,0.98)";
  ctx.shadowBlur = width * 0.022;
  ctx.lineWidth = Math.max(3, block.size * 0.028);
  ctx.strokeStyle = "rgba(0,0,0,0.78)";
  ctx.fillStyle = direction.editorial ? `rgba(${direction.paper},0.9)` : "rgba(244,240,231,0.9)";
  ctx.font = font(block.size, titleFamily, 900);
  block.lines.forEach((line, index) => {
    const offset = map.protectComposition ? 0 : map.tension === "diagonal-rise" ? index * width * 0.018 : map.tension === "poster-stack" ? (index % 2) * width * 0.028 : 0;
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = `rgba(${direction.accent},0.9)`;
    ctx.fillText(line, map.titleX + offset + width * 0.012, y + height * 0.012);
    ctx.restore();
    ctx.strokeText(line, map.titleX + offset, y);
    ctx.fillText(line, map.titleX + offset, y);
    y += block.lineHeight;
  });

  if (brushWord) {
    const brushSize = manualValue(settings, "subtitleSize", Math.max(width * 0.09, block.size * 0.72));
    y += height * 0.012;
    ctx.save();
    ctx.translate(map.titleX - width * 0.012, y);
    ctx.rotate(-0.055);
    ctx.font = font(brushSize, "Permanent Marker", 900);
    ctx.lineWidth = Math.max(3, brushSize * 0.045);
    ctx.strokeStyle = "rgba(0,0,0,0.72)";
    ctx.fillStyle = `rgba(${direction.accent},0.96)`;
    ctx.strokeText(brushWord, 0, 0);
    ctx.fillText(brushWord, 0, 0);
    ctx.restore();
    y += brushSize * 0.58;
  }

  if (campaign.subtitle || campaign.episodeTitle) {
    y += height * 0.024;
    ctx.font = font(Math.max(24, manualValue(settings, "performerSize", width * 0.022)), "Inter", 900);
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    const subtitle = upper(campaign.subtitle || campaign.episodeTitle).slice(0, 46);
    ctx.fillText(subtitle, map.titleX + width * 0.015, y);
    ctx.fillStyle = `rgba(${direction.accent},0.95)`;
    ctx.fillRect(map.titleX, y - width * 0.016, width * 0.006, width * 0.012);
    y += height * 0.038;
  }

  ctx.restore();
  return y;
}

function paintPerformerBlock(ctx, map, width, height, plan, direction) {
  const performer = upper(plan.campaign?.performer || "");
  if (!performer || performer === "FLESHLAB CAST") return;
  const y = map.ctaY - height * 0.045;
  ctx.save();
  ctx.font = font(width * 0.018, "Inter", 900);
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.fillText(performer, map.ctaX, y);
  ctx.fillStyle = `rgba(${direction.accent},0.8)`;
  ctx.fillRect(map.ctaX, y + height * 0.012, Math.min(width * 0.18, ctx.measureText(performer).width), 2);
  ctx.restore();
}

function paintFooter(ctx, width, height, plan, settings, direction, map = null) {
  const campaign = plan.campaign || {};
  const items = [campaign.footerCategory, campaign.marketingTagline, ...(String(settings?.sellingPoints || "").split(/\n+/))]
    .map(item => upper(item))
    .filter(Boolean)
    .slice(0, map?.protectComposition ? 1 : 3);
  let x = map?.protectComposition ? map.titleX : width * 0.055;
  const y = height * 0.93;
  const maxW = map?.protectComposition ? map.titleMaxW : width;
  ctx.save();
  ctx.font = font(width * 0.014, "Bebas Neue", 400);
  items.forEach((item, index) => {
    ctx.fillStyle = index === 0 ? `rgba(${direction.accent},0.92)` : "rgba(255,255,255,0.55)";
    ctx.fillText(item, x, y, maxW);
    x += ctx.measureText(item).width + width * 0.038;
  });
  ctx.restore();
}

function paintCTA(ctx, map, width, height, plan, direction) {
  const cta = upper(plan.campaign?.cta || "").slice(0, 22);
  ctx.save();
  ctx.font = font(width * 0.016, "Inter", 900);
  const textW = ctx.measureText(cta).width;
  const padX = width * 0.018;
  const boxH = height * 0.046;
  const x = clamp(map.ctaX, width * 0.04, width - textW - padX * 2 - width * 0.04);
  const y = clamp(map.ctaY, height * 0.18, height * 0.84);
  ctx.fillStyle = `rgba(${direction.brandAccent || direction.accent},0.86)`;
  ctx.beginPath();
  ctx.roundRect(x, y, textW + padX * 2, boxH, boxH * 0.5);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillText(cta, x + padX, y + boxH * 0.66);
  ctx.restore();
}

function finalGrade(ctx, width, height, direction, map = null) {
  ctx.save();
  if (map?.protectComposition) outpaintClip(ctx, map, width, height);
  const vignette = ctx.createRadialGradient(width * 0.5, height * 0.46, height * 0.08, width * 0.5, height * 0.46, width * 0.78);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, `rgba(0,0,0,${direction.editorial ? 0.42 : 0.66})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = `rgba(${direction.accent},0.36)`;
  ctx.lineWidth = Math.max(2, width * 0.002);
  ctx.strokeRect(width * 0.018, width * 0.018, width - width * 0.036, height - width * 0.036);
  ctx.restore();
}

function paintCommercialColorGrade(ctx, width, height, direction, map = null) {
  ctx.save();
  if (map?.protectComposition) outpaintClip(ctx, map, width, height);
  ctx.globalCompositeOperation = "multiply";
  const coolShadows = ctx.createLinearGradient(0, 0, width, height);
  coolShadows.addColorStop(0, "rgba(10,18,34,0.48)");
  coolShadows.addColorStop(0.55, "rgba(0,0,0,0.08)");
  coolShadows.addColorStop(1, "rgba(0,0,0,0.58)");
  ctx.fillStyle = coolShadows;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "screen";
  const warmSkin = ctx.createRadialGradient(width * 0.54, height * 0.36, 0, width * 0.54, height * 0.36, width * 0.56);
  warmSkin.addColorStop(0, `rgba(255,190,128,${0.08 + direction.warmth * 0.12})`);
  warmSkin.addColorStop(0.42, `rgba(${direction.accent},0.07)`);
  warmSkin.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = warmSkin;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function paintBackgroundSuppression(ctx, image, map, width, height, direction, settings = {}) {
  if (map.protectComposition) return;
  ctx.save();
  ctx.globalAlpha = map.portraitEditorial ? 0.28 : 0.58;
  ctx.filter = `blur(${Math.round(width * 0.018)}px) brightness(${Math.round(manualValue(settings, "brightness", 48))}%) contrast(${Math.round(manualValue(settings, "contrast", 118))}%) saturate(${Math.round(manualValue(settings, "saturation", 74))}%)`;
  fillImage(ctx, image, map.crop, 0, 0, width, height);
  ctx.restore();
  ctx.save();
  const clearHero = ctx.createRadialGradient(map.hero.x + map.hero.w * 0.5, map.hero.y + map.hero.h * 0.42, map.hero.w * 0.26, map.hero.x + map.hero.w * 0.5, map.hero.y + map.hero.h * 0.42, map.hero.h * 0.74);
  clearHero.addColorStop(0, "rgba(0,0,0,0)");
  clearHero.addColorStop(0.52, "rgba(0,0,0,0.14)");
  clearHero.addColorStop(1, "rgba(0,0,0,0.78)");
  ctx.fillStyle = clearHero;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function paintLocalHeroContrast(ctx, image, map, width, height, direction, settings = {}) {
  if (map.protectComposition) return;
  ctx.save();
  if (!map.protectComposition) {
    ctx.beginPath();
    ctx.ellipse(map.hero.x + map.hero.w * 0.5, map.hero.y + map.hero.h * 0.43, Math.max(42, map.hero.w * 0.72), Math.max(70, map.hero.h * 0.64), 0, 0, Math.PI * 2);
    ctx.clip();
  }
  ctx.filter = imageFilter(settings, 108, 132 + direction.density * 24, 106 + direction.warmth * 22);
  coverImage(ctx, image, map.crop, 0, 0, width, height);
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const rim = ctx.createRadialGradient(map.hero.x + map.hero.w * 0.54, map.hero.y + map.hero.h * 0.28, map.hero.w * 0.18, map.hero.x + map.hero.w * 0.54, map.hero.y + map.hero.h * 0.28, map.hero.h * 0.58);
  rim.addColorStop(0, "rgba(255,255,255,0.12)");
  rim.addColorStop(0.46, `rgba(${direction.accent},0.12)`);
  rim.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function paintPremiumMaterials(ctx, width, height, direction, map = null) {
  ctx.save();
  if (map?.protectComposition) outpaintClip(ctx, map, width, height);
  ctx.globalCompositeOperation = "overlay";
  for (let i = 0; i < 260; i += 1) {
    const x = width * (((i * 29 + Math.round(direction.seed * 91)) % 100) / 100);
    const y = height * (((i * 47 + Math.round(direction.seed * 67)) % 100) / 100);
    const alpha = i % 2 ? 0.035 : 0.02;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(x, y, Math.max(1, width * 0.001), Math.max(1, width * 0.001));
  }
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = `rgba(${direction.secondary},1)`;
  ctx.lineWidth = Math.max(1, width * 0.0008);
  for (let i = 0; i < 14; i += 1) {
    const x = width * (((i * 53) % 100) / 100);
    ctx.beginPath();
    ctx.moveTo(x, height * 0.08);
    ctx.lineTo(x + width * (0.018 + (i % 4) * 0.01), height * 0.88);
    ctx.stroke();
  }
  ctx.restore();
}

function scoreCommercialAdvertising(plan, map, direction, width, height) {
  const analysis = plan.analysis || {};
  const separation = clamp(analysis.subjectSeparation || 0.58);
  const curiosity = clamp(analysis.visualCuriosity || 0.58);
  const negativeSpace = clamp(analysis.negativeSpace?.score || 0.54);
  const complexity = clamp(analysis.backgroundComplexity || 0.5);
  const heroArea = clamp((map.hero.w * map.hero.h) / (width * height) * 2.7, 0.22, 1);
  const heroPositionPower = 1 - Math.abs(map.heroCx - 0.5) * 0.46;
  const directionStrength = clamp((map.tension === "diagonal-rise" ? 0.9 : map.tension === "center-crush" ? 0.84 : 0.76) + direction.density * 0.12);
  const depth = clamp(direction.density * 0.42 + separation * 0.34 + negativeSpace * 0.16 + (1 - complexity) * 0.08);
  const visualMass = clamp(heroArea * 0.56 + heroPositionPower * 0.18 + directionStrength * 0.26);
  const screenshotRisk = clamp(complexity * 0.42 + (1 - depth) * 0.34 + (1 - separation) * 0.24);

  const scrollStopPower = clamp(curiosity * 0.28 + visualMass * 0.28 + directionStrength * 0.2 + depth * 0.16 + (1 - screenshotRisk) * 0.08);
  const premiumFeel = clamp(depth * 0.34 + (1 - screenshotRisk) * 0.3 + direction.contrast * 0.16 / 1.35 + negativeSpace * 0.12 + direction.density * 0.08);
  const emotionalImpact = clamp(curiosity * 0.45 + direction.warmth * 0.18 + directionStrength * 0.17 + separation * 0.2);
  const heroDominance = clamp(heroArea * 0.42 + separation * 0.34 + visualMass * 0.24);
  const brandRecognition = clamp(direction.density * 0.25 + direction.contrast * 0.2 / 1.35 + (plan.campaign?.franchise ? 0.2 : 0.08) + 0.27);
  const thumbnailReadability = clamp(heroDominance * 0.58 + visualMass * 0.22 + directionStrength * 0.2);

  const total = Math.round(
    scrollStopPower * 30 +
    premiumFeel * 20 +
    emotionalImpact * 15 +
    heroDominance * 15 +
    brandRecognition * 10 +
    thumbnailReadability * 10
  );

  const tests = {
    noTextCampaign: premiumFeel >= 0.72 && depth >= 0.64 && screenshotRisk <= 0.48,
    scrollStop: scrollStopPower >= 0.76,
    squint: heroDominance >= 0.66 && directionStrength >= 0.7 && visualMass >= 0.64,
    screenshot: screenshotRisk <= 0.48,
    premium: premiumFeel >= 0.72,
  };
  const passed = Object.values(tests).every(Boolean) && total >= 82;
  return {
    total,
    passed,
    tests,
    components: {
      scrollStopPower: Math.round(scrollStopPower * 100),
      premiumFeel: Math.round(premiumFeel * 100),
      emotionalImpact: Math.round(emotionalImpact * 100),
      heroDominance: Math.round(heroDominance * 100),
      brandRecognition: Math.round(brandRecognition * 100),
      thumbnailReadability: Math.round(thumbnailReadability * 100),
      screenshotRisk: Math.round(screenshotRisk * 100),
    },
  };
}

function selectValidatedArtwork(plan, image, width, height, settings = {}) {
  const attempts = [0, 1, 2, 3, 4, 5, 6].map(attempt => {
    const direction = artDirection(plan, attempt);
    const map = compositionMap(plan, image, width, height, attempt, settings);
    const commercialScore = scoreCommercialAdvertising(plan, map, direction, width, height);
    return { attempt, direction, map, commercialScore };
  }).sort((a, b) => b.commercialScore.total - a.commercialScore.total);
  return attempts.find(item => item.commercialScore.passed) || attempts[0];
}

function paintPremiumArtworkOnly(ctx, image, map, width, height, direction, settings = {}) {
  paintBackgroundLayer(ctx, image, map, width, height, direction, settings);
  paintCommercialColorGrade(ctx, width, height, direction, map);
  paintBackgroundSuppression(ctx, image, map, width, height, direction, settings);
  paintLightShaping(ctx, map, width, height, direction);
  paintDepthLayer(ctx, map, width, height, direction);
  paintHeroEnhancement(ctx, image, map, width, height, direction, settings);
  paintLocalHeroContrast(ctx, image, map, width, height, direction, settings);
  paintEntertainmentComposition(ctx, map, width, height, direction);
  paintAtmosphere(ctx, map, width, height, direction);
  paintPremiumMaterials(ctx, width, height, direction, map);
  finalGrade(ctx, width, height, direction, map);
}

export async function paintCommercialVisualSystem(canvas, image, plan, settings, width, height) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const artwork = selectValidatedArtwork(plan, image, width, height, settings);
  const { direction, map, commercialScore } = artwork;
  paintPremiumArtworkOnly(ctx, image, map, width, height, direction, settings);
  paintBrandAccents(ctx, map, width, height, direction);
  paintTitleBlock(ctx, map, width, height, plan, direction, settings);
  paintPerformerBlock(ctx, map, width, height, plan, direction);
  paintFooter(ctx, width, height, plan, settings, direction, map);
  await paintLogo(ctx, map, width, direction, settings);
  return { logoHeight: width * 0.04, compositionMode: map.tension, visualSystemId: map.visualSystemId, renderedRenderPlanHash: map.renderPlanHash, renderMap: map, renderDirection: direction, commercialAdvertisingScore: commercialScore.total, commercialScore, artworkValidation: commercialScore.passed ? "passed" : "best_available", compositionProtection: map.protectComposition ? "source_composition_protected" : map.portraitEditorial ? "portrait_editorial_landscape_composition" : "standard_safe_crop", artDirectorVersion: "FLESHLAB ENTERTAINMENT KEY ART DIRECTOR v4.0" };
}