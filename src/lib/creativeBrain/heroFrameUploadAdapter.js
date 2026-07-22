import { base44 } from "@/api/base44Client";
import { registerApprovedHeroFrameUploadRequest, revokeApprovedHeroFrameUploadRequest } from "@/lib/aiMediaStudio/privacyGuard";

const HERO_FRAME_POLICY = {
  assetType: "HERO_FRAME",
  purpose: "HERO_RENDER",
  origin: "CreativeBrain",
  stage: "HeroPhotography"
};

function createRequestId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `hero-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Hero Frame could not be prepared for upload."));
    reader.readAsDataURL(file);
  });
}

export async function uploadApprovedHeroFrame(file, { consentGranted = false } = {}) {
  if (!consentGranted) throw new Error("Hero Frame upload requires explicit consent.");
  if (!file?.type?.startsWith("image/")) throw new Error("Only a selected image Hero Frame can be uploaded.");

  const requestId = createRequestId();
  const approval = { ...HERO_FRAME_POLICY, requestId, consentGranted: true };
  registerApprovedHeroFrameUploadRequest(approval);

  try {
    const fileDataUrl = await fileToDataUrl(file);
    const response = await base44.functions.invoke("uploadApprovedHeroFrame", {
      endpoint: "uploadApprovedHeroFrame",
      ...approval,
      fileName: file.name || "hero-frame",
      mimeType: file.type,
      fileSize: file.size,
      fileDataUrl
    });
    return response.data;
  } finally {
    revokeApprovedHeroFrameUploadRequest(requestId);
  }
}