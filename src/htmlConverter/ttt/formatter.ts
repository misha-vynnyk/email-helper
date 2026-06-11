/**
 * TTT HTML/MJML formatter
 *
 * Differences from the default formatter:
 *  - Uses tttHtmlTemplates / tttMjmlTemplates (div-based body, 15px padding, 220px sig)
 *  - processStyles keeps <div> structure (no span wrapping at root level)
 */

import * as colorUtils from "../utils/colorUtils";
import { config } from "../utils/config";
import * as utils from "../utils/htmlUtils";
import { TTT_PLACEHOLDER_URL, tttHtmlTemplates, tttMjmlTemplates } from "./templates";

// ─── Shared inline-style helpers (duplicated from formatter.ts intentionally) ─

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

function italicLinks(htmlContent: string): string {
  const savedLinks: string[] = [];
  htmlContent = htmlContent.replace(/\<a\s[^\>]*href=(["'])(https?:\/\/[^"']+)\1[^\>]*\>([\s\S]*?)\<\/a\>/gi, (_match, _q, _href, inner) => {
    const text = inner.replace(/<[^>]+>/g, "");
    const leadingSpaceMatch = text.match(/^([\s\u00A0]*)/);
    const trailingSpaceMatch = text.match(/([\s\u00A0]*)$/);
    const leadingSpaces = leadingSpaceMatch ? leadingSpaceMatch[1] : "";
    const trailingSpaces = trailingSpaceMatch ? trailingSpaceMatch[1] : "";
    const coreText = text.trim();
    if (!coreText) {
      const imgTags = inner.match(/<img[^>]*>/gi);
      if (imgTags && imgTags.length > 0) return imgTags.join("");
      return text;
    }
    const placeholder = `\x02LINK${savedLinks.length}\x03`;
    savedLinks.push(`<a href="${TTT_PLACEHOLDER_URL}" style="font-family:${config.fontFamily};text-decoration: underline;font-weight: 700; color: ${config.colors.link};">${coreText}</a>`);
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
    if (!color || !fontStyle || !/italic/i.test(fontStyle)) return match;
    if (colorUtils.isLinkColor(color)) {
      const leadingSpaceMatch = innerText.match(/^([\s\u00A0]*)/);
      const trailingSpaceMatch = innerText.match(/([\s\u00A0]*)$/);
      const leadingSpaces = leadingSpaceMatch ? leadingSpaceMatch[1] : "";
      const trailingSpaces = trailingSpaceMatch ? trailingSpaceMatch[1] : "";
      const coreText = innerText.trim();
      if (!coreText) return match;
      return `${leadingSpaces}<a href="${TTT_PLACEHOLDER_URL}" style="font-family:${config.fontFamily};text-decoration: underline;font-weight: 700; color: ${config.colors.link};"><em>${coreText}</em></a>${trailingSpaces}`;
    }
    return match;
  });

  htmlContent = htmlContent.replace(/\x02LINK(\d+)\x03/g, (_, i) => savedLinks[+i] ?? "");
  return htmlContent;
}

function linksStyles(htmlContent: string): string {
  const reg = /<span\b[^>]*style=(["'])([\s\S]*?)\1[^>]*>([\s\S]*?)<\/span>/gi;
  htmlContent = htmlContent.replace(reg, (match, _quote, style, innerText) => {
    const color = getInlineStyleValue(style, "color");
    if (!color) return match;
    if (colorUtils.isLinkColor(color)) {
      const leadingSpaceMatch = innerText.match(/^([\s\u00A0]*)/);
      const trailingSpaceMatch = innerText.match(/([\s\u00A0]*)$/);
      const leadingSpaces = leadingSpaceMatch ? leadingSpaceMatch[1] : "";
      const trailingSpaces = trailingSpaceMatch ? trailingSpaceMatch[1] : "";
      const coreText = innerText.slice(leadingSpaces.length, innerText.length - trailingSpaces.length);
      if (!coreText) return match;
      return `${leadingSpaces}<a href="${TTT_PLACEHOLDER_URL}" style="font-family:${config.fontFamily};text-decoration: underline;font-weight: 700; color: ${config.colors.link};">${coreText}</a>${trailingSpaces}`;
    }
    return match;
  });
  return htmlContent;
}

function processStyles(htmlContent: string): string {
  htmlContent = htmlContent.replace(/<b\b[^>]*>/gi, "").replace(/<\/b>/gi, "");

  htmlContent = htmlContent.replace(/<span[^>]*style=["']([^"']*)['"'][^>]*>(.*?)<\/span>/gi, (_match: string, style: string, inner: string) => {
    const bold = /font-weight:\s*700/i.test(style);
    const italic = /font-style:\s*italic/i.test(style);
    const underline = /text-decoration-line:\s*underline/i.test(style);

    if (bold && italic && underline) return `<em style="text-decoration: underline;font-weight: bold;">${inner}</em>`;
    if (italic && underline) return `<em style="text-decoration: underline;">${inner}</em>`;
    if (bold && italic) return `<b style="font-style: italic;">${inner}</b>`;
    if (bold && underline) return `<b style="text-decoration: underline;">${inner}</b>`;
    if (underline) return `<u>${inner}</u>`;
    if (bold) return `<b>${inner}</b>`;
    if (italic) return `<em>${inner}</em>`;
    return inner;
  });

  htmlContent = htmlContent.replace(/<div[^>]*>/gi, "<p>").replace(/<\/div>/gi, "</p>");
  htmlContent = htmlContent.replace(/<\/td>(?!\s*<\/tr>)/gi, " ");
  htmlContent = htmlContent.replace(/<\/th>(?!\s*<\/tr>)/gi, " ");
  htmlContent = htmlContent.replace(/<\/tr>/gi, "<br>\n");
  htmlContent = htmlContent.replace(/<\/?(table|tbody|thead|tr|td|th|col|colgroup)[^>]*>/gi, "");
  htmlContent = htmlContent.replace(/<a[^>]*>\s*<\/a>/g, " ");
  htmlContent = htmlContent.replace(/<span[^>]*>/gi, "").replace(/<\/span>/gi, "");
  htmlContent = htmlContent.replace(/<b>\s*<\/b>/g, "");
  return htmlContent;
}

function applyTemplate(content: string, regex: RegExp, templateFn: (content: string) => string): string {
  return content.replace(regex, (_match, innerContent) => templateFn(innerContent));
}

/**
 * TTT-specific wrapTextInDiv — uses <div> for both image wrapping and the body container.
 */
function wrapTextInDiv(htmlContent: string, templateFn: (content: string) => string, type: "html" | "mjml" = "html"): string {
  // 1. Replace Images
  htmlContent = htmlContent.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, (_match, src) => {
    return templateFn(src);
  });

  // 2. Wrap whole result in a body div block
  if (type === "html") {
    htmlContent = `<tr>
                      <td style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-top: 15px; padding-bottom: 15px;">
                                <div style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                                    ${htmlContent}
                                </div>
                      </td>
                    </tr>`;
  } else {
    htmlContent = `
            <tr>
              <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                <div style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                    ${htmlContent}
                </div>
              </td>
            </tr>
        `;
  }
  return htmlContent;
}

// ─── Public formatters ────────────────────────────────────────────────────────

export function formatHtmlTTT(editorContent: string): string {
  let content = editorContent;
  content = content.replace(/<meta[^>]*>/gi, "");
  content = content.replace(/<br\b[^>]*>/gi, "<br>");
  content = utils.mergeSimilarTags(content);
  content = italicLinks(content);
  content = linksStyles(content);
  content = utils.replaceAllEmojisAndSymbolsExcludingHTML(content);
  content = processStyles(content);

  // Block Wrappers
  content = applyTemplate(content, /<p[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/p>/gi, tttHtmlTemplates.centerText);
  content = applyTemplate(content, /<h6[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h6>/gi, tttHtmlTemplates.smallCenterText);
  content = applyTemplate(content, /<h6[^>]*>([\s\S]*?)<\/h6>/gi, tttHtmlTemplates.smallText);
  content = applyTemplate(content, /<h1[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h1>/gi, tttHtmlTemplates.centerHeadline);
  content = applyTemplate(content, /<h1[^>]*>([\s\S]*?)<\/h1>/gi, tttHtmlTemplates.headline);
  content = applyTemplate(content, /<h5[^>]*>([\s\S]*?)<\/h5>/gi, tttHtmlTemplates.button);
  content = applyTemplate(content, /<h4[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h4>/gi, tttHtmlTemplates.centerQuote);
  content = applyTemplate(content, /<h4[^>]*>([\s\S]*?)<\/h4>/gi, tttHtmlTemplates.quote);

  content = utils.addBrAfterClosingP(content);
  content = content.replace(/\s*\[\[BR_SEP\]\]\s*/g, "\n<br><br>\n");
  content = utils.removeStylesFromLists(content);

  // Complex wrapping (Images + Body) — div-based
  content = wrapTextInDiv(content, tttHtmlTemplates.wrapImg, "html");

  // More wrappers
  content = applyTemplate(content, /i-r-s([\s\S]*?)i-r-s-e/gi, tttHtmlTemplates.rightSideImg);
  content = applyTemplate(content, /i-l-s([\s\S]*?)i-l-s-e/gi, tttHtmlTemplates.leftSideImg);
  content = applyTemplate(content, /sign-i([\s\S]*?)sign-i-e/gi, tttHtmlTemplates.signatureImg);
  content = applyTemplate(content, /ftr-s([\s\S]*?)ftr-e/gi, tttHtmlTemplates.footerBlock);
  content = applyTemplate(content, /ftr-c([\s\S]*?)ftr-c-e/gi, tttHtmlTemplates.footerCenterBlock);

  content = utils.cleanEmptyHtmlTags(content);
  content = tttHtmlTemplates.fullStructure(content);
  content = utils.addOneBr(content);
  content = utils.replaceTripleBrWithSingle(content);

  return content;
}

export function formatMjmlTTT(editorContent: string): string {
  let content = editorContent;
  content = content.replace(/<meta[^>]*>/gi, "");
  content = content.replace(/<br\b[^>]*>/gi, "<br>");
  content = utils.mergeSimilarTags(content);
  content = italicLinks(content);
  content = linksStyles(content);
  content = utils.replaceAllEmojisAndSymbolsExcludingHTML(content);
  content = processStyles(content);

  // Block Wrappers
  content = applyTemplate(content, /<p[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/p>/gi, tttMjmlTemplates.centerText);
  content = applyTemplate(content, /<h6[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h6>/gi, tttMjmlTemplates.smallCenterText);
  content = applyTemplate(content, /<h6[^>]*>([\s\S]*?)<\/h6>/gi, tttMjmlTemplates.smallText);
  content = applyTemplate(content, /<h1[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h1>/gi, tttMjmlTemplates.centerHeadline);
  content = applyTemplate(content, /<h1[^>]*>([\s\S]*?)<\/h1>/gi, tttMjmlTemplates.headline);
  content = applyTemplate(content, /<h4[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h4>/gi, tttMjmlTemplates.centerQuote);
  content = applyTemplate(content, /<h4[^>]*>([\s\S]*?)<\/h4>/gi, tttMjmlTemplates.quote);
  content = applyTemplate(content, /<h5[^>]*>([\s\S]*?)<\/h5>/gi, tttMjmlTemplates.button);

  content = utils.addBrAfterClosingP(content);
  content = content.replace(/\s*\[\[BR_SEP\]\]\s*/g, "\n<br><br>\n");
  content = utils.removeStylesFromLists(content);

  // Complex wrapping — div-based
  content = wrapTextInDiv(content, tttMjmlTemplates.wrapImg, "mjml");

  // More wrappers
  content = applyTemplate(content, /i-l-s([\s\S]*?)i-l-s-e/gi, tttMjmlTemplates.leftSideImg);
  content = applyTemplate(content, /i-r-s([\s\S]*?)i-r-s-e/gi, tttMjmlTemplates.rightSideImg);
  content = applyTemplate(content, /sign-i([\s\S]*?)sign-i-e/gi, tttMjmlTemplates.signatureImg);
  content = applyTemplate(content, /ftr-s([\s\S]*?)ftr-e/gi, tttMjmlTemplates.footerBlock);
  content = applyTemplate(content, /ftr-c([\s\S]*?)ftr-c-e/gi, tttMjmlTemplates.footerCenterBlock);

  content = utils.cleanEmptyHtmlTags(content);
  content = tttMjmlTemplates.fullStructure(content);
  content = utils.addOneBr(content);
  content = utils.replaceTripleBrWithSingle(content);

  return content;
}
