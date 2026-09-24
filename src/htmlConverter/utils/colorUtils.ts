/**
 * Utility functions for color parsing and manipulation.
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

function sanitizeColorInput(color: string): string {
  return color.replace(/!important/gi, "").trim().toLowerCase();
}

function isValidRgbChannel(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 255;
}

// CSS named colors — hand-authored/Mail-app/Word-style paste (unlike Google Docs, which
// always emits hex/rgb()) sometimes uses a bare keyword (`style="color: red"`). Not the
// full ~150-entry CSS Color Module list, just the subset most likely to show up in real
// pasted content; extending this table further (if a gap surfaces) is safe — it only
// ever adds a recognized color, never changes an existing one.
const NAMED_COLORS: Record<string, RGB> = {
  black: { r: 0, g: 0, b: 0 },
  silver: { r: 192, g: 192, b: 192 },
  gray: { r: 128, g: 128, b: 128 },
  grey: { r: 128, g: 128, b: 128 },
  white: { r: 255, g: 255, b: 255 },
  maroon: { r: 128, g: 0, b: 0 },
  red: { r: 255, g: 0, b: 0 },
  purple: { r: 128, g: 0, b: 128 },
  fuchsia: { r: 255, g: 0, b: 255 },
  magenta: { r: 255, g: 0, b: 255 },
  green: { r: 0, g: 128, b: 0 },
  lime: { r: 0, g: 255, b: 0 },
  olive: { r: 128, g: 128, b: 0 },
  yellow: { r: 255, g: 255, b: 0 },
  navy: { r: 0, g: 0, b: 128 },
  blue: { r: 0, g: 0, b: 255 },
  teal: { r: 0, g: 128, b: 128 },
  aqua: { r: 0, g: 255, b: 255 },
  cyan: { r: 0, g: 255, b: 255 },
  orange: { r: 255, g: 165, b: 0 },
  pink: { r: 255, g: 192, b: 203 },
  brown: { r: 165, g: 42, b: 42 },
  darkred: { r: 139, g: 0, b: 0 },
  darkgreen: { r: 0, g: 100, b: 0 },
  lightgreen: { r: 144, g: 238, b: 144 },
  crimson: { r: 220, g: 20, b: 60 },
  gold: { r: 255, g: 215, b: 0 },
  indigo: { r: 75, g: 0, b: 130 },
  violet: { r: 238, g: 130, b: 238 },
  lightgray: { r: 211, g: 211, b: 211 },
  lightgrey: { r: 211, g: 211, b: 211 },
  darkgray: { r: 169, g: 169, b: 169 },
  darkgrey: { r: 169, g: 169, b: 169 },
  dimgray: { r: 105, g: 105, b: 105 },
  dimgrey: { r: 105, g: 105, b: 105 },
};

/**
 * Parses a color string (Hex, RGB, or a common CSS named color) into an RGB object.
 * Returns null if the color cannot be parsed.
 */
export function parseColor(color: string): RGB | null {
  color = sanitizeColorInput(color);

  if (color in NAMED_COLORS) return NAMED_COLORS[color];

  // Handle Hex (#RRGGBB, #RGB, #RRGGBBAA, #RGBA)
  if (color.startsWith("#")) {
    const hex = color.substring(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
      return { r, g, b };
    } else if (hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
      return { r, g, b };
    } else if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
      return { r, g, b };
    } else if (hex.length === 8) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
      return { r, g, b };
    }
    return null;
  }

  // Handle RGB (rgb(r, g, b) or rgba(r, g, b, a))
  // We ignore alpha for link detection purposes
  if (color.startsWith("rgb")) {
    const match = color.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(?:\d*\.?\d+))?\s*\)$/);
    if (!match) return null;

    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    if (!isValidRgbChannel(r) || !isValidRgbChannel(g) || !isValidRgbChannel(b)) return null;

    return { r, g, b };
  }

  return null;
}

/**
 * Determines if a color is "blue-ish" or "purple-ish" enough to be considered a link.
 * Heuristic: Blue component must be significantly stronger than Red and Green.
 * Or strictly speaking for links: Blue is usually the dominant channel.
 */
