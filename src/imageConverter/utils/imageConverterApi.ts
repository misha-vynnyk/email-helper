import API_URL from "../../config/api";
import { ConversionSettings } from "../types";

export interface ServerConversionResponse {
  success: boolean;
  data?: string; // base64
  size?: number;
  error?: string;
}

/**
 * Convert image using server-side processing
 */
export async function convertImageServer(file: File, settings: ConversionSettings): Promise<Blob> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("format", settings.format);
  formData.append("quality", settings.quality.toString());
  formData.append("backgroundColor", settings.backgroundColor);
  formData.append("resizeMode", settings.resize.mode);
  formData.append("compressionMode", settings.compressionMode);

  if (settings.resize.mode === "preset" && settings.resize.preset) {
    formData.append("preset", settings.resize.preset.toString());
  } else if (settings.resize.mode === "custom") {
    if (settings.resize.width) formData.append("width", settings.resize.width.toString());
    if (settings.resize.height) formData.append("height", settings.resize.height.toString());
    formData.append("preserveAspectRatio", settings.resize.preserveAspectRatio.toString());
  }

  const response = await fetch(`${API_URL}/api/image-converter/convert`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Server conversion failed");
  }

  return await response.blob();
}

/**
 * Convert multiple images using server-side processing
 */
export async function convertImagesServerBatch(
  files: File[],
  settings: ConversionSettings
): Promise<Blob[]> {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  formData.append("format", settings.format);
  formData.append("quality", settings.quality.toString());
  formData.append("backgroundColor", settings.backgroundColor);
  formData.append("resizeMode", settings.resize.mode);
  formData.append("compressionMode", settings.compressionMode);

  if (settings.resize.mode === "preset" && settings.resize.preset) {
    formData.append("preset", settings.resize.preset.toString());
  } else if (settings.resize.mode === "custom") {
    if (settings.resize.width) formData.append("width", settings.resize.width.toString());
    if (settings.resize.height) formData.append("height", settings.resize.height.toString());
    formData.append("preserveAspectRatio", settings.resize.preserveAspectRatio.toString());
  }

  const response = await fetch(`${API_URL}/api/image-converter/convert-batch`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Batch conversion failed");
  }

  // Response will be a JSON array of base64 strings
  const data = await response.json();
  return data.map((base64: string) => base64ToBlob(base64));
}

/**
 * Convert base64 to Blob
 */
function base64ToBlob(base64: string): Blob {
  const [header, data] = base64.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";

  const bytes = atob(data);
  const buffer = new ArrayBuffer(bytes.length);
  const array = new Uint8Array(buffer);

  for (let i = 0; i < bytes.length; i++) {
    array[i] = bytes.charCodeAt(i);
  }

  return new Blob([buffer], { type: mime });
}
