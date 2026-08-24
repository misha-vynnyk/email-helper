import { DOMPurify } from "@/htmlConverter/advanced/sanitize";

// "font" is included because document.execCommand("foreColor", ...) — used by the rich-text
// mini-editor's color button — emits <font color="..."> in some browsers instead of a styled <span>.
const ALLOWED_TAGS = ["b", "strong", "i", "em", "span", "font", "a", "br"];
const ALLOWED_ATTR = ["style", "color", "href", "target"];

/** Restricts a rich-text block's content to inline formatting only — no tables/images/block elements. */
export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}
