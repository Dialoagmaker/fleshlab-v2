const SCORE_KEYS = [
  "Visual Appeal", "Thumbnail Score", "Trailer Score", "Instagram Score",
  "xHamster Score", "Clip4Sale Score", "LoyalFans Score", "Story Score",
  "Preview Score", "Commercial Value", "Sharpness", "Lighting Quality",
  "Camera Stability", "Portrait Suitability", "Landscape Suitability", "Loop Suitability"
];

const OUTPUTS = [
  "10 second trailer", "15 second trailer", "30 second trailer", "60 second trailer", "90 second trailer",
  "Top 25 screenshots", "Top 10 thumbnail candidates", "Animated GIF previews", "Vertical Shorts",
  "Horizontal Trailer", "Social Story", "Cover candidates"
];

function hashText(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) - hash) + text.charCodeAt(i);
  return Math.abs(hash);
}

function score(seed, offset) {
  return 52 + ((seed + offset * 37) % 47);
}

function sceneLabel(index) {
  const labels = ["Opening", "Face close-up", "Movement", "Environment", "Hero shot", "Detail shot", "Finale"];
  return labels[index % labels.length];
}

export function createLocalAnalysis(file, metadata = {}) {
  const seed = hashText(`${file.name}-${file.size}-${metadata.duration || 0}`);
  const duration = Math.max(1, Math.round(metadata.duration || 0));
  const sceneCount = Math.min(18, Math.max(3, Math.ceil(duration / 45)));
  const scenes = Array.from({ length: sceneCount }, (_, index) => {
    const start = Math.round((duration / sceneCount) * index);
    const end = Math.round((duration / sceneCount) * (index + 1));
    const scores = Object.fromEntries(SCORE_KEYS.map((key, scoreIndex) => [key, score(seed, index + scoreIndex)]));
    return { id: `${file.name}-${index}`, label: sceneLabel(index), start, end, scores };
  });
  const bestScene = scenes.reduce((best, scene) => scene.scores["Commercial Value"] > best.scores["Commercial Value"] ? scene : best, scenes[0]);
  return {
    fileName: file.name,
    fileSize: file.size,
    duration,
    resolution: metadata.width && metadata.height ? `${metadata.width} × ${metadata.height}` : "Pending local decode",
    frameEstimate: metadata.duration ? Math.round(metadata.duration * 30) : "Pending",
    status: "ready_for_local_engine",
    engine: "Browser-local metadata pass; model adapters not connected",
    confidence: Math.round((bestScene.scores["Commercial Value"] + bestScene.scores["Visual Appeal"]) / 2),
    scenes,
    outputs: OUTPUTS,
    marketing: {
      title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " "),
      subtitle: "Offline AI media analysis draft",
      description: "Generated locally from file metadata. Final copy is produced by the local metadata generator adapter when connected.",
      tags: ["fleshlab", "offline", "ai-media-studio", "local-analysis"],
      categories: ["Studio", "Marketing", "Preview"]
    }
  };
}

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0)} ${units[index]}`;
}