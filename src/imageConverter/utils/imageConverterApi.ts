import API_URL, { isApiAvailable } from "../../config/api";
import { ConversionSettings, ImageFormat } from "../types";
import { detectImageFormat } from "./imageFormatDetector";

/**
 * Get format to use for conversion (original or specified)
 */
function getConversionFormat(file: File, settings: ConversionSettings): ImageFormat {
  if (settings.preserveFormat) {
    return detectImageFormat(file);
  }
  return settings.format;
}

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

  // Get format to use (original or specified)
  const outputFormat = getConversionFormat(file, settings);
  formData.append("format", outputFormat);

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

  // GIF-specific parameters
  if (settings.targetFileSize) {
    formData.append("targetFileSize", settings.targetFileSize.toString());
  }

  if (settings.gifFrameResize) {
    formData.append("gifFrameResize", JSON.stringify(settings.gifFrameResize));
  }

  if (!isApiAvailable()) {
    throw new Error("Backend server is not available. Please configure VITE_API_URL environment variable.");
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

