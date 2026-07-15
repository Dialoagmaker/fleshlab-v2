let installed = false;

function isBlockedPayload(value) {
  if (!value) return false;
  if (typeof File !== "undefined" && value instanceof File) return true;
  if (typeof Blob !== "undefined" && value instanceof Blob) return true;
  if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) return true;
  if (ArrayBuffer.isView?.(value)) return true;
  if (typeof value === "string") return /^data:(video|image)\//i.test(value);
  if (typeof FormData !== "undefined" && value instanceof FormData) {
    for (const [, entry] of value.entries()) if (isBlockedPayload(entry)) return true;
  }
  return false;
}

function block(kind, log) {
  const message = `Privacy guard blocked ${kind}: local media blobs must not be transmitted.`;
  log?.(message);
  throw new Error(message);
}

export function installLocalMediaPrivacyGuard(log) {
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

  window.__FLESHLAB_LOCAL_MEDIA_GUARD__ = {
    installed: true,
    mode: "Browser local",
    blocks: ["File", "Blob", "ArrayBuffer", "base64 image/video", "FormData media entries"],
  };
  log?.("Privacy guard installed");
}

export function getPrivacyFacts(outputCount = 0) {
  return [
    ["Video uploaded", "NO"],
    ["Video Blob transmitted", "NO"],
    ["Frames transmitted", "NO"],
    ["External AI API used", "NO"],
    ["Remote storage used", "NO"],
    ["Processing mode", "Browser local"],
    ["Generated outputs", outputCount ? "Local Blob URLs" : "None yet"],
  ];
}