import { DOMPurify } from "@/htmlConverter/advanced/sanitize";

// "font" is included because document.execCommand("foreColor", ...) — used by the rich-text
// mini-editor's color button — emits <font color="..."> in some browsers instead of a styled <span>.
// "u"/"ul"/"ol"/"li" are what execCommand("underline"/"insertUnorderedList"/"insertOrderedList")
// emit (canva-plan-v2.md Stage 4) — without them here, DOMPurify would silently strip those
// buttons' output right back out.
const ALLOWED_TAGS = ["b", "strong", "i", "em", "u", "span", "font", "a", "br", "ul", "ol", "li"];
const ALLOWED_ATTR = ["style", "color", "href", "target"];

/** Restricts a rich-text block's content to inline formatting only — no tables/images/block elements. */
export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}
