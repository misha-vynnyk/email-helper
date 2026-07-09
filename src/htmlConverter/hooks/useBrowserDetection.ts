import { useEffect, useState } from "react";

import { getApiBase, isApiAvailable } from "../../config/api";

export type BrowserDetectionStatus = "checking" | "found" | "not-found" | "skipped";

/**
 * Detects a usable Brave/Chromium executable for the Playwright upload path
 * via GET /api/storage-upload/browser-status. Only runs while `enabled`
 * (i.e. uploadMode === "playwright") since it's meaningless otherwise.
 */
export function useBrowserDetection(enabled: boolean): { status: BrowserDetectionStatus; path: string | null } {
  const [status, setStatus] = useState<BrowserDetectionStatus>("checking");
  const [detectedPath, setDetectedPath] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !isApiAvailable()) {
      setStatus("skipped");
      return;
    }

    let cancelled = false;
    setStatus("checking");

    fetch(`${getApiBase()}/api/storage-upload/browser-status`)
      .then((res) => (res.ok ? res.json() : { found: false, path: null }))
      .then((data: { found?: boolean; path?: string | null }) => {
        if (cancelled) return;
        if (data.found && data.path) {
          setDetectedPath(data.path);
          setStatus("found");
        } else {
          setDetectedPath(null);
          setStatus("not-found");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetectedPath(null);
          setStatus("not-found");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { status, path: detectedPath };
}
