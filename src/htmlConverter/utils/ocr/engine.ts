/**
 * Tesseract OCR engine wrapper
 */

import { BANNER_DICT } from "./postprocess/bannerSpell";
import { normalizeOcrLine } from "./postprocess/cleanup";

/**
 * OCR engine worker manager
 */
export class OcrEngine {
  private worker: any = null;
  private workerInit: Promise<any> | null = null;
  private progressCb: ((p: number) => void) | undefined;
  private passIndex = 0;
  private passCount = 1;
  private lastPsm: string | null = null;
  private lastWhitelist: string | null = null;

  private setProgress(p: number) {
    if (!this.progressCb) return;
    this.progressCb(Math.max(0, Math.min(1, p)));
  }

  /**
   * Initialize or get existing Tesseract worker
   */
  async getWorker(signal: AbortSignal): Promise<any> {
    if (this.worker) return this.worker;
    if (this.workerInit) return await this.workerInit;

    this.workerInit = (async () => {
      const mod: any = await import("tesseract.js");
      const createWorker: any = mod.createWorker || mod.default?.createWorker;
      const OEM: any = mod.OEM || mod.default?.OEM;
      if (typeof createWorker !== "function") {
        throw new Error("tesseract.js createWorker() not found");
      }

      const oem = OEM?.LSTM_ONLY ?? undefined;
      const w = await createWorker("eng", oem, {
        logger: (m: any) => {
          if (signal.aborted) return;
          if (m && typeof m.progress === "number") {
            const scaled = (this.passIndex + Math.max(0, Math.min(1, m.progress))) / Math.max(1, this.passCount);
            this.setProgress(scaled);
          }
        },
      });

      try {
        await w.setParameters({ preserve_interword_spaces: "1" });
      } catch {
        // ignore
      }

      if (signal.aborted) {
        try {
          await w.terminate();
        } catch {
          // ignore
        }
        throw new DOMException("Aborted", "AbortError");
      }

      this.worker = w;
      return w;
    })();

    return await this.workerInit;
  }

  /**
   * Set OCR parameters (PSM, whitelist) if changed
   */
  async setParameters(params: { psm?: string; whitelist?: string | null }): Promise<void> {
    if (!this.worker) return;

    if (params.psm !== undefined && params.psm !== this.lastPsm) {
      try {
        await this.worker.setParameters({ tessedit_pageseg_mode: params.psm });
        this.lastPsm = params.psm;
      } catch {
        // ignore
      }
    }

    if (params.whitelist !== undefined && params.whitelist !== this.lastWhitelist) {
      try {
        await this.worker.setParameters({ tessedit_char_whitelist: params.whitelist || "" });
        this.lastWhitelist = params.whitelist;
      } catch {
        // ignore
      }
    }
  }

  /**
   * Recognize text from canvas
   */
  async recognize(canvas: HTMLCanvasElement): Promise<any> {
    if (!this.worker) throw new Error("Worker not initialized");
    return await this.worker.recognize(canvas);
  }

  /**
   * Extract confident text from recognition result
   */
  extractConfidentText(r: any, opts: { useThreshold: boolean }): string {
    const rawText = String(r?.data?.text ?? "");
    const lines: any[] = Array.isArray(r?.data?.lines) ? r.data.lines : [];
    if (lines.length === 0) return rawText;

    // Be stricter on non-important lines to avoid garbage in "max" modes.
    const thrGeneral = opts.useThreshold ? 62 : 72;
    const thrImportant = opts.useThreshold ? 42 : 52;
    const picked: string[] = [];

    const dictHitsCount = (l: string) =>
      l
        .replace(/[^A-Za-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w.toUpperCase())
        .filter((w) => BANNER_DICT.has(w)).length;

    const isCtaLike = (l: string) => /\bclick\b/i.test(l) || /\blearn\b/i.test(l) || /\bsubscribe\b/i.test(l);
    const isYearLike = (l: string) => /\b(19|20)\d{2}\b/.test(l);

    for (const ln of lines) {
      const t = normalizeOcrLine(String(ln?.text ?? ""));
      if (!t) continue;
      const conf = Math.max(0, Math.min(100, Number(ln?.confidence ?? ln?.conf ?? 0)));
      const hits = dictHitsCount(t);
      const mustKeep = isCtaLike(t) || isYearLike(t) || /:$/.test(t) || hits >= 2;
      if (conf >= thrGeneral) {
        picked.push(t);
        continue;
      }
      if (mustKeep && conf >= thrImportant) {
        picked.push(t);
        continue;
      }
      // Allow unknown (zero-hit) short lines only if very high confidence.
      if (hits === 0 && t.split(/\s+/).length <= 2 && conf >= 85) {
        picked.push(t);
        continue;
      }
    }

    return picked.length > 0 ? picked.join("\n") : rawText;
  }

  /**
   * Set progress tracking
   */
  setProgressTracking(onProgress?: (p: number) => void, currentPass = 0, totalPasses = 1) {
    this.progressCb = onProgress;
    this.passIndex = currentPass;
    this.passCount = totalPasses;
  }

  /**
   * Dispose of the worker
   */
  async dispose(): Promise<void> {
    try {
      await this.worker?.terminate?.();
    } catch {
      // ignore
    }
    this.worker = null;
    this.workerInit = null;
    this.progressCb = undefined;
    this.passIndex = 0;
    this.passCount = 1;
    this.lastPsm = null;
    this.lastWhitelist = null;
  }
}

/**
 * Pick OCR parameters based on ROI characteristics
 */
export function pickOcrParamsForRoi(
  canvas: HTMLCanvasElement,
  baseWhitelist: string
): { psm: string; whitelist: string | null; isLine: boolean } {
  // If ROI is a wide, short band (CTA/button or title), PSM 7 (single line) often wins.
  // Also apply a conservative whitelist when user didn't set one:
  // banners often need only letters/numbers/spaces and this helps suppress junk glyphs.
  const ratio = canvas.height / Math.max(1, canvas.width);
  const isLine = ratio <= 0.18;
  const psm = isLine ? "7" : "11";
  const wl =
    baseWhitelist.trim().length > 0
      ? null
      : isLine
        ? "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 "
        : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:.'\"- ";
  return { psm, whitelist: wl, isLine };
}
