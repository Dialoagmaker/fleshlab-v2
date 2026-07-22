let installed = false;
let approvedHeroRenderSendDepth = 0;
const approvedHeroFrameUploadRequests = new Map();

const HERO_RENDER_CHANNEL = "approved_hero_frame_render";
const HERO_FRAME_UPLOAD_POLICY = {
  assetType: "HERO_FRAME",
  purpose: "HERO_RENDER",
  origin: "CreativeBrain",
  stage: "HeroPhotography"
};
const FORBIDDEN_HERO_RENDER_KEYS = [
  "video",
  "video_file",
  "video_blob",
  "video_data_url",
  "video_timeline",
  "timeline",
  "frames",
  "additional_frames",
  "frame_blobs",
  "browser_blob",
  "browser_analysis_data",
  "hidden_metadata",
  "local_media_blob"
];

function hasHeroFramePolicy(value) {
  if (!value || typeof value !== "object") return false;
  return value.assetType === HERO_FRAME_UPLOAD_POLICY.assetType &&
    value.purpose === HERO_FRAME_UPLOAD_POLICY.purpose &&
    value.origin === HERO_FRAME_UPLOAD_POLICY.origin &&
    value.stage === HERO_FRAME_UPLOAD_POLICY.stage;
}

function hasHeroFrameUploadMetadata(value) {
  if (!hasHeroFramePolicy(value)) return false;
  return typeof value.requestId === "string" && value.requestId.length >= 8 && value.consentGranted === true;
}

function metadataMatchesApproval(value, approval) {
  return approval && value.assetType === approval.assetType &&
    value.purpose === approval.purpose &&
    value.origin === approval.origin &&
    value.stage === approval.stage &&
    value.requestId === approval.requestId &&
    value.consentGranted === true;
}

function isApprovedHeroFrameUploadPayload(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (hasHeroFrameUploadMetadata(value)) {
    const approval = approvedHeroFrameUploadRequests.get(value.requestId);
    const mimeType = value.mimeType || value.mime_type || "";
    const dataUrl = value.fileDataUrl || value.file_data_url || "";
    return metadataMatchesApproval(value, approval) &&
      value.endpoint === "uploadApprovedHeroFrame" &&
      ["image/png", "image/jpeg", "image/webp"].includes(mimeType) &&
      /^data:image\/(png|jpeg|webp);base64,/i.test(dataUrl) &&
      !hasForbiddenHeroRenderKeys({ ...value, fileDataUrl: undefined, file_data_url: undefined });
  }
  return Object.values(value).some(entry => isApprovedHeroFrameUploadPayload(entry, seen));
}

function isApprovedHeroFrameAsset(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (hasHeroFramePolicy(value)) {
    const mimeType = value.type || value.mime_type || value.mimeType || "";
    return !mimeType || mimeType.startsWith("image/");
  }
  return Object.values(value).some(entry => isApprovedHeroFrameAsset(entry, seen));
}

function isBlockedPayload(value, seen = new WeakSet()) {
  if (!value) return false;
  if (typeof File !== "undefined" && value instanceof File) return true;
  if (typeof Blob !== "undefined" && value instanceof Blob) return true;
  if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) return true;
  if (ArrayBuffer.isView?.(value)) return true;
  if (typeof value === "string") return /^data:(video|image)\//i.test(value);
  if (typeof FormData !== "undefined" && value instanceof FormData) {
    for (const [, entry] of value.entries()) if (isBlockedPayload(entry, seen)) return true;
  }
  if (typeof value === "object") {
    if (seen.has(value)) return false;
    seen.add(value);
    return Object.values(value).some(entry => isBlockedPayload(entry, seen));
  }
  return false;
}

function block(kind, log) {
  const message = `Privacy guard blocked ${kind}: local media blobs must not be transmitted.`;
  log?.(message);
  throw new Error(message);
}

function hasForbiddenHeroRenderKeys(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  return Object.entries(value).some(([key, child]) => {
    const normalized = key.toLowerCase();
    if (FORBIDDEN_HERO_RENDER_KEYS.includes(normalized)) return true;
    return hasForbiddenHeroRenderKeys(child, seen);
  });
}

function parseJsonMaybe(value) {
  if (typeof value !== "string") return null;
  try { return JSON.parse(value); } catch (_) { return null; }
}

function isApprovedHeroRenderPayload(payload) {
  if (!payload || payload.action !== "generate" || payload.consent !== true) return false;
  const privacy = payload.privacy_guard || payload.privacyGuard || {};
  if (privacy.channel !== HERO_RENDER_CHANNEL) return false;
  if (privacy.user_approved_transmission !== true) return false;
  if (privacy.selected_hero_frame_only !== true) return false;
  const storyReference = payload.story_reference_data_url || payload.frame_data_url;
  const identityReference = payload.identity_reference_data_url;
  if (typeof storyReference !== "string" || !storyReference.startsWith("data:image/")) return false;
  if (identityReference && identityReference !== storyReference) return false;
  if (hasForbiddenHeroRenderKeys(payload)) return false;
  const { frame_data_url, story_reference_data_url, identity_reference_data_url, ...rest } = payload;
  return !isBlockedPayload(rest);
}

