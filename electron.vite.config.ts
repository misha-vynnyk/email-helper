import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "electron-vite";

// Electron 42 ships Node 22 in the main/preload processes
const ELECTRON_NODE_TARGET = "node22";

export default defineConfig({
  main: {
    build: {
      outDir: "dist-electron/main",
      // Keep server/ and automation/ as runtime requires — do not bundle them
      target: ELECTRON_NODE_TARGET,
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, "electron/main.ts"),
        },
        external: [
          "electron",
          /^node:/,
          // server and automation are loaded at runtime via path.join(__dirname, ...)
          // No static externals needed for them; the dynamic require() handles it.
        ],
        output: {
          format: "cjs",
          entryFileNames: "[name].js",
        },
      },
    },
  },
  preload: {
    build: {
      outDir: "dist-electron/preload",
      target: ELECTRON_NODE_TARGET,
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, "electron/preload.ts"),
        },
        external: ["electron", /^node:/],
        output: {
          format: "cjs",
          entryFileNames: "[name].js",
        },
      },
    },
  },
  renderer: {
    root: ".",
    // "./" is required for loadFile() to resolve assets correctly in packaged mode
    base: "./",
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: "http://127.0.0.1:3001",
          changeOrigin: true,
        },
        "/ai-api": {
          target: "http://127.0.0.1:3001",
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on("error", () => {});
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "dist-electron/renderer",
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, "index.html"),
        },
        output: {
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
        },
      },
      // esnext is safe — Electron 42's Chromium supports all modern JS
      target: "esnext",
    },
    // ESM workers are required for WASM (jsquash) imports
    worker: {
      format: "es",
    },
  },
});
