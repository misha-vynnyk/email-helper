import { contextBridge } from "electron";

// Expose a minimal API surface to the renderer.
// Extend this as more native capabilities are needed.
contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
});
