import type { OcrSkipReason } from "./imageAnalysis";

export type ImageAiAnalysisStatus = "idle" | "running" | "done" | "error";

export type ImageAiAnalysis = {
  status: ImageAiAnalysisStatus;
  progress?: number; // 0..1
  ocrText?: string;
  ocrTextRaw?: string;
  altSuggestions: string[];
  ctaSuggestions?: string[];
  nameSuggestions: string[];
  textLikelihood?: number;
  skippedReason?: OcrSkipReason;
  cacheHit?: boolean;
  error?: string;
};

