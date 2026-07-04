// DOM helpers for the email validator.
// The validator parses HTML once with the browser's DOMParser, rules inspect and
// mutate the Document, and the result is serialized back exactly once. This keeps
// checks deterministic (no shared regex state) and makes autofixes structurally safe.

export interface ParsedEmailHtml {
  doc: Document;
  /** True when the input was a full document (<html>/<!doctype>), not a fragment. */
  isFullDocument: boolean;
  /** Doctype string from the source, preserved on serialization. */
  doctype: string | null;
}

export function parseEmailHtml(html: string): ParsedEmailHtml {
  const isFullDocument = /<html[\s>]|<!doctype/i.test(html);
  const doctype = /<!doctype[^>]*>/i.exec(html)?.[0] ?? null;
  const doc = new DOMParser().parseFromString(html, "text/html");
  return { doc, isFullDocument, doctype };
}

export function serializeEmailHtml(parsed: ParsedEmailHtml): string {
  const { doc, isFullDocument, doctype } = parsed;
  if (isFullDocument) {
    const prefix = doctype ?? "<!DOCTYPE html>";
    return `${prefix}\n${doc.documentElement.outerHTML}`;
  }
  // Fragment input: the parser hoists <style>/<title>/<meta> into <head>;
  // keep that content so nothing the user wrote is silently dropped.
  const headContent = doc.head.innerHTML.trim();
  const bodyContent = doc.body.innerHTML;
  return headContent ? `${headContent}\n${bodyContent}` : bodyContent;
}

/** All elements in document order, including <head> content. */
export function allElements(doc: Document, selector: string): Element[] {
  return Array.from(doc.querySelectorAll(selector));
}

// ---------------------------------------------------------------------------
// Source positions (best effort — used only for report line/column display)
// ---------------------------------------------------------------------------

/**
 * Line/column of the Nth occurrence of an opening tag in the source string.
 * DOM nodes carry no positions, so we map the element's index among elements
 * of the same tag back to the source. Approximate but stable.
 */
export function sourceTagPosition(
  html: string,
  tagName: string,
  occurrence: number
): { line?: number; column?: number } {
  const re = new RegExp(`<${tagName}(?=[\\s/>])`, "gi");
  let match: RegExpExecArray | null;
  let index = -1;
  let count = 0;
  while ((match = re.exec(html)) !== null) {
    if (count === occurrence) {
      index = match.index;
      break;
    }
    count++;
  }
  if (index < 0) return {};

  let line = 1;
  let lastNewline = -1;
  for (let i = 0; i < index; i++) {
    if (html.charCodeAt(i) === 10) {
      line++;
      lastNewline = i;
    }
  }
  return { line, column: index - lastNewline };
}

// ---------------------------------------------------------------------------
// Inline style helpers (string-based on the style attribute — we do not use
// CSSOM so unknown/modern properties in user styles are preserved verbatim)
// ---------------------------------------------------------------------------

export function parseStyleAttr(styleText: string | null): Map<string, string> {
  const map = new Map<string, string>();
  if (!styleText) return map;
  for (const decl of styleText.split(";")) {
    const colon = decl.indexOf(":");
    if (colon <= 0) continue;
    const prop = decl.slice(0, colon).trim().toLowerCase();
    const value = decl.slice(colon + 1).trim();
    if (prop) map.set(prop, value);
  }
  return map;
}

export function stringifyStyleMap(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([prop, value]) => `${prop}: ${value}`)
    .join("; ");
}

/** Whether the element's inline style declares a property (optionally with a specific value). */
export function styleHasProp(el: Element, prop: string, value?: string): boolean {
  const map = parseStyleAttr(el.getAttribute("style"));
  if (!map.has(prop.toLowerCase())) return false;
  if (value === undefined) return true;
  const actual = map.get(prop.toLowerCase()) ?? "";
  return actual.replace(/\s+/g, "").toLowerCase() === value.replace(/\s+/g, "").toLowerCase();
}

/** Set a style property, preserving other declarations. Returns true if the attribute changed. */
export function setStyleProp(el: Element, prop: string, value: string): boolean {
  const map = parseStyleAttr(el.getAttribute("style"));
  const key = prop.toLowerCase();
  const current = map.get(key);
  if (current !== undefined && current.replace(/\s+/g, "") === value.replace(/\s+/g, "")) {
    return false;
  }
  map.set(key, value);
  el.setAttribute("style", stringifyStyleMap(map));
  return true;
}

/** Add a style property only when it is not declared yet. Returns true if added. */
export function addStylePropIfMissing(el: Element, prop: string, value: string): boolean {
  if (styleHasProp(el, prop)) return false;
  return setStyleProp(el, prop, value);
}

/** Merge two style attribute strings; properties from `override` win. */
export function mergeStyleStrings(base: string, override: string): string {
  const map = parseStyleAttr(base);
  for (const [prop, value] of parseStyleAttr(override)) {
    map.set(prop, value);
  }
  return stringifyStyleMap(map);
}

// ---------------------------------------------------------------------------
// Structural helpers
// ---------------------------------------------------------------------------

/**
 * Replace an element with a new tag, copying attributes and moving children.
 * `extraStyles` (e.g. heading font-size) override same-name properties in the
 * element's own style; everything else the user wrote is preserved.
 */
export function replaceElementTag(
  el: Element,
  newTag: string,
  extraStyles?: Record<string, string>
): Element {
  const doc = el.ownerDocument;
  const replacement = doc.createElement(newTag);

  for (const attr of Array.from(el.attributes)) {
    replacement.setAttribute(attr.name, attr.value);
  }

  if (extraStyles && Object.keys(extraStyles).length > 0) {
    const overrides = Object.entries(extraStyles)
      .map(([prop, value]) => `${prop}: ${value}`)
      .join("; ");
    replacement.setAttribute(
      "style",
      mergeStyleStrings(el.getAttribute("style") ?? "", overrides)
    );
  }

  while (el.firstChild) {
    replacement.appendChild(el.firstChild);
  }
  el.replaceWith(replacement);
  return replacement;
}

/** Depth of the deepest <table> nesting in the document. */
export function maxTableNestingDepth(doc: Document): number {
  let max = 0;
  for (const table of Array.from(doc.querySelectorAll("table"))) {
    let depth = 1;
    let parent = table.parentElement;
    while (parent) {
      if (parent.tagName === "TABLE") depth++;
      parent = parent.parentElement;
    }
    if (depth > max) max = depth;
  }
  return max;
}

/** True when the element has no element children and only whitespace text (NBSP counts as content). */
export function isVisuallyEmpty(el: Element): boolean {
  if (el.children.length > 0) return false;
  const text = el.textContent ?? "";
  if (text.includes("\u00a0")) return false; // &nbsp; spacers are intentional
  return text.trim() === "";
}
