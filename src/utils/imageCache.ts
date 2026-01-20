/**
 * Image Cache Service
 * Кешує зображення з storage.5th-elementagency.com в IndexedDB
 * для зменшення кількості запитів та покращення продуктивності
 */

const CACHE_DB_NAME = 'image-cache-db';
const CACHE_STORE_NAME = 'images';
const CACHE_VERSION = 1;
const STORAGE_DOMAIN = 'storage.5th-elementagency.com';

// Cache expiration time (7 days)
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

interface CachedImage {
  url: string;
  blob: Blob;
  cachedAt: number;
  contentType: string;
}

class ImageCacheService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private async initDB(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(CACHE_DB_NAME, CACHE_VERSION);

      request.onerror = () => {
        console.error('[ImageCache] Failed to open IndexedDB');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
          const store = db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'url' });
          store.createIndex('cachedAt', 'cachedAt', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Перевіряє чи URL належить до storage.5th-elementagency.com
   */
  private shouldCache(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === STORAGE_DOMAIN;
    } catch {
      return false;
    }
  }

  /**
   * Перевіряє чи кеш застарів
   */
  private isExpired(cachedAt: number): boolean {
    return Date.now() - cachedAt > CACHE_EXPIRY_MS;
  }

  /**
   * Отримує зображення з кешу
   */
  async getCachedImage(url: string): Promise<string | null> {
    if (!this.shouldCache(url)) {
      return null;
    }

    try {
      await this.initDB();
      if (!this.db) return null;

      return new Promise((resolve) => {
        const transaction = this.db!.transaction([CACHE_STORE_NAME], 'readonly');
        const store = transaction.objectStore(CACHE_STORE_NAME);
        const request = store.get(url);

        request.onsuccess = () => {
          const result = request.result as CachedImage | undefined;

          if (!result) {
            resolve(null);
            return;
          }

          // Перевіряємо чи не застарів кеш
          if (this.isExpired(result.cachedAt)) {
            // Видаляємо застарілий кеш (не чекаємо завершення, щоб не блокувати)
            this.deleteCachedImage(url).catch(() => {
              // Ігноруємо помилки видалення
            });
            resolve(null);
            return;
          }

          // Створюємо object URL з blob
          const objectUrl = URL.createObjectURL(result.blob);
          resolve(objectUrl);
        };

        request.onerror = () => {
          resolve(null);
        };
      });
    } catch (error) {
      console.error('[ImageCache] Error getting cached image:', error);
      return null;
    }
  }

  /**
   * Зберігає зображення в кеш
   */
  async cacheImage(url: string, blob: Blob, contentType: string = 'image/png'): Promise<void> {
    if (!this.shouldCache(url)) {
      return;
    }

    try {
      await this.initDB();
      if (!this.db) return;

      const cachedImage: CachedImage = {
        url,
        blob,
        cachedAt: Date.now(),
        contentType,
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([CACHE_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(CACHE_STORE_NAME);
        const request = store.put(cachedImage);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          console.error('[ImageCache] Error caching image:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[ImageCache] Error caching image:', error);
    }
  }

  /**
   * Видаляє зображення з кешу
   */
  async deleteCachedImage(url: string): Promise<void> {
    try {
      await this.initDB();
      if (!this.db) return;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([CACHE_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(CACHE_STORE_NAME);
        const request = store.delete(url);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[ImageCache] Error deleting cached image:', error);
    }
  }

  /**
   * Очищає застарілі записи з кешу
   */
  async cleanExpiredCache(): Promise<void> {
    try {
      await this.initDB();
      if (!this.db) return;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([CACHE_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(CACHE_STORE_NAME);
        const index = store.index('cachedAt');
        const request = index.openCursor();

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const image = cursor.value as CachedImage;
            if (this.isExpired(image.cachedAt)) {
              cursor.delete();
            }
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[ImageCache] Error cleaning expired cache:', error);
    }
  }

  /**
   * Очищає весь кеш
   */
  async clearCache(): Promise<void> {
    try {
      await this.initDB();
      if (!this.db) return;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([CACHE_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(CACHE_STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[ImageCache] Error clearing cache:', error);
    }
  }
}

// Singleton instance
export const imageCacheService = new ImageCacheService();

// Очищаємо застарілий кеш при завантаженні
if (typeof window !== 'undefined') {
  imageCacheService.cleanExpiredCache().catch(console.error);
}
