interface ElectronAPI {
  isElectron: boolean;
  getAppVersion: () => Promise<string>;
  openFolderDialog: () => Promise<string | null>;
  openFileDialog: (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>;
  showNotification: (title: string, body: string) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export function useElectronAPI(): ElectronAPI | null {
  if (typeof window !== "undefined" && window.electronAPI?.isElectron) {
    return window.electronAPI;
  }
  return null;
}
