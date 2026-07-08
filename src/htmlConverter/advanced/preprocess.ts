// Pre-processing pass applied to raw HTML before the DOM-based pipeline.
// Imports utility functions from the shared htmlUtils / constants layer.

import { SYMBOLS } from "../constants";
import {
  escapeRegExp,
  mergeSimilarTags,
  replaceAllEmojisAndSymbolsExcludingHTML,
} from "../utils/htmlUtils";

/** § symbol (with any adjacent <br> elements absorbed) → a single <br> */
export function resolveOneBrSymbol(html: string, symbol: string = SYMBOLS.ONE_BR): string {
  const oneBrRe = new RegExp(
    `(?:<br\\s*/?>\\s*)*${escapeRegExp(symbol || SYMBOLS.ONE_BR)}(?:\\s*<br\\s*/?>)*`,
    "gi",
  );
  return html.replace(oneBrRe, "<br>\n");
}

/** Remove zero-width chars and encode emoji/symbols as HTML entities */
export const normalizeSymbols = replaceAllEmojisAndSymbolsExcludingHTML;

/**
 * Merge consecutive identical <p>/<h*> opening tags into one element.
 * Re-uses htmlUtils.mergeSimilarTags, then converts its [[BR_SEP]] markers
 * to plain <br> so the result is valid HTML that fromDom.ts can parse.
 */
export function mergeSimilarBlockTags(html: string): string {
  html = mergeSimilarTags(html);
  html = html.replace(/\s*\[\[BR_SEP\]\]\s*/g, "<br>");
  return html;
}

export function preprocess(html: string, oneBrSymbol?: string): string {
  html = resolveOneBrSymbol(html, oneBrSymbol);
  // normalizeSymbols is intentionally NOT called here — DOMParser in normalize()
  // decodes HTML entities back to raw characters, undoing the encoding.
  // It is applied after renderAll in index.ts instead.
  return html;
}
