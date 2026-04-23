import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load AI backend URL from environment variable, fallback to local
  const aiBackendUrl = process.env.VITE_AI_BACKEND_URL || "http://127.0.0.1:8000";

  return {
    base: "/email-helper/",
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: "http://127.0.0.1:3001",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "/api"),
        },
        "/ai-api": {
          target: aiBackendUrl,
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(/^\/ai-api/, ""),
        },
      },
    },
    resolve: {
      alias: {
        "@usewaypoint/block-library": path.resolve(__dirname, "../block-library/src"),
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: ["@emotion/react", "@emotion/styled", "@mui/material", "@mui/icons-material"],
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
  };
});
