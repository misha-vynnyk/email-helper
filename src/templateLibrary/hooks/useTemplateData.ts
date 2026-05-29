import { useCallback, useRef, useState } from "react";
import { EmailTemplate } from "../../types/template";
import { preloadImages } from "../../utils/imageUrlReplacer";
import { logger } from "../../utils/logger";
import { listTemplates, syncAllTemplates } from "../utils/templateApi";
import { getTemplateStorageLocations } from "../utils/templateStorageConfig";

/**
 * Custom hook to abstract the data layer (fetching, syncing, caching, state management)
 * away from the TemplateLibrary presentation component.
 *
 * Enforces the Single Responsibility Principle by decoupling API communication
 * from the React UI lifecycle.
 */
export function useTemplateData() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadingRef = useRef(false);

  /**
   * Loads templates from the API and filters them by configured storage locations.
   */
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTemplates();
      if (Array.isArray(data)) {
        const locations = getTemplateStorageLocations(false);

        let visibleTemplates: EmailTemplate[];
        if (locations.length === 0) {
          visibleTemplates = [];
        } else {
          const allowedPaths = locations.map((loc) => loc.path);
          visibleTemplates = data.filter(
            (template) => template.filePath && allowedPaths.some((p) => template.filePath.startsWith(p))
          );
        }

        setTemplates(visibleTemplates);

        const previews = visibleTemplates.filter((t) => t.preview).map((t) => t.preview!);
        if (previews.length > 0) {
          preloadImages(previews.join(" ")).catch((err) => {
            logger.warn("TemplateLibrary", "Failed to preload template preview images", err);
          });
        }
      } else {
        logger.error("TemplateLibrary", "API returned non-array data", data);
        setTemplates([]);
        setError("Invalid data format from server");
      }
    } catch (err) {
      const isConnectionError = err instanceof Error && (err.message.includes("Failed to fetch") || err.message.includes("connection") || err.message.includes("Server connection failed"));

      if (isConnectionError) {
        logger.warn("TemplateLibrary", "Server unavailable - templates cannot be loaded");
      } else {
        logger.error("TemplateLibrary", "Failed to load templates", err);
      }

      setTemplates([]);
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Synchronizes all configured storage locations with the backend index.
   * Sends all paths in a single API call to avoid redundant re-syncs.
   */
  const syncTemplates = useCallback(async () => {
    setSyncing(true);
    setSyncMessage(null);
    setError(null);

    try {
      const locations = getTemplateStorageLocations(false);

      if (locations.length === 0) {
        setError("No storage locations configured. Please add directories in Storage settings.");
        return;
      }

      const result = await syncAllTemplates({
        recursive: true,
        category: "Other",
        paths: locations.map((loc) => loc.path),
      });

      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors.map((e) => `${e.root}: ${e.error}`);
        setError(`Sync completed with errors:\n${errorMessages.join("\n")}`);
      } else {
        setSyncMessage(`✅ Sync completed: ${result.templatesFound} templates found`);
        setTimeout(() => setSyncMessage(null), 5000);
      }

      await loadTemplates();
    } catch (err) {
      const isConnectionError = err instanceof Error && (err.message.includes("Failed to fetch") || err.message.includes("connection") || err.message.includes("Server connection failed"));

      if (isConnectionError) {
        logger.warn("TemplateLibrary", "Server unavailable - sync failed");
      } else {
        logger.error("TemplateLibrary", "Failed to sync templates", err);
      }

      setError(err instanceof Error ? err.message : "Failed to sync templates");
    } finally {
      setSyncing(false);
    }
  }, [loadTemplates]);

  /**
   * Initial data load — only fetches existing templates from the backend index.
   * Use syncTemplates() explicitly when the user wants to scan for new files.
   */
  const initializeTemplates = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      await loadTemplates();
    } finally {
      loadingRef.current = false;
    }
  }, [loadTemplates]);

  const deleteTemplate = useCallback((templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
  }, []);

  const updateTemplate = useCallback((updated: EmailTemplate) => {
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearSyncMessage = useCallback(() => setSyncMessage(null), []);

  return {
    templates,
    loading,
    syncing,
    syncMessage,
    error,
    initializeTemplates,
    loadTemplates,
    syncTemplates,
    deleteTemplate,
    updateTemplate,
    clearError,
    clearSyncMessage,
  };
}
