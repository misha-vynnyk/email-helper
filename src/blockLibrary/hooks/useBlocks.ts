/**
 * useBlocks Hook
 * Manages block data fetching and state
 */

import { useState, useEffect, useCallback } from "react";

import { logger } from "../../utils/logger";
import { blockService } from "../services/blockService";
import { EmailBlock } from "../types";

interface UseBlocksOptions {
  search?: string;
  category?: string;
  autoLoad?: boolean;
}

export function useBlocks(options: UseBlocksOptions = {}) {
  const { search, category, autoLoad = true } = options;

  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBlocks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = { search, category };
      const data = await blockService.listBlocks(filters);
      setBlocks(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load blocks";
      setError(message);
      logger.error("useBlocks", "Load failed", err);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    if (autoLoad) {
      loadBlocks();
    }
  }, [autoLoad, loadBlocks]);

  const createBlock = async (data: Partial<EmailBlock>) => {
    try {
      const newBlock = await blockService.createBlock(data);
      setBlocks((prev) => [...prev, newBlock]);
      return newBlock;
    } catch (err) {
      logger.error("useBlocks", "Create failed", err);
      throw err;
    }
  };

  const updateBlock = async (id: string, data: Partial<EmailBlock>) => {
    try {
      const updated = await blockService.updateBlock(id, data);
      setBlocks((prev) => prev.map((b) => (b.id === id ? updated : b)));
      return updated;
    } catch (err) {
      logger.error("useBlocks", "Update failed", err);
      throw err;
    }
  };

  const deleteBlock = async (id: string) => {
    try {
      await blockService.deleteBlock(id);
      setBlocks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      logger.error("useBlocks", "Delete failed", err);
      throw err;
    }
  };

  return {
    blocks,
    loading,
    error,
    loadBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
  };
}
