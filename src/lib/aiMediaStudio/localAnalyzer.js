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
  for (let time = 0; time < metadata.duration; time += 2) sampleTimes.push(Number(time.toFixed(2)));
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
    const metrics = calculateMetrics(analysisCtx.getImageData(0, 0, analysisCanvas.width, analysisCanvas.height), previousLuma);
    previousLuma = metrics.luma;
    const thumbBlob = await canvasToBlob(thumbCanvas, "image/jpeg", 0.88);
    frames.push({
      index,
      time,
      metrics: { ...metrics, luma: undefined },
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
  const screenshots = rankScreenshots(frames, 10);
  log?.("screenshots ranked");
  const outputs = screenshots.map((frame, index) => outputFile(
    `${baseName}_top_${String(index + 1).padStart(2, "0")}.jpg`,
    frame.blob,
    URL.createObjectURL(frame.blob),
    frame.url,
    "ready"
  ));

  outputs.push(await createContactSheet(rankScreenshots(frames, 25), baseName));

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

async function createTeaserWithFFmpeg({ file, scenes, log, onProgress }) {
  log?.("FFmpeg WASM loading started");
  let FFmpeg;
  let fetchFile;
  try {
    ({ FFmpeg } = await import("@ffmpeg/ffmpeg"));
    ({ fetchFile } = await import("@ffmpeg/util"));
  } catch (error) {
    throw new Error(`FFmpeg failed to load: ${error.message}`);
  }
  const ffmpeg = new FFmpeg();
  ffmpeg.on("progress", ({ progress }) => onProgress?.(75 + Math.round((progress || 0) * 20)));
  try {
    await withTimeout(ffmpeg.load(), 15000, "FFmpeg load timed out");
  } catch (error) {
    throw new Error(`FFmpeg failed to load: ${error.message}`);
  }
  const bestScene = scenes.slice().sort((a, b) => b.scores.technicalScore - a.scores.technicalScore)[0];
  const start = Math.max(0, bestScene?.start || 0);
  await ffmpeg.writeFile("input_video", await fetchFile(file));
  const extension = file.name.toLowerCase().endsWith(".webm") ? "webm" : "mp4";
  const outputName = `teaser.${extension}`;
  const args = extension === "webm"
    ? ["-ss", String(start), "-t", "10", "-i", "input_video", "-an", "-c:v", "libvpx-vp9", "-b:v", "2M", outputName]
    : ["-ss", String(start), "-t", "10", "-i", "input_video", "-an", "-c:v", "libx264", "-preset", "veryfast", "-movflags", "faststart", outputName];
  try {
    await withTimeout(ffmpeg.exec(args), 30000, "FFmpeg teaser encode timed out");
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: extension === "webm" ? "video/webm" : "video/mp4" });
    if (!blob.size) throw new Error("FFmpeg produced an empty teaser");
    log?.("teaser generated");
    return outputFile(`${file.name.replace(/\.[^/.]+$/, "")}_10s_teaser.${extension}`, blob, URL.createObjectURL(blob), URL.createObjectURL(blob), "ready");
  } catch (error) {
    throw new Error(`teaser generation failed: ${error.message}`);
  }
}

async function createTeaserWithMediaRecorder({ file, frames, log, onProgress }) {
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) throw new Error("Teaser generation failed: MediaRecorder or canvas captureStream is unavailable in this browser");
  const selected = rankScreenshots(frames, 10).slice(0, 10);
  if (!selected.length) throw new Error("Teaser generation failed: no analyzed frames available");
  const firstImage = await blobToImage(selected[0].blob);
  const canvas = document.createElement("canvas");
  canvas.width = firstImage.width || 960;
  canvas.height = firstImage.height || 540;
  const ctx = canvas.getContext("2d");
  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
  const recorder = new MediaRecorder(canvas.captureStream(10), { mimeType: mime });
  const chunks = [];
  recorder.ondataavailable = event => event.data?.size && chunks.push(event.data);
  const stopped = new Promise(resolve => recorder.onstop = resolve);
  recorder.start();
  for (let tick = 0; tick < 100; tick += 1) {
    const frame = selected[Math.min(selected.length - 1, Math.floor(tick / 10))];
    const image = await blobToImage(frame.blob);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.58)";
    ctx.fillRect(0, canvas.height - 40, 150, 40);
    ctx.fillStyle = "#fff";
    ctx.font = "18px sans-serif";
    ctx.fillText(formatTime(frame.time), 14, canvas.height - 14);
    onProgress?.(75 + Math.round((tick / 100) * 20));
    await wait(100);
  }
  recorder.stop();
  await stopped;
  const blob = new Blob(chunks, { type: "video/webm" });
  if (!blob.size) throw new Error("Teaser generation failed: browser produced an empty video blob");
  log?.("teaser generated");
  return outputFile(`${file.name.replace(/\.[^/.]+$/, "")}_10s_teaser.webm`, blob, URL.createObjectURL(blob), URL.createObjectURL(blob), "ready");
}

export async function createTeaserFromFrames({ file, frames, scenes, log, onProgress }) {
  log?.("teaser generation started");
  try {
    return await createTeaserWithFFmpeg({ file, scenes, log, onProgress });
  } catch (error) {
    log?.(`${error.message}; using browser MediaRecorder fallback`);
    return createTeaserWithMediaRecorder({ file, frames, log, onProgress });
  }
}