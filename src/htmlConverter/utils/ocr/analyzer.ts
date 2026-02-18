/**
 * OCR Analyzer - Public API and orchestration layer
 */

import type { ImageAnalysisSettings } from "../../types";
import { blobToCanvas, blobToCanvasFit, cropCanvasByFrac, estimateTextLikelihood, autoDetectRoiFracs } from "./roi/detect";
import { buildPasses, pickAttempts, preprocessForOcrV2 } from "./preprocess/pipeline";
import { cleanOcrText } from "./postprocess/cleanup";
// import { spellCorrectBannerText, postFixBannerText } from "./postprocess/bannerSpell"; // Unused - kept for potential future use
import { OcrEngine, pickOcrParamsForRoi } from "./engine";
import { processOcrOutput } from "./postprocess/processor";
import { AiBackendClient } from "./aiClient";

export type OcrSkipReason = "lowTextLikelihood";

export type OcrAnalyzeResult = {
  ocrText?: string;
  ocrTextRaw?: string;
  altSuggestions: string[];
  ctaSuggestions?: string[];
  nameSuggestions: string[];
  textLikelihood?: number;
  skippedReason?: OcrSkipReason;
  cacheHit?: boolean;
};

export type OcrAnalyzer = {
  analyzeFromUrl: (args: { url: string; settings: ImageAnalysisSettings; force?: boolean; signal: AbortSignal; onProgress?: (progress01: number) => void }) => Promise<OcrAnalyzeResult>;
  clearCache: () => void;
  dispose: () => Promise<void>;
};

export function normalizeCustomNameInput(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]/g, "").toLowerCase();
}

/**
 * Compute SHA-256 hash of a blob
 */
