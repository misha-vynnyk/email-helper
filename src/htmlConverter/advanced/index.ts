// Advanced HTML Converter — full pipeline.
// See ADVANCED_HTML_CONVERTER.md §10 for phase descriptions.

import { cleanEmptyHtmlTags, replaceTripleBrWithSingle } from "../utils/htmlUtils";
import { buildTemplates, templates as defaultTemplates } from "./config/templates";
import type { TokensOverride } from "./config/tokens";
import { mergeTokens,tokens } from "./config/tokens";
import { classify } from "./detect/classify";
import { fromDom } from "./ir/fromDom";
import { normalize } from "./normalize";
import { normalizeSymbols,preprocess } from "./preprocess";
import { renderAll } from "./render/toEmailHtml";

export function convertAdvanced(rawHtml: string, override: TokensOverride = {}): string {
  const hasOverride = Object.keys(override).length > 0;
  const tok  = hasOverride ? mergeTokens(tokens, override) : tokens;
  const tmpl = hasOverride ? buildTemplates(tok)           : defaultTemplates;

  const html        = preprocess(rawHtml);
  const bodyEl      = normalize(html);
  const structural  = fromDom(bodyEl);
  const components  = classify(structural);
  const rows        = renderAll(components, tmpl, tok);

  let result = tmpl.document(rows);
  result = normalizeSymbols(result);
  result = cleanEmptyHtmlTags(result);
  result = replaceTripleBrWithSingle(result);
  return result;
}
