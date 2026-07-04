export interface ElectronUploadRequest {
  tempPath: string;
  provider: string;
  category: string;
  folderName: string;
}

export interface ElectronUploadResult {
  success: boolean;
  publicUrl?: string;
  filePath?: string;
  error?: string;
}

interface ElectronAPI {
  isElectron: boolean;
  serverPort: number;
  getAppVersion: () => Promise<string>;
  openFolderDialog: () => Promise<string | null>;
  openFileDialog: (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>;
  showNotification: (title: string, body: string) => void;
  uploadFile: (req: ElectronUploadRequest) => Promise<ElectronUploadResult>;
  saveToPath: (content: string, folderPath: string, fileName: string) => Promise<{ saved: boolean; filePath?: string; error?: string }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export function useElectronAPI(): ElectronAPI | null {
  // window.electronAPI is set synchronously by the preload before React mounts,
  // so a direct read is safe and stable — no useState needed.
  if (typeof window !== "undefined" && window.electronAPI?.isElectron) {
    return window.electronAPI;
  }
  return null;
}

// Non-hook helper for use outside React components
export const getElectronAPI = (): ElectronAPI | null =>
  typeof window !== "undefined" && window.electronAPI?.isElectron
    ? window.electronAPI
    : null;
