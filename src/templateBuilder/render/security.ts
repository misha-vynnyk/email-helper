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

// Matches a leading scheme (after stripping whitespace/control characters attackers use to
// dodge naive checks, e.g. "java\tscript:") against known script-executing schemes.
const DANGEROUS_HREF_SCHEME = /^[\s\x00-\x1f]*(javascript|data|vbscript|file):/i;

/** Placeholder hrefs like "urlhere" (no scheme at all) are intentionally allowed through. */
export function isSafeHref(href: string): boolean {
  return !DANGEROUS_HREF_SCHEME.test(href);
}
