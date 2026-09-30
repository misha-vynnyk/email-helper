// Maps GDocs inline CSS values to IR roles — no raw px/pt values flow into ComponentNode.

export function parseStyle(style: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const decl of style.split(";")) {
    const idx = decl.indexOf(":");
    if (idx === -1) continue;
    const key = decl.slice(0, idx).trim().toLowerCase();
    const val = decl.slice(idx + 1).trim().toLowerCase();
    if (key && val) result[key] = val;
  }
  return result;
}

export function isBold(style: Record<string, string>): boolean {
  const fw = style["font-weight"] ?? "";
  if (fw === "bold") return true;
  const n = parseInt(fw);
  return !isNaN(n) && n >= 600;
}

// Returns true when font-weight is explicitly set to a non-bold value (e.g. 400 / normal).
// Used to un-inherit bold from a heading parent when a child span overrides it.
export function isExplicitNonBold(style: Record<string, string>): boolean {
  const fw = style["font-weight"];
  if (!fw) return false;
  if (fw === "normal") return true;
  const n = parseInt(fw);
  return !isNaN(n) && n < 600;
}

export function isItalic(style: Record<string, string>): boolean {
  return style["font-style"] === "italic";
}

// Returns true when font-style is explicitly set to normal (cancels inherited italic).
export function isExplicitNonItalic(style: Record<string, string>): boolean {
  return style["font-style"] === "normal";
}

export function isUnderline(style: Record<string, string>): boolean {
  return (style["text-decoration"] ?? "").includes("underline");
}

// Returns true when text-decoration is explicitly set to none (cancels inherited underline).
export function isExplicitNonUnderline(style: Record<string, string>): boolean {
  return style["text-decoration"] === "none";
}

export function getAlign(style: Record<string, string>): "left" | "center" | "right" | undefined {
  const a = style["text-align"];
  if (a === "center" || a === "right" || a === "left") return a;
  return undefined;
}

// Shared CSS px→pt ratio (96 CSS px per inch, 72pt per inch) — the one place this constant
// is declared; fromDom.ts's lengthToPt reuses it too instead of hand-rolling its own copy.
export function pxToPt(n: number): number {
  return n * (72 / 96);
}

// Parses both "Npt" and "Npx" font-size values to a plain pt number — GDocs normally emits
// pt, but px shows up too (the pre-existing normalize.test.ts fixture this feature revives
// uses font-size:18px, and the removed sizeFromStyle helper this replaces handled both
// units). Anything else (missing unit, NaN, other units) returns undefined — "no reliable
// size", not zero.
export function parseFontSizeToPt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const v = value.trim();
  const n = parseFloat(v);
  if (isNaN(n)) return undefined;
  if (v.endsWith("px")) return pxToPt(n);
  if (v.endsWith("pt")) return n;
  return undefined;
}
