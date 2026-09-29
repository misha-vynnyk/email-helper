import { useCallback, useEffect, useState } from "react";

import { STORAGE_KEYS } from "@/utils/storageKeys";

import { getElectronAPI } from "./useElectronAPI";
import { useLocalStorage } from "./useLocalStorage";

export interface CloudflareCredentials {
  accountId: string;
  apiToken: string;
}

const EMPTY: CloudflareCredentials = { accountId: "", apiToken: "" };

/**
 * User's own Cloudflare Account ID + API Token for the "AI аналіз зображень"
 * Cloudflare provider. Storage backend depends on the platform:
 * - Electron: main-process safeStorage (OS keychain-backed encryption), via IPC.
 * - Browser/GitHub Pages: plain localStorage (same risk-acceptance precedent
 *   already used for the SMTP app-password in EmailSenderContext).
 * Empty credentials mean "use the public zero-config Worker instead" — see
 * src/htmlConverter/utils/ocr/cloudflareClient.ts.
 */
export function useCloudflareCredentials() {
  const electron = getElectronAPI();
  const [webCredentials, setWebCredentials] = useLocalStorage<CloudflareCredentials>(STORAGE_KEYS.CLOUDFLARE_CREDENTIALS, EMPTY);
  const [electronCredentials, setElectronCredentials] = useState<CloudflareCredentials>(EMPTY);
  const [loaded, setLoaded] = useState(!electron);

  useEffect(() => {
    if (!electron) return;
    let cancelled = false;
    electron.loadCloudflareCredentials().then((data) => {
      if (cancelled) return;
      setElectronCredentials(data || EMPTY);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [electron]);

  const credentials = electron ? electronCredentials : webCredentials;

  const setCredentials = useCallback(
    async (next: CloudflareCredentials): Promise<{ saved: boolean; error?: string }> => {
      if (electron) {
        setElectronCredentials(next);
        return (await electron.saveCloudflareCredentials(next)) ?? { saved: false, error: "Unknown error" };
      }
      setWebCredentials(next);
      return { saved: true };
    },
    [electron, setWebCredentials]
  );

  const clearCredentials = useCallback(() => {
    setCredentials(EMPTY);
    if (electron) void electron.clearCloudflareCredentials();
  }, [electron, setCredentials]);

  return {
    credentials,
    setCredentials,
    clearCredentials,
    loaded,
    hasOwnToken: Boolean(credentials.accountId && credentials.apiToken),
    isSecureStorage: Boolean(electron),
  };
}
