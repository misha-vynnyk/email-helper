/**
 * OCR Analyzer - Public API and orchestration layer
 */

import type { ImageAnalysisSettings } from "../../types";
import { blobToCanvas, blobToCanvasFit, cropCanvasByFrac, estimateTextLikelihood, autoDetectRoiFracs } from "./roi/detect";
import { buildPasses, pickAttempts, preprocessForOcrV2 } from "./preprocess/pipeline";
import { cleanOcrText, buildCleanOcrSummary } from "./postprocess/cleanup";
import { spellCorrectBannerText, postFixBannerText, BANNER_DICT } from "./postprocess/bannerSpell";
import { filterOcrTextForUi, extractOcrSuggestions } from "./postprocess/uiFilter";
import { OcrEngine, pickOcrParamsForRoi } from "./engine";

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
  analyzeFromUrl: (args: {
    url: string;
    settings: ImageAnalysisSettings;
    force?: boolean;
    signal: AbortSignal;
    onProgress?: (progress01: number) => void;
  }) => Promise<OcrAnalyzeResult>;
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
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
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
function qualityScore(text: string): number {
  const cleaned = cleanOcrText(text);
  if (!cleaned) return -999;
  const joined = cleaned.replace(/\n+/g, " ").trim();
  const tokens = joined.split(/\s+/).filter(Boolean);
  const alphaNum = (joined.match(/[a-zA-Z0-9]/g) || []).length;
  const letters = (joined.match(/[A-Za-z]/g) || []).length;
  const nonWord = (joined.match(/[^a-zA-Z0-9\s]/g) || []).length;
  const punctRatio = alphaNum > 0 ? nonWord / (alphaNum + nonWord) : 1;

  const allowed2 = new Set([
    "AI", "AN", "AS", "AT", "BY", "DO", "GO", "IF", "IN", "IS", "IT", "MY",
    "NO", "OF", "OK", "ON", "OR", "TO", "UP", "US", "WE",
  ]);
  const common3 = new Set([
    "ALL", "AND", "ANY", "ARE", "BUT", "BUY", "CAN", "DID", "FOR", "GET", "HIS",
    "HER", "HOW", "NEW", "NOT", "NOW", "OUR", "OUT", "SEE", "THE", "TOP", "TRY",
    "USE", "WHY", "WIN", "YOU",
  ]);

  const isWordLikeToken = (token: string): boolean => {
    const core = token.replace(/[^A-Za-z0-9]/g, "");
    if (!core) return false;
    if (/^\d{4}$/.test(core)) return true;
    if (/^\d+$/.test(core)) return false;
    const up = core.toUpperCase();
    if (up.length >= 4) return true;
    if (up.length === 3) return common3.has(up);
    if (up.length === 2) return allowed2.has(up);
    return false;
  };

  const wordLike = tokens.filter(isWordLikeToken).length;
  const shortTok = tokens.filter((x) => x.replace(/[^A-Za-z0-9]/g, "").length <= 2).length;

  // Penalize repeated glyph noise like "RRRRR" / "=====" / etc.
  const repeatPenalty = /(.)\\1{5,}/.test(joined) ? 40 : 0;

  // If we have lots of tokens but few letters, it's probably garbage.
  const sparsePenalty = tokens.length >= 10 && letters < 20 ? 35 : 0;

  // Prefer outputs with more word-like tokens; heavily penalize punctuation-heavy gibberish.
  return (
    wordLike * 10 +
    Math.min(alphaNum, 250) * 0.15 +
    Math.min(tokens.length, 40) * 1.5 -
    shortTok * 2.5 -
    punctRatio * 80 -
    repeatPenalty -
    sparsePenalty
  );
}

/**
 * Create OCR analyzer instance
 */
