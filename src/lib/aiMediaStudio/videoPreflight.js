function withTimeout(promise, ms, onTimeout) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(onTimeout()), ms);
  });
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
}

function mediaErrorLabel(error) {
  const code = error?.code || null;
  const labels = {
    1: 'MEDIA_ERR_ABORTED',
    2: 'MEDIA_ERR_NETWORK',
    3: 'MEDIA_ERR_DECODE',
    4: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
  };
  return { code, label: labels[code] || 'NONE', message: error?.message || '' };
}

function classifyFailure(diag) {
  if (!diag.url) return 'NO_SOURCE';
  if (diag.finalFailureStage === 'timeout') return 'TIMEOUT';
  if (diag.finalFailureStage === 'canvas_pixel_read' && diag.corsStatus === 'canvas-tainted') return 'PLAYABLE_ONLY';
  if ([3, 4].includes(diag.browserMediaErrorCode)) return 'UNSUPPORTED_CODEC';
  if ([401, 403, 404, 410].includes(diag.httpStatus)) return 'URL_FAILED';
  if (diag.browserMediaErrorCode === 2) return 'URL_FAILED';
  if (diag.metadataLoaded && diag.seekingWorked && diag.canvasDrawSucceeded && diag.canvasPixelReadingSucceeded) return 'READY';
  return 'URL_FAILED';
}

async function probeHeaders(source, diag) {
  if (!source.url || source.url.startsWith('blob:')) {
    diag.corsStatus = 'local-object-url';
    return;
  }
  try {
    const response = await fetch(source.url, { method: 'HEAD', mode: 'cors', cache: 'no-store' });
    diag.httpStatus = response.status;
    diag.mimeType = response.headers.get('content-type') || diag.mimeType;
    diag.corsStatus = response.headers.get('access-control-allow-origin') ? 'cors-header-present' : 'head-ok-no-readable-acao';
    if (!response.ok) diag.finalFailureStage = 'url_head_failed';
  } catch (error) {
    diag.corsStatus = 'head-blocked-or-network-failed';
    diag.headerProbeError = error.message;
  }
}

function waitForVideoEvent(video, eventName, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Processing cancelled', 'AbortError'));
    const cleanup = () => {
      video.removeEventListener(eventName, onEvent);
      video.removeEventListener('error', onError);
    };
    const onEvent = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error('video element error')); };
    video.addEventListener(eventName, onEvent, { once: true });
    video.addEventListener('error', onError, { once: true });
  });
}

async function seekVideo(video, time, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Processing cancelled', 'AbortError'));
    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    };
    const onSeeked = () => { cleanup(); requestAnimationFrame(resolve); };
    const onError = () => { cleanup(); reject(new Error('seek failed')); };
    video.addEventListener('seeked', onSeeked, { once: true });
    video.addEventListener('error', onError, { once: true });
    video.currentTime = Math.min(Math.max(time, 0), Math.max(video.duration - 0.05, 0));
  });
}

