/**
 * Banner-specific spell correction utilities
 */

// Dictionary of common CTA and banner words
export const BANNER_DICT = new Set<string>([
  // CTA
  "CLICK",
  "HERE",
  "LEARN",
  "MORE",
  "READ",
  "SUBSCRIBE",
  "SIGN",
  "UP",
  "BUY",
  "NOW",
  "SHOP",
  "VIEW",
  // common
  "THE",
  "OF",
  "AND",
  "TO",
  "IN",
  "FOR",
  "ON",
  "WITH",
  "YOUR",
  "NEW",
  "AI",
  "AN",
  "THAN",
  "THIS",
  "COULD",
  "BE",
  "WORSE",
  "EX",
  "HEDGE",
  "FUND",
  "MANAGER",
  "FINANCIAL",
  "RECKONING",
  "BUBBLE",
  // some domain words we already saw / expect
  "APOCALYPSE",
  "HORSEMEN",
  "FOUR",
  // Marketing extras
  "FREE", "SAVE", "DEAL", "OFFER", "LIMITED", "EXCLUSIVE",
  "WATCH", "DISCOVER", "JOIN", "START", "GET",
  "IS", "IT", "AT", "BY", "OR", "AS",
]);

/**
 * Normalize a word for spell checking
 */
export function normalizeForSpell(word: string): string {
  return word
    .toUpperCase()
    .replace(/0/g, "O")
    .replace(/1/g, "I")
    .replace(/5/g, "S")
    .replace(/8/g, "B")
    .replace(/[^A-Z]/g, "");
}

/**
 * Compute Levenshtein distance with early termination
 */
export function levenshteinWithin(a: string, b: string, maxDist: number): number | null {
  // classic DP with early exit, optimized for small maxDist
  const al = a.length;
  const bl = b.length;
  if (Math.abs(al - bl) > maxDist) return null;
  if (al === 0) return bl <= maxDist ? bl : null;
  if (bl === 0) return al <= maxDist ? al : null;

  const prev = new Array<number>(bl + 1);
  const cur = new Array<number>(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;

  for (let i = 1; i <= al; i++) {
    cur[0] = i;
    let rowMin = cur[0];
    const ai = a.charCodeAt(i - 1);
    for (let j = 1; j <= bl; j++) {
      const cost = ai === b.charCodeAt(j - 1) ? 0 : 1;
      const v = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + cost
      );
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > maxDist) return null;
    for (let j = 0; j <= bl; j++) prev[j] = cur[j];
  }

  return prev[bl] <= maxDist ? prev[bl] : null;
}

/**
 * Spell-correct a single banner token
 */
export function spellCorrectBannerToken(token: string): string {
  const raw = token;
  const cleaned = normalizeForSpell(raw);
  if (cleaned.length === 0) return raw;
  if (BANNER_DICT.has(cleaned)) return cleaned;

  // Don't try to correct very short tokens; instead we drop them in cleanupAltCandidate.
  if (cleaned.length < 4) return cleaned;

  // Heuristic: only run if token looks suspicious.
  const suspicious =
    /[0-9]/.test(raw) ||
    /[|]/.test(raw) ||
    /[A-Z]{2,}[a-z]/.test(raw) ||
    /[Il]{2,}/.test(raw) ||
    // All-caps unknown tokens are often OCR glitches worth attempting to correct.
    (/^[A-Z]{4,}$/.test(cleaned) && !BANNER_DICT.has(cleaned));
  if (!suspicious) return cleaned;

  const maxDist = cleaned.length <= 5 ? 1 : 2;
  let best: { w: string; d: number } | null = null;
  for (const w of BANNER_DICT) {
    const d = levenshteinWithin(cleaned, w, maxDist);
    if (d == null) continue;
    if (!best || d < best.d || (d === best.d && w.length === cleaned.length)) {
      best = { w, d };
      if (d === 0) break;
    }
  }
  return best ? best.w : cleaned;
}

/**
 * Try to split glued ALL-CAPS tokens into dictionary words
 * Example: "CLICKHERE" -> "CLICK HERE"
 */
export function splitTokenByDict(token: string): string | null {
  const t = token.toUpperCase().replace(/[^A-Z]/g, "");
  if (t.length < 6 || t.length > 18) return null;

  const memo = new Map<number, string[] | null>();
  const maxParts = 4;

  const dfs = (i: number, parts: string[]): string[] | null => {
    if (i === t.length) return parts.length >= 2 ? parts : null;
    if (parts.length >= maxParts) return null;
    const cached = memo.get(i);
    if (cached) return [...cached];
    if (cached === null) return null;

    // prefer longer words first
    for (let len = Math.min(10, t.length - i); len >= 2; len--) {
      const seg = t.slice(i, i + len);
      if (!BANNER_DICT.has(seg)) continue;
      const out = dfs(i + len, [...parts, seg]);
      if (out) {
        memo.set(i, out);
        return out;
      }
    }

    memo.set(i, null);
    return null;
  };

  const best = dfs(0, []);
  return best ? best.join(" ") : null;
}

/**
 * Apply universal post-fixes to banner text
 */
export function postFixBannerText(text: string): string {
  // Universal (non-banner-specific) post-fixes:
  // - split glued dictionary words (CLICKHERE, THANANAI, BEWORSE, ...)
  // - fix a couple of very common OCR confusions around "AI"
  const splitFixed = text.replace(/\b[A-Za-z]{6,}\b/g, (m) => {
    const rep = splitTokenByDict(m);
    return rep ? rep : m;
  });

  return (
    splitFixed
      // normalize weird '=' often misread in CTA context
      .replace(/\bCLICK\s*[=]\b/gi, "CLICK")
      // "AN AL" is a common OCR confusion for "AN AI" on banners
      .replace(/\bAN\s+AL\b/gi, "AN AI")
      .replace(/\bTHAN\s+AN\s+AL\b/gi, "THAN AN AI")
  );
}

/**
 * Spell-correct all tokens in banner text
 */
export function spellCorrectBannerText(text: string): string {
  // Replace A-Z/0-9 tokens with corrected versions; keep punctuation/spaces.
  return text.replace(/[A-Za-z0-9]+/g, (m) => {
    const up = spellCorrectBannerToken(m);
    // Preserve original casing style lightly: if original was lower, keep lower.
    if (m === m.toLowerCase()) return up.toLowerCase();
    return up;
  });
}
