import { useCallback, useEffect, useRef, useState } from "react";

import type { ImageAnalysisSettings } from "../types";
import { createOcrAnalyzer, type OcrAnalyzeResult, type OcrAnalyzer } from "./imageAnalysis";
import type { ImageAiAnalysis } from "./ocrUiTypes";

export type OcrFile = { id: string; name: string; path?: string };

export type AnalyzeFileOptions = {
  force?: boolean;
  cancelPrevious?: boolean;
};

export type UseOcrAnalysisArgs = {
  enabled: boolean;
  settings?: ImageAnalysisSettings;
  files: OcrFile[];
};

export type UseOcrAnalysisApi = {
  aiById: Record<string, ImageAiAnalysis>;
  analyzeFile: (file: OcrFile, opts?: AnalyzeFileOptions) => Promise<OcrAnalyzeResult | null>;
  reset: () => void;
  dispose: () => void;
};

export function useOcrAnalysis({ enabled, settings, files }: UseOcrAnalysisArgs): UseOcrAnalysisApi {
  const [aiById, setAiById] = useState<Record<string, ImageAiAnalysis>>({});
  const abortRef = useRef<AbortController | null>(null);
  const autoQueuedRef = useRef<Set<string>>(new Set());
  const analyzerRef = useRef<OcrAnalyzer | null>(null);

  const setAiState = useCallback((fileId: string, next: Partial<ImageAiAnalysis>) => {
    setAiById((prev) => {
      const base: ImageAiAnalysis =
        prev[fileId] || { status: "idle", altSuggestions: [], nameSuggestions: [] };
      return {
        ...prev,
        [fileId]: { ...base, ...next },
      };
    });
  }, []);

  const getAnalyzer = useCallback((): OcrAnalyzer => {
    if (!analyzerRef.current) {
      analyzerRef.current = createOcrAnalyzer();
    }
    return analyzerRef.current;
  }, []);

  const analyzeFile = useCallback(
    async (file: OcrFile, opts?: AnalyzeFileOptions): Promise<OcrAnalyzeResult | null> => {
      if (!enabled || !settings) return null;
      if (!file.path) {
        setAiState(file.id, { status: "error", error: "No preview URL for this file" });
        return null;
      }

      const force = Boolean(opts?.force);
      const cancelPrevious = opts?.cancelPrevious !== false;

      if (cancelPrevious) {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
      } else if (!abortRef.current) {
        abortRef.current = new AbortController();
      }

      const signal = abortRef.current!.signal;
      setAiState(file.id, { status: "running", progress: 0, error: undefined });

      try {
        const analyzer = getAnalyzer();
        const result = await analyzer.analyzeFromUrl({
          url: file.path,
          settings,
          force,
          signal,
          onProgress: (p) => {
            if (signal.aborted) return;
            setAiState(file.id, { progress: p });
          },
        });

        setAiState(file.id, {
          status: "done",
          progress: 1,
          ocrText: result.ocrText,
          ocrTextRaw: result.ocrTextRaw,
          altSuggestions: result.altSuggestions,
          ctaSuggestions: result.ctaSuggestions,
          nameSuggestions: result.nameSuggestions,
          textLikelihood: result.textLikelihood,
          skippedReason: result.skippedReason,
          cacheHit: result.cacheHit,
        });

        return result;
      } catch (err: any) {
        if (err?.name === "AbortError") {
          setAiState(file.id, { status: "idle", progress: undefined });
          return null;
        }
        setAiState(file.id, { status: "error", error: err instanceof Error ? err.message : "Analysis failed" });
        return null;
      }
    },
    [enabled, getAnalyzer, settings, setAiState]
  );

  useEffect(() => {
    if (!enabled || !settings) return;
    if (settings.runMode !== "auto") return;
    const max = settings.autoAnalyzeMaxFiles ?? 0;
    if (max <= 0) return;

    let alive = true;
    (async () => {
      const candidates = files
        .slice(0, max)
        .filter((f) => {
          const status = aiById[f.id]?.status;
          if (status === "done" || status === "running") return false;
          if (autoQueuedRef.current.has(f.id)) return false;
          return true;
        });

      for (const f of candidates) {
        if (!alive) return;
        autoQueuedRef.current.add(f.id);
        await analyzeFile(f, { cancelPrevious: false });
      }
    })();

    return () => {
      alive = false;
    };
  }, [aiById, analyzeFile, enabled, files, settings]);

  useEffect(() => {
    if (!enabled || !settings || settings.runMode !== "auto") {
      autoQueuedRef.current.clear();
    }
  }, [enabled, settings]);

  useEffect(() => {
    const currentIds = new Set(files.map((f) => f.id));
    for (const id of Array.from(autoQueuedRef.current)) {
      if (!currentIds.has(id)) {
        autoQueuedRef.current.delete(id);
      }
    }
  }, [files]);

  const reset = useCallback(() => {
    setAiById({});
    autoQueuedRef.current.clear();
    abortRef.current?.abort();
    abortRef.current = new AbortController();
  }, []);

  const dispose = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    autoQueuedRef.current.clear();
    setAiById({});
    void analyzerRef.current?.dispose();
    analyzerRef.current = null;
  }, []);

  return { aiById, analyzeFile, reset, dispose };
}
