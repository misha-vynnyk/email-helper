/**
 * API Configuration
 *
 * Automatically switches between local and production API endpoints
 * based on the build environment.
 */

import { logger } from "../utils/logger";

// In production, only use API if VITE_API_URL is explicitly set
// Otherwise, disable API calls to avoid CORS errors
const API_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL || ""
  : import.meta.env.VITE_API_URL || "http://localhost:3001";

// Check if API is available
export const isApiAvailable = () => {
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
