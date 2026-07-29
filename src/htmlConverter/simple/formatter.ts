/**
 * Unified `formatHtml`/`formatMjml` — replaces the three near-duplicate
 * `formatter.ts`/`ttt/formatter.ts`/`alphaone/formatter.ts` pipelines with one
 * parameterized implementation driven by `SimpleTokens` + the template set
 * from `buildSimpleTemplates(tok)`.
 *
 * Stage 3 of /Users/mykhailovynnyk/.claude/plans/tidy-bubbling-oasis.md. The
 * three original files are intentionally left in place (not deleted yet) per
 * the user's request: switch the live wiring to this implementation first,
 * verify manually end-to-end, and only remove the old forks in a later,
 * separate cleanup step once confirmed.
 *
 * Cosmetic normalization (approved, same category as the whitespace
 * normalization documented in `config/templates.ts`): the synthesized
 * `<a>` style-attribute property order differed between profiles
 * (`font-family;text-decoration;font-weight;color` in default/ttt vs
 * `font-family;font-weight;color;text-decoration` in alphaone) — CSS
 * property order inside a `style` attribute has no rendering effect, so this
 * file normalizes to one consistent order everywhere.
 */
import * as colorUtils from "../utils/colorUtils";
import * as htmlUtils from "../utils/htmlUtils";
import type { buildSimpleTemplates } from "./config/templates";
import type { SimpleTokens } from "./config/tokens";

type SimpleTemplates = ReturnType<typeof buildSimpleTemplates>;

function getInlineStyleValue(style: string, property: string): string | null {
  const targetProperty = property.trim().toLowerCase();
  const declarations = style.split(";");

  for (const declaration of declarations) {
    const [rawProperty, ...rawValueParts] = declaration.split(":");
    if (!rawProperty || rawValueParts.length === 0) continue;

    if (rawProperty.trim().toLowerCase() !== targetProperty) continue;

    const rawValue = rawValueParts.join(":").trim();
    return rawValue || null;
  }

  return null;
}

function linkAnchorStyle(tok: SimpleTokens): string {
  return `font-family:${tok.fontFamily};text-decoration: underline;font-weight: 700; color: ${tok.color.link};`;
}

