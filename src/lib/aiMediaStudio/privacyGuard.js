let installed = false;

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

function isApprovedOpenRouterCoverInvoke(args) {
  const [functionName, payload] = args;
  if (functionName !== "openRouterAICover") return false;
  if (payload?.action !== "generate" || payload?.consent !== true) return false;
  const storyReference = payload.story_reference_data_url || payload.frame_data_url;
  const identityReference = payload.identity_reference_data_url;
  if (typeof storyReference !== "string" || !storyReference.startsWith("data:image/")) return false;
  if (identityReference && (typeof identityReference !== "string" || !identityReference.startsWith("data:image/"))) return false;
  const { frame_data_url, story_reference_data_url, identity_reference_data_url, ...rest } = payload;
  return !isBlockedPayload(rest);
}

function patchFunction(owner, key, label, log) {
  if (!owner?.[key] || owner[key].__localMediaGuarded) return;
  const original = owner[key].bind(owner);
  owner[key] = (...args) => {
    const approvedOpenRouterStill = key === "invoke" && isApprovedOpenRouterCoverInvoke(args);
    if (!approvedOpenRouterStill && args.some(arg => isBlockedPayload(arg))) block(label, log);
    if (approvedOpenRouterStill) log?.("privacy guard allowed one approved still image for OpenRouter cover generation");
    return original(...args);
  };
  owner[key].__localMediaGuarded = true;
}

export function installLocalMediaPrivacyGuard(log, base44Client = null) {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    if (isBlockedPayload(input) || isBlockedPayload(init?.body)) block("fetch", log);
    return originalFetch(input, init);
  };

  const originalSend = window.XMLHttpRequest?.prototype?.send;
  if (originalSend) {
    window.XMLHttpRequest.prototype.send = function guardedSend(body) {
      if (isBlockedPayload(body)) block("XMLHttpRequest", log);
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
    blocks: ["File", "Blob", "ArrayBuffer", "base64 image/video", "FormData media entries", "nested media payloads"],
  };
  log?.("Privacy guard installed");
}

export function getPrivacyFacts(outputCount = 0) {
  return [
    ["Local file uploaded", "NO"],
    ["Library video fetched", "Only in Proof mode"],
    ["New upload", "NO"],
    ["Frames sent to external AI", "NO"],
    ["Local file processing", "Browser local"],
    ["Library proof processing", "Browser local after fetch"],
    ["Generated outputs", outputCount ? "Local Blob URLs" : "None yet"],
  ];
}