async function sha256Hex(blob: Blob): Promise<string> {
  // Performance optimization: Hash only the first 256KB + size/type for validation.
  // This avoids reading/hashing massive 10MB+ images entirely.
  const limit = 256 * 1024;
  const slice = blob.slice(0, limit);
  const buf = await slice.arrayBuffer();

  // Mix in size/type to distinguish files that share the same header but differ later.
  const metadata = new TextEncoder().encode(`|${blob.size}|${blob.type}`);
  const combined = new Uint8Array(buf.byteLength + metadata.byteLength);
  combined.set(new Uint8Array(buf), 0);
  combined.set(metadata, buf.byteLength);

  const digest = await crypto.subtle.digest("SHA-256", combined);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate cache key based on analysis settings
 */
function getAnalysisConfigKey(s: ImageAnalysisSettings): string {
  // bump when OCR pipeline changes to avoid stale cache hits
  const OCR_PIPELINE_VERSION = 17;
  return [
    `v${OCR_PIPELINE_VERSION}`,
    s.useAiBackend ? "ai1" : "ai0",
    s.ocrMinWidth ?? 0,
    s.ocrMaxWidth ?? 0,
    s.ocrScaleFactor ?? 1,
    s.ocrPsm ?? "11",
    s.preprocessSharpen ? "sh1" : "sh0",
    s.preprocessBlur ? `bl${s.preprocessBlurRadius ?? 1}` : "bl0",
    s.preprocessBrightness ?? 1,
    s.ocrWhitelist ?? "",
    s.spellCorrectionBanner ? "sc1" : "sc0",
    s.roiEnabled ? `roi:${s.roiPreset}:${s.roiX},${s.roiY},${s.roiW},${s.roiH}` : "roi0",
    s.smartPrecheck ? "sp1" : "sp0",
    s.textLikelihoodThreshold ?? 0,
    s.precheckEdgeThreshold ?? 0,
    s.preprocess ? "pp1" : "pp0",
    s.preprocessContrast ?? 1,
    s.preprocessUseThreshold ? "th1" : "th0",
    s.preprocessThreshold ?? 0,
  ].join("|");
}

/**
 * Compute quality score for OCR text output
 */
import { ALLOWED_SHORT_ALL_CAPS, COMMON_3_LETTER_WORDS } from "./constants";

/**
 * Compute quality score for OCR text output
 */
function qualityScore(text: string): number {
  const cleaned = cleanOcrText(text);
  if (!cleaned) return -999;
  const joined = cleaned.replace(/\n+/g, " ").trim();
  const tokens = joined.split(/\s+/).filter(Boolean);
  const alphaNum = (joined.match(/[a-zA-Z0-9]/g) || []).length;
  const letters = (joined.match(/[A-Za-z]/g) || []).length;
  const nonWord = (joined.match(/[^a-zA-Z0-9\s]/g) || []).length;
  const punctRatio = alphaNum > 0 ? nonWord / (alphaNum + nonWord) : 1;

  const isWordLikeToken = (token: string): boolean => {
    const core = token.replace(/[^A-Za-z0-9]/g, "");
    if (!core) return false;
    if (/^\d{4}$/.test(core)) return true;
    if (/^\d+$/.test(core)) return false;
    const up = core.toUpperCase();
    if (up.length >= 4) return true;
    if (up.length === 3) return COMMON_3_LETTER_WORDS.has(up);
    if (up.length === 2) return ALLOWED_SHORT_ALL_CAPS.has(up);
    return false;
  };

  const wordLike = tokens.filter(isWordLikeToken).length;
  const shortTok = tokens.filter((x) => x.replace(/[^A-Za-z0-9]/g, "").length <= 2).length;

  // Penalize repeated glyph noise like "RRRRR" / "=====" / etc.
  const repeatPenalty = /(.)\1{5,}/.test(joined) ? 40 : 0;

  // If we have lots of tokens but few letters, it's probably garbage.
  const sparsePenalty = tokens.length >= 10 && letters < 20 ? 35 : 0;

  // Prefer outputs with more word-like tokens; heavily penalize punctuation-heavy gibberish.
  return wordLike * 10 + Math.min(alphaNum, 250) * 0.15 + Math.min(tokens.length, 40) * 1.5 - shortTok * 2.5 - punctRatio * 80 - repeatPenalty - sparsePenalty;
}

/**
 * Create OCR analyzer instance
 */
export function createOcrAnalyzer(): OcrAnalyzer {
  const engine = new OcrEngine();

  const cache = new Map<string, { configKey: string } & OcrAnalyzeResult>();

  return {
    clearCache: () => cache.clear(),

    dispose: async () => {
      await engine.dispose();
      cache.clear();
    },

    analyzeFromUrl: async ({ url, settings, force = false, signal, onProgress }) => {
      // PHASE 1: Initialization & Fetching (0% - 10%)
      onProgress?.(0.05);

      try {
        const res = await fetch(url, { signal });
        const blob = await res.blob();
        onProgress?.(0.1); // Downloaded

        const configKey = getAnalysisConfigKey(settings);
        const hash = await sha256Hex(blob);
        const cached = cache.get(hash);
        if (cached && cached.configKey === configKey && !(force && cached.skippedReason)) {
          onProgress?.(1);
          return {
            ocrText: cached.ocrText,
            ocrTextRaw: cached.ocrTextRaw,
            altSuggestions: cached.altSuggestions,
            ctaSuggestions: cached.ctaSuggestions,
            nameSuggestions: cached.nameSuggestions,
            textLikelihood: cached.textLikelihood,
            skippedReason: cached.skippedReason,
            cacheHit: true,
          };
        }

        // 0. CHECK: AI Backend Mode
        if (settings.useAiBackend) {
          // Simulate smooth progress during AI analysis (0.15 → 0.85)
          let simulatedProgress = 0.15;
          const progressInterval = setInterval(() => {
            if (simulatedProgress < 0.85) {
              // Logarithmic curve: fast at start, slows down as it approaches 0.85
              simulatedProgress += (0.85 - simulatedProgress) * 0.08;
              onProgress?.(simulatedProgress);
            }
          }, 500);

          try {
            onProgress?.(0.1); // Connecting...
            const result = await AiBackendClient.analyzeImage(blob, "detailed");
            onProgress?.(1); // Done

            // Cache this result
            cache.set(hash, { configKey, ...result, cacheHit: true });

            return result;
          } catch (e) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            console.error("❌ AI Backend failed:", errorMsg);

            // Throw the error so UI can show it to user
            // Don't silently fallback - user explicitly chose AI mode
            throw new Error(`AI Backend error: ${errorMsg}`);
          } finally {
            clearInterval(progressInterval);
          }
        }

        // PHASE 2: ROI & Preprocessing (10% - 25%)
        onProgress?.(0.15);
      } finally {
        engine.setProgressTracking(undefined, 0, 1);
      }
    },
  };
}
