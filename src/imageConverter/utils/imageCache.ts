/**
 * IndexedDB Image Cache with LRU Eviction
 * Caches converted images to avoid repeated conversions
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CacheEntry {
  key: string;
  blob: Blob;
  metadata: {
    fileName: string;
    originalSize: number;
    convertedSize: number;
    format: string;
    quality: number;
    timestamp: number; // For LRU
  };
}

interface ImageCacheDB extends DBSchema {
  images: {
    key: string;
    value: CacheEntry;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'image-converter-cache';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB

export class ImageCache {
  private db: IDBPDatabase<ImageCacheDB> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<ImageCacheDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('by-timestamp', 'metadata.timestamp');
      },
    });
  }

  /**
   * Generate cache key from conversion parameters
   * Includes file size and lastModified to ensure uniqueness for different files with same name
   */
  generateKey(
    fileName: string,
    format: string,
    quality: number,
    dimensions: { width?: number; height?: number },
    compressionMode: string,
    fileSize?: number,
    lastModified?: number
  ): string {
    const dimStr = `${dimensions.width || 'auto'}x${dimensions.height || 'auto'}`;
    const uniqueId = `${fileSize || 0}-${lastModified || 0}`;
    return `${fileName}-${uniqueId}-${format}-q${quality}-${dimStr}-${compressionMode}`;
  }

  /**
   * Get cached image blob
   */
  async get(key: string): Promise<Blob | null> {
    await this.init();
    if (!this.db) return null;

    const entry = await this.db.get(STORE_NAME, key);
    if (!entry) return null;

    // Update timestamp for LRU
    entry.metadata.timestamp = Date.now();
    await this.db.put(STORE_NAME, entry);

    return entry.blob;
  }

  /**
   * Cache a converted image
   */
  async cache(
    key: string,
    blob: Blob,
    metadata: Omit<CacheEntry['metadata'], 'timestamp'>
  ): Promise<void> {
    await this.init();
    if (!this.db) return;

    // Check cache size and evict if necessary
    await this.enforceSizeLimit(blob.size);

    const entry: CacheEntry = {
      key,
      blob,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
      },
    };

    await this.db.put(STORE_NAME, entry);
  }

  /**
   * Enforce cache size limit with LRU eviction
   */
  private async enforceSizeLimit(newBlobSize: number): Promise<void> {
    if (!this.db) return;

    const currentSize = await this.getCurrentCacheSize();
    
    if (currentSize + newBlobSize <= MAX_CACHE_SIZE) {
      return; // Within limit
    }

    // Need to evict old entries
    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    const index = tx.store.index('by-timestamp');
    
    let sizeToFree = currentSize + newBlobSize - MAX_CACHE_SIZE;
    let cursor = await index.openCursor();

    while (cursor && sizeToFree > 0) {
      const entry = cursor.value;
      sizeToFree -= entry.blob.size;
      await cursor.delete();
      cursor = await cursor.continue();
    }

    await tx.done;
  }

  /**
   * Get current cache size in bytes
   */
  async getCurrentCacheSize(): Promise<number> {
    await this.init();
    if (!this.db) return 0;

    const allEntries = await this.db.getAll(STORE_NAME);
    return allEntries.reduce((sum, entry) => sum + entry.blob.size, 0);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    count: number;
    totalSize: number;
    sizeFormatted: string;
  }> {
    await this.init();
    if (!this.db) return { count: 0, totalSize: 0, sizeFormatted: '0 B' };

    const allEntries = await this.db.getAll(STORE_NAME);
    const totalSize = allEntries.reduce((sum, entry) => sum + entry.blob.size, 0);

    return {
      count: allEntries.length,
      totalSize,
      sizeFormatted: this.formatBytes(totalSize),
    };
  }

  /**
   * Clear all cached images
   */
  async clear(): Promise<void> {
    await this.init();
    if (!this.db) return;

    await this.db.clear(STORE_NAME);
  }

  /**
   * Delete old entries (older than specified days)
   */
  async deleteOld(days: number = 7): Promise<number> {
    await this.init();
    if (!this.db) return 0;

    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const tx = this.db.transaction(STORE_NAME, 'readwrite');
    const index = tx.store.index('by-timestamp');
    
    let deletedCount = 0;
    let cursor = await index.openCursor();

    while (cursor) {
      if (cursor.value.metadata.timestamp < cutoffTime) {
        await cursor.delete();
        deletedCount++;
      }
      cursor = await cursor.continue();
    }

    await tx.done;
    return deletedCount;
  }

  /**
   * Check if a key exists in cache
   */
  async has(key: string): Promise<boolean> {
    await this.init();
    if (!this.db) return false;

    const entry = await this.db.get(STORE_NAME, key);
    return !!entry;
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }
}

// Export singleton instance
export const imageCache = new ImageCache();

