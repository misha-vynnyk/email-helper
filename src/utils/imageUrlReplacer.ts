/**
 * Утиліта для заміни URL зображень на кешовані версії в HTML
 */

import { imageCacheService } from './imageCache';

const STORAGE_DOMAIN = 'storage.5th-elementagency.com';

// Обмеження одночасних запитів (concurrency limit)
const MAX_CONCURRENT_REQUESTS = 5;

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
      if (url.hostname === STORAGE_DOMAIN) {
        // Перевіряємо чи це зображення за розширенням
        const pathname = url.pathname.toLowerCase();
        if (
          pathname.endsWith('.png') ||
          pathname.endsWith('.jpg') ||
          pathname.endsWith('.jpeg') ||
          pathname.endsWith('.gif') ||
          pathname.endsWith('.webp') ||
          pathname.endsWith('.svg')
        ) {
          urls.push(match);
        }
      }
    } catch {
      // Ігноруємо невалідні URL
    }
  }

  return [...new Set(urls)]; // Унікальні URL
}

/**
 * Завантажує зображення з обмеженням одночасних запитів
 */
async function loadImageWithLimit(
  url: string,
  semaphore: { count: number; queue: Array<() => void> }
): Promise<void> {
  // Чекаємо поки з'явиться вільне місце
  if (semaphore.count >= MAX_CONCURRENT_REQUESTS) {
    await new Promise<void>((resolve) => {
      semaphore.queue.push(resolve);
    });
  }

  semaphore.count++;

  try {
    // Перевіряємо чи вже є в кеші
    const cached = await imageCacheService.getCachedImage(url);
    if (cached) {
      // Очищаємо object URL якщо використали
      URL.revokeObjectURL(cached);
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
    }
  } catch (error) {
    // Ігноруємо помилки завантаження окремих зображень
    // Не логуємо помилки, щоб не засмічувати консоль при недоступності сервера
    // (помилки вже відображаються в Network tab браузера)
  } finally {
    semaphore.count--;
    // Пробуджуємо наступний запит з черги
    if (semaphore.queue.length > 0) {
      const next = semaphore.queue.shift();
      if (next) next();
    }
  }
}

/**
 * Завантажує всі зображення з HTML в кеш з обмеженням одночасних запитів
 */
export async function preloadImages(html: string): Promise<void> {
  const urls = extractImageUrls(html);

  if (urls.length === 0) return;

  // Semaphore для обмеження одночасних запитів
  const semaphore = {
    count: 0,
    queue: [] as Array<() => void>,
  };

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
  const urlMap = new Map<string, string>();

  // Завантажуємо всі зображення в кеш і отримуємо blob URLs
  for (const url of urls) {
    try {
      const cachedUrl = await imageCacheService.getCachedImage(url);
      if (cachedUrl) {
        urlMap.set(url, cachedUrl);
      }
    } catch (error) {
      // Ігноруємо помилки, залишаємо оригінальний URL
      // Не логуємо, щоб не засмічувати консоль
    }
  }

  // Замінюємо URL в HTML
  let result = html;
  for (const [originalUrl, cachedUrl] of urlMap.entries()) {
    // Замінюємо всі входження URL (з різними кавичками)
    const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedUrl, 'g');
    result = result.replace(regex, cachedUrl);
  }

  return result;
}
