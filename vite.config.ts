import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  // Load ports from environment variables
  const port = Number(process.env.VITE_PORT) || 5173;
  const backendPort = process.env.VITE_BACKEND_PORT || "3001";
  const aiBackendUrl = process.env.VITE_AI_BACKEND_URL || "http://127.0.0.1:8000";

  return {
    base: "/email-helper/",
    plugins: [react()],
    server: {
      port: port,
      watch: {
        ignored: ["**/server/ai/venv/**", "**/dist/**", "**/node_modules/**"],
      },
      proxy: {
        "/api": {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "/api"),
        },
        "/ai-api": {
          target: aiBackendUrl,
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(/^\/ai-api/, ""),
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              // Silence spam during startup
            });
          },
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
