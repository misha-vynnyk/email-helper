export const MAX_FILE_SIZE_CLIENT = 10 * 1024 * 1024; // 10MB
export const MAX_FILE_SIZE_SERVER = 50 * 1024 * 1024; // 50MB
export const SUPPORTED_FORMATS = ["jpeg", "webp", "avif", "png", "gif"] as const;
export const DEFAULT_QUALITY = 90;
export const DEFAULT_BACKGROUND_COLOR = "#FFFFFF";
export const DEFAULT_PROCESSING_MODE = "server";
export const DEFAULT_COMPRESSION_MODE = "balanced";
export const DEFAULT_FORMAT = "jpeg";
export const DEFAULT_AUTO_CONVERT = true;
export const DEFAULT_PRESERVE_FORMAT = false; // Convert to specified format by default
export const DEFAULT_AUTO_QUALITY = false; // Manual quality by default
export const DEFAULT_PRESERVE_EXIF = false; // Don't preserve EXIF by default (privacy)

// GIF Optimization constants
export const DEFAULT_GIF_TARGET_SIZE = undefined;
export const GIF_MIN_LOSSY = 10;
export const GIF_MAX_LOSSY = 200;
export const GIF_TARGET_SIZE_TOLERANCE = 0.05; // 5%
export const GIF_MAX_OPTIMIZATION_ITERATIONS = 10;
