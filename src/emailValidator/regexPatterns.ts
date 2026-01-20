// Common regex patterns used across email validation rules
// This file centralizes regex patterns to avoid duplication

export const REGEX_PATTERNS = {
  // HTML tag patterns - оптимізовані для швидкості
  TAG_OPENING: (tagName: string) => `<${tagName}(?:\\s[^>]*)?>`,
  TAG_CLOSING: (tagName: string) => `</${tagName}>`,
  TAG_SELF_CLOSING: (tagName: string) => `<${tagName}(?:\\s[^>]*)?/>`,
  TAG_WITH_CONTENT: (tagName: string) => `<${tagName}(?:\\s[^>]*)?>[\\s\\S]*?</${tagName}>`,

  // Attribute patterns - оптимізовані для уникнення backtracking
  ATTRIBUTE_STYLE_DUPLICATE: 'style="([^"]*)"([^>]*?)style="([^"]*)"',
  ATTRIBUTE_EMPTY_HREF: "href\\s*=\\s*(?:\"\\s*\"|'\\s*'|\\s*)",
  ATTRIBUTE_TARGET_WRONG: "target\\s*=\\s*(?:\"(?:_self|_parent|_top)\"|'(?:_self|_parent|_top)')",
  ATTRIBUTE_MALFORMED_SRC: "\\bs\\s+rc=",
  ATTRIBUTE_MISSING_SPACE: '="([^"]*)"([a-zA-Z]+=)',

  // Image patterns - більш точні та швидкі
  IMG_MALFORMED_ATTR_SPACING: '(<img[^>]*?)([a-zA-Z0-9_.-]+")([a-zA-Z]+=)',
  IMG_SELF_CLOSING_WRONG: "<img\\s*([^>]*?)></img>",
  IMG_MISSING_ALT: "<img(?![^>]*\\salt=)[^>]*>",
  IMG_MISSING_WIDTH: "<img(?![^>]*\\swidth=)[^>]*>",
  IMG_MISSING_HEIGHT: "<img(?![^>]*\\sheight=)[^>]*>",

  // Link patterns - оптимізовані
  LINK_EMPTY_HREF: "<a[^>]*href\\s*=\\s*(?:\"\\s*\"|'\\s*'|\\s*)[^>]*>",
  LINK_NO_TARGET: "<a[^>]*href\\s*=\\s*(?:\"[^\"]+\"|'[^']+')[^>]*(?!target\\s*=)[^>]*>",
  LINK_NO_STYLE: "<a[^>]*href\\s*=\\s*(?:\"[^\"]+\"|'[^']+')[^>]*(?!style\\s*=)[^>]*>",

  // Table patterns - зменшено backtracking
  TABLE_NESTED_EXCESSIVE: "<table([^>]*)><tr><td([^>]*)><table([^>]*)><tr><td([^>]*)>",
  TABLE_NESTED_CLOSING: "</td></tr></table></td></tr></table>",
  TABLE_EMPTY: "<table[^>]*><tr><td[^>]*>\\s*</td></tr></table>",
  TABLE_SINGLE_SPAN_WRAPPER:
    "<table[^>]*><tr><td[^>]*>(\\s*<span[^>]*>[^<]+</span>\\s*)</td></tr></table>",

  // Style patterns
  STYLE_WIDTH_PERCENTAGE: 'style="([^"]*?)width:\\s*100%([^"]*?)"',

  // Cleanup patterns - оптимізовані
  EMPTY_SPAN: "<span[^>]*>\\s*</span>",
  EMPTY_SPAN_WHITESPACE: "<span[^>]*>[\\s\\t\\n\\r]*</span>",
  EXTRA_SPACES_IN_TAG: "\\s+>",
  EXTRA_SPACES_MULTIPLE: "\\s{2,}",

  // Unsafe attributes patterns - більш точні
  UNSAFE_ATTRIBUTE: (attr: string) => `\\s${attr}\\s*=\\s*(?:"[^"]*"|'[^']*')`,
} as const;

// Common regex flags
export const REGEX_FLAGS = {
  GLOBAL_CASE_INSENSITIVE: "gi",
  GLOBAL_CASE_INSENSITIVE_MULTILINE: "gim",
  GLOBAL_CASE_INSENSITIVE_DOTALL: "gis",
  CASE_INSENSITIVE: "i",
  GLOBAL: "g",
} as const;

// Helper function to get tag patterns easily
export const getTagPatterns = (tagName: string) => ({
  opening: REGEX_PATTERNS.TAG_OPENING(tagName),
  closing: REGEX_PATTERNS.TAG_CLOSING(tagName),
  selfClosing: REGEX_PATTERNS.TAG_SELF_CLOSING(tagName),
  withContent: REGEX_PATTERNS.TAG_WITH_CONTENT(tagName),
});

// Helper function for common validation checks
export const createValidationPattern = (
  pattern: string,
  flags: string = REGEX_FLAGS.GLOBAL_CASE_INSENSITIVE
) => {
  return { pattern, flags };
};
