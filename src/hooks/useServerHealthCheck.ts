import { useEffect, useState } from "react";
import API_URL from "../config/api";
import { logger } from "../utils/logger";

interface ServerHealthStatus {
  isHealthy: boolean;
  isChecking: boolean;
  error: string | null;
  lastCheck: number | null;
  aiBackendHealthy?: boolean;
}

const MAX_RETRIES = 30; // Try for up to 30 seconds
const RETRY_INTERVAL = 1000; // 1 second between retries
const AI_BACKEND_URL = "http://localhost:8000"; // Python AI Backend

/**
 * Check if AI backend (Python FastAPI) is available
 */
const checkAiBackendHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${AI_BACKEND_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Hook to check server health on app startup
 * Retries until server is available
 */
export const useServerHealthCheck = (): ServerHealthStatus => {
  const [status, setStatus] = useState<ServerHealthStatus>({
    isHealthy: false,
    isChecking: true,
    error: null,
    lastCheck: null,
  });

  useEffect(() => {
    if (!API_URL) {
      // API is disabled
      setStatus({
        isHealthy: true, // Treat as healthy if API is disabled
        isChecking: false,
        error: null,
        lastCheck: Date.now(),
      });
      return;
    }

    let retryCount = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${API_URL}/api/health`, {
          method: "GET",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (isMounted) {
          if (response.ok) {
            // Node.js server is healthy, now check AI backend
            const aiHealthy = await checkAiBackendHealth();

            setStatus({
              isHealthy: true,
              isChecking: false,
              error: null,
              lastCheck: Date.now(),
              aiBackendHealthy: aiHealthy,
            });

            if (aiHealthy) {
              logger.info("useServerHealthCheck", "✅ Both servers are healthy");
            } else {
              logger.warn("useServerHealthCheck", "⚠️ Node server healthy, but AI backend not responding");
            }
          } else {
            throw new Error(`Server returned ${response.status}`);
          }
        }
      } catch (error) {
        if (isMounted) {
          retryCount++;

          if (retryCount >= MAX_RETRIES) {
            setStatus({
              isHealthy: false,
              isChecking: false,
              error: `Server not responding after ${MAX_RETRIES} attempts`,
              lastCheck: Date.now(),
            });
            logger.error("useServerHealthCheck", `❌ Server health check failed: Max retries reached`);
          } else {
            // Retry
            logger.warn("useServerHealthCheck", `⏳ Server not ready, retrying... (${retryCount}/${MAX_RETRIES})`);
            setStatus({
              isHealthy: false,
              isChecking: true,
              error: `Connecting to server... (${retryCount}/${MAX_RETRIES})`,
              lastCheck: Date.now(),
            });

            timeoutId = setTimeout(checkHealth, RETRY_INTERVAL);
          }
        }
      }
    };

    checkHealth();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return status;
};

export default useServerHealthCheck;
