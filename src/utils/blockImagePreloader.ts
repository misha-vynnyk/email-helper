/**
 * Preloader для зображень в блоках
 * Завантажує всі зображення з storage.5th-elementagency.com в кеш при ініціалізації блоків
 */

import { preloadImages } from './imageUrlReplacer';

/**
 * Завантажує зображення з HTML блоку в кеш
 */
export async function preloadBlockImages(html: string): Promise<void> {
  try {
    await preloadImages(html);
  } catch (error) {
    // Ігноруємо помилки preloading - це не критично
    console.warn('[BlockImagePreloader] Failed to preload images:', error);
  }
}

/**
 * Завантажує зображення з масиву блоків
 */
export async function preloadBlocksImages(blocks: Array<{ html?: string; preview?: string }>): Promise<void> {
  const htmlStrings = blocks
    .map(block => block.html || block.preview || '')
    .filter(Boolean);

  const preloadPromises = htmlStrings.map(html => preloadBlockImages(html));
  await Promise.allSettled(preloadPromises);
}
