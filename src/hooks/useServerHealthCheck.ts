import { useEffect, useState } from "react";
import API_URL from "../config/api";
import { logger } from "../utils/logger";

interface ServerHealthStatus {
  isHealthy: boolean;
  isChecking: boolean;
  error: string | null;
  lastCheck: number | null;
}

const MAX_RETRIES = 30; // Try for up to 30 seconds
const RETRY_INTERVAL = 1000; // 1 second between retries

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
            setStatus({
              isHealthy: true,
              isChecking: false,
              error: null,
              lastCheck: Date.now(),
            });
            logger.info("useServerHealthCheck", "✅ Server is healthy");
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
