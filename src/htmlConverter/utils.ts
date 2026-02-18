/**
 * Utility functions for HTML/MJML conversion
 */

import { SYMBOLS } from "./constants";

export function cleanEmptyHtmlTags(htmlContent: string): string {
  htmlContent = htmlContent.replace(/&nbsp;/g, " ");
  // <brbrbrbr>
  htmlContent = htmlContent.replace(/<b>\s*<\/b>/g, "");
  htmlContent = htmlContent.replace(/<li>\s*<\/li>/g, "");
  htmlContent = htmlContent.replace(/<br>\s*<br>\s*<br>\s*<br>/g, "<br><br>");
  htmlContent = htmlContent.replace(/<br>\s*<br>\s*<br>/g, "<br><br>");
  // Safety net: crush any sequence of 3+ breaks into 2
  htmlContent = htmlContent.replace(/(?:<br\s*\/?>\s*){3,}/gi, "<br><br>");
  htmlContent = htmlContent.replace(/(<span[^>]*>)\s*<br><br>/gi, "$1");
  htmlContent = htmlContent.replace(/<\/a>\s*<a[^>]*>/g, " ");
  htmlContent = htmlContent.replace(/<pre>/g, "");
  htmlContent = htmlContent.replace(/<a[^>]*>\s*<\/a>/g, " ");
  htmlContent = htmlContent.replace(/<b[^>]*>\s*<\/b>/g, " ");
  htmlContent = htmlContent.replace(/<u>\s*<\/u>/g, " ");
  htmlContent = htmlContent.replace(/<em[^>]*>\s*<\/em>/g, " ");
  htmlContent = htmlContent.replace(/<\/em>\s*<em[^>]*>/g, " ");
  htmlContent = htmlContent.replace(/<a[^>]*>\s*<\/a>/g, " ");
  htmlContent = htmlContent.replace(/<br><br>\s*<\/span>/g, "</span>");
  htmlContent = htmlContent.replace(/(<span[^>]*>)\s*<\/a>/gi, "$1");
  htmlContent = htmlContent.replace(/(<span[^>]*>)\s*<\/b>/gi, "$1");
  htmlContent = htmlContent.replace(/<a[^>]*>\s*<\/span>/g, "</span>");
  htmlContent = htmlContent.replace(/<b[^>]*>\s*<\/span>/g, "</span>");
  htmlContent = htmlContent.replace(/(<div[^>]*>)\s*<\/a>/gi, "$1");
  htmlContent = htmlContent.replace(/(<div[^>]*>)\s*<\/b>/gi, "$1");
  htmlContent = htmlContent.replace(/<a[^>]*>\s*<\/div>/g, "</div>");
  htmlContent = htmlContent.replace(/<b[^>]*>\s*<\/div>/g, "</div>");

  htmlContent = htmlContent.replace(/<h1[^>]*>/gi, "").replace(/<\/h1>/gi, "");
  htmlContent = htmlContent.replace(/<h2[^>]*>/gi, "").replace(/<\/h2>/gi, "");
  htmlContent = htmlContent.replace(/<h3[^>]*>/gi, "").replace(/<\/h3>/gi, "");
  htmlContent = htmlContent.replace(/<h4[^>]*>/gi, "").replace(/<\/h4>/gi, "");
  htmlContent = htmlContent.replace(/<h5[^>]*>/gi, "").replace(/<\/h5>/gi, "");
  htmlContent = htmlContent.replace(/<h6[^>]*>/gi, "").replace(/<\/h6>/gi, "");
  htmlContent = htmlContent.replace(/<br><br>\s*<br><br>/g, "<br><br>");
  htmlContent = htmlContent.replace(/<br><br>\s*<\/div>/g, "</div>");
  htmlContent = htmlContent.replace(/(<div[^>]*>)\s*<br><br>/gi, "$1");
  htmlContent = htmlContent.replace(/(<span[^>]*>)\s*<br><br>/gi, "$1");
  htmlContent = htmlContent.replace(/<br><br>\s*<\/span>/g, "</span>");
  htmlContent = htmlContent.replace(/(<div[^>]*>)\s*<br><br>/gi, "$1");
  htmlContent = htmlContent.replace(/<br><br>\s*<\/div>/g, "</div>");
  htmlContent = htmlContent.replace(/<br>\s*<\/div>/g, "</div>");
  htmlContent = htmlContent.replace(/<br>\s*<\/span>/g, "</span>");

  htmlContent = htmlContent.replace(/<span[^>]*>\s*<\/span>/g, "");
  htmlContent = htmlContent.replace(/<div[^>]*>\s*<\/div>/g, "");
  htmlContent = htmlContent.replace(/<td[^>]*>\s*<\/td>/g, "");
  htmlContent = htmlContent.replace(/<tr[^>]*>\s*<\/tr>/g, "");
  return htmlContent;
}

