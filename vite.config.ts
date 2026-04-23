import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "/email-helper/",
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
      "/ai-api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/ai-api/, ""),
      },
    },
    watch: {
      // Watch for changes in the block-library package
      ignored: ["!**/node_modules/@usewaypoint/block-library/**"],
    },
  },
  resolve: {
    alias: {
      // Point to the source files instead of built files for hot reload
      "@usewaypoint/block-library": path.resolve(__dirname, "../block-library/src"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["@emotion/react", "@emotion/styled", "@mui/material", "@mui/icons-material"],
    // Exclude block-library from pre-bundling to allow hot reload
    exclude: ["@usewaypoint/block-library"],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    target: "esnext",
  },
  worker: {
    format: "es",
  },
});
