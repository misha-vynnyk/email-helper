/**
 * Paste handler utilities for HTML converter
 */

import { IMAGE_EXCLUSION_ALT_REGEX } from "./constants";

/** Exclude from extraction: img with alt containing "Signature" (e.g. sign-i, sign-i-e) */
export function isSignatureImageAlt(alt: string | null): boolean {
  return !!(alt && IMAGE_EXCLUSION_ALT_REGEX.test(alt));
}

/** Exclude from URL replacement: <img> / <mj-image> tag with alt containing "Signature" */
export function isSignatureImageTag(tag: string): boolean {
  return /\balt=["'][^"']*Signature/i.test(tag);
}
