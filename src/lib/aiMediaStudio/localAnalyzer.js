import JSZip from "jszip";

const ACCEPTED_EXTENSIONS = ["mp4", "mov", "webm", "m4v"];

export function isSupportedVideoFile(file) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ACCEPTED_EXTENSIONS.includes(ext);
}

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0)} ${units[index]}`;
}

export function formatTime(seconds = 0) {
  const safe = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function canvasToBlob(canvas, type = "image/jpeg", quality = 0.86) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Canvas export failed")), type, quality);
  });
}

function seekVideo(video, time, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Processing cancelled", "AbortError"));
    const target = Math.min(Math.max(time, 0), Math.max(video.duration - 0.05, 0));
    if (Math.abs(video.currentTime - target) < 0.03 && video.readyState >= 2) {
      requestAnimationFrame(resolve);
      return;
    }
    let timeoutId;
    const cleanup = () => {
      window.clearTimeout(timeoutId);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
    const onSeeked = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error("Unsupported codec or frame decode failed")); };
    timeoutId = window.setTimeout(() => { cleanup(); reject(new Error("Frame decode timed out")); }, 12000);
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.currentTime = target;
  });
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function calculateHeroMetrics(imageData, metrics) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  let sampled = 0, skin = 0, upperSkin = 0, rightSkin = 0, centerSkin = 0, faceZoneSkin = 0, cx = 0, cy = 0;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const brightness = (r + g + b) / 3;
      const isSkinLike = r > 58 && g > 32 && b > 20 && r > g * 1.05 && r > b * 1.18 && max - min > 14 && brightness > 45 && brightness < 235;
      sampled += 1;
      if (isSkinLike) {
        skin += 1;
        cx += x;
        cy += y;
        if (y < height * 0.6) upperSkin += 1;
        if (x > width * 0.4) rightSkin += 1;
        if (x > width * 0.36 && x < width * 0.82 && y < height * 0.74) centerSkin += 1;
        if (x > width * 0.48 && x < width * 0.82 && y > height * 0.12 && y < height * 0.5) faceZoneSkin += 1;
      }
    }
  }
  const skinRatio = sampled ? (skin / sampled) * 100 : 0;
  const upperRatio = skin ? upperSkin / skin : 0;
  const rightRatio = skin ? rightSkin / skin : 0;
  const centerRatio = skin ? centerSkin / skin : 0;
  const faceZoneRatio = skin ? faceZoneSkin / skin : 0;
  const centroidX = skin ? cx / skin / width : 0;
  const centroidY = skin ? cy / skin / height : 0;
  const rightPanelRatio = rightRatio;
  const presence = clamp(skinRatio * 7.4, 0, 48);
  const heroPlacement = skin ? clamp((1 - Math.abs(centroidX - 0.68) / 0.26) * 20, 0, 20) + clamp((1 - Math.abs(centroidY - 0.43) / 0.3) * 12, 0, 12) : 0;
  const upperBody = clamp(upperRatio * 26, 0, 26);
  const rightHero = clamp(rightPanelRatio * 18, 0, 18);
  const centerInterest = clamp(centerRatio * 8, 0, 8);
  const faceFocus = clamp(faceZoneRatio * 14, 0, 14);
  const lighting = clamp(12 - Math.abs(metrics.brightness - 126) * 0.08 - metrics.overexposure * 1.8 - metrics.underexposure * 1.2, 0, 12);
  const cinematicContrast = clamp(metrics.contrast * 0.28, 0, 9);
  const transitionPenalty = metrics.visualDifference > 26 ? (metrics.visualDifference - 26) * 1.35 : 0;
  const blurPenalty = metrics.sharpness < 5.8 ? (5.8 - metrics.sharpness) * 4.4 : 0;
  const emptyPenalty = skinRatio < 2.5 ? 48 : skinRatio < 5 ? 28 : skinRatio < 7 ? 12 : 0;
  const wallPenalty = skinRatio < 7 && metrics.contrast < 38 ? 24 : skinRatio < 5 ? 14 : 0;
  const hiddenPenalty = skin && upperRatio < 0.36 ? 20 : 0;
  const edgePenalty = skin && (centroidX > 0.88 || centroidX < 0.46) ? 24 : 0;
  const lowBodyPenalty = skin && centroidY > 0.68 ? 18 : 0;
  const leftPanelPenalty = skin && rightPanelRatio < 0.62 ? 20 : 0;
  const score = clamp(presence + heroPlacement + upperBody + rightHero + centerInterest + faceFocus + lighting + cinematicContrast - transitionPenalty - blurPenalty - emptyPenalty - wallPenalty - hiddenPenalty - edgePenalty - lowBodyPenalty - leftPanelPenalty);
  return {
    score: Number(score.toFixed(2)),
    skinRatio: Number(skinRatio.toFixed(2)),
    upperBodyRatio: Number(upperRatio.toFixed(2)),
    rightHeroRatio: Number(rightPanelRatio.toFixed(2)),
    centerInterestRatio: Number(centerRatio.toFixed(2)),
    faceZoneRatio: Number(faceZoneRatio.toFixed(2)),
    centroidX: Number(centroidX.toFixed(2)),
    centroidY: Number(centroidY.toFixed(2)),
    suitable: score >= 62 && skinRatio >= 5 && upperRatio >= 0.36 && rightPanelRatio >= 0.62 && centroidX >= 0.46 && centroidX <= 0.88 && centroidY <= 0.68,
  };
}

function calculateMetrics(imageData, previousLuma) {
  const data = imageData.data;
  const width = imageData.width;
  const luma = new Float32Array(width * imageData.height);
  let sum = 0, over = 0, under = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const y = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    luma[p] = y;
    sum += y;
    if (y > 245) over += 1;
    if (y < 10) under += 1;
  }
  const avg = sum / luma.length;
  let variance = 0, edge = 0, diff = 0;
  for (let i = 0; i < luma.length; i += 1) {
    variance += Math.pow(luma[i] - avg, 2);
    if (previousLuma) diff += Math.abs(luma[i] - previousLuma[i]);
    if (i > width) edge += Math.abs(luma[i] - luma[i - 1]) + Math.abs(luma[i] - luma[i - width]);
  }
  const contrast = Math.sqrt(variance / luma.length);
  const sharpness = edge / (luma.length * 2);
  const visualDifference = previousLuma ? (diff / luma.length / 255) * 100 : 0;
  const technicalScore = Math.max(0, Math.min(100,
    100 - Math.abs(avg - 128) * 0.25 + contrast * 0.25 + sharpness * 1.1 - over / luma.length * 120 - under / luma.length * 80
  ));
  return {
    brightness: Number(avg.toFixed(2)),
    contrast: Number(contrast.toFixed(2)),
    sharpness: Number(sharpness.toFixed(2)),
    overexposure: Number(((over / luma.length) * 100).toFixed(2)),
    underexposure: Number(((under / luma.length) * 100).toFixed(2)),
    visualDifference: Number(visualDifference.toFixed(2)),
    technicalScore: Number(technicalScore.toFixed(2)),
    luma,
  };
}

async function whilePaused(pausedRef, signal) {
  while (pausedRef?.current) {
    if (signal?.aborted) throw new DOMException("Processing cancelled", "AbortError");
    await wait(150);
  }
}

export async function loadVideoMetadata(file, log) {
  const previewUrl = URL.createObjectURL(file);
  log?.("preview created");
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      if (!video.duration || !video.videoWidth || !video.videoHeight) {
        reject(new Error("Metadata could not be read"));
        return;
      }
      const aspectRatio = Number((video.videoWidth / video.videoHeight).toFixed(3));
      log?.("metadata loaded");
      resolve({ previewUrl, duration: video.duration, width: video.videoWidth, height: video.videoHeight, aspectRatio });
    };
    video.onerror = () => reject(new Error("Unsupported codec or metadata could not be read"));
    video.src = previewUrl;
  });
}

export async function sampleVideoFrames({ file, previewUrl, metadata, onProgress, log, pausedRef, signal }) {
  const video = document.createElement("video");
  video.src = previewUrl;
  video.muted = true;
  video.preload = "auto";
  video.crossOrigin = "anonymous";
  log?.("decoding started");
  await new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve;
    video.onerror = () => reject(new Error("Unsupported codec or frame decode failed"));
  });

  const analysisCanvas = document.createElement("canvas");
  analysisCanvas.width = 320;
  analysisCanvas.height = Math.max(1, Math.round(320 / metadata.aspectRatio));
  const analysisCtx = analysisCanvas.getContext("2d", { willReadFrequently: true });

  const thumbCanvas = document.createElement("canvas");
  thumbCanvas.width = Math.min(metadata.width, 960);
  thumbCanvas.height = Math.round(thumbCanvas.width / metadata.aspectRatio);
  const thumbCtx = thumbCanvas.getContext("2d");

  const sampleTimes = [];
  const sampleStep = Math.max(1, metadata.duration / 180);
  for (let time = 0; time < metadata.duration; time += sampleStep) sampleTimes.push(Number(time.toFixed(2)));
  if (!sampleTimes.length) sampleTimes.push(0);

  const frames = [];
  let previousLuma = null;
  for (let index = 0; index < sampleTimes.length; index += 1) {
    await whilePaused(pausedRef, signal);
    if (signal?.aborted) throw new DOMException("Processing cancelled", "AbortError");
    const time = sampleTimes[index];
    await seekVideo(video, time, signal);
    analysisCtx.drawImage(video, 0, 0, analysisCanvas.width, analysisCanvas.height);
    thumbCtx.drawImage(video, 0, 0, thumbCanvas.width, thumbCanvas.height);
    const imageData = analysisCtx.getImageData(0, 0, analysisCanvas.width, analysisCanvas.height);
    const metrics = calculateMetrics(imageData, previousLuma);
    const hero = calculateHeroMetrics(imageData, metrics);
    previousLuma = metrics.luma;
    const thumbBlob = await canvasToBlob(thumbCanvas, "image/jpeg", 0.88);
    frames.push({
      index,
      time,
      metrics: { ...metrics, luma: undefined },
      hero,
      blob: thumbBlob,
      url: URL.createObjectURL(thumbBlob),
      filename: `${file.name.replace(/\.[^/.]+$/, "")}_frame_${String(index + 1).padStart(4, "0")}.jpg`,
    });
    log?.(`frame ${index + 1}/${sampleTimes.length} analyzed`);
    onProgress?.(Math.round(((index + 1) / sampleTimes.length) * 70));
  }
  return frames;
}

export function detectScenes(frames, duration, log) {
  if (!frames.length) return [];
  const diffs = frames.slice(1).map(frame => frame.metrics.visualDifference);
  const avg = diffs.reduce((sum, value) => sum + value, 0) / Math.max(diffs.length, 1);
  const variance = diffs.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / Math.max(diffs.length, 1);
  const threshold = Math.max(10, avg + Math.sqrt(variance) * 0.9);
  const starts = [frames[0].time];
  frames.slice(1).forEach(frame => {
    const lastStart = starts[starts.length - 1];
    if (frame.metrics.visualDifference >= threshold && frame.time - lastStart >= 4) starts.push(frame.time);
  });
  const scenes = starts.map((start, index) => {
    const end = starts[index + 1] ?? duration;
    const sceneFrames = frames.filter(frame => frame.time >= start && frame.time < end);
    const representative = sceneFrames.reduce((best, frame) => frame.metrics.technicalScore > best.metrics.technicalScore ? frame : best, sceneFrames[0] || frames[0]);
    return {
      id: `scene-${index + 1}`,
      start,
      end,
      duration: Math.max(0, end - start),
      representativeThumbnailUrl: representative.url,
      representativeFrameIndex: representative.index,
      scores: representative.metrics,
    };
  });
  log?.("scenes detected");
  return scenes;
}

export function rankScreenshots(frames, limit = 10) {
  return [...frames].sort((a, b) => b.metrics.technicalScore - a.metrics.technicalScore).slice(0, limit);
}

export function rankHeroFrames(frames, limit = 12, minimumScore = 62) {
  return [...frames]
    .filter(frame => {
      const hero = frame.hero || {};
      return hero.suitable &&
        Number(hero.score || 0) >= minimumScore &&
        Number(hero.skinRatio || 0) >= 5 &&
        Number(hero.upperBodyRatio || 0) >= 0.36 &&
        Number(hero.rightHeroRatio || 0) >= 0.62 &&
        Number(hero.centroidX || 0) >= 0.46 &&
        Number(hero.centroidX || 0) <= 0.88 &&
        Number(hero.centroidY || 0) <= 0.68;
    })
    .sort((a, b) => {
      const aHero = a.hero || {};
      const bHero = b.hero || {};
      const aPremium = Number(aHero.score || 0) + Number(aHero.skinRatio || 0) * 2.8 + Number(aHero.rightHeroRatio || 0) * 22 + Number(aHero.faceZoneRatio || 0) * 10 + Number(aHero.upperBodyRatio || 0) * 10 - Math.abs(Number(aHero.centroidX || 0) - 0.68) * 36 - Math.max(0, Number(aHero.centroidY || 0) - 0.58) * 34;
      const bPremium = Number(bHero.score || 0) + Number(bHero.skinRatio || 0) * 2.8 + Number(bHero.rightHeroRatio || 0) * 22 + Number(bHero.faceZoneRatio || 0) * 10 + Number(bHero.upperBodyRatio || 0) * 10 - Math.abs(Number(bHero.centroidX || 0) - 0.68) * 36 - Math.max(0, Number(bHero.centroidY || 0) - 0.58) * 34;
      return bPremium - aPremium;
    })
    .slice(0, limit);
}

export function selectDiverseFrames(frames, limit = 10, initialMinGapSeconds = 8) {
  const ranked = rankScreenshots(frames, frames.length);
  let minGap = initialMinGapSeconds;
  let selected = [];
  while (selected.length < limit && minGap >= 1) {
    selected = [];
    ranked.forEach(frame => {
      if (selected.length >= limit) return;
      const farEnough = selected.every(chosen => Math.abs(chosen.time - frame.time) >= minGap);
      if (farEnough) selected.push(frame);
    });
    minGap /= 2;
  }
  return selected.length ? selected : ranked.slice(0, limit);
}

async function blobToImage(blob) {
  if (window.createImageBitmap) return createImageBitmap(blob);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(blob);
  });
}

async function createContactSheet(frames, baseName) {
  const selected = frames.slice(0, 25);
  const columns = 5;
  const cellW = 240;
  const cellH = 150;
  const rows = Math.max(1, Math.ceil(selected.length / columns));
  const canvas = document.createElement("canvas");
  canvas.width = columns * cellW;
  canvas.height = rows * cellH;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < selected.length; i += 1) {
    const image = await blobToImage(selected[i].blob);
    const x = (i % columns) * cellW;
    const y = Math.floor(i / columns) * cellH;
    ctx.drawImage(image, x, y, cellW, cellH);
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(x, y + cellH - 24, 86, 24);
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px sans-serif";
    ctx.fillText(formatTime(selected[i].time), x + 8, y + cellH - 8);
  }
  const blob = await canvasToBlob(canvas, "image/jpeg", 0.9);
  return outputFile(`${baseName}_contact_sheet.jpg`, blob, URL.createObjectURL(blob), URL.createObjectURL(blob), "ready");
}

function outputFile(filename, blob, url, previewUrl = null, status = "ready") {
  return { filename, size: blob.size, blob, url, previewUrl, status };
}

export async function createOutputs({ file, frames, scenes, log }) {
  const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");
  const screenshots = selectDiverseFrames(frames, 10, 8);
  log?.("diverse screenshots selected");
  const outputs = screenshots.map((frame, index) => outputFile(
    `${baseName}_top_${String(index + 1).padStart(2, "0")}.jpg`,
    frame.blob,
    URL.createObjectURL(frame.blob),
    frame.url,
    "ready"
  ));

  outputs.push(await createContactSheet(selectDiverseFrames(frames, 25, 4), baseName));

  const sceneData = scenes.map(scene => ({ ...scene, representativeThumbnailUrl: undefined }));
  const jsonBlob = new Blob([JSON.stringify(sceneData, null, 2)], { type: "application/json" });
  outputs.push(outputFile(`${baseName}_scenes.json`, jsonBlob, URL.createObjectURL(jsonBlob), null, "ready"));

  const csvRows = [["id", "start", "end", "duration", "brightness", "contrast", "sharpness", "overexposure", "underexposure", "visualDifference", "technicalScore"]]
    .concat(sceneData.map(scene => [scene.id, scene.start, scene.end, scene.duration, scene.scores.brightness, scene.scores.contrast, scene.scores.sharpness, scene.scores.overexposure, scene.scores.underexposure, scene.scores.visualDifference, scene.scores.technicalScore]));
  const csvBlob = new Blob([csvRows.map(row => row.join(",")).join("\n")], { type: "text/csv" });
  outputs.push(outputFile(`${baseName}_scenes.csv`, csvBlob, URL.createObjectURL(csvBlob), null, "ready"));

  const zip = new JSZip();
  screenshots.forEach((frame, index) => zip.file(`${baseName}_screenshot_${String(index + 1).padStart(2, "0")}.jpg`, frame.blob));
  const zipBlob = await zip.generateAsync({ type: "blob" });
  outputs.push(outputFile(`${baseName}_top_screenshots.zip`, zipBlob, URL.createObjectURL(zipBlob), null, "ready"));
  log?.("outputs ready");
  return outputs;
}

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => window.setTimeout(() => reject(new Error(message)), ms))
  ]);
}

async function createTeasersWithFFmpeg({ file, frames, log, onProgress }) {
  const candidates = selectDiverseFrames(frames, 3, 12);
  if (!candidates.length) throw new Error("No frames available for teaser generation");

  log?.("FFmpeg WASM loading started; first MP4 run can take up to 120 seconds");
  let FFmpeg;
  let fetchFile;
  try {
    ({ FFmpeg } = await import("@ffmpeg/ffmpeg"));
    ({ fetchFile } = await import("@ffmpeg/util"));
  } catch (error) {
    throw new Error(`FFmpeg failed to load: ${error.message}`);
  }

  const ffmpeg = new FFmpeg();
  try {
    await withTimeout(ffmpeg.load(), 120000, "FFmpeg load timed out after 120 seconds");
  } catch (error) {
    throw new Error(`FFmpeg failed to load: ${error.message}`);
  }

  await ffmpeg.writeFile("input_video", await fetchFile(file));
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const ext = file.name.split(".").pop()?.toLowerCase();
  const canStreamCopyToMp4 = ["mp4", "m4v", "mov"].includes(ext);
  const teasers = [];

  for (let index = 0; index < candidates.length; index += 1) {
    const frame = candidates[index];
    const start = Math.max(0, frame.time - 1);
    const outputName = `teaser_${index + 1}.mp4`;
    ffmpeg.on("progress", ({ progress }) => onProgress?.(75 + Math.round(((index + (progress || 0)) / candidates.length) * 20)));

    const fastCopyArgs = ["-y", "-ss", String(start), "-t", "10", "-i", "input_video", "-an", "-c:v", "copy", "-movflags", "+faststart", outputName];
    const transcodeArgs = [
      "-y",
      "-ss", String(start),
      "-t", "10",
      "-i", "input_video",
      "-an",
      "-vf", "fps=30,scale=min(720\\,iw):-2:flags=bicubic,format=yuv420p",
      "-r", "30",
      "-fps_mode", "cfr",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "25",
      "-movflags", "+faststart",
      outputName
    ];

    try {
      if (canStreamCopyToMp4) {
        try {
          log?.(`fast MP4 teaser ${index + 1}/${candidates.length} cut started at ${formatTime(start)}`);
          await withTimeout(ffmpeg.exec(fastCopyArgs), 20000, "Fast MP4 cut timed out");
        } catch (copyError) {
          log?.(`fast MP4 cut failed: ${copyError.message}; transcoding teaser ${index + 1}`);
          await withTimeout(ffmpeg.exec(transcodeArgs), 90000, "FFmpeg teaser encode timed out");
        }
      } else {
        await withTimeout(ffmpeg.exec(transcodeArgs), 90000, "FFmpeg teaser encode timed out");
      }

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data.buffer], { type: "video/mp4" });
      if (!blob.size) throw new Error("FFmpeg produced an empty teaser");
      teasers.push(outputFile(`${baseName}_10s_teaser_${String(index + 1).padStart(2, "0")}.mp4`, blob, URL.createObjectURL(blob), URL.createObjectURL(blob), "ready"));
    } catch (error) {
      throw new Error(`teaser ${index + 1} generation failed: ${error.message}`);
    }
  }

  log?.(`${teasers.length} diverse MP4 teaser candidates generated`);
  return teasers;
}

export async function createTeaserFromFrames({ file, frames, log, onProgress }) {
  log?.("diverse MP4 teaser generation started");
  try {
    return await createTeasersWithFFmpeg({ file, frames, log, onProgress });
  } catch (error) {
    log?.(`${error.message}; MP4 teaser generation stopped because browser WebM fallback was disabled`);
    throw new Error(`MP4 teaser generation failed: ${error.message}`);
  }
}