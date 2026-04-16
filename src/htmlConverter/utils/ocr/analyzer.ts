/**
 * OCR Analyzer - Public API and orchestration layer
 */

import type { ImageAnalysisSettings } from "../../types";
// import { cleanOcrText } from "./postprocess/cleanup"; // Was used by qualityScore, which has been removed
// import { spellCorrectBannerText, postFixBannerText } from "./postprocess/bannerSpell"; // Unused - kept for potential future use
import { OcrEngine } from "./engine";
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
  const OCR_PIPELINE_VERSION = 18;
  return [
    `v${OCR_PIPELINE_VERSION}`,
    s.useAiBackend ? `ai1-${s.aiProvider || "gemma3"}` : "ai0",
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

      // Helper: route external URLs through the server proxy to avoid browser CORS blocks
      const fetchImage = async (imageUrl: string): Promise<Blob> => {
        const isExternal = imageUrl.startsWith("http://") || imageUrl.startsWith("https://");
        const isSameOrigin = imageUrl.startsWith(window.location.origin) || imageUrl.includes("localhost") || imageUrl.includes("127.0.0.1");

        if (isExternal && !isSameOrigin) {
          // Proxy through our server to bypass CORS
          const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
          const res = await fetch(proxyUrl, { signal });
          if (!res.ok) throw new Error(`Proxy fetch failed: ${res.status} ${res.statusText}`);
          return res.blob();
        }
        // Same-origin or blob: fetch directly
        const res = await fetch(imageUrl, { signal });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
        return res.blob();
      };

      try {
        const blob = await fetchImage(url);
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
            const result = await AiBackendClient.analyzeImage(blob, settings.aiProvider || "gemma3");
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
        throw new Error("Classic OCR pipeline (Phase 2+) is not implemented in this build.");
      } finally {
        engine.setProgressTracking(undefined, 0, 1);
      }
    },
  };
}
