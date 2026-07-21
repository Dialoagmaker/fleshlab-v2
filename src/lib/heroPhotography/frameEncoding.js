export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) reject(new Error("Selected Source Frame is missing."));
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Selected Source Frame could not be encoded."));
    reader.readAsDataURL(file);
  });
}

export function readImageResolution(dataUrl) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({ width: null, height: null });
    image.src = dataUrl;
  });
}