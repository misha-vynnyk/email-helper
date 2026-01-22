/**
 * Paste handler utilities for HTML converter
 */

import { IMAGE_EXCLUSION_ALT_REGEX } from "./constants";

type LogFunction = (msg: string) => void;

/** Exclude from extraction: img with alt containing "Signature" (e.g. sign-i, sign-i-e) */
export function isSignatureImageAlt(alt: string | null): boolean {
  return !!(alt && IMAGE_EXCLUSION_ALT_REGEX.test(alt));
}

/** Exclude from URL replacement: <img> / <mj-image> tag with alt containing "Signature" */
export function isSignatureImageTag(tag: string): boolean {
  return /\balt=["'][^"']*Signature/i.test(tag);
}

export function setupPasteHandler(editorElement: HTMLElement, log: LogFunction): void {
  // Paste handler setup - no logging needed, images are processed automatically
  editorElement.addEventListener('paste', () => {
    // Handler exists for potential future functionality
  });
}
