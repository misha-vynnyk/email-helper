// Pre-processing pass applied to raw HTML before the DOM-based pipeline.
// Imports utility functions from the shared htmlUtils / constants layer.

import { SYMBOLS } from "../constants";
import {
  escapeRegExp,
  replaceAllEmojisAndSymbolsExcludingHTML,
} from "../utils/htmlUtils";

/**
 * § symbol (with any adjacent <br> elements absorbed) → a single <br>, tagged
 * data-one-br so fromDom.ts can tell an explicit user marker apart from a plain
 * GDocs-typed <br> — needed to detect § placed at the very end of a <p> (right
 * before </p>), which would otherwise be silently dropped as a trailing empty line.
 * No trailing "\n" in the replacement (unlike historical "<br>\n"): DOMParser turns
 * a bare newline after the tag into its own text node, and fromDom's collectRuns
 * treats a lone "\n" text node as an (unmarked) line break too — which used to
 * clobber the very data-one-br distinction this function exists to preserve.
 */
export function resolveOneBrSymbol(html: string, symbol: string = SYMBOLS.ONE_BR): string {
  const oneBrRe = new RegExp(
    `(?:<br\\s*/?>\\s*)*${escapeRegExp(symbol || SYMBOLS.ONE_BR)}(?:\\s*<br\\s*/?>)*`,
    "gi",
  );
  return html.replace(oneBrRe, '<br data-one-br="1">');
}

/** Remove zero-width chars and encode emoji/symbols as HTML entities */
export const normalizeSymbols = replaceAllEmojisAndSymbolsExcludingHTML;

export function preprocess(html: string, oneBrSymbol?: string): string {
  html = resolveOneBrSymbol(html, oneBrSymbol);
  // normalizeSymbols is intentionally NOT called here — DOMParser in normalize()
  // decodes HTML entities back to raw characters, undoing the encoding.
  // It is applied after renderAll in index.ts instead.
  return html;
}
