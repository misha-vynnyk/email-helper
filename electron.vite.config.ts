import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "electron-vite";

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, "electron/main.ts"),
        },
      },
    },
  },
  preload: {
    build: {
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
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
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