function italicLinks(htmlContent: string, tok: SimpleTokens): string {
  // Save native <a href="https://..."> links before stripping so they survive.
  const savedLinks: string[] = [];
  htmlContent = htmlContent.replace(/<a\s[^>]*href=(["'])(https?:\/\/[^"']+)\1[^>]*>([\s\S]*?)<\/a>/gi, (_match, _q, _href, inner) => {
    const text = inner.replace(/<[^>]+>/g, "");

    // Extract leading/trailing spaces to correctly place them OUTSIDE the link tag
    const leadingSpaceMatch = text.match(/^([\s ]*)/);
    const trailingSpaceMatch = text.match(/([\s ]*)$/);

    const leadingSpaces = leadingSpaceMatch ? leadingSpaceMatch[1] : "";
    const trailingSpaces = trailingSpaceMatch ? trailingSpaceMatch[1] : "";
    const coreText = text.trim();

    if (!coreText) {
      // If the link contains image(s) but no text — preserve the img tags so they
      // reach wrapTextInBlock for proper template wrapping. Without this the images
      // inside <a href="..."><img ...></a> are silently dropped.
      const imgTags = inner.match(/<img[^>]*>/gi);
      if (imgTags && imgTags.length > 0) return imgTags.join("");
      return text; // just whitespace — safe to drop
    }

    // Only the default profile checks native <a> links for italic styling and
    // wraps the text in <em> — ttt/alphaone never do this check at all.
    const hasItalic = tok.detectItalicNativeLinks && /font-style:\s*italic/i.test(inner);
    const linkContent = hasItalic ? `<em>${coreText}</em>` : coreText;
    const placeholder = `\x02LINK${savedLinks.length}\x03`;
    savedLinks.push(`<a href="${tok.placeholderHref}" style="${linkAnchorStyle(tok)}">${linkContent}</a>`);
    return `${leadingSpaces}${placeholder}${trailingSpaces}`;
  });

  htmlContent = htmlContent.replace(/<a[^>]*>/gi, "").replace(/<\/a>/gi, "");

  const regex = /(<span\b[^>]*style=(["'])[\s\S]*?\2[^>]*>[\s\S]*?<\/span>)/gi;

  htmlContent = htmlContent.replace(regex, (match) => {
    const styleMatch = match.match(/style=(["'])([\s\S]*?)\1/i);
    if (!styleMatch) return match;
    const style = styleMatch[2];
    const innerText = match.replace(/<[^>]+>/g, "");
    const color = getInlineStyleValue(style, "color");
    const fontStyle = getInlineStyleValue(style, "font-style");

    if (!color || !fontStyle || !/italic/i.test(fontStyle)) {
      return match;
    }

    if (colorUtils.isLinkColor(color)) {
      const leadingSpaceMatch = innerText.match(/^([\s ]*)/);
      const trailingSpaceMatch = innerText.match(/([\s ]*)$/);

      const leadingSpaces = leadingSpaceMatch ? leadingSpaceMatch[1] : "";
      const trailingSpaces = trailingSpaceMatch ? trailingSpaceMatch[1] : "";
      const coreText = innerText.trim();

      if (!coreText) return match;

      return `${leadingSpaces}<a href="${tok.placeholderHref}" style="${linkAnchorStyle(tok)}"><em>${coreText}</em></a>${trailingSpaces}`;
    }
    return match;
  });

  // eslint-disable-next-line no-control-regex -- \x02/\x03 are deliberate sentinel bytes marking saved-link placeholders
  htmlContent = htmlContent.replace(/\x02LINK(\d+)\x03/g, (_, i) => savedLinks[+i] ?? "");

  return htmlContent;
}

function linksStyles(htmlContent: string, tok: SimpleTokens): string {
  const reg = /<span\b[^>]*style=(["'])([\s\S]*?)\1[^>]*>([\s\S]*?)<\/span>/gi;

  htmlContent = htmlContent.replace(reg, (match, _quote, style, innerText) => {
    const color = getInlineStyleValue(style, "color");
    if (!color) return match;

    if (colorUtils.isLinkColor(color)) {
      const leadingSpaceMatch = innerText.match(/^([\s ]*)/);
      const trailingSpaceMatch = innerText.match(/([\s ]*)$/);

      const leadingSpaces = leadingSpaceMatch ? leadingSpaceMatch[1] : "";
      const trailingSpaces = trailingSpaceMatch ? trailingSpaceMatch[1] : "";
      // Avoid mutating tags internally if any exist, just strip ends
      const coreText = innerText.slice(leadingSpaces.length, innerText.length - trailingSpaces.length);

      if (!coreText) return match;

      return `${leadingSpaces}<a href="${tok.placeholderHref}" style="${linkAnchorStyle(tok)}">${coreText}</a>${trailingSpaces}`;
    }
    return match;
  });
  return htmlContent;
}

function processStyles(htmlContent: string): string {
  htmlContent = htmlContent.replace(/<b\b[^>]*>/gi, "").replace(/<\/b>/gi, "");

  // Single-pass style detection: parse style once, emit correct semantic tag
  htmlContent = htmlContent.replace(/<span[^>]*style=["']([^"']*)["'][^>]*>(.*?)<\/span>/gi, (_match: string, style: string, inner: string) => {
    const bold = /font-weight:\s*700/i.test(style);
    const italic = /font-style:\s*italic/i.test(style);
    const underline = /text-decoration(?:-line)?\s*:[^;]*\bunderline\b/i.test(style);

    if (bold && italic && underline) return `<em style="text-decoration: underline;font-weight: bold;">${inner}</em>`;
    if (italic && underline) return `<em style="text-decoration: underline;">${inner}</em>`;
    if (bold && italic) return `<b style="font-style: italic;">${inner}</b>`;
    if (bold && underline) return `<b style="text-decoration: underline;">${inner}</b>`;
    if (underline) return `<u>${inner}</u>`;
    if (bold) return `<b>${inner}</b>`;
    if (italic) return `<em>${inner}</em>`;

    return inner; // No formatting — strip the span
  });

  // Convert <div> to <p> so block structure is preserved by the paragraph formatter later
  htmlContent = htmlContent.replace(/<div[^>]*>/gi, "<p>");
  htmlContent = htmlContent.replace(/<\/div>/gi, "</p>");

  // Preserve basic spacing for tables before stripping their structure
  htmlContent = htmlContent.replace(/<\/td>(?!\s*<\/tr>)/gi, " ");
  htmlContent = htmlContent.replace(/<\/th>(?!\s*<\/tr>)/gi, " ");
  htmlContent = htmlContent.replace(/<\/tr>/gi, "<br>\n");

  // Delete table tags
  htmlContent = htmlContent.replace(/<\/?(table|tbody|thead|tr|td|th|col|colgroup)[^>]*>/gi, "");

  // Delete remaining empty/wrapper tags
  htmlContent = htmlContent.replace(/<a[^>]*>\s*<\/a>/g, " ");
  htmlContent = htmlContent.replace(/<span[^>]*>/gi, "").replace(/<\/span>/gi, "");
  htmlContent = htmlContent.replace(/<b>\s*<\/b>/g, "");

  return htmlContent;
}

function applyTemplate(content: string, regex: RegExp, templateFn: (content: string) => string): string {
  return content.replace(regex, (_match, innerContent) => templateFn(innerContent));
}

// Wraps images and the whole content in the outer block (span for default, div for ttt/alphaone).
function wrapTextInBlock(htmlContent: string, templateFn: (content: string) => string, type: "html" | "mjml", tok: SimpleTokens): string {
  // 1. Replace Images
  htmlContent = htmlContent.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, (_match, src) => templateFn(src));

  // 2. Wrap the whole result in the default block
  if (type === "html") {
    htmlContent = `<tr>
                      <td style="font-family:${tok.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-top: ${tok.blockPaddingV}; padding-bottom: ${tok.blockPaddingV};">
                                <${tok.blockWrapTag} style="font-family:${tok.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                                    ${htmlContent}
                                </${tok.blockWrapTag}>
                      </td>
                    </tr>`;
  } else {
    htmlContent = `
            <tr>
              <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                <div style="font-family:${tok.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                    ${htmlContent}
                </div>
              </td>
            </tr>
        `;
  }
  return htmlContent;
}

export function formatHtml(editorContent: string, tok: SimpleTokens, tmpl: SimpleTemplates, oneBrSymbol?: string): string {
  let content = editorContent;
  content = content.replace(/<meta[^>]*>/gi, "");
  content = content.replace(/<br\b[^>]*>/gi, "<br>");
  content = htmlUtils.mergeSimilarTags(content);
  content = italicLinks(content, tok);
  content = linksStyles(content, tok);
  content = htmlUtils.replaceAllEmojisAndSymbolsExcludingHTML(content);
  content = processStyles(content);

  // Block Wrappers
  content = applyTemplate(content, /<p[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/p>/gi, tmpl.htmlTemplates.centerText);
  content = applyTemplate(content, /<h6[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h6>/gi, tmpl.htmlTemplates.smallCenterText);
  content = applyTemplate(content, /<h6[^>]*>([\s\S]*?)<\/h6>/gi, tmpl.htmlTemplates.smallText);
  content = applyTemplate(content, /<h1[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h1>/gi, tmpl.htmlTemplates.centerHeadline);
  content = applyTemplate(content, /<h1[^>]*>([\s\S]*?)<\/h1>/gi, tmpl.htmlTemplates.headline);
  content = applyTemplate(content, /<h5[^>]*>([\s\S]*?)<\/h5>/gi, tmpl.htmlTemplates.button);
  content = applyTemplate(content, /<h4[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h4>/gi, tmpl.htmlTemplates.centerQuote);
  content = applyTemplate(content, /<h4[^>]*>([\s\S]*?)<\/h4>/gi, tmpl.htmlTemplates.quote);

  content = htmlUtils.addBrAfterClosingP(content);
  content = content.replace(/\s*\[\[BR_SEP\]\]\s*/g, "\n<br><br>\n");
  content = htmlUtils.removeStylesFromLists(content);

  // Complex wrapping (Images + Body)
  content = wrapTextInBlock(content, tmpl.htmlTemplates.wrapImg, "html", tok);

  // More wrappers
  content = applyTemplate(content, /i-r-s([\s\S]*?)i-r-s-e/gi, tmpl.htmlTemplates.rightSideImg);
  content = applyTemplate(content, /i-l-s([\s\S]*?)i-l-s-e/gi, tmpl.htmlTemplates.leftSideImg);
  content = applyTemplate(content, /sign-i([\s\S]*?)sign-i-e/gi, tmpl.htmlTemplates.signatureImg);
  content = applyTemplate(content, /ftr-s([\s\S]*?)ftr-e/gi, tmpl.htmlTemplates.footerBlock);
  content = applyTemplate(content, /ftr-c([\s\S]*?)ftr-c-e/gi, tmpl.htmlTemplates.footerCenterBlock);

  content = htmlUtils.cleanEmptyHtmlTags(content);
  content = tmpl.htmlTemplates.fullStructure(content);
  content = htmlUtils.addOneBr(content, oneBrSymbol);
  content = htmlUtils.replaceTripleBrWithSingle(content);

  return content;
}

export function formatMjml(editorContent: string, tok: SimpleTokens, tmpl: SimpleTemplates, oneBrSymbol?: string): string {
  let content = editorContent;
  content = content.replace(/<meta[^>]*>/gi, "");
  content = content.replace(/<br\b[^>]*>/gi, "<br>");
  content = htmlUtils.mergeSimilarTags(content);
  content = italicLinks(content, tok);
  content = linksStyles(content, tok);
  content = htmlUtils.replaceAllEmojisAndSymbolsExcludingHTML(content);
  content = processStyles(content);

  // Block Wrappers
  content = applyTemplate(content, /<p[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/p>/gi, tmpl.mjmlTemplates.centerText);
  content = applyTemplate(content, /<h6[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h6>/gi, tmpl.mjmlTemplates.smallCenterText);
  content = applyTemplate(content, /<h6[^>]*>([\s\S]*?)<\/h6>/gi, tmpl.mjmlTemplates.smallText);
  content = applyTemplate(content, /<h1[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h1>/gi, tmpl.mjmlTemplates.centerHeadline);
  content = applyTemplate(content, /<h1[^>]*>([\s\S]*?)<\/h1>/gi, tmpl.mjmlTemplates.headline);
  content = applyTemplate(content, /<h4[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h4>/gi, tmpl.mjmlTemplates.centerQuote);
  content = applyTemplate(content, /<h4[^>]*>([\s\S]*?)<\/h4>/gi, tmpl.mjmlTemplates.quote);
  content = applyTemplate(content, /<h5[^>]*>([\s\S]*?)<\/h5>/gi, tmpl.mjmlTemplates.button);

  content = htmlUtils.addBrAfterClosingP(content);
  content = content.replace(/\s*\[\[BR_SEP\]\]\s*/g, "\n<br><br>\n");
  content = htmlUtils.removeStylesFromLists(content);

  // Complex wrapping
  content = wrapTextInBlock(content, tmpl.mjmlTemplates.wrapImg, "mjml", tok);

  // More wrappers
  content = applyTemplate(content, /i-l-s([\s\S]*?)i-l-s-e/gi, tmpl.mjmlTemplates.leftSideImg);
  content = applyTemplate(content, /i-r-s([\s\S]*?)i-r-s-e/gi, tmpl.mjmlTemplates.rightSideImg);
  content = applyTemplate(content, /sign-i([\s\S]*?)sign-i-e/gi, tmpl.mjmlTemplates.signatureImg);
  content = applyTemplate(content, /ftr-s([\s\S]*?)ftr-e/gi, tmpl.mjmlTemplates.footerBlock);
  content = applyTemplate(content, /ftr-c([\s\S]*?)ftr-c-e/gi, tmpl.mjmlTemplates.footerCenterBlock);

  content = htmlUtils.cleanEmptyHtmlTags(content);
  content = tmpl.mjmlTemplates.fullStructure(content);
  content = htmlUtils.addOneBr(content, oneBrSymbol);
  content = htmlUtils.replaceTripleBrWithSingle(content);

  return content;
}
