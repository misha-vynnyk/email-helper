// User-controlled values that get interpolated into generated email HTML (shell.fontFamily,
// leaf.href) need more than HTML-escaping: fontFamily lands inside a <style> text node where
// entities don't get interpreted by the HTML parser but raw CSS still does, and href needs a
// scheme check since escaping quotes/angle brackets does nothing to stop a `javascript:` URI.

// Letters, digits, spaces, commas, hyphens and quotes cover every real font-stack
// ("'Roboto', Arial, Helvetica, sans-serif") while dropping characters that could break out
// of the CSS declaration (`;`, `{`, `}`, `<`, `>`, backslash, etc.).
const UNSAFE_FONT_FAMILY_CHARS = /[^a-zA-Z0-9 ,'"-]/g;

export function sanitizeFontFamily(fontFamily: string): string {
  return fontFamily.replace(UNSAFE_FONT_FAMILY_CHARS, "");
}

// Matches a leading scheme against known script-executing schemes, checked AFTER stripping
// whitespace/control characters from anywhere in the string (not just the front) — browsers
// strip ASCII tab/LF/CR from anywhere in a URL before parsing it (WHATWG URL spec), so
// "java\tscript:alert(1)" is executed as javascript: by the browser even though the scheme word
// itself is split by a control character. A leading-only strip doesn't catch that.
const HREF_WHITESPACE_AND_CONTROL_CHARS = /[\s\x00-\x1f]/g;
const DANGEROUS_HREF_SCHEME = /^(javascript|data|vbscript|file):/i;

/** Placeholder hrefs like "urlhere" (no scheme at all) are intentionally allowed through. */
export function isSafeHref(href: string): boolean {
  return !DANGEROUS_HREF_SCHEME.test(href.replace(HREF_WHITESPACE_AND_CONTROL_CHARS, ""));
}
