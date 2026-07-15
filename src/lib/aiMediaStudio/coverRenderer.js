import { renderPosterToCanvas } from "./posterRenderer";

export const COVER_FORMATS = [
  { id: "landscape", label: "16:9 Landscape", width: 1920, height: 1080 },
  { id: "post", label: "4:5 Promotional Post", width: 1080, height: 1350 },
  { id: "square", label: "1:1 Square", width: 1080, height: 1080 },
  { id: "story", label: "9:16 Story", width: 1080, height: 1920 },
  { id: "custom", label: "Custom", width: 1600, height: 900 },
];

export const COVER_PRESETS = [
  { id: "v2-auto", label: "Cinematic Poster Engine v2", red: "#d00012", charcoal: "#030303", stroke: "#7a000b" },
  { id: "v2-title", label: "Title Dominant", red: "#d00012", charcoal: "#030303", stroke: "#7a000b" },
  { id: "v2-performer", label: "Performer Dominant", red: "#d00012", charcoal: "#030303", stroke: "#7a000b" },
  { id: "v2-balanced", label: "Balanced", red: "#d00012", charcoal: "#030303", stroke: "#7a000b" },
];

export const DEFAULT_COVER_SETTINGS = {
  formatId: "landscape",
  customWidth: 1600,
  customHeight: 900,
  presetId: "v2-auto",
  variant: "auto",
  manualOverrides: {},
  zoom: 1,
  x: 0,
  y: 0,
  brightness: 102,
  contrast: 114,
  saturation: 106,
  titleSize: 190,
  subtitleSize: 92,
  performerSize: 68,
  titleY: 57,
  gradientStrength: 90,
  logoPosition: "adaptive",
  logoScale: 100,
  logoX: 0,
  logoY: 0,
  borderTexture: 42,
  safeMargin: 7,
  sellingPoints: "REAL MOMENTS\nRAW CHEMISTRY\nAMATEUR WINS",
  showSafeMargins: false,
};

export function getCoverDimensions(settings) {
  const format = COVER_FORMATS.find(item => item.id === settings.formatId) || COVER_FORMATS[0];
  if (format.id !== "custom") return { width: format.width, height: format.height, label: format.label };
  return { width: Math.max(320, Number(settings.customWidth) || 1600), height: Math.max(320, Number(settings.customHeight) || 900), label: "Custom" };
}

export async function blobToCanvasImage(blob) {
  if (window.createImageBitmap) return createImageBitmap(blob);
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = reject;
    image.src = url;
  });
}

export async function renderCoverToCanvas(canvas, frameBlob, metadata, settings) {
  const { width, height } = getCoverDimensions(settings);
  const image = frameBlob ? await blobToCanvasImage(frameBlob) : null;
  if (!image) throw new Error("A selected poster frame is required");
  if (document?.fonts?.load) {
    await Promise.all([
      document.fonts.load("900 210px Bebas Neue"),
      document.fonts.load("900 132px Permanent Marker"),
      document.fonts.load("900 72px Inter"),
    ]);
  }
  return await renderPosterToCanvas(canvas, image, metadata, settings, width, height);
}

export function canvasToBlob(canvas, type = "image/png", quality = 0.92) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Cover export failed")), type, quality));
}