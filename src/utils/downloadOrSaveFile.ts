import { getElectronAPI } from "@/hooks/useElectronAPI";

export type DownloadOrSaveOutcome =
  | { kind: "browser-download" }
  | { kind: "folder-pick-canceled" }
  | { kind: "saved" }
  | { kind: "file-exists" }
  | { kind: "save-error"; error: string | undefined };

interface DownloadOrSaveOptions {
  /** Reads the caller's own persisted download folder (React state, localStorage, ...) — may
   * return a falsy value to trigger the folder-picker dialog. */
  getFolder: () => string | undefined;
  /** Called once a folder was picked via the dialog, so the caller can persist it for next time. */
  onFolderResolved?: (folder: string) => void;
  /** Blob MIME type for the browser-download fallback only — the Electron `saveToPath` path below
   * doesn't take one, it writes raw content by filename extension. Defaults to `"text/html"`,
   * this module's original (and still most common) caller. */
  mimeType?: string;
}

function downloadViaBrowserAnchor(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * In the packaged Electron desktop app, saves through a native folder-picker + `saveToPath`
 * instead of a browser-style anchor download. Callers own their own folder persistence (some use
 * React state, some use localStorage) and their own outcome→user-feedback mapping (toast, log
 * line, ...) — this only does the actual save/download and reports what happened.
 */
export async function downloadOrSaveFile(content: string, filename: string, { getFolder, onFolderResolved, mimeType = "text/html" }: DownloadOrSaveOptions): Promise<DownloadOrSaveOutcome> {
  const electronAPI = getElectronAPI();
  if (!electronAPI?.saveToPath) {
    downloadViaBrowserAnchor(content, filename, mimeType);
    return { kind: "browser-download" };
  }

  let folder = getFolder();
  if (!folder) {
    const picked = await electronAPI.openFolderDialog();
    if (!picked) return { kind: "folder-pick-canceled" };
    folder = picked;
    onFolderResolved?.(folder);
  }

  const result = await electronAPI.saveToPath(content, folder, filename);
  if (result.saved) return { kind: "saved" };
  if (result.canceled) return { kind: "file-exists" };
  // No fallback text for a missing result.error here — that's locale-specific UI copy, left to
  // each caller (this module has no single language to default to).
  return { kind: "save-error", error: result.error };
}
