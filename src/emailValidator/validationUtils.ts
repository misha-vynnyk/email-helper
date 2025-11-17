// Common utility functions for email validation rules
// This file centralizes common validation logic to avoid duplication

import { RegexCache } from "./cache";
import { REGEX_FLAGS, REGEX_PATTERNS } from "./regexPatterns";
import { HTMLNode, ValidationResult } from "./types";

/**
 * Common validation check patterns
 */
export const ValidationChecks = {
  /**
   * Check if HTML is valid string
   */
  isValidHtml: (html: string): boolean => {
    return Boolean(html && typeof html === "string");
  },

  /**
   * Create basic validation result
   */
  createValidationResult: (
    rule: string,
    severity: "error" | "warning" | "info",
    message: string,
    suggestion: string,
    category: "structure" | "accessibility" | "compatibility" | "performance" | "best-practice",
    line?: number,
    column?: number
  ): ValidationResult => ({
    rule,
    severity,
    message,
    suggestion,
    autoFixAvailable: true,
    category,
    line,
    column,
  }),

  /**
   * Check for pattern existence in HTML - оптимізовано
   */
  hasPattern: (
    html: string,
    pattern: string,
    flags: string = REGEX_FLAGS.GLOBAL_CASE_INSENSITIVE
  ): boolean => {
    if (!ValidationChecks.isValidHtml(html)) return false;
    try {
      // Для простої перевірки існування використовуємо test() без global флага
      const testFlags = flags.replace("g", "");
      return RegexCache.get(pattern, testFlags).test(html);
    } catch (error) {
      return false;
    }
  },

  /**
   * Find all matches for pattern in HTML
   */
  findPatternMatches: (
    html: string,
    pattern: string,
    flags: string = REGEX_FLAGS.GLOBAL_CASE_INSENSITIVE
  ): RegExpExecArray[] => {
    const matches: RegExpExecArray[] = [];
    if (!ValidationChecks.isValidHtml(html)) return matches;

    try {
      // Отримуємо regex з кешу з гарантованим global флагом
      const globalFlags = flags.includes("g") ? flags : `${flags}g`;
      const regex = RegexCache.get(pattern, globalFlags);

      for (const m of html.matchAll(regex)) {
        matches.push(m as unknown as RegExpExecArray);
      }
    } catch (error) {
      // Return empty array on error
    }
    return matches;
  },

  /**
   * Check for forbidden tags using AST
   */
  checkForbiddenTagsAST: (
    ast: HTMLNode[],
    forbiddenTags: readonly string[],
    _ruleName: string,
    callback: (node: HTMLNode, tagName: string) => void
  ): void => {
    if (!ast || !Array.isArray(forbiddenTags)) return;

    const traverseNodes = (nodes: HTMLNode[]) => {
      for (const node of nodes) {
        if (node.type === "element" && node.tagName && forbiddenTags.includes(node.tagName)) {
          callback(node, node.tagName);
        }
        if (node.children && Array.isArray(node.children)) {
          traverseNodes(node.children);
        }
      }
    };

    traverseNodes(ast);
  },

  /**
   * Check for forbidden tags using regex fallback
   */
  checkForbiddenTagsRegex: (
    html: string,
    forbiddenTags: readonly string[],
    _ruleName: string,
    callback: (tagName: string) => void
  ): void => {
    if (!ValidationChecks.isValidHtml(html) || !Array.isArray(forbiddenTags)) return;

    forbiddenTags.forEach((tag) => {
      const pattern = REGEX_PATTERNS.TAG_OPENING(tag);
      const matches = ValidationChecks.findPatternMatches(html, pattern);
      if (matches.length > 0) {
        callback(tag);
      }
    });
  },
};

/**
 * Common autofix patterns
 */