export function isBlueish(color: string): boolean {
  const rgb = parseColor(color);
  if (!rgb) return false;

  const { r, g, b } = rgb;

  // Basic Heuristic:
  // 1. Blue must be the dominant or co-dominant color.
  // 2. It shouldn't be grayscale (where r ~= g ~= b).
  // 3. Covers standard blues (#0000FF, #1155CC) and purples (#551A8B).

  // Filter out dark colors (black/dark gray) where all channels are low
  // e.g., #000000 -> not a link
  if (r < 40 && g < 40 && b < 40) return false;

  // Filter out grays/whites where channels are close
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 30) return false; // Too close to grayscale

  // For Blue/Purple links:
  // Blue should be greater than Green (avoids teals/cyans being false positives if desired, although some links are teal)
  // Blue should be greater than Red OR Red and Blue are both high (Purple)

  // Specific check for standard Google Docs/Web blues:
  // - Blue is usually the highest channel.
  if (b > r && b > g) return true;

  // Check for Purples (High Red + High Blue, Low Green)
  // e.g. #551A8B (Purple link) -> R:85, G:26, B:139. B > G (true), B > R (true)
  // e.g. Magenta #FF00FF -> R:255, G:0, B:255. B == R.

  if (b >= r && b > g) return true;

  return false;
}

/**
 * Public helper for link color detection. Keeps formatting code free from color heuristics.
 */
export function isLinkColor(color: string): boolean {
  return isBlueish(color);
}

// Minimum channel spread (max-min, 0-255 scale) for a color to be considered "not gray/black/
// white" at all — lower than isBlueish's own 30, since this classifier's job is to catch even
// muted/dark reds and greens (e.g. #8B0000, #2F4F2F), not to conservatively rule out uncertainty.
const CHROMA_THRESHOLD = 15;
// Hue tolerance (degrees) around the two bucket centers. Green gets a wider window than red
// because "green" covers a visually broader range (yellow-green to teal-adjacent) in casual use.
const RED_HUE_TOLERANCE = 18;
const GREEN_HUE_TOLERANCE = 30;
const RED_HUE_CENTER = 0;
const GREEN_HUE_CENTER = 120;
// Above this normalized HSL lightness, a color reads as a pastel tint (e.g. pink, mint) rather
// than "red"/"green" even when its hue sits right on the red/green center — without this, a
// light pink (~hue 350°, very close to red's 0°) would misclassify as red.
const MAX_LIGHTNESS_FOR_BUCKET = 0.75;

function computeHueDegrees(r: number, g: number, b: number): number {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  if (delta === 0) return 0;

  let hue: number;
  if (max === rn) hue = ((gn - bn) / delta) % 6;
  else if (max === gn) hue = (bn - rn) / delta + 2;
  else hue = (rn - gn) / delta + 4;

  hue *= 60;
  if (hue < 0) hue += 360;
  return hue;
}

function hueDistance(hue: number, center: number): number {
  const diff = Math.abs(hue - center);
  return Math.min(diff, 360 - diff);
}

/**
 * Classifies a color as a "red" or "green" bucket for the simple converter's experimental
 * text-color passthrough — matches by hue (not raw channel dominance) so a red-dominant color
 * like orange (#FFA500) doesn't get mistaken for red. Grays/blacks/whites (low chroma) and
 * pastel tints (high lightness, e.g. pink/mint) are excluded — they fall through to `null`
 * exactly like any other unrecognized color (blue/purple/orange/teal/yellow/etc.).
 */
export function classifyColorBucket(color: string): "red" | "green" | null {
  const rgb = parseColor(color);
  if (!rgb) return null;

  const { r, g, b } = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < CHROMA_THRESHOLD) return null;

  const lightness = (max + min) / 2 / 255;
  if (lightness > MAX_LIGHTNESS_FOR_BUCKET) return null;

  const hue = computeHueDegrees(r, g, b);
  if (hueDistance(hue, RED_HUE_CENTER) <= RED_HUE_TOLERANCE) return "red";
  if (hueDistance(hue, GREEN_HUE_CENTER) <= GREEN_HUE_TOLERANCE) return "green";
  return null;
}