function isApprovedHeroRenderBody(body) {
  if (approvedHeroRenderSendDepth <= 0) return false;
  return isApprovedHeroRenderPayload(parseJsonMaybe(body));
}

function isApprovedHeroFrameUploadBody(body) {
  return isApprovedHeroFrameUploadPayload(parseJsonMaybe(body));
}

function isApprovedOpenRouterCoverInvoke(args) {
  const [functionName, payload] = args;
  return functionName === "openRouterAICover" && isApprovedHeroRenderPayload(payload);
}

function isApprovedHeroFrameUploadInvoke(args) {
  const [functionName, payload] = args;
  return functionName === "uploadApprovedHeroFrame" && isApprovedHeroFrameUploadPayload(payload);
}

function patchFunction(owner, key, label, log) {
  if (!owner?.[key] || owner[key].__localMediaGuarded) return;
  const original = owner[key].bind(owner);
  owner[key] = (...args) => {
    const approvedOpenRouterStill = key === "invoke" && isApprovedOpenRouterCoverInvoke(args);
    const approvedHeroFrameUpload = key === "invoke" && isApprovedHeroFrameUploadInvoke(args);
    if (!approvedOpenRouterStill && !approvedHeroFrameUpload && args.some(arg => isBlockedPayload(arg))) block(label, log);
    if (approvedHeroFrameUpload) {
      log?.("privacy guard allowed request-bound Hero Frame upload");
      return original(...args);
    }
    if (approvedOpenRouterStill) {
      log?.("privacy guard allowed one consent-approved Hero Frame for rendering");
      approvedHeroRenderSendDepth += 1;
      const result = original(...args);
      if (result && typeof result.finally === "function") {
        return result.finally(() => { approvedHeroRenderSendDepth = Math.max(0, approvedHeroRenderSendDepth - 1); });
      }
      approvedHeroRenderSendDepth = Math.max(0, approvedHeroRenderSendDepth - 1);
      return result;
    }
    return original(...args);
  };
  owner[key].__localMediaGuarded = true;
}

export function installLocalMediaPrivacyGuard(log, base44Client = null) {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    if (isBlockedPayload(input) || (!isApprovedHeroRenderBody(init?.body) && !isApprovedHeroFrameUploadBody(init?.body) && isBlockedPayload(init?.body))) block("fetch", log);
    return originalFetch(input, init);
  };

  const originalSend = window.XMLHttpRequest?.prototype?.send;
  if (originalSend) {
    window.XMLHttpRequest.prototype.send = function guardedSend(body) {
      if (!isApprovedHeroRenderBody(body) && !isApprovedHeroFrameUploadBody(body) && isBlockedPayload(body)) block("XMLHttpRequest", log);
      return originalSend.call(this, body);
    };
  }

  if (base44Client) {
    patchFunction(base44Client.integrations?.Core, "UploadFile", "Base44 UploadFile", log);
    patchFunction(base44Client.integrations?.Core, "UploadPrivateFile", "Base44 UploadPrivateFile", log);
    patchFunction(base44Client.functions, "invoke", "Base44 function payload", log);
  }

  window.__FLESHLAB_LOCAL_MEDIA_GUARD__ = {
    installed: true,
    mode: "Browser local",
    blocks: ["VIDEO assets", "FRAME assets", "unclassified File", "unclassified Blob", "ArrayBuffer", "base64 image/video", "FormData media entries", "nested media payloads"],
    asset_policy: HERO_FRAME_UPLOAD_POLICY,
    allow_with_consent: ["Selected Hero Frame through approved render channel only", "Single-use request-bound Hero Frame upload"],
    hero_render_channel: HERO_RENDER_CHANNEL,
  };
  log?.("Privacy guard installed");
}

export function registerApprovedHeroFrameUploadRequest(metadata) {
  if (!hasHeroFrameUploadMetadata(metadata)) throw new Error("Invalid Hero Frame upload approval metadata.");
  approvedHeroFrameUploadRequests.set(metadata.requestId, { ...metadata });
}

export function revokeApprovedHeroFrameUploadRequest(requestId) {
  approvedHeroFrameUploadRequests.delete(requestId);
}

export function getApprovedHeroFrameUploadRequestCount() {
  return approvedHeroFrameUploadRequests.size;
}

export function getPrivacyFacts(outputCount = 0) {
  return [
    ["Local file uploaded", "NO"],
    ["Library video fetched", "Only in Proof mode"],
    ["New video upload", "NO"],
    ["Hero Frame upload", "HERO_FRAME only for HeroPhotography"],
    ["Frames sent to external AI", "HERO_FRAME only after approved render request"],
    ["Local file processing", "Browser local"],
    ["Library proof processing", "Browser local after fetch"],
    ["Generated outputs", outputCount ? "Local Blob URLs" : "None yet"],
  ];
}