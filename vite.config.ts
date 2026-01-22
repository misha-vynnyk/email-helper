import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "/email-helper/",
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
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
  },
});