export function isSignatureImageTag(imgTag: string): boolean {
  // Simple check: if alt contains "signature", skip replacement
  return /alt=["'].*signature.*["']/i.test(imgTag);
}

export function addOneBr(htmlContent: string): string {
  return htmlContent.replace(new RegExp(SYMBOLS.ONE_BR, "gi"), function (_match, _content) {
    return "<br>";
  });
}

export function replaceTripleBrWithSingle(htmlContent: string): string {
  const BR = `<br>\n`;
  htmlContent = htmlContent.replace(/<\w+[^>]*>\s*<\w+[^>]*>\s*<br\s*\/?>\s*<\/\w+>\s*<\/\w+>/gi, BR);

  htmlContent = htmlContent.replace(/<\w+[^>]*>\s*<br\s*\/?>\s*<\/\w+>/gi, BR);

  htmlContent = htmlContent.replace(/\s*<br\s*\/?>\s*<\/(\w+)>/gi, "</$1><br>");

  htmlContent = htmlContent.replace(/(?:<br\s*\/?>\s*){3,}/gi, BR);

  return htmlContent;
}

export function addBrAfterClosingP(htmlContent: string): string {
  // First, handle <p> tags inside <li> elements - remove p tags but keep content
  // This prevents <br> from being added inside list items
  htmlContent = htmlContent.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_match, liContent) => {
    // Remove <p> tags inside <li>, keeping the content
    const cleanedContent = liContent.replace(/<p[^>]*>/gi, "").replace(/<\/p>/gi, "");
    return `<li>${cleanedContent}</li>`;
  });

  // Handle sequences of empty paragraphs (p tags with only br inside)
  // We want to treat even a single empty paragraph as a spacer, but NOT add extra breaks if it's just one.
  // The goal: merge the line break from the empty paragraph with the standard paragraph break.
  htmlContent = htmlContent.replace(/(<p[^>]*>[\s\S]*?<\/p>)(\s*<p[^>]*>\s*<br\s*\/?>\s*<\/p>\s*){1,}(<p[^>]*>[\s\S]*?<\/p>)/gi, (_match, beforeP, _emptyPs, afterP) => {
    // We just ignore the empty P in the middle, because the </p> replacement below will add <br><br>
    // effectively doing P -> BR BR -> P.
    // If we kept the empty P, we'd get P -> BR BR -> BR (from empty P) -> BR BR -> P, which is too much.
    return beforeP + afterP;
  });

  // Delete extra inline <br> (optional, but good for cleanup)
  // htmlContent = htmlContent.replace(/<br\s*\/?>/gi, "");

  // Add <br><br> after each </p> (but not inside lists - they're already processed)
  // Use negative lookahead to skip </p> that are inside <li> elements
  htmlContent = htmlContent.replace(/<\/p>(?!\s*<\/li>)/gi, "</p>\n<br><br>\n");

  // Delete extra <p> tags (but not inside lists - already processed)
  htmlContent = htmlContent.replace(/<p[^>]*>/gi, "").replace(/<\/p>/gi, "");

  // Remove <br> between <li> elements (lists should not have <br> between items)
  htmlContent = htmlContent.replace(/<\/li>\s*<br>\s*<br>\s*<li>/gi, "</li>\n<li>");
  htmlContent = htmlContent.replace(/<\/li>\s*<br>\s*<li>/gi, "</li>\n<li>");
  // Also remove <br> at the start of <li> (if any were added incorrectly)
  htmlContent = htmlContent.replace(/<li>\s*<br>\s*<br>/gi, "<li>");
  htmlContent = htmlContent.replace(/<li>\s*<br>/gi, "<li>");

  // add <br> before (ol, ul) if needed
  htmlContent = htmlContent.replace(/<br><br>(\s*<(ol|ul)[^>]*>)/gi, "<br>\n$1");

  return htmlContent;
}

export function removeStylesFromLists(htmlContent: string): string {
  htmlContent = htmlContent.replace(/<ol[^>]*style="[^"]*"[^>]*>/gi, "<ol>\n");
  htmlContent = htmlContent.replace(/<ul[^>]*style="[^"]*"[^>]*>/gi, "<ul>\n");
  htmlContent = htmlContent.replace(/<li[^>]*style="[^"]*"[^>]*>/gi, "<li>");
  htmlContent = htmlContent.replace(/<\/li>/gi, "</li>\n");
  return htmlContent;
}

export function replaceAllEmojisAndSymbolsExcludingHTML(htmlContent: string): string {
  const rx = /(?:\p{Extended_Pictographic}|(?![<>=&%"'#;:_-])[\p{S}\p{No}])(?:\uFE0F)?/gu;

  // Remove Zero Width Space and other invisible characters that cause issues
  htmlContent = htmlContent.replace(/[\u200B-\u200D\uFEFF]/g, "");

  return htmlContent.replace(rx, (match) => {
    return Array.from(match)
      .map((ch) => `&#${ch.codePointAt(0)};`)
      .join("");
  });
}

export function mergeSimilarTags(htmlContent: string): string {
  // Merge adjacent h1-h6 tags and add <br><br> between them
  const tagsToMerge = ["h1", "h4", "h5", "h6"];

  // Now handle tags normally (merge them)
  tagsToMerge.forEach((tag) => {
    const regex = new RegExp(`(<\\/${tag}>)\\s*<${tag}[^>]*>`, "gi");

    let matchFound = true;
    let tagIterations = 0;
    while (matchFound && tagIterations < 50) {
      matchFound = false;
      let count = 0;
      htmlContent = htmlContent.replace(regex, (_match) => {
        matchFound = true;
        count++;
        return "[[BR_SEP]]";
      });
      tagIterations++;
    }
  });

  return htmlContent;
}
