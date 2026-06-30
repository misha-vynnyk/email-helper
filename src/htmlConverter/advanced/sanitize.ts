// Phase 5 (optional): DOMPurify pass on the final email HTML output.
// The output is built from a controlled IR so <script> never appears.
// Enable only if you need to accept untrusted HTML directly.
//
// Allowlist covers email-safe attributes; enabling DOMPurify without this
// list would strip inline styles and break the rendered output.

import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "html", "head", "meta", "body", "title",
  "table", "tr", "td", "th", "thead", "tbody",
  "a", "img", "span", "b", "em", "u", "br", "p",
];

const ALLOWED_ATTR = [
  "style", "class", "width", "height", "align", "valign",
  "cellpadding", "cellspacing", "border", "bgcolor",
  "colspan", "rowspan", "role", "lang", "charset",
  "src", "alt", "href", "target",
];

// Returns sanitized HTML. Pass the final document string.
export function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORCE_BODY: false,
    WHOLE_DOCUMENT: true,
  });
}
