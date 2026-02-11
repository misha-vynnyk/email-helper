/**
 * Main HTML/MJML formatting logic
 */

import { blueColors, config } from "./config";
import { htmlTemplates, mjmlTemplates } from "./templates";
import * as utils from "./utils";
import * as colorUtils from "./colorUtils";

function isLinkColor(color: string): boolean {
  // Sanitize: remove !important and trim
  const sanitized = color.replace(/!important/gi, "").trim();

  // 1. Check against the explicit list from config
  for (const pattern of blueColors) {
    if (new RegExp("^" + pattern + "$", "i").test(sanitized)) return true;
  }

  // 2. Smart check for any blue-ish/purple-ish color
  return colorUtils.isBlueish(sanitized);
}

function italicLinks(htmlContent: string): string {
  htmlContent = htmlContent.replace(/<a[^>]*>/gi, "").replace(/<\/a>/gi, "");

  // Regex targets only Hex or RGB color values to skip "transparent" or other named containers
  // and handle single/double quotes and !important
  const regex = /<span[^>]*style=["'][^"']*color\s*:\s*(#[0-9a-fA-F]{3,6}|rgb\s*\([^)]+\))(?:[^"';]*!important)?[^"']*font-style\s*:\s*italic[^"']*["'][^>]*>(.*?)<\/span>/gi;

  htmlContent = htmlContent.replace(regex, (match, color, innerText) => {
    if (isLinkColor(color)) {
      return `<a href="urlhere" style="font-family:'Roboto', Arial, Helvetica, sans-serif;text-decoration: underline;font-weight: 700; color: #0000EE;"><em>${innerText}</em></a>`;
    }
    return match;
  });

  return htmlContent;
}

function linksStyles(htmlContent: string): string {
  // Regex targets only Hex or RGB color values
  const reg = /<span[^>]*style=["'][^"']*color\s*:\s*(#[0-9a-fA-F]{3,6}|rgb\s*\([^)]+\))(?:[^"';]*!important)?[^"']*["'][^>]*>(.*?)<\/span>/gi;

  htmlContent = htmlContent.replace(reg, (match, color, innerText) => {
    if (isLinkColor(color)) {
      return `<a href="urlhere" style="font-family:'Roboto', Arial, Helvetica, sans-serif;text-decoration: underline;font-weight: 700; color: #0000EE;">${innerText}</a>`;
    }
    return match;
  });
  return htmlContent;
}

function processStyles(htmlContent: string): string {
  htmlContent = htmlContent.replace(/<b[^>]*>/gi, "").replace(/<\/b>/gi, "");

  // i and b and u
  htmlContent = htmlContent.replace(/<span[^>]*style="[^"]*font-weight:\s*700[^"]*;[^"]*font-style:\s*italic[^"]*;[^"]*text-decoration-line:\s*underline[^"]*"[^>]*>(.*?)<\/span>/gi, '<em style="text-decoration: underline;font-weight: bold;">$1</em>');

  // i and u
  htmlContent = htmlContent.replace(/<span[^>]*style="[^"]*font-style:\s*italic[^"]*;[^"]*text-decoration-line:\s*underline[^"]*"[^>]*>(.*?)<\/span>/gi, '<em style="text-decoration: underline;">$1</em>');

  // i and b
  htmlContent = htmlContent.replace(/<span[^>]*style="[^"]*font-weight:\s*700[^"]*;[^"]*font-style:\s*italic[^"]*"[^>]*>(.*?)<\/span>/gi, '<b style="font-style: italic;">$1</b>');

  // b and u
  htmlContent = htmlContent.replace(/<span[^>]*style="[^"]*font-weight:\s*700[^"]*;[^"]*text-decoration-line:\s*underline[^"]*"[^>]*>(.*?)<\/span>/gi, '<b style="text-decoration: underline;">$1</b>');

  // u
  htmlContent = htmlContent.replace(/<span[^>]*style="[^"]*text-decoration-line:\s*underline[^"]*"[^>]*>(.*?)<\/span>/gi, "<u>$1</u>");

  // b
  htmlContent = htmlContent.replace(/<span[^>]*style="[^"]*font-weight:\s*700[^"]*"[^>]*>(.*?)<\/span>/gi, "<b>$1</b>");

  // i
  htmlContent = htmlContent.replace(/<span[^>]*style="[^"]*font-style:\s*italic[^"]*"[^>]*>(.*?)<\/span>/gi, "<em>$1</em>");

  //delete tags
  htmlContent = htmlContent.replace(/<a[^>]*>\s*<\/a>/g, " ");
  htmlContent = htmlContent.replace(/<div[^>]*>/gi, "").replace(/<\/div>/gi, "");
  htmlContent = htmlContent.replace(/<span[^>]*>/gi, "").replace(/<\/span>/gi, "");
  htmlContent = htmlContent.replace(/<b>\s*<\/b>/g, "");

  //delete table tags update
  htmlContent = htmlContent.replace(/<table[^>]*>/gi, "").replace(/<\/table>/gi, "");
  htmlContent = htmlContent.replace(/<tbody[^>]*>/gi, "").replace(/<\/tbody>/gi, "");
  htmlContent = htmlContent.replace(/<tr[^>]*>/gi, "").replace(/<\/tr>/gi, "");
  htmlContent = htmlContent.replace(/<td[^>]*>/gi, "").replace(/<\/td>/gi, "");
  htmlContent = htmlContent.replace(/<col[^>]*>/gi, "").replace(/<\/col>/gi, "");
  htmlContent = htmlContent.replace(/<colgroup[^>]*>/gi, "").replace(/<\/colgroup>/gi, "");

  return htmlContent;
}

function applyTemplate(content: string, regex: RegExp, templateFn: (content: string) => string): string {
  return content.replace(regex, (_match, innerContent) => templateFn(innerContent));
}

