// Email validation rules, DOM-based.
//
// Every rule works against a Document parsed once per run (see RuleContext):
//   - check(ctx)      inspects ctx.doc (or ctx.html for purely textual defects)
//   - preprocess(html) fixes string-level defects the HTML parser would
//                      misinterpret (runs before parsing, autofix mode only)
//   - autofix(ctx)    mutates ctx.doc and reports whether anything changed
//
// The engines serialize the document back to HTML exactly once, after all
// fixes. There is no regex state shared between runs and no whole-document
// regex rewriting, so results are deterministic and fixes cannot corrupt
// attribute values or text content.

import { COMMON_PATTERNS, EMAIL_DEFAULTS } from "./EMAIL_CONSTANTS";
import {
  addStylePropIfMissing,
  allElements,
  isVisuallyEmpty,
  maxTableNestingDepth,
  mergeStyleStrings,
  replaceElementTag,
  sourceTagPosition,
  styleHasProp,
} from "./domUtils";
import { FORBIDDEN_TAGS, RuleContext, ValidationResult, ValidationRule } from "./types";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const BLOCK_TAGS_DEFAULT = [
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
] as const;

const DANGEROUS_TAGS_DEFAULT = [
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
] as const;

// Attributes that email clients ignore or strip. Deliberately excludes `id`
// (anchor links) and `aria-*` (accessibility) — removing those does harm.
const UNSAFE_ATTRIBUTE_NAMES = [
  "contenteditable",
  "draggable",
  "spellcheck",
  "tabindex",
  "accesskey",
  "class",
] as const;

function isUnsafeAttribute(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    (lower.startsWith("on") && lower.length > 2) ||
    lower.startsWith("data-") ||
    (UNSAFE_ATTRIBUTE_NAMES as readonly string[]).includes(lower)
  );
}

function tagsFromConfig(ctx: RuleContext, key: string, fallback: readonly string[]): string[] {
  const value = ctx.config?.[key];
  return Array.isArray(value) ? (value as string[]) : [...fallback];
}

/** Best-effort source positions for a list of elements, per tag occurrence order. */
function positionsFor(ctx: RuleContext, elements: Element[]): Array<{ line?: number; column?: number }> {
  const counters = new Map<string, number>();
  return elements.map((el) => {
    const tag = el.tagName.toLowerCase();
    const occurrence = counters.get(tag) ?? 0;
    counters.set(tag, occurrence + 1);
    return sourceTagPosition(ctx.html, tag, occurrence);
  });
}

function fixHeadings(ctx: RuleContext): boolean {
  const headings = allElements(ctx.doc, "h1,h2,h3,h4,h5,h6");
  for (const el of headings) {
    const level = Number(el.tagName.charAt(1));
    replaceElementTag(el, "span", {
      "font-weight": "bold",
      "font-size": `${getFontSizeForHeading(level)}px`,
    });
  }
  return headings.length > 0;
}

function fixParagraphs(ctx: RuleContext): boolean {
  const paragraphs = allElements(ctx.doc, "p");
  for (const el of paragraphs) {
    replaceElementTag(el, "span");
  }
  return paragraphs.length > 0;
}

function fixBlockElements(ctx: RuleContext): boolean {
  const tags = tagsFromConfig(ctx, "blockTags", BLOCK_TAGS_DEFAULT);
  if (tags.length === 0) return false;
  const selector = tags.join(",");
  const doc = ctx.doc;
  let changed = false;
  let guard = 0;

  // Replace outermost-first; children stay in the document, so re-querying
  // picks up nested block elements until none remain (or the table cap hits).
  while (guard++ < 1000) {
    const el = doc.body.querySelector(selector);
    if (!el) break;
    if (doc.querySelectorAll("table").length >= EMAIL_DEFAULTS.MAX_TABLES) break;

    const table = doc.createElement("table");
    table.setAttribute("cellpadding", "0");
    table.setAttribute("cellspacing", "0");
    table.setAttribute("border", "0");
    const tr = doc.createElement("tr");
    const td = doc.createElement("td");
    td.setAttribute("valign", "top");
    // The user's attributes (style, width, bgcolor, …) belong on the content
    // cell, not on the wrapper table.
    for (const attr of Array.from(el.attributes)) {
      td.setAttribute(attr.name, attr.value);
    }
    while (el.firstChild) {
      td.appendChild(el.firstChild);
    }
    tr.appendChild(td);
    table.appendChild(tr);
    el.replaceWith(table);
    changed = true;
  }
  return changed;
}