export const AutofixUtils = {
  /**
   * Replace tags with styled spans
   */
  replaceTagsWithSpans: (
    html: string,
    tagReplacements: Record<string, { fontSize?: number; fontWeight?: string; display?: string }>
  ): string => {
    if (!ValidationChecks.isValidHtml(html)) return html;

    let fixedHtml = html;
    try {
      Object.entries(tagReplacements).forEach(([tag, styles]) => {
        // Create pattern with capturing group for attributes
        const openingPattern = `<${tag}((?:\\s[^>]*)?)>`;
        const closingPattern = REGEX_PATTERNS.TAG_CLOSING(tag);

        const styleAttr = Object.entries(styles)
          .map(([prop, value]) => {
            switch (prop) {
              case "fontSize":
                return `font-size: ${value}px`;
              case "fontWeight":
                return `font-weight: ${value}`;
              case "display":
                return `display: ${value}`;
              default:
                return `${prop}: ${value}`;
            }
          })
          .join("; ");

        // Properly handle attributes and style merging
        fixedHtml = fixedHtml.replace(
          RegexCache.get(openingPattern, "gi"),
          (_match, attributes) => {
            // Check if there are existing styles in attributes
            const existingStyleMatch = attributes.match(/style\s*=\s*["']([^"']*)["']/i);
            let finalStyle = styleAttr;

            if (existingStyleMatch) {
              // Parse existing styles into object to avoid duplicates
              const existingStylesText = existingStyleMatch[1].replace(/;\s*$/, "");
              const existingStylesObj: Record<string, string> = {};

              // Parse existing styles
              existingStylesText.split(";").forEach((style: string) => {
                const [prop, value] = style.split(":").map((s: string) => s.trim());
                if (prop && value) {
                  existingStylesObj[prop] = value;
                }
              });

              // Parse new styles and override existing ones
              styleAttr.split(";").forEach((style: string) => {
                const [prop, value] = style.split(":").map((s: string) => s.trim());
                if (prop && value) {
                  existingStylesObj[prop] = value;
                }
              });

              // Rebuild styles without duplicates
              finalStyle = Object.entries(existingStylesObj)
                .map(([prop, value]) => `${prop}: ${value}`)
                .join("; ");

              // Remove existing style attribute
              attributes = attributes.replace(/\s*style\s*=\s*["'][^"']*["']/gi, "");
            }

            return `<span${attributes} style="${finalStyle};">`;
          }
        );
        fixedHtml = fixedHtml.replace(RegexCache.get(closingPattern, "gi"), "</span>");
      });
    } catch (error) {
      // Return original on error
    }
    return fixedHtml;
  },

  /**
   * Replace block elements with table structure
   */
  replaceBlockElementsWithTables: (html: string, blockTags: readonly string[]): string => {
    if (!ValidationChecks.isValidHtml(html)) return html;

    let fixedHtml = html;
    try {
      if (Array.isArray(blockTags)) {
        blockTags.forEach((tag) => {
          const openingPattern = REGEX_PATTERNS.TAG_OPENING(tag);
          const closingPattern = REGEX_PATTERNS.TAG_CLOSING(tag);

          fixedHtml = fixedHtml.replace(
            RegexCache.get(openingPattern),
            '<table cellpadding="0" cellspacing="0" border="0"$1><tr><td valign="top">'
          );
          fixedHtml = fixedHtml.replace(RegexCache.get(closingPattern), "</td></tr></table>");
        });
      }
    } catch (error) {
      // Return original on error
    }
    return fixedHtml;
  },

  /**
   * Remove dangerous tags completely
   */
  removeDangerousTags: (html: string, dangerousTags: readonly string[]): string => {
    if (!ValidationChecks.isValidHtml(html)) return html;

    let fixedHtml = html;
    try {
      if (Array.isArray(dangerousTags)) {
        dangerousTags.forEach((tag) => {
          const withContentPattern = REGEX_PATTERNS.TAG_WITH_CONTENT(tag);
          const selfClosingPattern = REGEX_PATTERNS.TAG_SELF_CLOSING(tag);

          fixedHtml = fixedHtml.replace(
            RegexCache.get(withContentPattern, REGEX_FLAGS.GLOBAL_CASE_INSENSITIVE_DOTALL),
            ""
          );
          fixedHtml = fixedHtml.replace(RegexCache.get(selfClosingPattern), "");
        });
      }
    } catch (error) {
      // Return original on error
    }
    return fixedHtml;
  },

  /**
   * Clean up excessive table nesting
   */
  cleanupTableNesting: (html: string, maxIterations: number = 10): string => {
    if (!ValidationChecks.isValidHtml(html)) return html;

    let fixedHtml = html;
    try {
      let prevHtml;
      let iterations = 0;

      do {
        prevHtml = fixedHtml;
        fixedHtml = fixedHtml.replace(
          RegexCache.get(REGEX_PATTERNS.TABLE_NESTED_EXCESSIVE),
          "<table$1><tr><td$2>"
        );
        fixedHtml = fixedHtml.replace(
          RegexCache.get(REGEX_PATTERNS.TABLE_NESTED_CLOSING),
          "</td></tr></table>"
        );
        iterations++;
      } while (prevHtml !== fixedHtml && iterations < maxIterations);

      // Remove empty tables
      fixedHtml = fixedHtml.replace(RegexCache.get(REGEX_PATTERNS.TABLE_EMPTY), "");

      // Don't wrap single text spans in tables
      fixedHtml = fixedHtml.replace(RegexCache.get(REGEX_PATTERNS.TABLE_SINGLE_SPAN_WRAPPER), "$1");
    } catch (error) {
      // Return original on error
    }
    return fixedHtml;
  },

  /**
   * Merge duplicate style attributes
   */
  mergeDuplicateStyles: (html: string, maxIterations: number = 3): string => {
    if (!ValidationChecks.isValidHtml(html)) return html;

    let fixedHtml = html;
    try {
      let prevHtml;
      let iterations = 0;

      do {
        prevHtml = fixedHtml;
        fixedHtml = fixedHtml.replace(
          RegexCache.get(REGEX_PATTERNS.ATTRIBUTE_STYLE_DUPLICATE),
          (_match, style1, middle, style2) => {
            // Split styles and merge, removing duplicates
            const styles1 = style1.split(";").filter((s: string) => s.trim());
            const styles2 = style2.split(";").filter((s: string) => s.trim());
            const allStyles = [...styles1, ...styles2];

            // Remove duplicates by property name (keep last)
            const uniqueStyles = [];
            const seenProps = new Set();

            for (const style of allStyles.reverse()) {
              const prop = style.split(":")[0]?.trim();
              if (prop && !seenProps.has(prop)) {
                seenProps.add(prop);
                uniqueStyles.unshift(style.trim());
              }
            }

            const combinedStyle = uniqueStyles.join("; ");
            return `style="${combinedStyle}"${middle}`;
          }
        );
        iterations++;
      } while (prevHtml !== fixedHtml && iterations < maxIterations);
    } catch (error) {
      // Return original on error
    }
    return fixedHtml;
  },

  /**
   * Remove empty elements
   */
  removeEmptyElements: (html: string): string => {
    if (!ValidationChecks.isValidHtml(html)) return html;

    let fixedHtml = html;
    try {
      fixedHtml = fixedHtml.replace(RegexCache.get(REGEX_PATTERNS.EMPTY_SPAN), "");
      fixedHtml = fixedHtml.replace(RegexCache.get(REGEX_PATTERNS.EMPTY_SPAN_WHITESPACE), "");
    } catch (error) {
      // Return original on error
    }
    return fixedHtml;
  },
};

/**
 * Common font size mappings for headings
 */
export const HEADING_FONT_SIZES = {
  h1: 32,
  h2: 24,
  h3: 20,
  h4: 18,
  h5: 16,
  h6: 14,
} as const;

/**
 * Helper to get font size for heading level
 */
export const getFontSizeForHeading = (level: number): number => {
  const headingKey = `h${level}` as keyof typeof HEADING_FONT_SIZES;
  return HEADING_FONT_SIZES[headingKey] || 14;
};
