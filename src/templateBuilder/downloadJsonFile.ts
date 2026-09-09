import { toast } from "react-toastify";

import { STORAGE_KEYS } from "@/utils/storageKeys";
import { downloadOrSaveFile } from "@/utils/downloadOrSaveFile";

/** Sibling of `downloadHtmlFile.ts`, same `downloadOrSaveFile` reuse and download-folder
 * persistence, just for the JSON Export button's output instead of the rendered HTML. */
export async function downloadJsonFile(json: string, filename: string): Promise<void> {
  const outcome = await downloadOrSaveFile(json, filename, {
    getFolder: () => localStorage.getItem(STORAGE_KEYS.TEMPLATE_BUILDER_DOWNLOAD_FOLDER) ?? undefined,
    onFolderResolved: (folder) => localStorage.setItem(STORAGE_KEYS.TEMPLATE_BUILDER_DOWNLOAD_FOLDER, folder),
    mimeType: "application/json",
  });

  if (outcome.kind === "saved") toast.success(`Saved: ${filename}`);
  else if (outcome.kind === "file-exists") toast.info(`Save canceled: ${filename} already exists`);
  else if (outcome.kind === "save-error") toast.error(`Save failed: ${outcome.error ?? "unknown error"}`);
}
