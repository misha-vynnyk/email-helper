/**
 * Content replacer utilities for HTML Converter
 * Plain functions (no hook needed — no state, no side effects).
 */

import { isSignatureImageTag } from "./htmlUtils";
import { capImageWidth } from "./imageUtils";

export interface ContentReplacerResult {
  replaced: string;
  count: number;
}

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Replaces image src URLs in HTML/MJML content using a src→newUrl map.
 * Tries both the raw URL and the absolute version.
 */
export function replaceUrlsInContentByMap(content: string, pattern: RegExp, urlMap: Record<string, string>): ContentReplacerResult {
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
}

/**
 * Replaces image src URLs positionally using an ordered list of storage URLs.
 */
export function replaceUrlsInContent(content: string, pattern: RegExp, storageUrls: string[]): ContentReplacerResult {
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
}

/**
 * Shrinks the `width`/`max-width` of placeholder `<img>` tags down to each
 * image's real pixel width when that's smaller than the declared width —
 * avoids upscaling low-res source images. Matches positionally (`widths[i]`
 * is the real width of the i-th non-signature image, in document order)
 * rather than by src, because every rendered placeholder `<img>` shares one
 * fixed src (see `tok.storageUrl` / `tok.placeholderImageSrc`) — the same
 * reason `replaceUrlsInContent` falls back to positional matching.
 */
export function capImageWidthsInContent(content: string, pattern: RegExp, widths: Array<number | undefined>): ContentReplacerResult {
  let cappedCount = 0;
  let imageIndex = 0;

  const replaced = content.replace(pattern, (match, prefix, oldUrl, suffix) => {
    if (isSignatureImageTag(match)) return match;

    const realWidth = widths[imageIndex++];
    if (!realWidth) return match;

    let changed = false;
    let newSuffix = suffix.replace(/(\swidth=["'])(\d+)(px)?(["'])/i, (attrMatch: string, p1: string, w: string, unit: string, p4: string) => {
      const capped = capImageWidth(parseInt(w, 10), realWidth);
      if (capped === parseInt(w, 10)) return attrMatch;
      changed = true;
      return `${p1}${capped}${unit || ""}${p4}`;
    });
    newSuffix = newSuffix.replace(/(max-width:\s*)(\d+)(px)/i, (styleMatch: string, p1: string, w: string, p3: string) => {
      const capped = capImageWidth(parseInt(w, 10), realWidth);
      if (capped === parseInt(w, 10)) return styleMatch;
      changed = true;
      return `${p1}${capped}${p3}`;
    });

    if (!changed) return match;
    cappedCount++;
    return `${prefix}${oldUrl}${newSuffix}`;
  });

  return { replaced, count: cappedCount };
}

/**
 * Replaces ALT attributes in img tags based on a storageUrl → alt mapping.
 * Uses regex instead of DOMParser to preserve original HTML formatting (important for email).
 */
export function replaceAltsInContent(content: string, altMap: Record<string, string>): ContentReplacerResult {
  if (Object.keys(altMap).length === 0) return { replaced: content, count: 0 };

  let replacedCount = 0;

  // Match entire <img ...> tag (handles multi-line with [\s\S])
  const replaced = content.replace(/<img[\s\S]*?>/gi, (imgTag) => {
    const srcMatch = imgTag.match(/\ssrc=["']([^"']+)["']/i);
    if (!srcMatch) return imgTag;

    const src = srcMatch[1];
    const newAlt = altMap[src];
    if (!newAlt) return imgTag;
    const safeAlt = escapeHtmlAttr(newAlt);

    replacedCount++;

    if (/\salt=["'][^"']*["']/i.test(imgTag)) {
      return imgTag.replace(/(\salt=["'])[^"']*(["'])/i, `$1${safeAlt}$2`);
    } else {
      return imgTag.replace(/<img/i, `<img alt="${safeAlt}"`);
    }
  });

  return { replaced, count: replacedCount };
}
