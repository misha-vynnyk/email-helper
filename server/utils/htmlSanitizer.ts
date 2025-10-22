/**
 * HTML Sanitizer
 *
 * Sanitizes HTML content to prevent XSS attacks
 * Uses isomorphic-dompurify (works in Node.js without jsdom)
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Email-safe DOMPurify configuration
 */
const PURIFY_CONFIG = {
  // Allow common HTML email tags
  ALLOWED_TAGS: [
    "html",
    "head",
    "body",
    "title",
    "meta",
    "style",
    "table",
    "tbody",
    "thead",
    "tfoot",
    "tr",
    "td",
    "th",
    "div",
    "span",
    "p",
    "br",
    "hr",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "a",
    "img",
    "ul",
    "ol",
    "li",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "center",
    "font",
    "pre",
    "code",
  ],

  // Allow common attributes
  ALLOWED_ATTR: [
    "href",
    "src",
    "alt",
    "title",
    "width",
    "height",
    "style",
    "class",
    "id",
    "align",
    "valign",
    "border",
    "cellpadding",
    "cellspacing",
    "colspan",
    "rowspan",
    "bgcolor",
    "color",
    "target",
    "role",
  ],

  // Allow data URIs for images
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,

  // Keep relative URLs
  ALLOW_DATA_ATTR: false,

  // Keep HTML structure
  KEEP_CONTENT: true,

  // Return DOM instead of string for better control
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,

  // Prevent mXSS attacks
  SAFE_FOR_TEMPLATES: true,

  // Remove unsafe elements completely
  FORCE_BODY: false,

  // Allow SVG (common in email templates)
  USE_PROFILES: { html: true, svg: true, svgFilters: false },
};

/**
 * Sanitize HTML content
 */
export function sanitizeHTML(dirty: string): string {
  if (!dirty || typeof dirty !== "string") {
    return "";
  }

  try {
    // Remove null bytes
    const cleaned = dirty.replace(/\0/g, "");

    // Sanitize with DOMPurify
    const sanitized = DOMPurify.sanitize(cleaned, PURIFY_CONFIG);

    return sanitized;
  } catch (error) {
    console.error("HTML sanitization error:", error);
    // Return empty string on error for safety
    return "";
  }
}

/**
 * Sanitize HTML with strict mode (removes more tags)
 */
export function sanitizeHTMLStrict(dirty: string): string {
  if (!dirty || typeof dirty !== "string") {
    return "";
  }

  try {
    const cleaned = dirty.replace(/\0/g, "");

    const strictConfig = {
      ...PURIFY_CONFIG,
      ALLOWED_TAGS: ["p", "br", "strong", "em", "a"],
      ALLOWED_ATTR: ["href", "target"],
    };

    const sanitized = DOMPurify.sanitize(cleaned, strictConfig);

    return sanitized;
  } catch (error) {
    console.error("HTML sanitization error:", error);
    return "";
  }
}

/**
 * Check if HTML contains potentially dangerous content
 */
export function containsDangerousHTML(html: string): boolean {
  if (!html) return false;

  // Check for common XSS patterns
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // event handlers like onclick=
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<applet/gi,
    /<meta\s+http-equiv/gi,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(html));
}

/**
 * Validate HTML structure (basic check)
 */
export function validateHTMLStructure(html: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!html || html.trim().length === 0) {
    errors.push("HTML content is empty");
    return { valid: false, errors };
  }

  // Check for balanced tags (basic check)
  const openTags = html.match(/<(\w+)[^>]*>/g) || [];
  const closeTags = html.match(/<\/(\w+)>/g) || [];

  if (openTags.length !== closeTags.length) {
    errors.push("Unbalanced HTML tags detected");
  }

  // Check for dangerous content
  if (containsDangerousHTML(html)) {
    errors.push("Potentially dangerous content detected");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
