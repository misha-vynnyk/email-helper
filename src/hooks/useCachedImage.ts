import { useEffect, useState } from 'react';
import { imageCacheService } from '../utils/imageCache';

/**
 * Hook для завантаження та кешування зображень
 * @param imageUrl - URL зображення
 * @returns об'єкт з URL (кешованим або оригінальним) та станом завантаження
 */
export function useCachedImage(imageUrl: string | null | undefined) {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setCachedUrl(null);
      setLoading(false);
      return;
    }

    let objectUrl: string | null = null;
    let previousObjectUrl: string | null = null;
    let isMounted = true;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);

        // Очищаємо попередній object URL якщо він є
        if (previousObjectUrl) {
          URL.revokeObjectURL(previousObjectUrl);
          previousObjectUrl = null;
        }

        // Спочатку перевіряємо кеш
        const cachedObjectUrl = await imageCacheService.getCachedImage(imageUrl);

        if (cachedObjectUrl) {
          if (isMounted) {
            // Отримуємо поточний cachedUrl через функцію setState callback
            setCachedUrl((currentUrl) => {
              // Зберігаємо старий URL для очищення
              if (currentUrl && currentUrl.startsWith('blob:')) {
                previousObjectUrl = currentUrl;
              }
              return cachedObjectUrl;
            });
            setLoading(false);
          } else {
            // Якщо компонент розмонтовано, очищаємо одразу
            URL.revokeObjectURL(cachedObjectUrl);
          }
          return;
        }

        // Якщо немає в кеші, завантажуємо зображення
        const response = await fetch(imageUrl, {
          mode: 'cors',
          cache: 'default',
        });

        if (!response.ok) {
          throw new Error(`Failed to load image: ${response.statusText}`);
        }

        const blob = await response.blob();
        const contentType = response.headers.get('content-type') || blob.type;

        // Зберігаємо в кеш
        await imageCacheService.cacheImage(imageUrl, blob, contentType);

        // Створюємо object URL
        objectUrl = URL.createObjectURL(blob);

        if (isMounted) {
          setCachedUrl((currentUrl) => {
            // Зберігаємо старий URL для очищення
            if (currentUrl && currentUrl.startsWith('blob:')) {
              previousObjectUrl = currentUrl;
            }
            return objectUrl!;
          });
          setLoading(false);
        } else {
          // Якщо компонент розмонтовано, очищаємо одразу
          URL.revokeObjectURL(objectUrl);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load image'));
          setLoading(false);
          // У випадку помилки використовуємо оригінальний URL
          setCachedUrl(imageUrl);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      // Очищаємо object URLs при розмонтуванні
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      if (previousObjectUrl) {
        URL.revokeObjectURL(previousObjectUrl);
      }
    };
  }, [imageUrl]);

  return {
    url: cachedUrl || imageUrl || '',
    loading,
    error,
  };
}
