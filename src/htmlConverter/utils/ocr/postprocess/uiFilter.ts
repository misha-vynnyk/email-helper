/**
 * UI filtering and suggestion extraction utilities
 */

import { cleanOcrText, normalizeOcrLine, cleanupAltCandidate, truncateAlt, isAllCapsLike, isTitleCaseLike } from "./cleanup";

/**
 * Filter OCR text for UI display by removing noise and junk
 */
export function filterOcrTextForUi(text: string): string {
  const lines = cleanOcrText(text)
    .split("\n")
    .map(normalizeOcrLine)
    .filter(Boolean);

  const out: string[] = [];
  const seen = new Set<string>();
  const allowedShortAllCaps = new Set([
    "AI",
    "AN",
    "AS",
    "AT",
    "BE",
    "BY",
    "DO",
    "EX",
    "GO",
    "IF",
    "IN",
    "IS",
    "IT",
    "MY",
    "NO",
    "OF",
    "OK",
    "ON",
    "OR",
    "TO",
    "UP",
    "US",
    "WE",
  ]);
  const common3 = new Set([
    "ALL",
    "AND",
    "ANY",
    "ARE",
    "BUT",
    "BUY",
    "CAN",
    "DID",
    "FOR",
    "GET",
    "HIS",
    "HER",
    "HOW",
    "NEW",
    "NOT",
    "NOW",
    "OUR",
    "OUT",
    "SEE",
    "THE",
    "TOP",
    "TRY",
    "USE",
    "WHY",
    "WIN",
    "YOU",
  ]);

  const isWordLikeToken = (token: string): boolean => {
    const core = token.replace(/[^A-Za-z0-9]/g, "");
    if (!core) return false;
    if (/^\d{4}$/.test(core)) return true; // years like 2026
    if (/^\d+$/.test(core)) return false; // other numbers are not "words"
    const up = core.toUpperCase();
    if (up.length >= 4) return true;
    if (up.length === 3) return common3.has(up);
    if (up.length === 2) return allowedShortAllCaps.has(up);
    return false;
  };

  const normalizeUiLine = (line: string): string => {
    const raw = line.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
    if (!raw) return raw;
    const parts = raw.split(" ").filter(Boolean);
    // Drop trailing 1–3 letter junk tokens (e.g. "gg", "gf", "gid", "Jo") unless they look like real short words.
    while (parts.length > 1) {
      const last = parts[parts.length - 1];
      const letters = last.replace(/[^A-Za-z]/g, "");
      const isAllCaps = letters.length > 0 && letters === letters.toUpperCase();
      if (
        letters.length > 0 &&
        letters.length <= 3
      ) {
        const up = letters.toUpperCase();
        const keep =
          (letters.length === 2 && isAllCaps && allowedShortAllCaps.has(up)) ||
          (letters.length === 3 && common3.has(up)) ||
          /^\d{4}$/.test(letters);
        if (keep) break;
        parts.pop();
        continue;
      }
      break;
    }
    return parts.join(" ").trim();
  };

  for (const l of lines) {
    const line = normalizeUiLine(l);
    if (line.length < 2) continue;
    if (line.length > 200) continue;
    if (!/[a-zA-Z0-9]/.test(line)) continue;
    if (/^[|_.,\-–—=]+$/.test(line)) continue;
    if (/^[ilI|]{1,6}$/.test(line)) continue;
    if (/(.)\\1{5,}/.test(line)) continue; // "RRRRRR"

    const tokens = line.split(/\s+/).filter(Boolean);
    const letters = (line.match(/[A-Za-z]/g) || []).length;
    const alphaNum = (line.match(/[a-zA-Z0-9]/g) || []).length;
    const nonWord = (line.match(/[^a-zA-Z0-9\s]/g) || []).length;

    // Single-word lines (FINANCIAL / RECKONING / CLICK) are valid if long enough.
    if (tokens.length === 1) {
      if (letters < 4) continue;
    } else {
      // Require at least 2 "word-like" tokens (allows BE/AN/AI etc).
      const wordLikeTokens = tokens.filter(isWordLikeToken).length;
      if (wordLikeTokens < 2) continue;

      // Drop lines that are mostly tiny non-word-like tokens (typical OCR garbage).
      if (tokens.length >= 4) {
        const tinyNonWordLike = tokens.filter((t) => {
          const core = t.replace(/[^A-Za-z0-9]/g, "");
          if (!core) return true;
          if (core.length > 2) return false;
          return !isWordLikeToken(core);
        }).length;
        if (tinyNonWordLike / tokens.length > 0.5) continue;
      }

      // If it's very long but lacks enough letters, it's usually noise.
      if (tokens.length >= 8 && letters < 18) continue;

      // Universal noise killer: if a multi-token line has too few "word-like" tokens,
      // it's almost always garbage like "BIL COE TEE ONG".
      const wordLike = wordLikeTokens;
      if (tokens.length >= 5 && wordLike / tokens.length < 0.6) continue;
    }

    if (alphaNum > 0 && nonWord / (alphaNum + nonWord) > 0.45) continue;
    if (/\bhttps?:\/\//i.test(line)) continue;

    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }

  return out.join("\n").trim();
}

/**
 * Pick one-word name candidates from alt suggestions
 */
export function pickOneWordNameCandidates(altCandidates: string[]): string[] {
  const candidates: string[] = [];
  for (const alt of altCandidates) {
    const words = alt
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .filter((w) => w.length >= 3 && w.length <= 20);
    const best = words[0];
    if (best && !candidates.includes(best)) candidates.push(best);
    if (candidates.length >= 3) break;
  }
  return candidates;
}

/**
 * Extract suggestions for alt text, CTA, and image names from OCR text
 */
export function extractOcrSuggestions(ocrText: string): {
  altSuggestions: string[];
  ctaSuggestions: string[];
  nameSuggestions: string[];
} {
  const rawLines = cleanOcrText(ocrText)
    .split("\n")
    .map(normalizeOcrLine)
    .filter(Boolean);

  const isJunk = (l: string) => {
    if (l.length < 2) return true;
    // Don't hard-drop long lines too aggressively:
    // Tesseract sometimes returns a whole banner headline as one long line.
    if (l.length > 320) return true;
    if (!/[a-zA-Z0-9]/.test(l)) return true;
    if (/^[|_.,\-–—=]+$/.test(l)) return true;
    if (/^[ilI|]{1,4}$/.test(l)) return true;
    const nonWord = (l.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const alphaNum = (l.match(/[a-zA-Z0-9]/g) || []).length;
    if (alphaNum > 0 && nonWord / (alphaNum + nonWord) > 0.5) return true;
    if (/\bhttps?:\/\//i.test(l)) return true;
    return false;
  };

  const isCta = (l: string) =>
    /\b(click here|learn more|read more|sign up|subscribe|buy now|shop now|view more)\b/i.test(l);

  const unique: Array<{ l: string; idx: number }> = [];
  for (let idx = 0; idx < rawLines.length; idx++) {
    const l = rawLines[idx];
    if (isJunk(l)) continue;
    const key = l.toLowerCase();
    if (!unique.some((x) => x.l.toLowerCase() === key)) unique.push({ l, idx });
  }

  const ctaLines: string[] = [];
  const contentLines: Array<{ l: string; idx: number }> = [];
  for (const it of unique) {
    if (isCta(it.l)) ctaLines.push(it.l);
    else contentLines.push(it);
  }

  const scoreLine = (l: string) => {
    const len = l.length;
    const words = l.split(/\s+/).filter(Boolean).length;
    const alphaNum = (l.match(/[a-zA-Z0-9]/g) || []).length;
    const symbols = (l.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const capsBonus = isAllCapsLike(l) ? 18 : 0;
    const titleBonus = isTitleCaseLike(l) ? 10 : 0;
    const idealLenBonus = len >= 8 && len <= 80 ? 18 : len >= 3 && len <= 120 ? 8 : -8;
    return (
      alphaNum * 0.5 +
      Math.min(words, 10) * 6 +
      idealLenBonus +
      capsBonus +
      titleBonus -
      symbols * 2
    );
  };

  const top = (lines: Array<{ l: string; idx: number }>, n: number) =>
    lines
      .map((it) => ({ ...it, s: scoreLine(it.l) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => cleanupAltCandidate(truncateAlt(x.l)))
      .filter(Boolean)
      .slice(0, n);

  const altSuggestions = top(contentLines, 3);
  const ctaSuggestions = ctaLines
    .map((l) => cleanupAltCandidate(truncateAlt(l)))
    .filter(Boolean)
    .slice(0, 2);

  // CTA fallback: if OCR caught "CLICK" but missed the second word, suggest "CLICK HERE".
  // This is intentionally narrow to avoid hallucination.
  const sawClick = unique.some((x) => /\bclick\b/i.test(x.l));
  const hasCtaAlready = ctaSuggestions.some((x) => /\b(click here|learn more|read more|sign up)\b/i.test(x));
  if (sawClick && !hasCtaAlready) {
    ctaSuggestions.unshift("CLICK HERE");
  }

  // Build a combined headline from best 2-3 content lines (by score), preserving original order.
  const topForHeadline = contentLines
    .map((it) => ({ ...it, s: scoreLine(it.l) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .sort((a, b) => a.idx - b.idx)
    .map((x) => x.l);
  const combinedHeadline = cleanupAltCandidate(truncateAlt(topForHeadline.join(" ")));
  const altWithHeadline =
    combinedHeadline &&
    !altSuggestions.some((s) => s.toLowerCase() === combinedHeadline.toLowerCase())
      ? [combinedHeadline, ...altSuggestions]
      : altSuggestions;

  const nameSuggestions = pickOneWordNameCandidates(
    altWithHeadline.length > 0 ? altWithHeadline : ctaSuggestions
  );

  return { altSuggestions: altWithHeadline.slice(0, 3), ctaSuggestions, nameSuggestions };
}
