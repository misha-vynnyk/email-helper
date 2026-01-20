import { RegexCache, StringBatcher } from "./cache";
import { COMMON_PATTERNS, EMAIL_DEFAULTS, PERFORMANCE_CONSTANTS } from "./EMAIL_CONSTANTS";
import { findNodesByTagName, SimpleHTMLParser, traverseAST } from "./htmlParser";
import { REGEX_PATTERNS } from "./regexPatterns";
import {
  EMAIL_SAFE_TAGS,
  FORBIDDEN_TAGS,
  HTMLNode,
  REQUIRED_TABLE_ATTRIBUTES,
  TraversalContext,
  ValidationResult,
  ValidationRule,
} from "./types";
import { AutofixUtils, HEADING_FONT_SIZES, ValidationChecks } from "./validationUtils";

// Cache classes moved to cache.ts to avoid circular dependencies

export const EMAIL_VALIDATION_RULES: Record<string, ValidationRule> = {
  "forbidden-tags": {
    name: "forbidden-tags",
    displayName: "Forbidden HTML Tags (Legacy)",
    description: "Legacy rule - replaced by specific rules (heading-tags, paragraph-tags, etc.)",
    severity: "error",
    enabled: false,
    configurable: true,
    category: "structure",
    config: {
      allowedTags: EMAIL_SAFE_TAGS,
      forbiddenTags: FORBIDDEN_TAGS,
    },
    check: (html: string, _config = {}) => {
      const results: ValidationResult[] = [];
      if (!html || typeof html !== "string") return results;

      try {
        const parser = new SimpleHTMLParser(html);
        const ast = parser.parse();
        const forbiddenTags = _config.forbiddenTags || FORBIDDEN_TAGS;

        traverseAST(ast, (node) => {
          if (
            node.type === "element" &&
            node.tagName &&
            Array.isArray(forbiddenTags) &&
            forbiddenTags.includes(node.tagName)
          ) {
            results.push({
              rule: "forbidden-tags",
              severity: "error",
              message: `Tag "${node.tagName}" is not email-safe`,
              line: node.line,
              column: node.column,
              suggestion: getTagReplacement(node.tagName),
              autoFixAvailable: true,
              category: "structure",
            });
          }
        });
      } catch (error) {
        // Fallback regex checking
        const forbiddenTags = _config.forbiddenTags || FORBIDDEN_TAGS;
        if (Array.isArray(forbiddenTags)) {
          forbiddenTags.forEach((tag) => {
            const regex = RegexCache.get(`<${tag}(?:\\s[^>]*)?>`, "gi");
            const matches = html.match(regex);
            if (matches) {
              matches.forEach(() => {
                results.push({
                  rule: "forbidden-tags",
                  severity: "error",
                  message: `Tag "${tag}" is not email-safe`,
                  suggestion: getTagReplacement(tag),
                  autoFixAvailable: true,
                  category: "structure",
                });
              });
            }
          });
        }
      }
      return results;
    },
    checkWithAST: (html: string, ast: HTMLNode[], _config = {}) => {
      const results: ValidationResult[] = [];
      if (!html || typeof html !== "string" || !ast) return results;

      try {
        const forbiddenTags = _config.forbiddenTags || FORBIDDEN_TAGS;

        traverseAST(ast, (node) => {
          if (
            node.type === "element" &&
            node.tagName &&
            Array.isArray(forbiddenTags) &&
            forbiddenTags.includes(node.tagName)
          ) {
            results.push({
              rule: "forbidden-tags",
              severity: "error",
              message: `Tag "${node.tagName}" is not email-safe`,
              line: node.line,
              column: node.column,
              suggestion: getTagReplacement(node.tagName),
              autoFixAvailable: true,
              category: "structure",
            });
          }
        });
      } catch (error) {
        // Fallback to original check method
        return EMAIL_VALIDATION_RULES["forbidden-tags"].check(html, _config);
      }
      return results;
    },
    autofix: (html: string) => {
      if (!html || typeof html !== "string") return html;

      let fixedHtml = html;
      try {
        // Replace headings with styled spans (INLINE ONLY for email safety)
        for (let i = 1; i <= PERFORMANCE_CONSTANTS.MAX_HEADING_LEVELS; i++) {
          const regex = RegexCache.get(`<h${i}([^>]*)>`);
          const closeRegex = RegexCache.get(`</h${i}>`);
          fixedHtml = fixedHtml.replace(
            regex,
            `<span$1 style="font-weight: bold; font-size: ${getFontSizeForHeading(i)}px;">`
          );
          fixedHtml = fixedHtml.replace(closeRegex, "</span>");
        }

        // Replace paragraphs with spans only (no br)
        fixedHtml = fixedHtml.replace(RegexCache.get("<p([^>]*)>"), "<span$1>");
        fixedHtml = fixedHtml.replace(RegexCache.get("</p>"), "</span>");

        // Replace block elements with table structure - but limit nesting
        const blockTags = [
          "div",
          "section",
          "article",
          "nav",
          "header",
          "footer",
          "main",
          "aside",
          "figure",
          "figcaption",
        ];

        // Count existing tables to prevent excessive nesting
        const existingTables = (fixedHtml.match(/<table/g) || []).length;
        const maxTables = EMAIL_DEFAULTS.MAX_TABLES; // Limit total tables to prevent excessive nesting

        if (existingTables < maxTables) {
          blockTags.forEach((tag) => {
            const regex = RegexCache.get(`<${tag}((?:\\s[^>]*)?)>`);
            const closeRegex = RegexCache.get(`</${tag}>`);
            fixedHtml = fixedHtml.replace(
              regex,
              '<table cellpadding="0" cellspacing="0" border="0"$1><tr><td valign="top">'
            );
            fixedHtml = fixedHtml.replace(closeRegex, "</td></tr></table>");
          });
        }

        // Remove dangerous/unsupported tags completely
        const removeTags = [
          "script",
          "style",
          "form",
          "input",
          "button",
          "textarea",
          "select",
          "option",
          "fieldset",
          "legend",
          "label",
          "video",
          "audio",
          "canvas",
          "svg",
          "iframe",
          "embed",
          "object",
          "base", // Doesn't work in most email clients
          "col", // Doesn't work in most email clients
          "area", // Doesn't work in most email clients
        ];
        removeTags.forEach((tag) => {
          // Використовуємо більш ефективний паттерн без backtracking
          const regex = RegexCache.get(`<${tag}(?:\\s[^>]*)?>(?:[\\s\\S]*?)</${tag}>`, "gi");
          fixedHtml = fixedHtml.replace(regex, "");
          const selfClosingRegex = RegexCache.get(`<${tag}(?:\\s[^>]*)?/>`, "gi");
          fixedHtml = fixedHtml.replace(selfClosingRegex, "");
        });

        // Fix duplicate style attributes - limited iterations for safety
        for (let i = 0; i < EMAIL_DEFAULTS.MAX_STYLE_MERGE_ITERATIONS; i++) {
          const beforeFix = fixedHtml;
          fixedHtml = fixedHtml.replace(
            RegexCache.get('style="([^"]*?)"([^>]*?)style="([^"]*?)"'),
            (match, style1, middle, style2) => {
              // Split styles and merge, removing duplicates
              const styles1 = style1.split(";").filter((s: string) => s.trim());
              const styles2 = style2.split(";").filter((s: string) => s.trim());
              const allStyles = [...styles1, ...styles2];

              // Remove duplicates by property name
              const uniqueStyles = [];
              const seenProps = new Set();

              for (const style of allStyles) {
                const prop = style.split(":")[0]?.trim();
                if (prop && !seenProps.has(prop)) {
                  seenProps.add(prop);
                  uniqueStyles.push(style.trim());
                }
              }

              const combinedStyle = uniqueStyles.join("; ");
              return `style="${combinedStyle}"${middle}`;
            }
          );

          // Break if no changes made
          if (beforeFix === fixedHtml) {
            break;
          }
        }

        // Clean up excessive table nesting - limited iterations for safety
        for (let i = 0; i < EMAIL_DEFAULTS.MAX_AUTOFIX_ITERATIONS; i++) {
          const beforeFix = fixedHtml;
          fixedHtml = fixedHtml.replace(
            RegexCache.get("<table([^>]*?)><tr><td([^>]*?)><table([^>]*?)><tr><td([^>]*?)>"),
            "<table$1><tr><td$2>"
          );
          fixedHtml = fixedHtml.replace(
            RegexCache.get("<\\/td><\\/tr><\\/table><\\/td><\\/tr><\\/table>"),
            "</td></tr></table>"
          );

          // Break if no changes made
          if (beforeFix === fixedHtml) {
            break;
          }
        }

        // Remove empty tables
        fixedHtml = fixedHtml.replace(
          RegexCache.get("<table[^>]*><tr><td[^>]*>\\s*<\\/td><\\/tr><\\/table>"),
          ""
        );

        // Don't wrap single text spans in tables
        fixedHtml = fixedHtml.replace(
          RegexCache.get(
            "<table[^>]*><tr><td[^>]*>(\\s*<span[^>]*>[^<]+<\\/span>\\s*)<\\/td><\\/tr><\\/table>"
          ),
          "$1"
        );

        // Remove empty and whitespace-only span tags
        fixedHtml = fixedHtml.replace(RegexCache.get("<span[^>]*>\\s*<\\/span>"), "");
        fixedHtml = fixedHtml.replace(RegexCache.get("<span[^>]*>[\\s\\t\\n\\r]*<\\/span>"), "");

        // Fix broken img src attributes EARLY (like "s rc" -> "src")
        fixedHtml = fixedHtml.replace(RegexCache.get("\\bs\\s+rc="), "src=");
        fixedHtml = fixedHtml.replace(RegexCache.get("\\bS\\s+RC="), "src=");

        // Fix missing spaces between img attributes early
        fixedHtml = fixedHtml.replace(RegexCache.get('="([^"]*)"([a-zA-Z]+=)'), '="$1" $2');

        // Fix specific malformed img attributes like src="test.jpg"alt="test"
        fixedHtml = fixedHtml.replace(
          RegexCache.get('(<img[^>]*?)([a-zA-Z0-9_.-]+")([a-zA-Z]+=)'),
          "$1$2 $3"
        );
      } catch (error) {
        // Return original on error
      }

      // FINAL FIX: Ensure s rc is fixed no matter what (outside try-catch)
      fixedHtml = fixedHtml.replace(RegexCache.get("\\bs\\s+rc="), "src=");
      fixedHtml = fixedHtml.replace(RegexCache.get("\\bS\\s+RC="), "src=");

      return fixedHtml;
    },
  },

  "email-safe-tags": {
    name: "email-safe-tags",
    displayName: "Email-Safe Tag Format",
    description: "Ensures tags are formatted correctly for email clients",
    severity: "error",
    enabled: true,
    configurable: false,
    category: "structure",
    check: (html: string) => {
      const results: ValidationResult[] = [];
      if (!html || typeof html !== "string") return results;

      try {
        // Check for wrong closing and self-closing br/hr tags
        const emailOpenTags = ["br", "hr"];
        emailOpenTags.forEach((tag) => {
          // Check for wrong closing: <br></br>
          const wrongClosingPattern = RegexCache.get(`<${tag}\\s*[^>]*><\\/${tag}>`);
          const wrongMatches = html.match(wrongClosingPattern);
          if (wrongMatches) {
            wrongMatches.forEach(() => {
              results.push({
                rule: "email-safe-tags",
                severity: "error",
                message: `Tag "${tag}" should not have closing tag in emails`,
                suggestion: `Replace <${tag}></${tag}> with <${tag}>`,
                autoFixAvailable: true,
                category: "structure",
              });
            });
          }

          // Check for self-closing: <br/> or <br />
          const selfClosingPattern = RegexCache.get(`<${tag}\\s*[^>]*\\/>`);
          const selfClosingMatches = html.match(selfClosingPattern);
          if (selfClosingMatches) {
            selfClosingMatches.forEach(() => {
              results.push({
                rule: "email-safe-tags",
                severity: "error",
                message: `Tag "${tag}" should be open tag in emails, not self-closing`,
                suggestion: `Replace <${tag}/> with <${tag}>`,
                autoFixAvailable: true,
                category: "structure",
              });
            });
          }
        });

        // Check for images that should be self-closing
        const emailSelfClosingTags = ["img"];
        emailSelfClosingTags.forEach((tag) => {
          const wrongClosingPattern = RegexCache.get(`<${tag}\\s*[^>]*><\\/${tag}>`);
          const wrongMatches = html.match(wrongClosingPattern);
          if (wrongMatches) {
            wrongMatches.forEach(() => {
              results.push({
                rule: "email-safe-tags",
                severity: "error",
                message: `Tag "${tag}" should be self-closing`,
                suggestion: `Replace <${tag}></${tag}> with <${tag} />`,
                autoFixAvailable: true,
                category: "structure",
              });
            });
          }
        });
      } catch (error) {
        // Silently fail
      }
      return results;
    },
    autofix: (html: string) => {
      if (!html || typeof html !== "string") return html;

      try {
        // Use StringBatcher for batch operations
        const batcher = new StringBatcher();

        // Add all operations to batch
        batcher
          // Fix BR tags: make them open tags (not self-closing)
          .add(RegexCache.get("<br\\s*[^>]*><\\/br>"), "<br>")
          .add(RegexCache.get("<br\\s*[^>]*\\/>"), "<br>")
          // Fix HR tags: make them open tags (not self-closing)
          .add(RegexCache.get("<hr\\s*[^>]*><\\/hr>"), "<hr>")
          .add(RegexCache.get("<hr\\s*[^>]*\\/>"), "<hr>")
          // Fix IMG tags: make them properly self-closing
          .add(RegexCache.get("<img\\s*([^>]*?)><\\/img>"), "<img $1 />")
          // Clean up malformed tags
          .add(RegexCache.get("<br\\/\\s*\\/>"), "<br>")
          .add(RegexCache.get("<br\\s*\\/\\s*\\/>"), "<br>")
          .add(RegexCache.get("<hr\\/\\s*\\/>"), "<hr>")
          .add(RegexCache.get("<hr\\s*\\/\\s*\\/>"), "<hr>")
          // Fix malformed img tags - more comprehensive
          .add(RegexCache.get("(<img[^>]*?)\\s*\\/\\s*([^>]*?)>"), "$1$2 />")
          .add(RegexCache.get("(<img[^>]*?)([^\"'])\\s*\\/\\s*([^>]*?)>"), "$1$2$3 />")
          .add(RegexCache.get("<img([^>]*?)([^/])\\s*\\/\\s*\\/\\s*>"), "<img$1$2 />")
          // Clean up multiple spaces in self-closing tags (only for img)
          .add(RegexCache.get("(<img[^>]*?)\\s+\\/>", "g"), "$1 />")
          // Fix missing spaces before attributes (remaining cases)
          .add(RegexCache.get("(<img[^>]*?)([a-zA-Z])([a-zA-Z]+=)"), "$1$2 $3")
          // Clean up malformed attribute spaces and quotes
          .add(RegexCache.get("\\s+(style|alt|src|class|width|height)="), " $1=")
          .add(RegexCache.get("=\\s*([^\"'\\s>]+)"), '="$1"')
          // Remove extra spaces in tag content
          .add(RegexCache.get("\\s+>", "gi"), ">")
          .add(RegexCache.get("<\\s+", "gi"), "<")
          // FINAL FIX: s rc -> src
          .add(RegexCache.get("\\bs\\s+rc="), "src=")
          .add(RegexCache.get("\\bS\\s+RC="), "src=");

        // Execute all operations in batch
        return batcher.execute(html);
      } catch (error) {
        // Return original on error
        return html;
      }
    },
  },

  "table-attributes": {
    name: "table-attributes",
    displayName: "Required Table Attributes",
    description: "Ensures tables have required email-safe attributes",
    severity: "error",
    enabled: true,
    configurable: true,
    category: "structure",
    config: {
      requiredAttributes: REQUIRED_TABLE_ATTRIBUTES,
    },
    check: (html: string) => {
      const results: ValidationResult[] = [];
      if (!html || typeof html !== "string") return results;

      try {
        const parser = new SimpleHTMLParser(html);
        const ast = parser.parse();

        // Check tables
        const tables = findNodesByTagName(ast, "table");
        tables.forEach((table) => {
          const attrs = table.attributes || {};

          if (!attrs.cellpadding || attrs.cellpadding !== "0") {
            results.push({
              rule: "table-attributes",
              severity: "error",
              message: 'Table should have cellpadding="0"',
              line: table.line,
              column: table.column,
              suggestion: 'Add cellpadding="0" to table tag',
              autoFixAvailable: true,
              category: "structure",
            });
          }

          if (!attrs.cellspacing || attrs.cellspacing !== "0") {
            results.push({
              rule: "table-attributes",
              severity: "error",
              message: 'Table should have cellspacing="0"',
              line: table.line,
              column: table.column,
              suggestion: 'Add cellspacing="0" to table tag',
              autoFixAvailable: true,
              category: "structure",
            });
          }

          if (!attrs.border || attrs.border !== "0") {
            results.push({
              rule: "table-attributes",
              severity: "error",
              message: 'Table should have border="0"',
              line: table.line,
              column: table.column,
              suggestion: 'Add border="0" to table tag',
              autoFixAvailable: true,
              category: "structure",
            });
          }
        });

        // Check images for required attributes
        const images = findNodesByTagName(ast, "img");
        images.forEach((img) => {
          const attrs = img.attributes || {};

          if (!attrs.alt) {
            results.push({
              rule: "table-attributes",
              severity: "error",
              message: "Image must have alt attribute",
              line: img.line,
              column: img.column,
              suggestion: 'Add alt="" to img tag',
              autoFixAvailable: true,
              category: "accessibility",
            });
          }

          if (!attrs.width) {
            results.push({
              rule: "table-attributes",
              severity: "error",
              message: "Image must have width attribute",
              line: img.line,
              column: img.column,
              suggestion: `Add width="${EMAIL_DEFAULTS.DEFAULT_IMAGE_WIDTH}" to img tag`,
              autoFixAvailable: true,
              category: "structure",
            });
          }

          if (!attrs.height) {
            results.push({
              rule: "table-attributes",
              severity: "error",
              message: "Image must have height attribute",
              line: img.line,
              column: img.column,
              suggestion: `Add height="${EMAIL_DEFAULTS.DEFAULT_IMAGE_HEIGHT}" to img tag`,
              autoFixAvailable: true,
              category: "structure",
            });
          }

          if (!attrs.style || !attrs.style.includes("display:block")) {
            results.push({
              rule: "table-attributes",
              severity: "error",
              message: 'Image must have style="display:block"',
              line: img.line,
              column: img.column,
              suggestion: 'Add style="display:block" to img tag',
              autoFixAvailable: true,
              category: "structure",
            });
          }
        });
      } catch (error) {
        results.push({
          rule: "table-attributes",
          severity: "warning",
          message: "Unable to parse HTML for detailed checking",
          suggestion: 'Check table attributes manually: cellpadding="0" cellspacing="0" border="0"',
          autoFixAvailable: false,
          category: "structure",
        });
      }
      return results;
    },
    checkWithAST: (html: string, ast: HTMLNode[], _config, traversalContext?: TraversalContext) => {
      const results: ValidationResult[] = [];
      if (!html || typeof html !== "string" || !ast) return results;

      try {
        // Використовуємо оптимізований traversal контекст
        const tables =
          traversalContext?.findNodesByTag("table") || findNodesByTagName(ast, "table");
        tables.forEach((table) => {
          const attrs = table.attributes || {};

          if (!attrs.cellpadding || attrs.cellpadding !== "0") {
            results.push({
              rule: "table-attributes",
              severity: "error",
              message: 'Table should have cellpadding="0"',
              line: table.line,
              column: table.column,
              suggestion: 'Add cellpadding="0" to table tag',
              autoFixAvailable: true,
              category: "structure",
            });
          }

          if (!attrs.cellspacing || attrs.cellspacing !== "0") {
            results.push({
              rule: "table-attributes",
              severity: "error",
              message: 'Table should have cellspacing="0"',
              line: table.line,
              column: table.column,
              suggestion: 'Add cellspacing="0" to table tag',
              autoFixAvailable: true,
              category: "structure",
            });
          }

          if (!attrs.border || attrs.border !== "0") {
            results.push({
              rule: "table-attributes",
              severity: "error",
              message: 'Table should have border="0"',
              line: table.line,
              column: table.column,
              suggestion: 'Add border="0" to table tag',
              autoFixAvailable: true,
              category: "structure",
            });
          }
        });

        // Check images for required attributes using optimized traversal
        const images = traversalContext?.findNodesByTag("img") || findNodesByTagName(ast, "img");
        images.forEach((img) => {
          const attrs = img.attributes || {};

          if (!attrs.alt) {
            results.push({
              rule: "table-attributes",
              severity: "error",
              message: "Image must have alt attribute",
              line: img.line,
              column: img.column,
              suggestion: 'Add alt="" to img tag',
              autoFixAvailable: true,
              category: "accessibility",
            });
          }

          if (!attrs.width) {
            results.push({
              rule: "table-attributes",
              severity: "error",
              message: "Image must have width attribute",
              line: img.line,
              column: img.column,
              suggestion: `Add width="${EMAIL_DEFAULTS.DEFAULT_IMAGE_WIDTH}" to img tag`,
              autoFixAvailable: true,
              category: "structure",
            });
          }

          if (!attrs.height) {
            results.push({
              rule: "table-attributes",
              severity: "error",
              message: "Image must have height attribute",
              line: img.line,
              column: img.column,
              suggestion: `Add height="${EMAIL_DEFAULTS.DEFAULT_IMAGE_WIDTH}" to img tag`,
              autoFixAvailable: true,
              category: "structure",
            });
          }

          if (!attrs.style || !attrs.style.includes("display:block")) {
            results.push({
              rule: "table-attributes",
              severity: "error",
              message: 'Image must have style="display:block"',
              line: img.line,
              column: img.column,
              suggestion: 'Add style="display:block" to img tag',
              autoFixAvailable: true,
              category: "structure",
            });
          }
        });
      } catch (error) {
        // Fallback to original check method
        return EMAIL_VALIDATION_RULES["table-attributes"].check(html);
      }
      return results;
    },
    autofix: (html: string) => {
      if (!html || typeof html !== "string") return html;

      let fixedHtml = html;
      try {
        // Fix table attributes (avoid duplicates and fix wrong values)
        fixedHtml = fixedHtml.replace(/<table([^>]*?)>/gi, (match, attrs) => {
          let newAttrs = attrs;

          // Fix existing wrong values
          newAttrs = newAttrs.replace(/cellpadding="[^"]*"/gi, 'cellpadding="0"');
          newAttrs = newAttrs.replace(/cellspacing="[^"]*"/gi, 'cellspacing="0"');
          newAttrs = newAttrs.replace(/border="[^"]*"/gi, 'border="0"');

          // Add missing attributes
          if (!newAttrs.includes("cellpadding=")) newAttrs += ' cellpadding="0"';
          if (!newAttrs.includes("cellspacing=")) newAttrs += ' cellspacing="0"';
          if (!newAttrs.includes("border=")) newAttrs += ' border="0"';

          return `<table${newAttrs}>`;
        });

        // Fix td attributes (avoid duplicates and fix wrong values)
        fixedHtml = fixedHtml.replace(/<td([^>]*?)>/gi, (match, attrs) => {
          let newAttrs = attrs;

          // Fix existing wrong valign values
          newAttrs = newAttrs.replace(/valign="(middle|bottom|baseline)"/gi, 'valign="top"');

          // Add missing valign
          if (!newAttrs.includes("valign=")) newAttrs += ' valign="top"';

          return `<td${newAttrs}>`;
        });

        // Fix img attributes (comprehensive replacement)
        fixedHtml = fixedHtml.replace(/<img([^>]*?)(\s*\/?\s*)>/gi, (match, attrs) => {
          let newAttrs = attrs;

          // Alt handling is done by image-alt-attributes rule - skip here to avoid conflicts

          // Add width if missing (default from constants)
          if (!newAttrs.includes("width="))
            newAttrs += ` width="${EMAIL_DEFAULTS.DEFAULT_IMAGE_WIDTH}"`;

          // Add height if missing (default from constants)
          if (!newAttrs.includes("height="))
            newAttrs += ` height="${EMAIL_DEFAULTS.DEFAULT_IMAGE_HEIGHT}"`;

          // Fix percentage widths to max-width for email compatibility (only if not already max-width)
          if (newAttrs.includes("width: 100%") && !newAttrs.includes("max-width:")) {
            newAttrs = newAttrs.replace(
              /style="([^"]*?)width:\s*100%([^"]*?)"/gi,
              (styleMatch: string, before: string, after: string) => {
                const beforeStyles = before.trim();
                const afterStyles = after.trim();
                const separator1 = beforeStyles && !beforeStyles.endsWith(";") ? "; " : "";
                const separator2 = afterStyles && !afterStyles.startsWith(";") ? "; " : "";
                return `style="${beforeStyles}${separator1}max-width:100%${separator2}${afterStyles}"`;
              }
            );
          }

          // Add or update style with display:block
          if (!newAttrs.includes("style=")) {
            newAttrs += ' style="display:block"';
          } else {
            // Add display:block if not present
            if (!newAttrs.includes("display:block")) {
              newAttrs = newAttrs.replace(
                /style="([^"]*?)"/gi,
                (styleMatch: string, styleContent: string) => {
                  const trimmed = styleContent.trim();
                  const separator = trimmed && !trimmed.endsWith(";") ? "; " : "";
                  return `style="${trimmed}${separator}display:block"`;
                }
              );
            }
          }

          // Ensure proper self-closing format
          return `<img${newAttrs} />`;
        });
      } catch (error) {
        // Return original on error
      }
      return fixedHtml;
    },
  },

  "email-safe-links": {
    name: "email-safe-links",
    displayName: "Email-Safe Links",
    description: "Ensures links are formatted correctly for email clients",
    severity: "error",
    enabled: true,
    configurable: false,
    category: "structure",
    check: (html: string) => {
      const results: ValidationResult[] = [];
      if (!html || typeof html !== "string") return results;

      try {
        // Check for empty href attributes
        const emptyHrefPattern = /<a[^>]*href\s*=\s*["']?\s*["']?[^>]*>/gi;
        for (const match of html.matchAll(emptyHrefPattern)) {
          if (match[0].includes('href=""') || match[0].includes("href=''")) {
            results.push({
              rule: "email-safe-links",
              severity: "error",
              message: "Link has empty href attribute",
              suggestion: "Remove empty links or provide valid href",
              autoFixAvailable: true,
              category: "structure",
            });
          }
        }

        // Check for wrong target attributes
        const wrongTargetPattern = /<a[^>]*target\s*=\s*["'](_self|_parent|_top)["'][^>]*>/gi;
        for (const match of html.matchAll(wrongTargetPattern)) {
          results.push({
            rule: "email-safe-links",
            severity: "warning",
            message: `Link target "${match[1]}" doesn't work in most email clients`,
            suggestion: 'Use target="_blank" for all email links',
            autoFixAvailable: true,
            category: "compatibility",
          });
        }

        // Check for missing target="_blank"
        const noTargetPattern = /<a[^>]*href\s*=\s*["'][^"']*["'][^>]*(?!target\s*=)[^>]*>/gi;
        for (const match of html.matchAll(noTargetPattern)) {
          if (!match[0].includes("target=")) {
            results.push({
              rule: "email-safe-links",
              severity: "warning",
              message: 'Link should have target="_blank" in emails',
              suggestion: 'Add target="_blank" to all email links',
              autoFixAvailable: true,
              category: "best-practice",
            });
          }
        }

        // Check for missing styles in links
        const noStylePattern = /<a[^>]*href\s*=\s*["'][^"']*["'][^>]*(?!style\s*=)[^>]*>/gi;
        for (const match of html.matchAll(noStylePattern)) {
          if (!match[0].includes("style=")) {
            results.push({
              rule: "email-safe-links",
              severity: "warning",
              message: "Link should have inline styles for email compatibility",
              suggestion: 'Add style="color:#0000ff; text-decoration:none;" to links',
              autoFixAvailable: true,
              category: "best-practice",
            });
          }
        }
      } catch (error) {
        // Silently fail
      }
      return results;
    },
    autofix: (html: string) => {
      if (!html || typeof html !== "string") return html;

      let fixedHtml = html;
      try {
        // Fix empty href by setting default value "urlhere" (ONLY for <a> tags)
        fixedHtml = fixedHtml.replace(
          /<a\b([^>]*?)href\s*=\s*["']?\s*["']?([^>]*?)>/gi,
          (match, before, after) => {
            // Replace empty href with default value
            if (
              match.includes('href=""') ||
              match.includes("href=''") ||
              match.includes("href= ")
            ) {
              return `<a${before} href="${COMMON_PATTERNS.DEFAULT_HREF_VALUE}"${after}>`;
            }
            // Keep non-empty href attributes
            return match;
          }
        );

        // Fix wrong target attributes to _blank (only within <a> tags)
        fixedHtml = fixedHtml.replace(
          /<a\b([^>]*?)target\s*=\s*["'](_self|_parent|_top)["']([^>]*?)>/gi,
          '<a$1target="_blank"$3>'
        );

        // Enhanced link processing: add target="_blank" and styles (ONLY for <a> tags)
        fixedHtml = fixedHtml.replace(/<a\b([^>]*)>/gi, (match, attrs) => {
          let newAttrs = attrs;

          // Fix malformed href attributes (missing = sign)
          newAttrs = newAttrs.replace(/\s+href\s+([^"\s>]+)/gi, ' href="$1"');
          newAttrs = newAttrs.replace(/\s+href\s+"([^"]*)"([^>]*)/gi, ' href="$1"$2');

          // Add default href if completely missing
          if (!newAttrs.includes("href=")) {
            newAttrs += ` href="${COMMON_PATTERNS.DEFAULT_HREF_VALUE}"`;
          }

          // Add target="_blank" if missing
          if (!newAttrs.includes("target=")) {
            newAttrs += ' target="_blank"';
          }

          // Add default email-safe styles if missing
          if (!newAttrs.includes("style=")) {
            newAttrs += ' style="color:#0000ff; text-decoration:none;"';
          } else {
            // Enhance existing styles if needed
            if (!newAttrs.includes("text-decoration:")) {
              newAttrs = newAttrs.replace(
                /style="([^"]*?)"/gi,
                (styleMatch: string, styleContent: string) => {
                  const trimmed = styleContent.trim();
                  const separator = trimmed && !trimmed.endsWith(";") ? "; " : "";
                  return `style="${trimmed}${separator}text-decoration:none"`;
                }
              );
            }
          }

          return `<a${newAttrs}>`;
        });
      } catch (error) {
        // Return original on error
      }
      return fixedHtml;
    },
  },

  "email-unsafe-attributes": {
    name: "email-unsafe-attributes",
    displayName: "Email-Unsafe Attributes",
    description: "Removes attributes that don't work or are dangerous in emails",
    severity: "warning",
    enabled: true,
    configurable: false,
    category: "compatibility",
    check: (html: string) => {
      const results: ValidationResult[] = [];
      if (!html || typeof html !== "string") return results;

      try {
        const unsafeAttrs = [
          "id",
          "class",
          "onclick",
          "onload",
          "onmouseover",
          "contenteditable",
          "draggable",
          "data-\\w+",
        ];

        unsafeAttrs.forEach((attr) => {
          const pattern = RegexCache.get(`\\s${attr}\\s*=\\s*["'][^"']*["']`);
          if (pattern.test(html)) {
            results.push({
              rule: "email-unsafe-attributes",
              severity: "warning",
              message: `Attribute "${attr}" may not work in email clients`,
              suggestion: "Remove or replace with inline styles",
              autoFixAvailable: true,
              category: "compatibility",
            });
          }
        });
      } catch (error) {
        // Silently fail
      }
      return results;
    },
    autofix: (html: string) => {
      if (!html || typeof html !== "string") return html;

      try {
        const batcher = new StringBatcher();

        // Remove unsafe attributes
        const unsafeAttrs = [
          "id",
          "class",
          "onclick",
          "onload",
          "onmouseover",
          "onmouseout",
          "onfocus",
          "onblur",
          "contenteditable",
          "draggable",
          "spellcheck",
          "tabindex",
          "accesskey",
          "data-[\\w-]+",
          "aria-[\\w-]+", // data-* and aria-* attributes
        ];

        // Add attribute removal operations to batch
        unsafeAttrs.forEach((attr) => {
          batcher.add(RegexCache.get(`\\s${attr}\\s*=\\s*["'][^"']*["']`), "");
        });

        // Add cleanup operations
        batcher.add(RegexCache.get("\\s+>", "g"), ">").add(RegexCache.get("\\s{2,}", "g"), " ");

        return batcher.execute(html);
      } catch (error) {
        // Return original on error
        return html;
      }
    },
  },

  "heading-tags": {
    name: "heading-tags",
    displayName: "Heading Tags Replacement",
    description: "Replaces h1-h6 tags with styled spans for email compatibility",
    severity: "error",
    enabled: true,
    configurable: false,
    category: "structure",
    check: (html: string) => {
      const results: ValidationResult[] = [];
      if (!ValidationChecks.isValidHtml(html)) return results;

      try {
        for (let i = 1; i <= PERFORMANCE_CONSTANTS.MAX_HEADING_LEVELS; i++) {
          const pattern = REGEX_PATTERNS.TAG_OPENING(`h${i}`);
          const matches = ValidationChecks.findPatternMatches(html, pattern);

          matches.forEach(() => {
            results.push(
              ValidationChecks.createValidationResult(
                "heading-tags",
                "error",
                `Heading tag h${i} is not email-safe`,
                `Replace h${i} with styled span`,
                "structure"
              )
            );
          });
        }
      } catch (error) {
        // Silently fail
      }
      return results;
    },
    checkWithAST: (html: string, ast: HTMLNode[]) => {
      const results: ValidationResult[] = [];
      if (!ValidationChecks.isValidHtml(html) || !ast) return results;

      try {
        const headingTags = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;

        ValidationChecks.checkForbiddenTagsAST(ast, headingTags, "heading-tags", (node) => {
          results.push(
            ValidationChecks.createValidationResult(
              "heading-tags",
              "error",
              `Heading tag ${node.tagName} is not email-safe`,
              `Replace ${node.tagName} with styled span`,
              "structure",
              node.line,
              node.column
            )
          );
        });
      } catch (error) {
        // Fallback to regex check
        return EMAIL_VALIDATION_RULES["heading-tags"].check(html);
      }
      return results;
    },
    autofix: (html: string) => {
      if (!ValidationChecks.isValidHtml(html)) return html;

      try {
        // Use utility function to replace headings with styled spans
        const headingReplacements = Object.fromEntries(
          Object.entries(HEADING_FONT_SIZES).map(([tag, fontSize]) => [
            tag,
            { fontSize, fontWeight: "bold" },
          ])
        );

        return AutofixUtils.replaceTagsWithSpans(html, headingReplacements);
      } catch (error) {
        // Return original on error
        return html;
      }
    },
  },

  "paragraph-tags": {
    name: "paragraph-tags",
    displayName: "Paragraph Tags Replacement",
    description: "Replaces p tags with spans for email compatibility",
    severity: "error",
    enabled: true,
    configurable: false,
    category: "structure",
    check: (html: string) => {
      const results: ValidationResult[] = [];
      if (!ValidationChecks.isValidHtml(html)) return results;

      try {
        const pattern = REGEX_PATTERNS.TAG_OPENING("p");
        const matches = ValidationChecks.findPatternMatches(html, pattern);

        matches.forEach(() => {
          results.push(
            ValidationChecks.createValidationResult(
              "paragraph-tags",
              "error",
              "Paragraph tag is not email-safe",
              "Replace p with span",
              "structure"
            )
          );
        });
      } catch (error) {
        // Silently fail
      }
      return results;
    },
    checkWithAST: (html: string, ast: HTMLNode[]) => {
      const results: ValidationResult[] = [];
      if (!html || typeof html !== "string" || !ast) return results;

      try {
        traverseAST(ast, (node) => {
          if (node.type === "element" && node.tagName === "p") {
            results.push({
              rule: "paragraph-tags",
              severity: "error",
              message: "Paragraph tag is not email-safe",
              line: node.line,
              column: node.column,
              suggestion: "Replace p with span",
              autoFixAvailable: true,
              category: "structure",
            });
          }
        });
      } catch (error) {
        // Fallback to regex check
        return EMAIL_VALIDATION_RULES["paragraph-tags"].check(html);
      }
      return results;
    },
    autofix: (html: string) => {
      if (!html || typeof html !== "string") return html;

      let fixedHtml = html;
      try {
        // Replace paragraphs with spans
        fixedHtml = fixedHtml.replace(RegexCache.get("<p([^>]*)>"), "<span$1>");
        fixedHtml = fixedHtml.replace(RegexCache.get("</p>"), "</span>");
      } catch (error) {
        // Return original on error
      }
      return fixedHtml;
    },
  },

  "block-element-tags": {
    name: "block-element-tags",
    displayName: "Block Element Tags Replacement",
    description:
      "Replaces block elements (div, section, etc.) with table structure for email compatibility",
    severity: "error",
    enabled: true,
    configurable: true,
    category: "structure",
    config: {
      blockTags: [
        "div",
        "section",
        "article",
        "nav",
        "header",
        "footer",
        "main",
        "aside",
        "figure",
        "figcaption",
      ],
    },
    check: (html: string, _config = {}) => {
      const results: ValidationResult[] = [];
      if (!html || typeof html !== "string") return results;

      try {
        const blockTags = _config.blockTags || [
          "div",
          "section",
          "article",
          "nav",
          "header",
          "footer",
          "main",
          "aside",
          "figure",
          "figcaption",
        ];

        if (Array.isArray(blockTags)) {
          blockTags.forEach((tag) => {
            const regex = RegexCache.get(`<${tag}(?:\\s[^>]*)?>`, "gi");
            const matches = html.match(regex);
            if (matches) {
              matches.forEach(() => {
                results.push({
                  rule: "block-element-tags",
                  severity: "error",
                  message: `Block element "${tag}" is not email-safe`,
                  suggestion: `Replace ${tag} with table structure`,
                  autoFixAvailable: true,
                  category: "structure",
                });
              });
            }
          });
        }
      } catch (error) {
        // Silently fail
      }
      return results;
    },
    checkWithAST: (html: string, ast: HTMLNode[], _config = {}) => {
      const results: ValidationResult[] = [];
      if (!html || typeof html !== "string" || !ast) return results;

      try {
        const blockTags = _config.blockTags || [
          "div",
          "section",
          "article",
          "nav",
          "header",
          "footer",
          "main",
          "aside",
          "figure",
          "figcaption",
        ];

        traverseAST(ast, (node) => {
          if (
            node.type === "element" &&
            node.tagName &&
            Array.isArray(blockTags) &&
            blockTags.includes(node.tagName)
          ) {
            results.push({
              rule: "block-element-tags",
              severity: "error",
              message: `Block element "${node.tagName}" is not email-safe`,
              line: node.line,
              column: node.column,
              suggestion: `Replace ${node.tagName} with table structure`,
              autoFixAvailable: true,
              category: "structure",
            });
          }
        });
      } catch (error) {
        // Fallback to regex check
        return EMAIL_VALIDATION_RULES["block-element-tags"].check(html, _config);
      }
      return results;
    },
    autofix: (html: string, _config = {}) => {
      if (!html || typeof html !== "string") return html;

      let fixedHtml = html;
      try {
        const blockTags = _config.blockTags || [
          "div",
          "section",
          "article",
          "nav",
          "header",
          "footer",
          "main",
          "aside",
          "figure",
          "figcaption",
        ];

        if (Array.isArray(blockTags)) {
          // Count existing tables to prevent excessive nesting
          const existingTables = (fixedHtml.match(/<table/g) || []).length;
          const maxTables = EMAIL_DEFAULTS.MAX_TABLES; // Limit total tables to prevent excessive nesting

          if (existingTables < maxTables) {
            blockTags.forEach((tag) => {
              const regex = RegexCache.get(`<${tag}([^>]*)>`);
              const closeRegex = RegexCache.get(`</${tag}>`);
              fixedHtml = fixedHtml.replace(
                regex,
                '<table cellpadding="0" cellspacing="0" border="0"$1><tr><td valign="top">'
              );
              fixedHtml = fixedHtml.replace(closeRegex, "</td></tr></table>");
            });
          }
        }
      } catch (error) {
        // Return original on error
      }
      return fixedHtml;
    },
  },

  "dangerous-tags": {
    name: "dangerous-tags",
    displayName: "Dangerous Tags Removal",
    description: "Removes dangerous/unsupported tags (script, style, form, etc.) completely",
    severity: "error",
    enabled: true,
    configurable: true,
    category: "structure",
    config: {
      dangerousTags: [
        "script",
        "style",
        "form",
        "input",
        "button",
        "textarea",
        "select",
        "option",
        "fieldset",
        "legend",
        "label",
        "video",
        "audio",
        "canvas",
        "svg",
        "iframe",
        "embed",
        "object",
        "base",
        "col",
        "area",
      ],
    },
    check: (html: string, _config = {}) => {
      const results: ValidationResult[] = [];
      if (!html || typeof html !== "string") return results;

      try {
        const dangerousTags = _config.dangerousTags || [
          "script",
          "style",
          "form",
          "input",
          "button",
          "textarea",
          "select",
          "option",
          "fieldset",
          "legend",
          "label",
          "video",
          "audio",
          "canvas",
          "svg",
          "iframe",
          "embed",
          "object",
          "base",
          "col",
          "area",
        ];

        if (Array.isArray(dangerousTags)) {
          dangerousTags.forEach((tag) => {
            const regex = RegexCache.get(`<${tag}(?:\\s[^>]*)?>`, "gi");
            const matches = html.match(regex);
            if (matches) {
              matches.forEach(() => {
                results.push({
                  rule: "dangerous-tags",
                  severity: "error",
                  message: `Dangerous tag "${tag}" should be removed`,
                  suggestion: `Remove ${tag} tag completely`,
                  autoFixAvailable: true,
                  category: "structure",
                });
              });
            }
          });
        }
      } catch (error) {
        // Silently fail
      }
      return results;
    },
    checkWithAST: (html: string, ast: HTMLNode[], _config = {}) => {
      const results: ValidationResult[] = [];
      if (!html || typeof html !== "string" || !ast) return results;

      try {
        const dangerousTags = _config.dangerousTags || [
          "script",
          "style",
          "form",
          "input",
          "button",
          "textarea",
          "select",
          "option",
          "fieldset",
          "legend",
          "label",
          "video",
          "audio",
          "canvas",
          "svg",
          "iframe",
          "embed",
          "object",
          "base",
          "col",
          "area",
        ];

        traverseAST(ast, (node) => {
          if (
            node.type === "element" &&
            node.tagName &&
            Array.isArray(dangerousTags) &&
            dangerousTags.includes(node.tagName)
          ) {
            results.push({
              rule: "dangerous-tags",
              severity: "error",
              message: `Dangerous tag "${node.tagName}" should be removed`,
              line: node.line,
              column: node.column,
              suggestion: `Remove ${node.tagName} tag completely`,
              autoFixAvailable: true,
              category: "structure",
            });
          }
        });
      } catch (error) {
        // Fallback to regex check
        return EMAIL_VALIDATION_RULES["dangerous-tags"].check(html, _config);
      }
      return results;
    },
    autofix: (html: string, _config = {}) => {
      if (!html || typeof html !== "string") return html;

      let fixedHtml = html;
      try {
        const dangerousTags = _config.dangerousTags || [
          "script",
          "style",
          "form",
          "input",
          "button",
          "textarea",
          "select",
          "option",
          "fieldset",
          "legend",
          "label",
          "video",
          "audio",
          "canvas",
          "svg",
          "iframe",
          "embed",
          "object",
          "base",
          "col",
          "area",
        ];

        if (Array.isArray(dangerousTags)) {
          dangerousTags.forEach((tag) => {
            // Оптимізовані паттерни без backtracking
            const regex = RegexCache.get(`<${tag}(?:\\s[^>]*)?>(?:[\\s\\S]*?)</${tag}>`, "gi");
            fixedHtml = fixedHtml.replace(regex, "");
            const selfClosingRegex = RegexCache.get(`<${tag}(?:\\s[^>]*)?/>`, "gi");
            fixedHtml = fixedHtml.replace(selfClosingRegex, "");
          });
        }
      } catch (error) {
        // Return original on error
      }
      return fixedHtml;
    },
  },

  "duplicate-styles": {
    name: "duplicate-styles",
    displayName: "Duplicate Style Attributes Cleanup",
    description: "Merges duplicate style attributes in HTML elements",
    severity: "warning",
    enabled: true,
    configurable: false,
    category: "best-practice",
    check: (html: string) => {
      const results: ValidationResult[] = [];
      if (!html || typeof html !== "string") return results;

      try {
        const duplicateStylePattern = RegexCache.get('style="([^"]*?)"([^>]*?)style="([^"]*?)"');
        if (duplicateStylePattern.test(html)) {
          results.push({
            rule: "duplicate-styles",
            severity: "warning",
            message: "Duplicate style attributes found",
            suggestion: "Merge duplicate style attributes",
            autoFixAvailable: true,
            category: "best-practice",
          });
        }
      } catch (error) {
        // Silently fail
      }
      return results;
    },
    autofix: (html: string) => {
      if (!html || typeof html !== "string") return html;

      let fixedHtml = html;
      try {
        // Fix duplicate style attributes - limited iterations for safety
        for (let i = 0; i < EMAIL_DEFAULTS.MAX_STYLE_MERGE_ITERATIONS; i++) {
          const beforeFix = fixedHtml;
          fixedHtml = fixedHtml.replace(
            RegexCache.get('style="([^"]*?)"([^>]*?)style="([^"]*?)"'),
            (match, style1, middle, style2) => {
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

          // Break if no changes made
          if (beforeFix === fixedHtml) {
            break;
          }
        }
      } catch (error) {
        // Return original on error
      }
      return fixedHtml;
    },
  },

  "table-nesting-cleanup": {
    name: "table-nesting-cleanup",
    displayName: "Table Nesting Cleanup",
    description: "Reduces excessive table nesting for better email rendering",
    severity: "warning",
    enabled: true,
    configurable: true,
    category: "structure",
    config: {
      maxIterations: EMAIL_DEFAULTS.MAX_AUTOFIX_ITERATIONS,
    },
    check: (html: string) => {
      const results: ValidationResult[] = [];
      if (!html || typeof html !== "string") return results;

      try {
        const nestedTablePattern = RegexCache.get(
          "<table([^>]*?)><tr><td([^>]*?)><table([^>]*?)><tr><td([^>]*?)>"
        );
        if (nestedTablePattern.test(html)) {
          results.push({
            rule: "table-nesting-cleanup",
            severity: "warning",
            message: "Excessive table nesting detected",
            suggestion: "Reduce table nesting for better email compatibility",
            autoFixAvailable: true,
            category: "structure",
          });
        }
      } catch (error) {
        // Silently fail
      }
      return results;
    },
    autofix: (html: string, _config = {}) => {
      if (!html || typeof html !== "string") return html;

      let fixedHtml = html;
      try {
        const maxIterations = (
          typeof _config.maxIterations === "number"
            ? _config.maxIterations
            : EMAIL_DEFAULTS.MAX_AUTOFIX_ITERATIONS
        ) as number;

        // Clean up excessive table nesting - limited iterations for safety
        for (let i = 0; i < maxIterations; i++) {
          const beforeFix = fixedHtml;
          fixedHtml = fixedHtml.replace(
            RegexCache.get("<table([^>]*?)><tr><td([^>]*?)><table([^>]*?)><tr><td([^>]*?)>"),
            "<table$1><tr><td$2>"
          );
          fixedHtml = fixedHtml.replace(
            RegexCache.get("<\\/td><\\/tr><\\/table><\\/td><\\/tr><\\/table>"),
            "</td></tr></table>"
          );

          // Break if no changes made
          if (beforeFix === fixedHtml) {
            break;
          }
        }

        // Remove empty tables
        fixedHtml = fixedHtml.replace(
          RegexCache.get("<table[^>]*><tr><td[^>]*>\\s*<\\/td><\\/tr><\\/table>"),
          ""
        );

        // Don't wrap single text spans in tables
        fixedHtml = fixedHtml.replace(
          RegexCache.get(
            "<table[^>]*><tr><td[^>]*>(\\s*<span[^>]*>[^<]+<\\/span>\\s*)<\\/td><\\/tr><\\/table>"
          ),
          "$1"
        );
      } catch (error) {
        // Return original on error
      }
      return fixedHtml;
    },
  },

  "empty-elements-cleanup": {
    name: "empty-elements-cleanup",
    displayName: "Empty Elements Cleanup",
    description: "Removes empty and whitespace-only elements",
    severity: "info",
    enabled: true,
    configurable: false,
    category: "best-practice",
    check: (html: string) => {
      const results: ValidationResult[] = [];
      if (!html || typeof html !== "string") return results;

      try {
        const emptySpanPattern = RegexCache.get("<span[^>]*>\\s*<\\/span>");
        if (emptySpanPattern.test(html)) {
          results.push({
            rule: "empty-elements-cleanup",
            severity: "info",
            message: "Empty elements found",
            suggestion: "Remove empty and whitespace-only elements",
            autoFixAvailable: true,
            category: "best-practice",
          });
        }
      } catch (error) {
        // Silently fail
      }
      return results;
    },
    autofix: (html: string) => {
      if (!html || typeof html !== "string") return html;

      let fixedHtml = html;
      try {
        // Remove empty and whitespace-only span tags
        fixedHtml = fixedHtml.replace(RegexCache.get("<span[^>]*>\\s*<\\/span>"), "");
        fixedHtml = fixedHtml.replace(RegexCache.get("<span[^>]*>[\\s\\t\\n\\r]*<\\/span>"), "");
      } catch (error) {
        // Return original on error
      }
      return fixedHtml;
    },
  },

  "malformed-attributes": {
    name: "malformed-attributes",
    displayName: "Malformed Attributes Fix",
    description: 'Fixes malformed attributes like "s rc" to "src"',
    severity: "error",
    enabled: true,
    configurable: false,
    category: "structure",
    check: (html: string) => {
      const results: ValidationResult[] = [];
      if (!html || typeof html !== "string") return results;

      try {
        const malformedSrcPattern = RegexCache.get("\\bs\\s+rc=");
        if (malformedSrcPattern.test(html)) {
          results.push({
            rule: "malformed-attributes",
            severity: "error",
            message: 'Malformed "s rc" attribute found',
            suggestion: 'Fix "s rc" to "src"',
            autoFixAvailable: true,
            category: "structure",
          });
        }

        const malformedSpacingPattern = RegexCache.get('="([^"]*)"([a-zA-Z]+=)');
        if (malformedSpacingPattern.test(html)) {
          results.push({
            rule: "malformed-attributes",
            severity: "error",
            message: "Missing spaces between attributes",
            suggestion: "Add spaces between attributes",
            autoFixAvailable: true,
            category: "structure",
          });
        }
      } catch (error) {
        // Silently fail
      }
      return results;
    },
    autofix: (html: string) => {
      if (!html || typeof html !== "string") return html;

      let fixedHtml = html;
      try {
        // Use StringBatcher for batch operations
        const batcher = new StringBatcher();

        batcher
          // Fix broken img src attributes (like "s rc" -> "src")
          .add(RegexCache.get("\\bs\\s+rc="), "src=")
          .add(RegexCache.get("\\bS\\s+RC="), "src=")
          // Fix missing spaces between img attributes
          .add(RegexCache.get('="([^"]*)"([a-zA-Z]+=)'), '="$1" $2')
          // Fix specific malformed img attributes like src="test.jpg"alt="test"
          .add(RegexCache.get('(<img[^>]*?)([a-zA-Z0-9_.-]+")([a-zA-Z]+=)'), "$1$2 $3");

        fixedHtml = batcher.execute(fixedHtml);
      } catch (error) {
        // Return original on error
      }
      return fixedHtml;
    },
  },

  // Image alt attribute validation and fixes
  "image-alt-attributes": {
    name: "image-alt-attributes",
    displayName: "Image Alt Attributes",
    description: "Ensures all images have meaningful alt attributes for accessibility",
    severity: "warning",
    enabled: true,
    configurable: false,
    category: "accessibility",
    check: (html: string) => {
      const results: ValidationResult[] = [];

      // Find images with missing or empty alt attributes
      const imgMissingAlt = html.match(/<img(?![^>]*\salt\s*=\s*["'][^"']+["'])[^>]*>/gi);
      if (imgMissingAlt) {
        imgMissingAlt.forEach(() => {
          results.push({
            rule: "image-alt-attributes",
            severity: "error",
            message: "Image missing meaningful alt attribute for accessibility",
            line: 0,
            column: 0,
          });
        });
      }

      // Find images with empty alt attributes
      const imgEmptyAlt = html.match(/<img[^>]*alt\s*=\s*["']?\s*["'][^>]*>/gi);
      if (imgEmptyAlt) {
        imgEmptyAlt.forEach(() => {
          results.push({
            rule: "image-alt-attributes",
            severity: "warning",
            message: "Image has empty alt attribute - should be descriptive",
            line: 0,
            column: 0,
          });
        });
      }

      return results;
    },
    autofix: (html: string) => {
      if (!html || typeof html !== "string") return html;

      let fixedHtml = html;
      try {
        // Single comprehensive img replacement to avoid multiple passes and conflicts
        fixedHtml = fixedHtml.replace(/<img([^>]*?)(\s*\/?\s*)>/gi, (match, attrs) => {
          let newAttrs = attrs;

          // Extract src for alt text generation
          const srcMatch = attrs.match(/src\s*=\s*["']([^"']+)["']/i);
          let altText = EMAIL_DEFAULTS.DEFAULT_ALT_TEXT;

          if (srcMatch) {
            const filename = srcMatch[1].split("/").pop()?.split(".")[0];
            if (filename) {
              // Convert filename to readable text (remove underscores, capitalize)
              altText = filename
                .replace(/[_-]/g, " ")
                .replace(/\b\w/g, (l: string) => l.toUpperCase());
            }
          }

          // Remove any existing alt attributes to prevent duplication
          newAttrs = newAttrs.replace(/\s*alt\s*=\s*["'][^"']*["']/gi, "");

          // Add clean alt attribute
          newAttrs += ` alt="${altText}"`;

          // Ensure proper self-closing format
          return `<img${newAttrs} />`;
        });
      } catch (error) {
        // Return original on error
      }
      return fixedHtml;
    },
  },
};

// Helper functions
function getTagReplacement(tagName: string): string {
  const replacements: Record<string, string> = {
    div: "Use <table><tr><td>content</td></tr></table>",
    p: "Use <span>content</span>",
    h1: `Use <span style="font-weight:bold; font-size:${EMAIL_DEFAULTS.HEADING_FONT_SIZES.h1}px;">content</span>`,
    h2: `Use <span style="font-weight:bold; font-size:${EMAIL_DEFAULTS.HEADING_FONT_SIZES.h2}px;">content</span>`,
    h3: `Use <span style="font-weight:bold; font-size:${EMAIL_DEFAULTS.HEADING_FONT_SIZES.h3}px;">content</span>`,
    h4: `Use <span style="font-weight:bold; font-size:${EMAIL_DEFAULTS.HEADING_FONT_SIZES.h4}px;">content</span>`,
    h5: `Use <span style="font-weight:bold; font-size:${EMAIL_DEFAULTS.HEADING_FONT_SIZES.h5}px;">content</span>`,
    h6: `Use <span style="font-weight:bold; font-size:${EMAIL_DEFAULTS.HEADING_FONT_SIZES.h6}px;">content</span>`,
    section: "Use <table><tr><td>content</td></tr></table>",
    article: "Use <table><tr><td>content</td></tr></table>",
    nav: "Use <table><tr><td>content</td></tr></table>",
    header: "Use <table><tr><td>content</td></tr></table>",
    footer: "Use <table><tr><td>content</td></tr></table>",
    main: "Use <table><tr><td>content</td></tr></table>",
    aside: "Use <table><tr><td>content</td></tr></table>",
    figure: "Use <table><tr><td>content</td></tr></table>",
    figcaption: "Use <table><tr><td>content</td></tr></table>",
    // Dangerous tags - remove completely
    script: "Remove - not supported in emails",
    style: "Use inline styles instead",
    form: "Remove - forms not supported in emails",
    input: "Remove - interactive elements not supported",
    button: "Use <a> link styled as button",
    textarea: "Remove - not supported in emails",
    select: "Remove - not supported in emails",
    option: "Remove - not supported in emails",
    fieldset: "Remove - not supported in emails",
    legend: "Remove - not supported in emails",
    label: "Remove - not supported in emails",
    video: "Use static image or GIF instead",
    audio: "Remove - not supported in emails",
    canvas: "Use static image instead",
    svg: "Use PNG/JPG image instead",
    iframe: "Remove - not supported in emails",
    embed: "Remove - not supported in emails",
    object: "Remove - not supported in emails",
  };
  return replacements[tagName] || "Replace with email-safe alternative";
}

function getFontSizeForHeading(level: number): number {
  return (
    EMAIL_DEFAULTS.HEADING_FONT_SIZES[
      `h${level}` as keyof typeof EMAIL_DEFAULTS.HEADING_FONT_SIZES
    ] || 16
  );
}
