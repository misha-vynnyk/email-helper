import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,

  getAppVersion: (): Promise<string> =>
    ipcRenderer.invoke("app:getVersion"),

  openFolderDialog: (): Promise<string | null> =>
    ipcRenderer.invoke("dialog:openFolder"),

  openFileDialog: (filters?: { name: string; extensions: string[] }[]): Promise<string | null> =>
    ipcRenderer.invoke("dialog:openFile", filters),

  showNotification: (title: string, body: string): void =>
    ipcRenderer.send("notification:show", { title, body }),

  uploadFile: (req: { tempPath: string; provider: string; category: string; folderName: string }) =>
    ipcRenderer.invoke("upload:executeFile", req),
});
