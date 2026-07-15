import { analyzeVisionFromImageData } from "./visionCore";

function createCanvasFromImage(image, targetWidth) {
  const aspect = image.width / image.height;
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = Math.max(1, Math.round(targetWidth / aspect));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

async function detectFace(canvas) {
  if (!window.FaceDetector) return { faceBox: null, supported: false };
  try {
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 4 });
    const faces = await detector.detect(canvas);
    const box = faces?.[0]?.boundingBox;
    if (!box) return { faceBox: null, supported: true };
    return {
      supported: true,
      faceBox: { x: box.x / canvas.width, y: box.y / canvas.height, w: box.width / canvas.width, h: box.height / canvas.height },
    };
  } catch (_) {
    return { faceBox: null, supported: true };
  }
}

export async function analyzeVisionLayer(image, options = {}) {
  const targetWidth = options.targetWidth || 360;
  const { canvas, ctx } = createCanvasFromImage(image, targetWidth);
  const face = await detectFace(canvas);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return analyzeVisionFromImageData(imageData, {
    source: options.source || "heuristic-vision-layer",
    faceBox: face.faceBox,
    faceDetectionSupported: face.supported,
  });
}

export { analyzeVisionFromImageData };