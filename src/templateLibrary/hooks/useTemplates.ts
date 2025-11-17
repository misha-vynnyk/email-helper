/**
 * useTemplates Hook
 * Manages template data fetching and state
 */

import { useState, useEffect, useCallback } from "react";

import { logger } from "../../utils/logger";
import { templateService } from "../services/templateService";
import { EmailTemplate } from "../types";

interface UseTemplatesOptions {
  search?: string;
  category?: string;
  autoLoad?: boolean;
}

export function useTemplates(options: UseTemplatesOptions = {}) {
  const { search, category, autoLoad = true } = options;

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = { search, category };
      const data = await templateService.listTemplates(filters);
      setTemplates(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load templates";
      setError(message);
      logger.error("useTemplates", "Load failed", err);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    if (autoLoad) {
      loadTemplates();
    }
  }, [autoLoad, loadTemplates]);

  const createTemplate = async (data: Partial<EmailTemplate>) => {
    try {
      const newTemplate = await templateService.createTemplate(data);
      setTemplates((prev) => [...prev, newTemplate]);
      return newTemplate;
    } catch (err) {
      logger.error("useTemplates", "Create failed", err);
      throw err;
    }
  };

  const updateTemplate = async (id: string, data: Partial<EmailTemplate>) => {
    try {
      const updated = await templateService.updateTemplate(id, data);
      setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    } catch (err) {
      logger.error("useTemplates", "Update failed", err);
      throw err;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await templateService.deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      logger.error("useTemplates", "Delete failed", err);
      throw err;
    }
  };

  const syncTemplate = async (id: string) => {
    try {
      const synced = await templateService.syncTemplate(id);
      setTemplates((prev) => prev.map((t) => (t.id === id ? synced : t)));
      return synced;
    } catch (err) {
      logger.error("useTemplates", "Sync failed", err);
      throw err;
    }
  };

  return {
    templates,
    loading,
    error,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    syncTemplate,
  };
}