export async function preflightAnalyzableVideoSource(source, { signal, timeoutMs = 15000 } = {}) {
  const diag = {
    videoId: source.videoId || null,
    title: source.title || 'Untitled Video',
    selectedSourceField: source.selectedSourceField || source.sourceField || 'none',
    sourceType: source.sourceType || 'none',
    redactedUrl: source.redactedUrl || null,
    extension: source.extension || 'unknown',
    mimeType: source.mimeType || '',
    accessType: source.accessType || 'unknown',
    metadataLoaded: false,
    playbackStarted: false,
    seekingWorked: false,
    canvasDrawSucceeded: false,
    canvasPixelReadingSucceeded: false,
    browserMediaErrorCode: null,
    browserMediaError: 'NONE',
    corsStatus: 'not-tested',
    codecInformation: source.browserCanPlay || 'unknown',
    finalFailureStage: 'not-started',
    classification: 'URL_FAILED',
    failureMessage: '',
    url: source.url || null,
    metadata: null,
  };

  if (!source.url) {
    diag.classification = 'NO_SOURCE';
    diag.finalFailureStage = 'source_resolution';
    diag.failureMessage = source.reason || 'No usable video source exists';
    return diag;
  }

  await probeHeaders(source, diag);
  if ([401, 403, 404, 410].includes(diag.httpStatus)) {
    diag.classification = 'URL_FAILED';
    diag.failureMessage = `Source URL returned HTTP ${diag.httpStatus}`;
    return diag;
  }

  const video = document.createElement('video');
  const isRemote = /^https?:/i.test(source.url);
  if (isRemote) video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';

  try {
    diag.finalFailureStage = 'metadata';
    video.src = source.url;
    await withTimeout(waitForVideoEvent(video, 'loadedmetadata', signal), timeoutMs, () => {
      diag.finalFailureStage = 'timeout';
      return new Error('Timed out while loading video metadata');
    });
    diag.metadataLoaded = true;
    diag.metadata = {
      previewUrl: source.url,
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
      aspectRatio: Number((video.videoWidth / video.videoHeight).toFixed(3)),
    };
    diag.codecInformation = `${diag.mimeType || 'unknown mime'} · canPlayType=${video.canPlayType(diag.mimeType || '') || 'unknown'} · ${video.videoWidth}x${video.videoHeight}`;

    diag.finalFailureStage = 'playback';
    try {
      await withTimeout(video.play(), 5000, () => new Error('Timed out while starting playback'));
      diag.playbackStarted = true;
      video.pause();
    } catch (playError) {
      diag.playbackStarted = false;
      diag.playbackError = playError.message;
    }

    diag.finalFailureStage = 'seek';
    const seekTarget = Math.min(Math.max(video.duration * 0.12, 0.25), Math.max(video.duration - 0.2, 0));
    await withTimeout(seekVideo(video, seekTarget, signal), timeoutMs, () => {
      diag.finalFailureStage = 'timeout';
      return new Error('Timed out while seeking decoded frame');
    });
    diag.seekingWorked = true;

    diag.finalFailureStage = 'canvas_draw';
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = Math.max(1, Math.round(64 / diag.metadata.aspectRatio));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    diag.canvasDrawSucceeded = true;

    diag.finalFailureStage = 'canvas_pixel_read';
    try {
      ctx.getImageData(0, 0, 1, 1);
      diag.canvasPixelReadingSucceeded = true;
      if (isRemote && diag.corsStatus !== 'cors-header-present') diag.corsStatus = 'canvas-readable-cors-ok';
    } catch (error) {
      if (error.name === 'SecurityError') {
        diag.corsStatus = 'canvas-tainted';
        diag.failureMessage = 'Video plays, but browser analysis is blocked by storage CORS policy.';
      } else {
        diag.failureMessage = error.message;
      }
    }
    canvas.width = 0;
    canvas.height = 0;
  } catch (error) {
    const media = mediaErrorLabel(video.error);
    diag.browserMediaErrorCode = media.code;
    diag.browserMediaError = media.label;
    diag.failureMessage = diag.failureMessage || error.message;
  } finally {
    const media = mediaErrorLabel(video.error);
    diag.browserMediaErrorCode = diag.browserMediaErrorCode || media.code;
    diag.browserMediaError = diag.browserMediaError === 'NONE' ? media.label : diag.browserMediaError;
    diag.classification = classifyFailure(diag);
    if (diag.classification === 'READY') diag.finalFailureStage = 'ready';
    if (diag.classification === 'PLAYABLE_ONLY') diag.finalFailureStage = 'canvas_pixel_read';
    if (!diag.failureMessage && diag.classification !== 'READY') diag.failureMessage = `${diag.classification} at ${diag.finalFailureStage}`;
    video.removeAttribute('src');
    video.load();
  }

  return diag;
}

export function aggregatePreflightDiagnostics(items) {
  return items.reduce((counts, item) => {
    const key = item.classification || 'URL_FAILED';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, { READY: 0, PLAYABLE_ONLY: 0, UNSUPPORTED_CODEC: 0, URL_FAILED: 0, NO_SOURCE: 0, TIMEOUT: 0 });
}