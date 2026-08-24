import { toast } from "react-toastify";

import { getElectronAPI } from "@/hooks/useElectronAPI";
import { STORAGE_KEYS } from "@/utils/storageKeys";

function downloadViaBrowser(html: string, filename: string): void {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Mirrors useHtmlExport.ts's downloadFile: in the packaged Electron desktop app, exports go
 * through a native save dialog instead of falling back to a browser-style anchor download. */
export async function downloadHtmlFile(html: string, filename: string): Promise<void> {
  const electronAPI = getElectronAPI();
  if (!electronAPI?.saveToPath) {
    downloadViaBrowser(html, filename);
    return;
  }

  let folder = localStorage.getItem(STORAGE_KEYS.TEMPLATE_BUILDER_DOWNLOAD_FOLDER) ?? "";
  if (!folder) {
    const picked = await electronAPI.openFolderDialog();
    if (!picked) return;
    folder = picked;
    localStorage.setItem(STORAGE_KEYS.TEMPLATE_BUILDER_DOWNLOAD_FOLDER, folder);
  }

  const result = await electronAPI.saveToPath(html, folder, filename);
  if (result.saved) toast.success(`Saved: ${filename}`);
  else if (result.canceled) toast.info(`Save canceled: ${filename} already exists`);
  else toast.error(`Save failed: ${result.error ?? "unknown error"}`);
}
