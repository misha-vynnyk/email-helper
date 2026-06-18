/**
 * API Configuration
 *
 * Automatically switches between local and production API endpoints
 * based on the build environment.
 */

import { logger } from "../utils/logger";

// In production, only use API if VITE_API_URL is explicitly set
// Otherwise, disable API calls to avoid CORS errors
const API_URL = import.meta.env.VITE_API_URL || "";

// In packaged Electron the renderer loads from file://, so relative URLs like
// "/api/..." resolve to "file:///api/..." and never reach the Express server.
// We detect Electron via the preload-injected flag and use the actual port
// communicated by the main process (may differ from 3001 if that port was busy).
export const getApiBase = (): string => {
  if (typeof window !== "undefined" && (window as any).electronAPI?.isElectron) {
    const port = (window as any).electronAPI?.serverPort ?? 3001;
    return `http://localhost:${port}`;
  }
  return "";
};

// Check if API is available
export const isApiAvailable = () => {
  // Always available in development (via proxy)
  if (import.meta.env.DEV) return true;
  // Always available in packaged Electron (embedded Express server)
  if (typeof window !== "undefined" && (window as any).electronAPI?.isElectron) return true;
  return !!API_URL;
};

export default API_URL;
export { API_URL };

// Helper function for API calls (deprecated - use apiClient instead)
export const apiCall = async (endpoint: string, options?: RequestInit) => {
  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "API request failed");
    }

    return response.json();
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error("API call failed:", error.message);
      throw error;
    } else {
      logger.error("API call failed:", String(error));
      throw new Error(String(error));
    }
  }
};
