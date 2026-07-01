// Advanced HTML Converter — full pipeline.
// See ADVANCED_HTML_CONVERTER.md §10 for phase descriptions.

import { tokens, mergeTokens } from "./config/tokens";
import type { TokensOverride } from "./config/tokens";
import { buildTemplates, templates as defaultTemplates } from "./config/templates";
import { preprocess } from "./preprocess";
import { normalize } from "./normalize";
import { fromDom } from "./ir/fromDom";
import { classify } from "./detect/classify";
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

  return tmpl.document(rows);
}