// Special handling for the function that wraps images AND the whole content
function wrapTextInSpan(htmlContent: string, templateFn: (content: string) => string, type: "html" | "mjml" = "html"): string {
  // 1. Replace Images
  htmlContent = htmlContent.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, function (_match, src) {
    return templateFn(src);
  });

  // 2. Wrap the whole result in a default span block
  if (type === "html") {
    htmlContent = `<tr>
                      <td style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-top: 14px; padding-bottom: 14px;">
                                <span style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                                    ${htmlContent}
                                </span>
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

export function formatHtml(editorContent: string): string {
  let content = editorContent;
  content = utils.mergeSimilarTags(content);
  content = italicLinks(content);
  content = linksStyles(content);
  content = utils.replaceAllEmojisAndSymbolsExcludingHTML(content);
  content = processStyles(content);

  // Block Wrappers
  content = applyTemplate(content, /<p[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/p>/gi, htmlTemplates.centerText);
  content = applyTemplate(content, /<h6[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h6>/gi, htmlTemplates.smallCenterText);
  content = applyTemplate(content, /<h6[^>]*>([\s\S]*?)<\/h6>/gi, htmlTemplates.smallText);
  content = applyTemplate(content, /<h1[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h1>/gi, htmlTemplates.centerHeadline);
  content = applyTemplate(content, /<h1[^>]*>([\s\S]*?)<\/h1>/gi, htmlTemplates.headline);
  content = applyTemplate(content, /<h5[^>]*>([\s\S]*?)<\/h5>/gi, htmlTemplates.button);
  content = applyTemplate(content, /<h4[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h4>/gi, htmlTemplates.centerQuote);
  content = applyTemplate(content, /<h4[^>]*>([\s\S]*?)<\/h4>/gi, htmlTemplates.quote);

  content = utils.addBrAfterClosingP(content);
  // Clean up whitespace around [[BR_SEP]] and replace with <br><br> on its own line
  content = content.replace(/\s*\[\[BR_SEP\]\]\s*/g, "\n<br><br>\n");
  content = utils.removeStylesFromLists(content);

  // Complex wrapping (Images + Body)
  content = wrapTextInSpan(content, htmlTemplates.wrapImg, "html");

  // More wrappers
  content = applyTemplate(content, /i-r-s([\s\S]*?)i-r-s-e/gi, htmlTemplates.rightSideImg);
  content = applyTemplate(content, /i-l-s([\s\S]*?)i-l-s-e/gi, htmlTemplates.leftSideImg);
  content = applyTemplate(content, /sign-i([\s\S]*?)sign-i-e/gi, htmlTemplates.signatureImg);
  content = applyTemplate(content, /ftr-s([\s\S]*?)ftr-e/gi, htmlTemplates.footerBlock);
  content = applyTemplate(content, /ftr-c([\s\S]*?)ftr-c-e/gi, htmlTemplates.footerCenterBlock);

  content = utils.cleanEmptyHtmlTags(content);
  content = htmlTemplates.fullStructure(content);
  content = utils.addOneBr(content);
  content = utils.replaceTripleBrWithSingle(content);

  return content;
}

export function formatMjml(editorContent: string): string {
  let content = editorContent;
  content = utils.mergeSimilarTags(content);
  content = italicLinks(content);
  content = linksStyles(content);
  content = utils.replaceAllEmojisAndSymbolsExcludingHTML(content);
  content = processStyles(content);

  // Block Wrappers
  content = applyTemplate(content, /<p[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/p>/gi, mjmlTemplates.centerText);
  content = applyTemplate(content, /<h6[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h6>/gi, mjmlTemplates.smallCenterText);
  content = applyTemplate(content, /<h6[^>]*>([\s\S]*?)<\/h6>/gi, mjmlTemplates.smallText);
  content = applyTemplate(content, /<h1[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h1>/gi, mjmlTemplates.centerHeadline);
  content = applyTemplate(content, /<h1[^>]*>([\s\S]*?)<\/h1>/gi, mjmlTemplates.headline);
  content = applyTemplate(content, /<h4[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h4>/gi, mjmlTemplates.centerQuote);
  content = applyTemplate(content, /<h4[^>]*>([\s\S]*?)<\/h4>/gi, mjmlTemplates.quote);
  content = applyTemplate(content, /<h5[^>]*>([\s\S]*?)<\/h5>/gi, mjmlTemplates.button);

  content = utils.addBrAfterClosingP(content);
  // Clean up whitespace around [[BR_SEP]] and replace with <br><br> on its own line
  content = content.replace(/\s*\[\[BR_SEP\]\]\s*/g, "\n<br><br>\n");
  content = utils.removeStylesFromLists(content);

  // Complex wrapping
  content = wrapTextInSpan(content, mjmlTemplates.wrapImg, "mjml");

  // More wrappers
  content = applyTemplate(content, /i-l-s([\s\S]*?)i-l-s-e/gi, mjmlTemplates.leftSideImg);
  content = applyTemplate(content, /i-r-s([\s\S]*?)i-r-s-e/gi, mjmlTemplates.rightSideImg);
  content = applyTemplate(content, /sign-i([\s\S]*?)sign-i-e/gi, mjmlTemplates.signatureImg);
  content = applyTemplate(content, /ftr-s([\s\S]*?)ftr-e/gi, mjmlTemplates.footerBlock);
  content = applyTemplate(content, /ftr-c([\s\S]*?)ftr-c-e/gi, mjmlTemplates.footerCenterBlock);

  content = utils.cleanEmptyHtmlTags(content);
  content = mjmlTemplates.fullStructure(content);
  content = utils.addOneBr(content);
  content = utils.replaceTripleBrWithSingle(content);

  return content;
}
