export type GoogleFontCategory = "sans-serif" | "serif" | "monospace" | "handwriting";

export interface GoogleFontEntry {
  name: string;
  category: GoogleFontCategory;
  /**
   * "variable" = true variable font (full 100..900 wght axis, requested via the compact range
   * syntax); otherwise the exact static weights this font actually ships. Verified live against
   * Google's own CSS2 API per font (not guessed) — requesting the range syntax on a non-variable
   * font is hard-rejected by Google ("400: Font family not found"), and a discrete list needs the
   * real weight set to avoid silently padding the URL with weights that don't exist.
   */
  weights: "variable" | number[];
}

const FALLBACK_STACK: Record<GoogleFontCategory, string> = {
  "sans-serif": "Arial, Helvetica, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  monospace: "'Courier New', Courier, monospace",
  handwriting: "cursive",
};

/** Curated top-50 Google Fonts — a bundled offline catalog so picking a font never requires
 * visiting fonts.google.com. Not the full 1500+ catalog; extend this list by hand if a specific
 * font is missing (see templateBuilder wiki status page for the tradeoff this was chosen over). */
export const GOOGLE_FONT_CATALOG: GoogleFontEntry[] = [
  { name: "Roboto", category: "sans-serif", weights: "variable" },
  { name: "Open Sans", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { name: "Lato", category: "sans-serif", weights: [100, 300, 400, 700, 900] },
  { name: "Montserrat", category: "sans-serif", weights: "variable" },
  { name: "Poppins", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: "Inter", category: "sans-serif", weights: "variable" },
  { name: "Nunito", category: "sans-serif", weights: [200, 300, 400, 500, 600, 700, 800, 900] },
  { name: "Nunito Sans", category: "sans-serif", weights: [200, 300, 400, 500, 600, 700, 800, 900] },
  { name: "Raleway", category: "sans-serif", weights: "variable" },
  { name: "Ubuntu", category: "sans-serif", weights: [300, 400, 500, 700] },
  { name: "Work Sans", category: "sans-serif", weights: "variable" },
  { name: "Rubik", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800, 900] },
  { name: "Mulish", category: "sans-serif", weights: [200, 300, 400, 500, 600, 700, 800, 900] },
  { name: "Quicksand", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { name: "Karla", category: "sans-serif", weights: [200, 300, 400, 500, 600, 700, 800] },
  { name: "Manrope", category: "sans-serif", weights: [200, 300, 400, 500, 600, 700, 800] },
  { name: "DM Sans", category: "sans-serif", weights: "variable" },
  { name: "Fira Sans", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: "Barlow", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: "Cabin", category: "sans-serif", weights: [400, 500, 600, 700] },
  { name: "Josefin Sans", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700] },
  { name: "Oswald", category: "sans-serif", weights: [200, 300, 400, 500, 600, 700] },
  { name: "Noto Sans", category: "sans-serif", weights: "variable" },
  { name: "Roboto Condensed", category: "sans-serif", weights: "variable" },
  { name: "IBM Plex Sans", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700] },
  { name: "Space Grotesk", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { name: "Outfit", category: "sans-serif", weights: "variable" },
  { name: "Plus Jakarta Sans", category: "sans-serif", weights: [200, 300, 400, 500, 600, 700, 800] },
  { name: "Figtree", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800, 900] },
  { name: "Sora", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700, 800] },
  { name: "Urbanist", category: "sans-serif", weights: "variable" },
  { name: "Hind", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { name: "Titillium Web", category: "sans-serif", weights: [200, 300, 400, 600, 700, 900] },
  { name: "Dosis", category: "sans-serif", weights: [200, 300, 400, 500, 600, 700, 800] },
  { name: "Comfortaa", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { name: "PT Sans", category: "sans-serif", weights: [400, 700] },
  { name: "Heebo", category: "sans-serif", weights: "variable" },
  { name: "Archivo", category: "sans-serif", weights: "variable" },
  { name: "Assistant", category: "sans-serif", weights: [200, 300, 400, 500, 600, 700, 800] },
  { name: "Public Sans", category: "sans-serif", weights: "variable" },
  { name: "Playfair Display", category: "serif", weights: [400, 500, 600, 700, 800, 900] },
  { name: "Merriweather", category: "serif", weights: [300, 400, 500, 600, 700, 800, 900] },
  { name: "Roboto Slab", category: "serif", weights: "variable" },
  { name: "PT Serif", category: "serif", weights: [400, 700] },
  { name: "Lora", category: "serif", weights: [400, 500, 600, 700] },
  { name: "Bitter", category: "serif", weights: "variable" },
  { name: "Libre Baskerville", category: "serif", weights: [400, 500, 600, 700] },
  { name: "IBM Plex Serif", category: "serif", weights: [100, 200, 300, 400, 500, 600, 700] },
  { name: "Roboto Mono", category: "monospace", weights: [100, 200, 300, 400, 500, 600, 700] },
  { name: "Source Code Pro", category: "monospace", weights: [200, 300, 400, 500, 600, 700, 800, 900] },
];

export function fontFamilyStack(name: string, category: GoogleFontCategory): string {
  return `'${name}', ${FALLBACK_STACK[category]}`;
}

/** Values must be listed in ascending (ital, wght) order — a hard requirement of the CSS2 API. */
function fontFamilyParam(font: GoogleFontEntry): string {
  const encodedName = font.name.replace(/ /g, "+");
  if (font.weights === "variable") {
    return `family=${encodedName}:ital,wght@0,100..900;1,100..900`;
  }
  const axisValues = [0, 1].flatMap((ital) => (font.weights as number[]).map((wght) => `${ital},${wght}`)).join(";");
  return `family=${encodedName}:ital,wght@${axisValues}`;
}

/** Combines any number of selected Google Fonts (by catalog name) into one <link>-ready href,
 * matching how fonts.google.com itself bundles multiple families into a single request — each
 * using its own real weight set instead of one bloated list applied uniformly to every font. */
export function buildGoogleFontsHref(fontNames: string[]): string | undefined {
  const entries = fontNames.map((name) => GOOGLE_FONT_CATALOG.find((f) => f.name === name)).filter((f): f is GoogleFontEntry => Boolean(f));
  if (entries.length === 0) return undefined;
  return `https://fonts.googleapis.com/css2?${entries.map(fontFamilyParam).join("&")}&display=swap`;
}
