/**
 * OCR text cleanup and normalization utilities
 */

/**
 * Clean OCR text by normalizing whitespace and line breaks
 */
export function cleanOcrText(text: string): string {
  return (
    text
      .replace(/\r/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/**
 * Truncate alt text to maximum length, breaking at word boundaries
 */
export function truncateAlt(text: string, maxLen = 130): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= maxLen) return t;
  const sliced = t.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(" ");
  return (lastSpace > 30 ? sliced.slice(0, lastSpace) : sliced).trim();
}

import { ALLOWED_SHORT_ALL_CAPS } from "../constants";

/**
 * Clean up an alt text candidate by removing trailing junk tokens
 */
export function cleanupAltCandidate(text: string): string {
  // Normalize whitespace + strip weird trailing junk tokens.
  const t = text
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return t;

  const words = t.split(" ").filter(Boolean);
  if (words.length <= 2) return t;

  const last = words[words.length - 1];
  const letters = last.replace(/[^A-Za-z]/g, "");
  const isAllCaps = letters.length > 0 && letters === letters.toUpperCase();

  // Drop trailing 1–2 letter non-caps tokens (e.g. "Jo") but keep "AI", "OF".
  if (letters.length > 0 && letters.length <= 2 && (!isAllCaps || !ALLOWED_SHORT_ALL_CAPS.has(letters))) {
    words.pop();
    return words.join(" ").trim();
  }

  return t;
}

/**
 * Normalize an OCR line by cleaning quotes and whitespace
 */
export function normalizeOcrLine(line: string): string {
  return line
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Check if text is mostly ALL CAPS
 */
export function isAllCapsLike(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 4) return false;
  const upper = letters.replace(/[^A-Z]/g, "").length;
  return upper / letters.length >= 0.85;
}

/**
 * Check if text is in Title Case
 */
export function isTitleCaseLike(text: string): boolean {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2) return false;
  const scored: number[] = words
    .filter((w) => /^[A-Za-z]/.test(w))
    .map((w) => (w[0] === w[0].toUpperCase() ? 1 : 0));
  if (scored.length < 2) return false;
  const ratio = scored.reduce((a, b) => a + b, 0) / scored.length;
  return ratio >= 0.6;
}

/**
 * Build a clean OCR summary by deduplicating and merging lines
 */
export function buildCleanOcrSummary(text: string): string {
  const filtered = text; // Assume already filtered
  if (!filtered) return "";

  // Keep order. Filtering already removed most junk; reordering here was causing wrong sentence order.
  const inputLines = filtered.split("\n").map((l) => l.trim()).filter(Boolean);
  const out: string[] = [];
  const seen = new Set<string>();
  const normKey = (line: string): string =>
    line
      .toLowerCase()
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .replace(/^["']+/, "")
      .replace(/["']+$/, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  for (const l of inputLines) {
    const key = normKey(l);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(l);
  }

  // Universal formatting: merge trailing role line with previous headline.
  // Example: "EX HEDGE FUND" + "MANAGER:" => "EX HEDGE FUND MANAGER:"
  const merged: string[] = [];
  for (const l of out) {
    const prev = merged[merged.length - 1];
    const canMerge =
      prev &&
      /:$/.test(l) &&
      !/:$/.test(prev) &&
      prev.split(/\s+/).filter(Boolean).length >= 2 &&
      prev.length <= 45 &&
      l.length <= 20 &&
      (isAllCapsLike(prev) || prev === prev.toUpperCase()) &&
      (isAllCapsLike(l) || l === l.toUpperCase());
    if (canMerge) {
      merged[merged.length - 1] = `${prev} ${l}`.trim();
    } else {
      merged.push(l);
    }
  }

  // CTA helper: if we saw CLICK but not CLICK HERE, add it at the end.
  const sawClick = merged.some((l) => /\bclick\b/i.test(l));
  const hasClickHere = merged.some((l) => /\bclick here\b/i.test(l));
  if (sawClick && !hasClickHere) merged.push("CLICK HERE");

  return merged.join("\n").trim();
}