function fixDangerousTags(ctx: RuleContext): boolean {
  const tags = tagsFromConfig(ctx, "dangerousTags", DANGEROUS_TAGS_DEFAULT);
  if (tags.length === 0) return false;
  const elements = allElements(ctx.doc, tags.join(","));
  for (const el of elements) {
    el.remove();
  }
  return elements.length > 0;
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

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
      forbiddenTags: FORBIDDEN_TAGS,
    },
    check: (ctx) => {
      const results: ValidationResult[] = [];
      const tags = tagsFromConfig(ctx, "forbiddenTags", FORBIDDEN_TAGS);
      if (tags.length === 0) return results;
      const elements = allElements(ctx.doc, tags.join(","));
      const positions = positionsFor(ctx, elements);
      elements.forEach((el, i) => {
        const tagName = el.tagName.toLowerCase();
        results.push({
          rule: "forbidden-tags",
          severity: "error",
          message: `Tag "${tagName}" is not email-safe`,
          ...positions[i],
          suggestion: getTagReplacement(tagName),
          autoFixAvailable: true,
          category: "structure",
        });
      });
      return results;
    },
    autofix: (ctx) => {
      const a = fixDangerousTags(ctx);
      const b = fixHeadings(ctx);
      const c = fixParagraphs(ctx);
      const d = fixBlockElements(ctx);
      return a || b || c || d;
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
    check: (ctx) => {
      const results: ValidationResult[] = [];
      const html = ctx.html;

      for (const tag of ["br", "hr"]) {
        for (const _m of html.matchAll(new RegExp(`<${tag}\\b[^>]*></${tag}>`, "gi"))) {
          void _m;
          results.push({
            rule: "email-safe-tags",
            severity: "error",
            message: `Tag "${tag}" should not have closing tag in emails`,
            suggestion: `Replace <${tag}></${tag}> with <${tag}>`,
            autoFixAvailable: true,
            category: "structure",
          });
        }
        for (const _m of html.matchAll(new RegExp(`<${tag}\\b[^>]*/>`, "gi"))) {
          void _m;
          results.push({
            rule: "email-safe-tags",
            severity: "error",
            message: `Tag "${tag}" should be open tag in emails, not self-closing`,
            suggestion: `Replace <${tag}/> with <${tag}>`,
            autoFixAvailable: true,
            category: "structure",
          });
        }
      }

      for (const _m of html.matchAll(/<img\b[^>]*><\/img>/gi)) {
        void _m;
        results.push({
          rule: "email-safe-tags",
          severity: "error",
          message: 'Tag "img" should be self-closing',
          suggestion: "Replace <img></img> with <img />",
          autoFixAvailable: true,
          category: "structure",
        });
      }
      return results;
    },
    // These are textual formatting defects. They must be fixed before parsing:
    // the HTML parser turns `</br>` into a second <br>, which would double
    // line breaks if we let it through.
    preprocess: (html) =>
      html
        .replace(/<\/(br|hr)\s*>/gi, "")
        .replace(/<(br|hr)\b[^>]*?\/>/gi, "<$1>")
        .replace(/(<img\b[^>]*)>\s*<\/img>/gi, "$1>"),
  },

  "table-attributes": {
    name: "table-attributes",
    displayName: "Required Table Attributes",
    description: "Ensures tables have required email-safe attributes",
    severity: "error",
    enabled: true,
    configurable: true,
    category: "structure",
    check: (ctx) => {
      const results: ValidationResult[] = [];

      const tables = allElements(ctx.doc, "table");
      const tablePositions = positionsFor(ctx, tables);
      tables.forEach((table, i) => {
        for (const attr of ["cellpadding", "cellspacing", "border"]) {
          if (table.getAttribute(attr) !== "0") {
            results.push({
              rule: "table-attributes",
              severity: "error",
              message: `Table should have ${attr}="0"`,
              ...tablePositions[i],
              suggestion: `Add ${attr}="0" to table tag`,
              autoFixAvailable: true,
              category: "structure",
            });
          }
        }
      });

      const images = allElements(ctx.doc, "img");
      const imgPositions = positionsFor(ctx, images);
      images.forEach((img, i) => {
        if (!img.hasAttribute("width")) {
          results.push({
            rule: "table-attributes",
            severity: "error",
            message: "Image must have width attribute",
            ...imgPositions[i],
            suggestion: `Add width="${EMAIL_DEFAULTS.DEFAULT_IMAGE_WIDTH}" to img tag`,
            autoFixAvailable: true,
            category: "structure",
          });
        }
        if (!img.hasAttribute("height")) {
          results.push({
            rule: "table-attributes",
            severity: "error",
            message: "Image must have height attribute",
            ...imgPositions[i],
            suggestion: `Add height="${EMAIL_DEFAULTS.DEFAULT_IMAGE_HEIGHT}" to img tag`,
            autoFixAvailable: true,
            category: "structure",
          });
        }
        if (!styleHasProp(img, "display", "block")) {
          results.push({
            rule: "table-attributes",
            severity: "error",
            message: 'Image must have style="display:block"',
            ...imgPositions[i],
            suggestion: 'Add style="display:block" to img tag',
            autoFixAvailable: true,
            category: "structure",
          });
        }
      });

      return results;
    },
    autofix: (ctx) => {
      let changed = false;

      for (const table of allElements(ctx.doc, "table")) {
        for (const attr of ["cellpadding", "cellspacing", "border"]) {
          if (table.getAttribute(attr) !== "0") {
            table.setAttribute(attr, "0");
            changed = true;
          }
        }
      }

      // Add valign only when missing — an explicit valign is the user's
      // layout decision and must not be rewritten.
      for (const td of allElements(ctx.doc, "td")) {
        if (!td.hasAttribute("valign")) {
          td.setAttribute("valign", "top");
          changed = true;
        }
      }

      for (const img of allElements(ctx.doc, "img")) {
        if (!img.hasAttribute("width")) {
          img.setAttribute("width", String(EMAIL_DEFAULTS.DEFAULT_IMAGE_WIDTH));
          changed = true;
        }
        if (!img.hasAttribute("height")) {
          img.setAttribute("height", String(EMAIL_DEFAULTS.DEFAULT_IMAGE_HEIGHT));
          changed = true;
        }
        // styleHasProp normalizes whitespace, so an existing "display: block"
        // is recognized and never duplicated.
        if (addStylePropIfMissing(img, "display", "block")) {
          changed = true;
        }
      }

      return changed;
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
    check: (ctx) => {
      const results: ValidationResult[] = [];
      const links = allElements(ctx.doc, "a");
      const positions = positionsFor(ctx, links);

      links.forEach((a, i) => {
        const href = a.getAttribute("href");
        if (href === null || href.trim() === "") {
          results.push({
            rule: "email-safe-links",
            severity: "error",
            message: "Link has empty href attribute",
            ...positions[i],
            suggestion: "Remove empty links or provide valid href",
            autoFixAvailable: true,
            category: "structure",
          });
        }

        const target = a.getAttribute("target");
        if (target && ["_self", "_parent", "_top"].includes(target)) {
          results.push({
            rule: "email-safe-links",
            severity: "warning",
            message: `Link target "${target}" doesn't work in most email clients`,
            ...positions[i],
            suggestion: 'Use target="_blank" for all email links',
            autoFixAvailable: true,
            category: "compatibility",
          });
        } else if (!target) {
          results.push({
            rule: "email-safe-links",
            severity: "warning",
            message: 'Link should have target="_blank" in emails',
            ...positions[i],
            suggestion: 'Add target="_blank" to all email links',
            autoFixAvailable: true,
            category: "best-practice",
          });
        }

        if (!a.hasAttribute("style")) {
          results.push({
            rule: "email-safe-links",
            severity: "warning",
            message: "Link should have inline styles for email compatibility",
            ...positions[i],
            suggestion: `Add style="${EMAIL_DEFAULTS.DEFAULT_LINK_STYLES}" to links`,
            autoFixAvailable: true,
            category: "best-practice",
          });
        }
      });

      return results;
    },
    autofix: (ctx) => {
      let changed = false;
      for (const a of allElements(ctx.doc, "a")) {
        const href = a.getAttribute("href");
        if (href === null || href.trim() === "") {
          a.setAttribute("href", COMMON_PATTERNS.DEFAULT_HREF_VALUE);
          changed = true;
        }

        const target = a.getAttribute("target");
        if (!target || ["_self", "_parent", "_top"].includes(target)) {
          if (target !== "_blank") {
            a.setAttribute("target", "_blank");
            changed = true;
          }
        }

        if (!a.hasAttribute("style")) {
          a.setAttribute("style", EMAIL_DEFAULTS.DEFAULT_LINK_STYLES);
          changed = true;
        } else if (addStylePropIfMissing(a, "text-decoration", "none")) {
          changed = true;
        }
      }
      return changed;
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
    check: (ctx) => {
      const results: ValidationResult[] = [];
      const seen = new Set<string>();
      for (const el of allElements(ctx.doc, "*")) {
        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase();
          if (isUnsafeAttribute(name) && !seen.has(name)) {
            seen.add(name);
            results.push({
              rule: "email-unsafe-attributes",
              severity: "warning",
              message: `Attribute "${name}" may not work in email clients`,
              suggestion: "Remove or replace with inline styles",
              autoFixAvailable: true,
              category: "compatibility",
            });
          }
        }
      }
      return results;
    },
    autofix: (ctx) => {
      let changed = false;
      for (const el of allElements(ctx.doc, "*")) {
        for (const attr of Array.from(el.attributes)) {
          if (isUnsafeAttribute(attr.name)) {
            el.removeAttribute(attr.name);
            changed = true;
          }
        }
      }
      return changed;
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
    check: (ctx) => {
      const headings = allElements(ctx.doc, "h1,h2,h3,h4,h5,h6");
      const positions = positionsFor(ctx, headings);
      return headings.map((el, i) => {
        const tag = el.tagName.toLowerCase();
        return {
          rule: "heading-tags",
          severity: "error" as const,
          message: `Heading tag ${tag} is not email-safe`,
          ...positions[i],
          suggestion: `Replace ${tag} with styled span`,
          autoFixAvailable: true,
          category: "structure" as const,
        };
      });
    },
    autofix: fixHeadings,
  },

  "paragraph-tags": {
    name: "paragraph-tags",
    displayName: "Paragraph Tags Replacement",
    description: "Replaces p tags with spans for email compatibility",
    severity: "error",
    enabled: true,
    configurable: false,
    category: "structure",
    check: (ctx) => {
      const paragraphs = allElements(ctx.doc, "p");
      const positions = positionsFor(ctx, paragraphs);
      return paragraphs.map((_el, i) => ({
        rule: "paragraph-tags",
        severity: "error" as const,
        message: "Paragraph tag is not email-safe",
        ...positions[i],
        suggestion: "Replace p with span",
        autoFixAvailable: true,
        category: "structure" as const,
      }));
    },
    autofix: fixParagraphs,
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
      blockTags: BLOCK_TAGS_DEFAULT,
    },
    check: (ctx) => {
      const tags = tagsFromConfig(ctx, "blockTags", BLOCK_TAGS_DEFAULT);
      if (tags.length === 0) return [];
      const elements = Array.from(ctx.doc.body.querySelectorAll(tags.join(",")));
      const positions = positionsFor(ctx, elements);
      return elements.map((el, i) => {
        const tag = el.tagName.toLowerCase();
        return {
          rule: "block-element-tags",
          severity: "error" as const,
          message: `Block element "${tag}" is not email-safe`,
          ...positions[i],
          suggestion: `Replace ${tag} with table structure`,
          autoFixAvailable: true,
          category: "structure" as const,
        };
      });
    },
    autofix: fixBlockElements,
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
      dangerousTags: DANGEROUS_TAGS_DEFAULT,
    },
    check: (ctx) => {
      const tags = tagsFromConfig(ctx, "dangerousTags", DANGEROUS_TAGS_DEFAULT);
      if (tags.length === 0) return [];
      const elements = allElements(ctx.doc, tags.join(","));
      const positions = positionsFor(ctx, elements);
      return elements.map((el, i) => {
        const tag = el.tagName.toLowerCase();
        return {
          rule: "dangerous-tags",
          severity: "error" as const,
          message: `Dangerous tag "${tag}" should be removed`,
          ...positions[i],
          suggestion: `Remove ${tag} tag completely`,
          autoFixAvailable: true,
          category: "structure" as const,
        };
      });
    },
    autofix: fixDangerousTags,
  },

  "duplicate-styles": {
    name: "duplicate-styles",
    displayName: "Duplicate Style Attributes Cleanup",
    description: "Merges duplicate style attributes in HTML elements",
    severity: "warning",
    enabled: true,
    configurable: false,
    category: "best-practice",
    check: (ctx) => {
      // Duplicate attributes cannot be represented in the DOM (the parser
      // keeps the first one), so this defect is detected in the source text.
      if (/<[a-zA-Z][^>]*?style\s*=\s*"[^"]*"[^>]*?style\s*=/i.test(ctx.html)) {
        return [
          {
            rule: "duplicate-styles",
            severity: "warning",
            message: "Duplicate style attributes found",
            suggestion: "Merge duplicate style attributes",
            autoFixAvailable: true,
            category: "best-practice",
          },
        ];
      }
      return [];
    },
    // Must run before parsing: DOMParser silently drops the second style
    // attribute, which would lose the user's declarations instead of merging.
    preprocess: (html) => {
      let out = html;
      for (let i = 0; i < EMAIL_DEFAULTS.MAX_STYLE_MERGE_ITERATIONS; i++) {
        const before = out;
        out = out.replace(
          /(<[a-zA-Z][^>]*?)style\s*=\s*"([^"]*)"([^>]*?)style\s*=\s*"([^"]*)"/g,
          (_match, prefix, style1, middle, style2) =>
            `${prefix}style="${mergeStyleStrings(style1, style2)}"${middle}`
        );
        if (out === before) break;
      }
      return out;
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
    check: (ctx) => {
      const maxNesting = ctx.validatorConfig.maxTableNesting || EMAIL_DEFAULTS.MAX_TABLE_NESTING;
      const depth = maxTableNestingDepth(ctx.doc);
      if (depth > maxNesting) {
        return [
          {
            rule: "table-nesting-cleanup",
            severity: "warning",
            message: `Excessive table nesting detected (depth ${depth}, max ${maxNesting})`,
            suggestion: "Reduce table nesting for better email compatibility",
            autoFixAvailable: true,
            category: "structure",
          },
        ];
      }
      return [];
    },
    autofix: (ctx) => {
      const maxNesting = ctx.validatorConfig.maxTableNesting || EMAIL_DEFAULTS.MAX_TABLE_NESTING;
      let changed = false;

      // Collapse redundant single-cell wrappers only while the nesting depth
      // actually exceeds the limit — intentional nested layouts are kept.
      let guard = 0;
      while (maxTableNestingDepth(ctx.doc) > maxNesting && guard++ < 100) {
        if (!collapseOneRedundantTable(ctx.doc)) break;
        changed = true;
      }

      for (const table of allElements(ctx.doc, "table")) {
        if (isVisuallyEmpty(table) && !table.querySelector("img")) {
          table.remove();
          changed = true;
        }
      }

      return changed;
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
    check: (ctx) => {
      const hasEmpty = allElements(ctx.doc, "span").some(isVisuallyEmpty);
      if (hasEmpty) {
        return [
          {
            rule: "empty-elements-cleanup",
            severity: "info",
            message: "Empty elements found",
            suggestion: "Remove empty and whitespace-only elements",
            autoFixAvailable: true,
            category: "best-practice",
          },
        ];
      }
      return [];
    },
    autofix: (ctx) => {
      let changed = false;
      // Removing an empty span can make its parent span empty; iterate.
      for (let i = 0; i < 10; i++) {
        const empty = allElements(ctx.doc, "span").filter(isVisuallyEmpty);
        if (empty.length === 0) break;
        for (const el of empty) el.remove();
        changed = true;
      }
      return changed;
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
    check: (ctx) => {
      const results: ValidationResult[] = [];
      if (/\bs\s+rc=/i.test(ctx.html)) {
        results.push({
          rule: "malformed-attributes",
          severity: "error",
          message: 'Malformed "s rc" attribute found',
          suggestion: 'Fix "s rc" to "src"',
          autoFixAvailable: true,
          category: "structure",
        });
      }
      if (/="[^"]*"[a-zA-Z-]+=/.test(ctx.html)) {
        results.push({
          rule: "malformed-attributes",
          severity: "error",
          message: "Missing spaces between attributes",
          suggestion: "Add spaces between attributes",
          autoFixAvailable: true,
          category: "structure",
        });
      }
      return results;
    },
    // "s rc=" must be repaired before parsing (the parser would keep a stray
    // `s` attribute); missing inter-attribute spaces are handled by the
    // parse/serialize round-trip itself.
    preprocess: (html) => html.replace(/\bs\s+rc=/gi, "src="),
    autofix: (ctx) => /="[^"]*"[a-zA-Z-]+=/.test(ctx.html),
  },

  "image-alt-attributes": {
    name: "image-alt-attributes",
    displayName: "Image Alt Attributes",
    description: "Ensures all images have meaningful alt attributes for accessibility",
    severity: "warning",
    enabled: true,
    configurable: false,
    category: "accessibility",
    check: (ctx) => {
      if (ctx.validatorConfig.requireAltText === false) return [];

      const results: ValidationResult[] = [];
      const images = allElements(ctx.doc, "img");
      const positions = positionsFor(ctx, images);

      images.forEach((img, i) => {
        const alt = img.getAttribute("alt");
        if (alt === null) {
          results.push({
            rule: "image-alt-attributes",
            severity: "error",
            message: "Image missing meaningful alt attribute for accessibility",
            ...positions[i],
            suggestion: "Add descriptive alt text to the image",
            autoFixAvailable: true,
            category: "accessibility",
          });
        } else if (alt.trim() === "") {
          results.push({
            rule: "image-alt-attributes",
            severity: "warning",
            message: "Image has empty alt attribute - should be descriptive",
            ...positions[i],
            suggestion: "Describe the image content in the alt attribute",
            autoFixAvailable: true,
            category: "accessibility",
          });
        }
      });

      return results;
    },
    autofix: (ctx) => {
      let changed = false;
      for (const img of allElements(ctx.doc, "img")) {
        const alt = img.getAttribute("alt");
        // Only fill in missing/empty alt — existing alt text is the user's
        // work and is never overwritten.
        if (alt !== null && alt.trim() !== "") continue;

        let altText: string = EMAIL_DEFAULTS.DEFAULT_ALT_TEXT;
        const src = img.getAttribute("src") ?? "";
        const filename = src.split("/").pop()?.split(".")[0];
        if (filename) {
          altText = filename.replace(/[_-]+/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        }
        img.setAttribute("alt", altText);
        changed = true;
      }
      return changed;
    },
  },
};

