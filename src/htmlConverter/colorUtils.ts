/**
 * Utility functions for color parsing and manipulation.
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Parses a color string (Hex or RGB) into an RGB object.
 * Returns null if the color cannot be parsed.
 */
export function parseColor(color: string): RGB | null {
  color = color.trim().toLowerCase();

  // Handle Hex (#RRGGBB or #RGB)
  if (color.startsWith("#")) {
    const hex = color.substring(1);
    if (hex.length === 3) {
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
    }
    return null;
  }

  // Handle RGB (rgb(r, g, b) or rgba(r, g, b, a))
  // We ignore alpha for link detection purposes
  if (color.startsWith("rgb")) {
    const match = color.match(/rgb\w*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!match) return null;
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
    };
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
