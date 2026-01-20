/**
 * Утиліта для заміни URL зображень на кешовані версії в HTML
 */

import { imageCacheService } from './imageCache';

// Конфігурація
const CONFIG = {
  STORAGE_DOMAIN: 'storage.5th-elementagency.com',
  MAX_CONCURRENT_REQUESTS: 5,
  IMAGE_EXTENSIONS: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'] as const,
} as const;

// Кеш для неіснуючих URL (щоб не намагатися завантажувати їх повторно)
const failedUrls = new Set<string>();

/**
 * Перевіряє чи є розширення файлу зображенням
 */
function isImageExtension(pathname: string): boolean {
  const lowerPathname = pathname.toLowerCase();
  return CONFIG.IMAGE_EXTENSIONS.some((ext) => lowerPathname.endsWith(ext));
}

/**
 * Знаходить всі URL зображень з storage.5th-elementagency.com в HTML
 */
export function extractImageUrls(html: string): string[] {
  const urls: string[] = [];
  const regex = /https?:\/\/[^"'\s>]+/g;
  const matches = html.match(regex) || [];

  for (const match of matches) {
    try {
      const url = new URL(match);
      if (url.hostname === CONFIG.STORAGE_DOMAIN && isImageExtension(url.pathname)) {
        urls.push(match);
      }
    } catch {
      // Ігноруємо невалідні URL
    }
  }

  return [...new Set(urls)]; // Унікальні URL
}

/**
 * Тип для semaphore обмеження одночасних запитів
 */
interface Semaphore {
  count: number;
  queue: Array<() => void>;
}

/**
 * Створює новий semaphore
 */
function createSemaphore(): Semaphore {
  return { count: 0, queue: [] };
}

/**
 * Отримує доступ до semaphore (чекає якщо досягнуто ліміту)
 */
async function acquire(semaphore: Semaphore): Promise<void> {
  if (semaphore.count >= CONFIG.MAX_CONCURRENT_REQUESTS) {
    await new Promise<void>((resolve) => {
      semaphore.queue.push(resolve);
    });
  }
  semaphore.count++;
}

/**
 * Звільняє semaphore та пробуджує наступний запит
 */
function release(semaphore: Semaphore): void {
  semaphore.count--;
  const next = semaphore.queue.shift();
  if (next) next();
}

/**
 * Завантажує зображення з обмеженням одночасних запитів
 */
async function loadImageWithLimit(url: string, semaphore: Semaphore): Promise<void> {
  await acquire(semaphore);

  try {
    // Перевіряємо чи вже є в кеші
    const cached = await imageCacheService.getCachedImage(url);
    if (cached) {
      URL.revokeObjectURL(cached);
      return;
    }

    // Перевіряємо чи URL вже зазнав невдачі
    if (failedUrls.has(url)) {
      return;
    }

    // Завантажуємо зображення
    const response = await fetch(url, {
      mode: 'cors',
      cache: 'default',
    });

    if (response.ok) {
      const blob = await response.blob();
      const contentType = response.headers.get('content-type') || blob.type;
      await imageCacheService.cacheImage(url, blob, contentType);
    } else if (response.status === 404) {
      // Кешуємо неіснуючі URL, щоб не намагатися завантажувати їх повторно
      failedUrls.add(url);
    }
  } catch {
    // Ігноруємо помилки завантаження окремих зображень
    // Не логуємо помилки, щоб не засмічувати консоль при недоступності сервера
    // (помилки вже відображаються в Network tab браузера)
  } finally {
    release(semaphore);
  }
}

/**
 * Завантажує всі зображення з HTML в кеш з обмеженням одночасних запитів
 */
export async function preloadImages(html: string): Promise<void> {
  const urls = extractImageUrls(html);
  if (urls.length === 0) return;

  const semaphore = createSemaphore();
  const loadPromises = urls.map((url) => loadImageWithLimit(url, semaphore));
  await Promise.allSettled(loadPromises);
}

/**
 * Замінює URL зображень в HTML на кешовані blob URLs
 * Використовується для iframe та preview
 *
 * ⚠️ УВАГА: Blob URLs потрібно очищати після використання через URL.revokeObjectURL()
 */
export async function replaceImageUrlsWithCached(html: string): Promise<string> {
  const urls = extractImageUrls(html);
  if (urls.length === 0) return html;

  const urlMap = new Map<string, string>();

  // Завантажуємо всі зображення в кеш і отримуємо blob URLs (паралельно)
  const cachedResults = await Promise.allSettled(
    urls.map(async (url) => {
      // Пропускаємо неіснуючі URL
      if (failedUrls.has(url)) {
        return { url, cachedUrl: null };
      }

      try {
        const cachedUrl = await imageCacheService.getCachedImage(url);
        return { url, cachedUrl };
      } catch {
        return { url, cachedUrl: null };
      }
    })
  );

  // Збираємо успішні результати
  for (const result of cachedResults) {
    if (result.status === 'fulfilled' && result.value.cachedUrl) {
      urlMap.set(result.value.url, result.value.cachedUrl);
    }
  }

  // Замінюємо URL в HTML
  let result = html;
  for (const [originalUrl, cachedUrl] of urlMap.entries()) {
    const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedUrl, 'g');
    result = result.replace(regex, cachedUrl);
  }

  return result;
}