// ---------------------------------------------------------------------------
// Collapse helper for table-nesting-cleanup
// ---------------------------------------------------------------------------

/**
 * Find one redundant wrapper — a <td> whose only content is a single-row,
 * single-cell <table> — and hoist the inner cell's children into the outer
 * cell. Returns true when a collapse happened.
 */
function collapseOneRedundantTable(doc: Document): boolean {
  for (const inner of Array.from(doc.querySelectorAll("table table"))) {
    const outerTd = inner.parentElement;
    if (!outerTd || outerTd.tagName !== "TD") continue;

    const meaningfulSiblings = Array.from(outerTd.childNodes).filter(
      (n) => !(n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim() === "")
    );
    if (meaningfulSiblings.length !== 1 || meaningfulSiblings[0] !== inner) continue;

    const rows = Array.from(inner.children)
      .flatMap((child) => (child.tagName === "TBODY" ? Array.from(child.children) : [child]))
      .filter((child) => child.tagName === "TR");
    if (rows.length !== 1) continue;

    const cells = Array.from(rows[0].children).filter((c) => c.tagName === "TD" || c.tagName === "TH");
    if (cells.length !== 1) continue;

    const innerTd = cells[0];
    while (innerTd.firstChild) {
      outerTd.appendChild(innerTd.firstChild);
    }
    inner.remove();
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Suggestion helpers
// ---------------------------------------------------------------------------

function getTagReplacement(tagName: string): string {
  const tableReplacement = "Use <table><tr><td>content</td></tr></table>";
  const replacements: Record<string, string> = {
    div: tableReplacement,
    p: "Use <span>content</span>",
    section: tableReplacement,
    article: tableReplacement,
    nav: tableReplacement,
    header: tableReplacement,
    footer: tableReplacement,
    main: tableReplacement,
    aside: tableReplacement,
    figure: tableReplacement,
    figcaption: tableReplacement,
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
  for (let level = 1; level <= 6; level++) {
    replacements[`h${level}`] =
      `Use <span style="font-weight:bold; font-size:${getFontSizeForHeading(level)}px;">content</span>`;
  }
  return replacements[tagName] || "Replace with email-safe alternative";
}

export function getFontSizeForHeading(level: number): number {
  return (
    EMAIL_DEFAULTS.HEADING_FONT_SIZES[
      `h${level}` as keyof typeof EMAIL_DEFAULTS.HEADING_FONT_SIZES
    ] || 16
  );
}
