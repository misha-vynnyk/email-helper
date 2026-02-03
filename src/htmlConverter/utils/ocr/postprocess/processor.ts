/**
 * Efficient Single-Pass Post-processing Pipeline
 */

import { cleanOcrText, normalizeOcrLine, cleanupAltCandidate, truncateAlt, isAllCapsLike, isTitleCaseLike } from "./cleanup";
import { postFixBannerText, spellCorrectBannerText } from "./bannerSpell";
import { ALLOWED_SHORT_ALL_CAPS, COMMON_3_LETTER_WORDS } from "../constants";

type LineType = "junk" | "cta" | "content" | "year";

interface ProcessedLine {
  raw: string;
  normalized: string;
  tokens: string[];
  type: LineType;
  score: number;
  wordLikeCount: number;
}

export interface ProcessorResult {
  ocrText: string;     // for UI (clean)
  ocrTextRaw: string;  // raw-ish (just corrected)
  altSuggestions: string[];
  ctaSuggestions: string[];
  nameSuggestions: string[];
}

/**
 * Process raw OCR output in a single pass
 */
export function processOcrOutput(
  rawText: string,
  opts: { spellCorrect: boolean }
): ProcessorResult {
  // 1. Initial Cleanup & correction
  const cleaned = cleanOcrText(rawText);
  const corrected = opts.spellCorrect ? spellCorrectBannerText(cleaned) : cleaned;
  const fixed = postFixBannerText(corrected); // This is our "ocrTextRaw" (corrected but full)

  // 2. Tokenize & Analyze Lines
  const rawLines = fixed.split("\n");
  const lines: ProcessedLine[] = [];
  const seen = new Set<string>();

  for (const rawLine of rawLines) {
    const normalized = normalizeOcrLine(rawLine);
    if (!normalized) continue;

    // Deduplication
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const analysis = analyzeLine(normalized);
    if (analysis.type !== "junk") {
      lines.push({ raw: rawLine, normalized, ...analysis });
    }
  }

  // 3. Extract Artifacts
  // UI Text: Join non-junk lines
  const ocrText = lines.map(l => l.normalized).join("\n");

  // Suggestions
  const { altSuggestions, ctaSuggestions, nameSuggestions } = extractFromLines(lines);

  return {
    ocrText,
    ocrTextRaw: fixed,
    altSuggestions,
    ctaSuggestions,
    nameSuggestions
  };
}

/**
 * Analyze a single line to determine type and score
 */
function analyzeLine(line: string): { tokens: string[]; type: LineType; score: number; wordLikeCount: number } {
  const tokens = line.split(/\s+/).filter(Boolean);

  // Quick Junk Filter
  if (line.length < 2 || line.length > 320) return junk();
  if (!/[a-zA-Z0-9]/.test(line)) return junk();
  if (/^[|_.,\-–—=]+$/.test(line)) return junk(); // Only symbols
  if (/(.)\1{5,}/.test(line)) return junk(); // RRRRRR

  const alphaNum = (line.match(/[a-zA-Z0-9]/g) || []).length;
  const nonWord = (line.match(/[^a-zA-Z0-9\s]/g) || []).length;
  // Too many symbols vs letters
  if (alphaNum > 0 && nonWord / (alphaNum + nonWord) > 0.45) return junk();
  if (/\bhttps?:\/\//i.test(line)) return junk();

  // Token Analysis
  let wordLikeCount = 0;
  for (const t of tokens) {
    if (isWordLike(t)) wordLikeCount++;
  }

  // Universal Noise Killer
  if (tokens.length > 1) {
    if (tokens.length === 1 && alphaNum < 4) return junk(); // "g"

    // Require minimum word-like tokens for multi-word lines
    if (tokens.length >= 4) {
      if (wordLikeCount / tokens.length < 0.5) return junk();
    }

    // Long but no letters
    const letters = (line.match(/[A-Za-z]/g) || []).length;
    if (tokens.length >= 8 && letters < 18) return junk();
  } else {
    // Single token must be decent
    if (alphaNum < 3) return junk();
  }

  // Classification
  let type: LineType = "content";
  if (/\b(click|learn|read|sign|subscribe|buy|shop|view)\s+(here|more|up|now)\b/i.test(line)) type = "cta";
  else if (/^\d{4}$/.test(line) || /\b(19|20)\d{2}\b/.test(line)) type = "year";
  else if (/\b(click|subscribe)\b/i.test(line)) type = "cta";

  // Scoring
  const len = line.length;
  const capsBonus = isAllCapsLike(line) ? 18 : 0;
  const titleBonus = isTitleCaseLike(line) ? 10 : 0;
  const idealLenBonus = len >= 8 && len <= 80 ? 18 : len >= 3 && len <= 120 ? 8 : -8;
  const symbols = (line.match(/[^a-zA-Z0-9\s]/g) || []).length;

  const score =
    alphaNum * 0.5 +
    Math.min(tokens.length, 10) * 6 +
    idealLenBonus +
    capsBonus +
    titleBonus -
    symbols * 2;

  return { tokens, type, score, wordLikeCount };
}

function junk() {
  return { tokens: [], type: "junk" as LineType, score: -999, wordLikeCount: 0 };
}

function isWordLike(token: string): boolean {
  const core = token.replace(/[^A-Za-z0-9]/g, "");
  if (!core) return false;
  if (/^\d{4}$/.test(core)) return true;
  if (/^\d+$/.test(core)) return false;
  const up = core.toUpperCase();
  if (up.length >= 4) return true;
  if (up.length === 3) return COMMON_3_LETTER_WORDS.has(up);
  if (up.length === 2) return ALLOWED_SHORT_ALL_CAPS.has(up);
  return false;
}

/**
 * Extract suggestions from processed lines
 */
function extractFromLines(lines: ProcessedLine[]) {
  // Sort by score for Alt suggestions
  const sorted = [...lines].sort((a, b) => b.score - a.score);

  const altSuggestions = sorted
    .filter(l => l.type === "content" && l.score > 0)
    .slice(0, 3)
    .map(l => cleanupAltCandidate(truncateAlt(l.normalized)))
    .filter(Boolean);

  const ctaSuggestions = lines
    .filter(l => l.type === "cta")
    .map(l => cleanupAltCandidate(truncateAlt(l.normalized)))
    .filter(Boolean)
    .slice(0, 2);

  // CTA fallback
  const hasStrongCta = ctaSuggestions.some(c => /\b(click here|learn more|sign up)\b/i.test(c));
  if (!hasStrongCta && lines.some(l => /\bclick\b/i.test(l.normalized))) {
    ctaSuggestions.unshift("CLICK HERE");
  }

  // Combined headline for name fallback
  const topForHeadline = sorted
    .slice(0, 3)
    .sort((a, b) => lines.indexOf(a) - lines.indexOf(b)) // maintain original order
    .map(l => l.normalized);

  const combinedHeadline = cleanupAltCandidate(truncateAlt(topForHeadline.join(" ")));
  const pool = combinedHeadline ? [combinedHeadline, ...altSuggestions] : ctaSuggestions;

  const nameSuggestions: string[] = [];
  for (const cand of pool) {
    const parts = cand.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
    for (const p of parts) {
      if (!nameSuggestions.includes(p)) nameSuggestions.push(p);
      if (nameSuggestions.length >= 3) break;
    }
    if (nameSuggestions.length >= 3) break;
  }

  return { altSuggestions, ctaSuggestions, nameSuggestions };
}
