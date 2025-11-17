/**
 * Template Content Cache
 * In-memory cache for template HTML content to speed up preview loading
 */

interface CacheEntry {
  content: string;
  timestamp: number;
}

const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Maximum number of templates to cache

class TemplateContentCache {
  private cache: Map<string, CacheEntry> = new Map();
  private loadingPromises: Map<string, Promise<string>> = new Map();

  /**
   * Get cached content if available and not expired
   */
  get(templateId: string): string | null {
    const entry = this.cache.get(templateId);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > CACHE_EXPIRY_MS) {
      // Entry expired
      this.cache.delete(templateId);
      return null;
    }

    return entry.content;
  }

  /**
   * Store content in cache
   */
  set(templateId: string, content: string): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      )[0]?.[0];
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(templateId, {
      content,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if content is being loaded (deduplicate requests)
   */
  getLoadingPromise(templateId: string): Promise<string> | null {
    return this.loadingPromises.get(templateId) || null;
  }

  /**
   * Store loading promise to deduplicate concurrent requests
   */
  setLoadingPromise(templateId: string, promise: Promise<string>): void {
    this.loadingPromises.set(templateId, promise);
    promise
      .then(() => {
        // Remove from loading promises after completion
        this.loadingPromises.delete(templateId);
      })
      .catch(() => {
        // Remove on error too
        this.loadingPromises.delete(templateId);
      });
  }

  /**
   * Invalidate cache for specific template
   */
  invalidate(templateId: string): void {
    this.cache.delete(templateId);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  /**
   * Preload templates (for adjacent templates in navigation)
   */
  async preload(templateIds: string[], loadFn: (id: string) => Promise<string>): Promise<void> {
    // Load in background, don't wait for all
    templateIds.forEach((id) => {
      if (!this.get(id) && !this.getLoadingPromise(id)) {
        const promise = loadFn(id);
        this.setLoadingPromise(id, promise);
        promise
          .then((content) => {
            this.set(id, content);
          })
          .catch(() => {
            // Ignore preload errors
          });
      }
    });
  }
}

// Singleton instance
export const templateContentCache = new TemplateContentCache();