export function createOcrAnalyzer(): OcrAnalyzer {
  const engine = new OcrEngine();

  const cache = new Map<
    string,
    {
      configKey: string;
      ocrText?: string;
      ocrTextRaw?: string;
      altSuggestions: string[];
      ctaSuggestions?: string[];
      nameSuggestions: string[];
      textLikelihood?: number;
      skippedReason?: OcrSkipReason;
    }
  >();

  return {
    clearCache: () => cache.clear(),

    dispose: async () => {
      await engine.dispose();
      cache.clear();
    },

    analyzeFromUrl: async ({ url, settings, force = false, signal, onProgress }) => {
      engine.setProgressTracking(onProgress, 0, 1);

      try {
        const res = await fetch(url, { signal });
        const blob = await res.blob();

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

        // Smart precheck
        let textLikelihood: number | undefined;
        if (settings.smartPrecheck && !force) {
          try {
            // For AUTO ROI we precheck on the full downscaled image to avoid false skips
            // when text is distributed across multiple zones (top title + CTA button, etc).
            let small = await blobToCanvas(blob, 256);
            if (settings.roiEnabled && settings.roiPreset !== "full" && settings.roiPreset !== "auto") {
              small = cropCanvasByFrac(small, settings.roiX, settings.roiY, settings.roiW, settings.roiH);
            }
            textLikelihood = estimateTextLikelihood(small, settings.precheckEdgeThreshold ?? 70);
            const thr = settings.textLikelihoodThreshold ?? 0.075;
            if (textLikelihood < thr) {
              const skipped: OcrAnalyzeResult = {
                altSuggestions: [],
                ctaSuggestions: [],
                nameSuggestions: [],
                textLikelihood,
                skippedReason: "lowTextLikelihood",
                cacheHit: false,
              };
              cache.set(hash, { configKey, ...skipped });
              onProgress?.(1);
              return skipped;
            }
          } catch {
            // ignore and proceed
          }
        }

        const scaleFactor = Math.max(1, Math.min(3, Math.round(settings.ocrScaleFactor ?? 1)));
        const minW0 = Math.max(0, settings.ocrMinWidth ?? 0);
        const maxW0 = Math.max(200, settings.ocrMaxWidth ?? 1200);
        const hardCap = 3200;
        const minW = Math.min(hardCap, Math.round(minW0 * scaleFactor));
        const maxW = Math.min(hardCap, Math.round(maxW0 * scaleFactor));
        const fullCanvas = await blobToCanvasFit(blob, { minWidth: minW, maxWidth: maxW });

        const makeSmallForRoi = (src: HTMLCanvasElement): HTMLCanvasElement => {
          const maxSmall = 320;
          const scale = src.width > maxSmall ? maxSmall / src.width : 1;
          if (scale === 1) return src;
          const c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(src.width * scale));
          c.height = Math.max(1, Math.round(src.height * scale));
          const ctx = c.getContext("2d");
          if (!ctx) return src;
          ctx.imageSmoothingEnabled = true;
          (ctx as any).imageSmoothingQuality = "high";
          ctx.drawImage(src, 0, 0, c.width, c.height);
          return c;
        };

        const roiFracs: Array<{ x: number; y: number; w: number; h: number }> = (() => {
          if (!settings.roiEnabled || settings.roiPreset === "full") return [{ x: 0, y: 0, w: 1, h: 1 }];
          if (settings.roiPreset === "auto") {
            const small = makeSmallForRoi(fullCanvas);
            const rois = autoDetectRoiFracs(small, settings.precheckEdgeThreshold ?? 70, 3);

            // Extra "universal" candidates for distributed banner text:
            // top title band + bottom CTA band (only if they look "texty").
            const addIfTexty = (cand: { x: number; y: number; w: number; h: number }) => {
              const c = cropCanvasByFrac(small, cand.x, cand.y, cand.w, cand.h);
              const tl = estimateTextLikelihood(c, settings.precheckEdgeThreshold ?? 70);
              if (tl < 0.035) return; // cheap cut
              const iou = (a: typeof cand, b: typeof cand) => {
                const ax2 = a.x + a.w;
                const ay2 = a.y + a.h;
                const bx2 = b.x + b.w;
                const by2 = b.y + b.h;
                const ix = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x));
                const iy = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y));
                const inter = ix * iy;
                const ua = a.w * a.h + b.w * b.h - inter;
                return ua <= 0 ? 0 : inter / ua;
              };
              if (rois.some((r) => iou(r, cand) > 0.75)) return;
              rois.push(cand);
            };

            addIfTexty({ x: 0, y: 0, w: 1, h: 0.30 }); // title area
            addIfTexty({ x: 0, y: 0.66, w: 1, h: 0.34 }); // CTA / footer

            // If still empty, fall back to full.
            return rois.length > 0 ? rois.slice(0, 4) : [{ x: 0, y: 0, w: 1, h: 1 }];
          }
          return [{ x: settings.roiX, y: settings.roiY, w: settings.roiW, h: settings.roiH }];
        })();

        const baseCanvases: HTMLCanvasElement[] = roiFracs.map((r) => {
          if (r.x <= 0.001 && r.y <= 0.001 && r.w >= 0.999 && r.h >= 0.999) return fullCanvas;
          return cropCanvasByFrac(fullCanvas, r.x, r.y, r.w, r.h);
        });

        const contrast = settings.preprocessContrast ?? 1.8;
        const brightness = settings.preprocessBrightness ?? 1.1;
        const usePreprocess = Boolean(settings.preprocess);
        const useThreshold = Boolean(settings.preprocessUseThreshold);
        const fixedThr = settings.preprocessThreshold ?? 160;
        const sharpen = Boolean(settings.preprocessSharpen);
        const blur = Boolean(settings.preprocessBlur);
        const blurRadius = settings.preprocessBlurRadius ?? 1;

        const worker = await engine.getWorker(signal);

        // Apply base OCR parameters
        const basePsm = String(settings.ocrPsm ?? "11");
        const whitelist = String(settings.ocrWhitelist ?? "");
        await engine.setParameters({ psm: basePsm, whitelist });

        const roiParams = baseCanvases.map((c) => pickOcrParamsForRoi(c, whitelist));

        const roiAttempts: Array<{
          roiIdx: number;
          attemptId: string;
          canvas: HTMLCanvasElement;
          psm: string;
          whitelist: string | null;
        }> = [];

        for (let i = 0; i < baseCanvases.length; i++) {
          const base = baseCanvases[i];
          const passes = buildPasses(base, {
            usePreprocess,
            contrast,
            brightness,
            useThreshold,
            fixedThr,
            sharpen,
            blur,
            blurRadius,
          });
          const params = roiParams[i] || { psm: basePsm, whitelist: null, isLine: false };
          const attempts = pickAttempts(passes, {
            isLine: Boolean(params.isLine),
            aggressive: Boolean(settings.preprocessUseThreshold),
          });
          const { psm, whitelist: wl } = params;
          for (const a of attempts) {
            roiAttempts.push({ roiIdx: i, attemptId: a.id, canvas: a.canvas, psm, whitelist: wl });
          }
        }

        engine.setProgressTracking(onProgress, 0, roiAttempts.length);
        let globalAttempt = 0;
        const scoredByRoi: Array<Array<{ id: string; text: string; confidence: number; score: number }>> = baseCanvases.map(() => []);

        for (const a of roiAttempts) {
          if (signal.aborted) throw new DOMException("Aborted", "AbortError");
          engine.setProgressTracking(onProgress, globalAttempt, roiAttempts.length);
          globalAttempt++;

          await engine.setParameters({ psm: a.psm, whitelist: a.whitelist });

          const r = await engine.recognize(a.canvas);
          const t = engine.extractConfidentText(r, { useThreshold });
          const conf = Number(r?.data?.confidence ?? 0);
          const score = conf * 1.4 + qualityScore(t);
          const id = `roi${a.roiIdx}:${a.attemptId}`;
          scoredByRoi[a.roiIdx].push({ id, text: t, confidence: conf, score });
        }

        const normalizeTextForMerge = (t: string) => {
          const cleaned = cleanOcrText(t);
          const corrected = settings.spellCorrectionBanner ? spellCorrectBannerText(cleaned) : cleaned;
          return postFixBannerText(corrected);
        };

        // Merge in a stable visual order: sort ROIs top->bottom, keep line order within each ROI.
        const roiOrder = roiFracs
          .map((r, idx) => ({ idx, y: r.y, h: r.h }))
          .sort((a, b) => a.y - b.y || b.h - a.h)
          .map((x) => x.idx);

        const mergedTextParts: string[] = [];
        const seenLine = new Set<string>();
        const dictHitsCount = (l: string) =>
          l
            .replace(/[^A-Za-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter(Boolean)
            .map((w) => w.toUpperCase())
            .filter((w) => BANNER_DICT.has(w)).length;
        const isCtaLike = (l: string) => /\bclick\b/i.test(l) || /\blearn\b/i.test(l) || /\bsubscribe\b/i.test(l);
        const isYearLike = (l: string) => /\b(19|20)\d{2}\b/.test(l);
        const isAllCapsLike = (text: string): boolean => {
          const letters = text.replace(/[^a-zA-Z]/g, "");
          if (letters.length < 4) return false;
          const upper = letters.replace(/[^A-Z]/g, "").length;
          return upper / letters.length >= 0.85;
        };

        const pushLinesFromText = (t: string, opts: { onlyImportant?: boolean }) => {
          const normalized = normalizeTextForMerge(t);
          const lines = cleanOcrText(normalized).split("\n").map((l) => l.trim()).filter(Boolean);
          for (const l of lines) {
            const key = l.toLowerCase();
            if (seenLine.has(key)) continue;
            if (opts.onlyImportant) {
              const important =
                isCtaLike(l) ||
                isYearLike(l) ||
                /:$/.test(l) ||
                (l.split(/\s+/).length === 1 &&
                  BANNER_DICT.has(l.replace(/[^A-Za-z]/g, "").toUpperCase())) ||
                (isAllCapsLike(l) && l.split(/\s+/).length <= 5 && dictHitsCount(l) >= 1) ||
                ((/["""]/.test(l) || /\.\.\./.test(l)) && l.split(/\s+/).length >= 2);
              if (!important) continue;
            }
            seenLine.add(key);
            mergedTextParts.push(l);
          }
        };

        for (const roiIdx of roiOrder) {
          const list = scoredByRoi[roiIdx] || [];
          list.sort((a, b) => b.score - a.score);
          if (list[0]) pushLinesFromText(list[0].text, { onlyImportant: false });
          if (list[1]) pushLinesFromText(list[1].text, { onlyImportant: true });
        }

        const mergedText = mergedTextParts.join("\n");
        const cleaned0 = cleanOcrText(mergedText);
        const corrected = settings.spellCorrectionBanner ? spellCorrectBannerText(cleaned0) : cleaned0;
        const fixed = postFixBannerText(corrected);
        const summary = buildCleanOcrSummary(fixed);
        const uiText = filterOcrTextForUi(fixed);
        const { altSuggestions, ctaSuggestions, nameSuggestions } = extractOcrSuggestions(uiText || fixed);

        // Universal fallback: if ROI is enabled (esp. auto) but we got almost nothing, try full image once.
        const textAmount = ((uiText || fixed).match(/[A-Za-z0-9]/g) || []).length;
        if (settings.roiEnabled && settings.roiPreset === "auto" && textAmount < 12 && !signal.aborted) {
          const fullBase = fullCanvas;
          const retryPasses: Array<{ id: string; canvas: HTMLCanvasElement }> = [];
          if (!usePreprocess) retryPasses.push({ id: "full-raw", canvas: fullBase });
          else {
            retryPasses.push({
              id: "full-hard-otsu",
              canvas: preprocessForOcrV2(fullBase, {
                grayscaleMode: "max",
                contrast,
                brightness,
                useThreshold: true,
                threshold: Math.max(0, fixedThr),
                sharpen,
                blur,
                blurRadius,
              }),
            });
          }
          const r2 = await engine.recognize(retryPasses[0].canvas);
          const t2 = String(r2?.data?.text ?? "");
          const c2_0 = cleanOcrText(t2);
          const c2_corr = settings.spellCorrectionBanner ? spellCorrectBannerText(c2_0) : c2_0;
          const c2_fixed = postFixBannerText(c2_corr);
          const c2_ui = filterOcrTextForUi(c2_fixed);
          const c2 = c2_ui || c2_fixed;
          if ((c2.match(/[A-Za-z0-9]/g) || []).length > textAmount) {
            const sug2 = extractOcrSuggestions(c2);
            // replace with better full-image result
            onProgress?.(1);
            const out2: OcrAnalyzeResult = {
              ocrText: c2,
              ocrTextRaw: c2_corr,
              altSuggestions: sug2.altSuggestions,
              ctaSuggestions: sug2.ctaSuggestions,
              nameSuggestions: sug2.nameSuggestions,
              textLikelihood,
              skippedReason: undefined,
              cacheHit: false,
            };
            cache.set(hash, {
              configKey,
              ocrText: c2,
              ocrTextRaw: c2_corr,
              altSuggestions: sug2.altSuggestions,
              ctaSuggestions: sug2.ctaSuggestions,
              nameSuggestions: sug2.nameSuggestions,
              textLikelihood,
            });
            return out2;
          }
        }

        const out: OcrAnalyzeResult = {
          ocrText: summary || uiText || fixed,
          ocrTextRaw: corrected,
          altSuggestions,
          ctaSuggestions,
          nameSuggestions,
          textLikelihood,
          skippedReason: undefined,
          cacheHit: false,
        };

        cache.set(hash, {
          configKey,
          ocrText: summary || uiText || fixed,
          ocrTextRaw: corrected,
          altSuggestions,
          ctaSuggestions,
          nameSuggestions,
          textLikelihood,
        });

        onProgress?.(1);
        return out;
      } finally {
        engine.setProgressTracking(undefined, 0, 1);
      }
    },
  };
}
