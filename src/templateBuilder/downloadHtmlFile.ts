import { toast } from "react-toastify";

import { STORAGE_KEYS } from "@/utils/storageKeys";
import { downloadOrSaveFile } from "@/utils/downloadOrSaveFile";

/** Thin wrapper over the shared downloadOrSaveFile (also used by useHtmlExport.ts's downloadFile)
 * — this module's own job is just persisting the download folder in localStorage and mapping
 * the outcome to a toast, matching this panel's existing UX. */
export async function downloadHtmlFile(html: string, filename: string): Promise<void> {
  const outcome = await downloadOrSaveFile(html, filename, {
    getFolder: () => localStorage.getItem(STORAGE_KEYS.TEMPLATE_BUILDER_DOWNLOAD_FOLDER) ?? undefined,
    onFolderResolved: (folder) => localStorage.setItem(STORAGE_KEYS.TEMPLATE_BUILDER_DOWNLOAD_FOLDER, folder),
  });

  if (outcome.kind === "saved") toast.success(`Saved: ${filename}`);
  else if (outcome.kind === "file-exists") toast.info(`Save canceled: ${filename} already exists`);
  else if (outcome.kind === "save-error") toast.error(`Save failed: ${outcome.error ?? "unknown error"}`);
}
