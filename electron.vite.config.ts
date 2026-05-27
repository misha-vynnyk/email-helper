import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "electron-vite";

export default defineConfig({
  main: {
    build: {
      outDir: "dist-electron/main",
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, "electron/main.ts"),
        },
      },
    },
  },
  preload: {
    build: {
      outDir: "dist-electron/preload",
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, "electron/preload.ts"),
        },
      },
    },
  },
  renderer: {
    root: ".",
    base: "./",
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: "http://127.0.0.1:3001",
          changeOrigin: true,
        },
        "/ai-api": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
          ws: true,
          rewrite: (p) => p.replace(/^\/ai-api/, ""),
          configure: (proxy) => {
            proxy.on("error", () => {}); // AI service may not be running — silence proxy noise
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
      },
      target: "esnext",
    },
    worker: {
      format: "es",
    },
  },
});
