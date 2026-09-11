/**
 * Test-only adapter over `simple/formatter.ts` matching the call signature of
 * the now-deleted per-profile legacy forks (root `formatter.ts`,
 * `ttt/formatter.ts`, `alphaone/formatter.ts`) — `formatHtml(editorContent,
 * oneBrSymbol?)` instead of `simple/formatter.ts`'s
 * `formatHtml(editorContent, tok, tmpl, oneBrSymbol?)` — so tests written
 * against the old forks keep working against the live implementation with
 * only an import change.
 */
import { buildSimpleTemplates } from "../simple/config/templates";
import { mergeSimpleTokens, tokens as simpleTokens } from "../simple/config/tokens";
import type { SimpleTokensOverride } from "../simple/config/tokens";
import { formatHtml as formatHtmlSimple, formatMjml as formatMjmlSimple } from "../simple/formatter";
import { profile as alphaoneProfile } from "../simple/profiles/alphaone";
import { profile as defaultProfile } from "../simple/profiles/default";
import { profile as redProfile } from "../simple/profiles/red";
import { profile as tttProfile } from "../simple/profiles/ttt";

function makeFormatters(profileOverride: SimpleTokensOverride) {
  const tok = mergeSimpleTokens(simpleTokens, profileOverride);
  const tmpl = buildSimpleTemplates(tok);
  return {
    formatHtml: (editorContent: string, oneBrSymbol?: string) => formatHtmlSimple(editorContent, tok, tmpl, oneBrSymbol),
    formatMjml: (editorContent: string, oneBrSymbol?: string) => formatMjmlSimple(editorContent, tok, tmpl, oneBrSymbol),
  };
}

const defaultFormatters = makeFormatters(defaultProfile);
const tttFormatters = makeFormatters(tttProfile);
const alphaoneFormatters = makeFormatters(alphaoneProfile);
const redFormatters = makeFormatters(redProfile);

export const formatHtmlDefault = defaultFormatters.formatHtml;
export const formatMjmlDefault = defaultFormatters.formatMjml;
export const formatHtmlTTT = tttFormatters.formatHtml;
export const formatMjmlTTT = tttFormatters.formatMjml;
export const formatHtmlAlphaone = alphaoneFormatters.formatHtml;
export const formatMjmlAlphaone = alphaoneFormatters.formatMjml;
export const formatHtmlRed = redFormatters.formatHtml;
export const formatMjmlRed = redFormatters.formatMjml;
