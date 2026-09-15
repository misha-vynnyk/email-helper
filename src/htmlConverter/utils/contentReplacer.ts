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
  // The Simple converter's MJML wrapImg template (mirroring genuine MJML-compiler output
  // conventions) wraps its <img> in its own `<td style="width:Npx;">` — a SEPARATE pixel
  // value from the img's own width/max-width, sharing the exact same number only at
  // initial template-generation time. That <td> sits entirely OUTSIDE the matched <img>
  // tag, so the img-scoped replace below never touches it — the image itself would shrink
  // but its containing cell would stay at the original, larger width. Record each actual
  // change here so it can be patched in a second pass below; empty for HTML output, whose
  // equivalent wrapper has no inline pixel width to begin with (a CSS class instead), so
  // this is a safe no-op there.
  const wrappingTdWidthChanges: Array<{ from: number; to: number }> = [];

  const replaced = content.replace(pattern, (match, prefix, oldUrl, suffix) => {
    if (isSignatureImageTag(match)) return match;

    const realWidth = widths[imageIndex++];
    if (!realWidth) return match;

    let changed = false;
    let cappedWidth: number | undefined;
    let declaredWidth: number | undefined;
    let newSuffix = suffix.replace(/(\swidth=["'])(\d+)(px)?(["'])/i, (attrMatch: string, p1: string, w: string, unit: string, p4: string) => {
      declaredWidth = parseInt(w, 10);
      const capped = capImageWidth(declaredWidth, realWidth);
      cappedWidth = capped;
      if (capped === declaredWidth) return attrMatch;
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
    if (declaredWidth !== undefined && cappedWidth !== undefined && cappedWidth !== declaredWidth) {
      wrappingTdWidthChanges.push({ from: declaredWidth, to: cappedWidth });
    }
    return `${prefix}${oldUrl}${newSuffix}`;
  });

  let final = replaced;
  let cursor = 0;
  for (const { from, to } of wrappingTdWidthChanges) {
    const needle = `<td style="width:${from}px;">`;
    const idx = final.indexOf(needle, cursor);
    if (idx === -1) continue; // no such wrapper here (e.g. HTML output) — nothing to patch
    const replacement = `<td style="width:${to}px;">`;
    final = final.slice(0, idx) + replacement + final.slice(idx + needle.length);
    cursor = idx + replacement.length;
  }

  return { replaced: final, count: cappedCount };
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
