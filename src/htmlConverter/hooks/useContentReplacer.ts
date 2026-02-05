import { useCallback } from "react";
import { isSignatureImageTag } from "../utils";

interface ContentReplacerResult {
  replaced: string;
  count: number;
}

export function useContentReplacer() {
  const replaceUrlsInContentByMap = useCallback((content: string, pattern: RegExp, urlMap: Record<string, string>): ContentReplacerResult => {
    let replacedCount = 0;
    const replaced = content.replace(pattern, (match, prefix, oldUrl, suffix) => {
      if (isSignatureImageTag(match)) return match;

      const candidates: string[] = [String(oldUrl)];
      try {
        candidates.push(new URL(String(oldUrl), window.location.href).toString());
      } catch {
        // ignore
      }

      for (const c of candidates) {
        const next = urlMap[c];
        if (next) {
          replacedCount++;
          return `${prefix}${next}${suffix}`;
        }
      }
      return match;
    });

    return { replaced, count: replacedCount };
  }, []);

  const replaceUrlsInContent = useCallback((content: string, pattern: RegExp, storageUrls: string[]): ContentReplacerResult => {
    let imageIndex = 0;
    let replacedCount = 0;

    const replaced = content.replace(pattern, (match, prefix, _oldUrl, suffix) => {
      if (isSignatureImageTag(match)) return match;
      if (imageIndex < storageUrls.length) {
        const newUrl = storageUrls[imageIndex++];
        replacedCount++;
        return `${prefix}${newUrl}${suffix}`;
      }
      return match;
    });

    return { replaced, count: replacedCount };
  }, []);

  // Replace ALT attributes in img tags based on URL mapping
  // altMap is storageUrl -> alt (after upload)
  // Uses regex instead of DOMParser to preserve original HTML formatting (important for email)
  const replaceAltsInContent = useCallback((content: string, _urlMap: Record<string, string>, altMap: Record<string, string>): ContentReplacerResult => {
    if (Object.keys(altMap).length === 0) return { replaced: content, count: 0 };

    let replacedCount = 0;

    // Match entire <img ...> tag (handles multi-line with [\s\S])
    const replaced = content.replace(/<img[\s\S]*?>/gi, (imgTag) => {
      // Extract src value
      const srcMatch = imgTag.match(/\ssrc=["']([^"']+)["']/i);
      if (!srcMatch) return imgTag;

      const src = srcMatch[1];
      // altMap now uses storage URL as key directly
      const newAlt = altMap[src];
      if (!newAlt) return imgTag;

      replacedCount++;

      // Replace alt attribute value (handles alt before or after src)
      if (/\salt=["'][^"']*["']/i.test(imgTag)) {
        // Alt exists - replace it
        return imgTag.replace(/(\salt=["'])[^"']*(["'])/i, `$1${newAlt}$2`);
      } else {
        // No alt - add it after <img
        return imgTag.replace(/<img/i, `<img alt="${newAlt}"`);
      }
    });

    return { replaced, count: replacedCount };
  }, []);

  return {
    replaceUrlsInContentByMap,
    replaceUrlsInContent,
    replaceAltsInContent,
  };
}
