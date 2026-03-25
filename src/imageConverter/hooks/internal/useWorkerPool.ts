/**
 * Worker Pool Hook
 * Manages Web Worker pool lifecycle.
 * Extracted from ImageConverterContext.
 */

import { useEffect, useRef } from "react";

import { LIMITS } from "../../constants/limits";
import { logger } from "../../../utils/logger";
import { WorkerPool } from "../../workers/workerPool";

export function useWorkerPool() {
  const workerPool = useRef<WorkerPool | null>(null);
  const USE_WORKERS = typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined";

  useEffect(() => {
    if (USE_WORKERS && !workerPool.current) {
      workerPool.current = new WorkerPool(LIMITS.MAX_CONCURRENT_CONVERSIONS);
      workerPool.current.init().catch((error) => {
        logger.error("ImageConverter", "Failed to initialize worker pool", error);
        workerPool.current = null;
      });
    }

    return () => {
      if (workerPool.current) {
        workerPool.current.terminate();
        workerPool.current = null;
      }
    };
  }, [USE_WORKERS]);

  return { workerPool, USE_WORKERS };
}
