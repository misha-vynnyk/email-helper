import { CompressionMode, ImageFormat } from "../types";

export interface PresetProfile {
  id: string;
  name: string;
  description: string;
  format: ImageFormat;
  quality: number;
  maxWidth?: number;
  compressionMode: CompressionMode;
  preserveFormat?: boolean;
}

export const PRESETS: Record<string, PresetProfile> = {
  email: {
    id: "email",
    name: "Email",
    description: "Optimized for email attachments (small file size, 600px width)",
    format: "jpeg",
    quality: 80,
    maxWidth: 600,
    compressionMode: "balanced",
  },
  web: {
    id: "web",
    name: "Web",
    description: "Balanced quality for websites (WebP format, 1920px width)",
    format: "webp",
    quality: 85,
    maxWidth: 1920,
    compressionMode: "balanced",
  },
  print: {
    id: "print",
    name: "Print",
    description: "High quality for printing (minimal compression)",
    format: "png",
    quality: 95,
    compressionMode: "maximum-quality",
  },
  social: {
    id: "social",
    name: "Social Media",
    description: "Optimized for social media platforms (1200px width)",
    format: "jpeg",
    quality: 82,
    maxWidth: 1200,
    compressionMode: "balanced",
  },
  thumbnail: {
    id: "thumbnail",
    name: "Thumbnail",
    description: "Small thumbnails (WebP, 400px width)",
    format: "webp",
    quality: 75,
    maxWidth: 400,
    compressionMode: "maximum-compression",
  },
  lossless: {
    id: "lossless",
    name: "Lossless",
    description: "No quality loss (preserves original format)",
    format: "png",
    quality: 100,
    compressionMode: "lossless",
    preserveFormat: true,
  },
  gif: {
    id: "gif",
    name: "GIF Animation",
    description: "Optimized animated GIF with quality preservation",
    format: "gif",
    quality: 85,
    compressionMode: "balanced",
    preserveFormat: true,
  },
};

export const PRESET_ORDER = ["email", "web", "social", "print", "thumbnail", "gif", "lossless"];
