// Phase 3: DOM → StructuralNode tree (dumb DOM map, no house-logic).
// Accepts (tok, warn) so profile overrides apply during IR construction and
// silently-dropped content is reported to the conversion warnings list.

import { isLinkColor } from "../../utils/colorUtils";
import type { Tokens } from "../config/tokens";
import { tokens as defaultTokens } from "../config/tokens";
import { canonicalizeBg,canonicalizeText } from "./color";
import { getAlign, isBold, isExplicitNonBold, isExplicitNonItalic, isExplicitNonUnderline, isItalic, isUnderline, parseMarginTopPt, parseStyle, ptToSizeRole } from "./style";
import type { BorderSide, BorderSpec, CellNode, ImageNode, Paragraph, RowNode, Run,StructuralNode, TableNode, WarnFn } from "./types";

// ── Inline run collection ─────────────────────────────────────────────────────

interface Ctx {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color?: string;
  size: "body" | "small" | "headline";
  href?: string;
  bg: string;
}

const LINE_BREAK = "\n";

function sizeFromTag(tag: string): "body" | "small" | "headline" {
  if (tag === "H1" || tag === "H2") return "headline";
  if (tag === "H5" || tag === "H6") return "small";
  return "body";
}

function sizeFromStyle(style: Record<string, string>, tok: Tokens): "body" | "small" | "headline" | null {
  const fs = style["font-size"];
  if (!fs) return null;
  if (fs.endsWith("pt")) {
    const role = ptToSizeRole(fs, tok);
    return role; // "body" or "small"
  }
  if (fs.endsWith("px")) {
    const px = parseFloat(fs);
    if (px <= tok.font.smallPx + 2) return "small";
    if (px >= tok.font.headlinePx - 2) return "headline";
    return "body";
  }
  return null;
}

function makeRun(text: string, ctx: Ctx): Run {
  const run: Run = { text };
  if (ctx.bold) run.bold = true;
  if (ctx.italic) run.italic = true;
  if (ctx.underline) run.underline = true;
  if (ctx.color) run.color = ctx.color;
  if (ctx.href) run.href = ctx.href;
  return run;
}

function mergeRuns(runs: Run[]): Run[] {
  if (runs.length === 0) return runs;
  const out: Run[] = [{ ...runs[0] }];
  for (let i = 1; i < runs.length; i++) {
    const prev = out[out.length - 1];
    const cur = runs[i];
    if (
      cur.text !== LINE_BREAK && prev.text !== LINE_BREAK &&
      prev.bold === cur.bold && prev.italic === cur.italic &&
      prev.underline === cur.underline && prev.color === cur.color &&
      prev.href === cur.href
    ) {
      prev.text += cur.text;
    } else {
      out.push({ ...cur });
    }
  }
  return out;
}

function splitIntoLines(runs: Run[]): Run[][] {
  const lines: Run[][] = [[]];
  for (const run of runs) {
    if (run.text === LINE_BREAK) {
      lines.push([]);
    } else {
      lines[lines.length - 1].push(run);
    }
  }
  while (lines.length > 1 && lines[lines.length - 1].length === 0) lines.pop();
  return lines;
}

function collectRuns(el: Element | Node, ctx: Ctx, tok: Tokens): Run[] {
  const runs: Run[] = [];

  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").replace(/\u00A0/g, " ");
      if (text) {
        // Whitespace-only text inside a link-colored span gets ctx.href (PLACEHOLDER_URL),
        // but whitespace is not actual link text — strip href so we don't emit <a> tags
        // containing only newlines/spaces that confuse adjacent-link cleanup passes.
        const runCtx = text.trim() ? ctx : { ...ctx, href: undefined };
        runs.push(makeRun(text, runCtx));
      }
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;

    const child = node as Element;
    const tag = child.tagName.toUpperCase();

    if (tag === "BR") { runs.push({ text: LINE_BREAK }); continue; }
    // Skip block-level elements that shouldn't appear inside inline context
    if (tag === "TABLE") continue;

    const style = parseStyle(child.getAttribute("style") ?? "");
    const childCtx: Ctx = { ...ctx };

    // Inline style always wins over tag semantics:
    // <b style="font-weight:normal"> is Google Docs' wrapper — must NOT set bold.
    if (isExplicitNonBold(style))        childCtx.bold = false;
    else if (isBold(style) || tag === "B" || tag === "STRONG") childCtx.bold = true;

    if (isExplicitNonItalic(style))      childCtx.italic = false;
    else if (isItalic(style) || tag === "EM" || tag === "I")   childCtx.italic = true;

    if (isExplicitNonUnderline(style))   childCtx.underline = false;
    else if (isUnderline(style) || tag === "U")                childCtx.underline = true;

    const rawColor = style["color"];
    if (rawColor) {
      childCtx.color = canonicalizeText(rawColor, ctx.bg, tok) ?? ctx.color;
    }

    if (tag === "A") {
      childCtx.href = child.getAttribute("href") ?? ctx.href;
    }

    // Span styled like a link (blue + underlined) but with no surrounding <a> → treat as
    // placeholder link. Both signals are required — color alone is too weak a signal (GDocs
    // authors use blue for plain emphasis/headings too) and produced false-positive links
    // (e.g. a promo banner's blue "readable" text becoming clickable for no reason).
    if (tag === "SPAN" && rawColor && !childCtx.href && childCtx.underline && isLinkColor(rawColor)) {
      childCtx.href = tok.placeholderHref;
    }

    const sizeOverride = sizeFromStyle(style, tok);
    if (sizeOverride) childCtx.size = sizeOverride;

    runs.push(...collectRuns(child, childCtx, tok));
  }

  return runs;
}

// ── Paragraph ────────────────────────────────────────────────────────────────

function parseParagraph(el: Element, bg: string, tok: Tokens): Paragraph | null {
  const tag = el.tagName.toUpperCase();
  const style = parseStyle(el.getAttribute("style") ?? "");
  const align = getAlign(style);
  const marginTopPt = parseMarginTopPt(style);
  const headingMatch = tag.match(/^H([1-6])$/);
  const isHeading = Boolean(headingMatch);
  const headingLevel = headingMatch ? parseInt(headingMatch[1]) : undefined;
  const size = isHeading ? sizeFromTag(tag) : "body";

  // Headings do NOT start bold — bold comes only from explicit <b>/<strong> tags or
  // font-weight:700 spans. GDocs HTML always encodes weight explicitly; and Chrome's
  // DOM serializer drops font-weight:400 (initial value) before we can detect it, so
  // relying on "cancel heading bold via font-weight:400 span" is unreliable in-browser.
  const ctx: Ctx = { bold: false, italic: false, underline: false, size, bg };
  const rawRuns = collectRuns(el, ctx, tok);
  const merged = mergeRuns(rawRuns);
  const lines = splitIntoLines(merged);

  // Strip leading empty lines so paraBreaks indices aren't offset by residual <br> at block start
  while (lines.length > 1 && lines[0].length === 0) lines.shift();

  if (!lines.some(l => l.length > 0)) return null;
  return { type: "p", align, size, headingLevel, lines, marginTopPt };
}

// ── Image ────────────────────────────────────────────────────────────────────

function parseImage(el: Element, warn?: WarnFn): ImageNode | null {
  const src = el.getAttribute("src");
  if (!src) {
    warn?.("Зображення без src пропущено");
    return null;
  }
  const alt = el.getAttribute("alt") ?? undefined;
  return { type: "img", src, alt };
}

/**
 * Extract <img> descendants of a block element as ImageNodes.
 * GDocs wraps each image in its own <p><span><img></span></p>, so ordering
 * relative to the block's text uses a simple rule: images whose preceding
 * text (within the block) is empty come before the paragraph, the rest after.
 */
function extractImages(el: Element, warn?: WarnFn): { before: ImageNode[]; after: ImageNode[] } {
  const before: ImageNode[] = [];
  const after: ImageNode[] = [];
  for (const imgEl of Array.from(el.querySelectorAll("img"))) {
    const img = parseImage(imgEl, warn);
    if (!img) continue;
    const range = el.ownerDocument.createRange();
    range.setStart(el, 0);
    range.setEndBefore(imgEl);
    (range.toString().trim() ? after : before).push(img);
  }
  return { before, after };
}

// ── Borders (cell classification + color only — widths always come from tokens) ─

// GDocs usually emits hex/rgb() (e.g. "solid #c2410c 1.75pt"), but named CSS colors
// (e.g. "1px solid red") show up too — try hex/rgb() first, then fall back to
// scanning the remaining words for one that resolves via canonicalizeBg (named colors).
function extractBorderColorToken(v: string, tok: Tokens): string | undefined {
  const colorMatch = v.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]+\)/);
  if (colorMatch) return colorMatch[0];
  const words = v.match(/[a-z]+/g) ?? [];
  return words.find(w => canonicalizeBg(w, tok) !== null);
}

function parseBorderSide(value: string | undefined, tok: Tokens): BorderSide | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  if (!v || v === "none") return undefined;
  const colorToken = extractBorderColorToken(v, tok);
  if (!colorToken) return undefined;
  // A declared width of 0 means no visible border, even if a color is present.
  const widthMatch = v.match(/([\d.]+)\s*(?:pt|px)/);
  const width = widthMatch ? parseFloat(widthMatch[1]) : 1;
  if (width <= 0) return undefined;
  const color = canonicalizeBg(colorToken, tok);
  if (!color) return undefined;
  return { color };
}

function parseBorderSpec(style: Record<string, string>, tok: Tokens): BorderSpec | undefined {
  const shorthand = style["border"];
  const top = parseBorderSide(style["border-top"] ?? shorthand, tok);
  const right = parseBorderSide(style["border-right"] ?? shorthand, tok);
  const bottom = parseBorderSide(style["border-bottom"] ?? shorthand, tok);
  const left = parseBorderSide(style["border-left"] ?? shorthand, tok);
  if (!top && !right && !bottom && !left) return undefined;
  return { top, right, bottom, left };
}

// ── Table ────────────────────────────────────────────────────────────────────

function parseTable(el: Element, bg: string, tok: Tokens, warn?: WarnFn): TableNode | null {
  const cols = Array.from(el.querySelectorAll(":scope > colgroup > col"));
  const colWidths = cols.length > 0
    ? cols.map(c => parseInt(c.getAttribute("width") ?? "0")).filter(n => n > 0)
    : undefined;

  // Direct <tr> rows only (not from nested tables)
  const rowEls = Array.from(el.querySelectorAll("tr")).filter(
    r => r.closest("table") === el
  );

  const rows: RowNode[] = [];
  for (const rowEl of rowEls) {
    const cellEls = Array.from(rowEl.querySelectorAll("td, th")).filter(
      c => c.closest("table") === el
    );

    const cells: CellNode[] = cellEls.map(cellEl => {
      const cellStyle = parseStyle(cellEl.getAttribute("style") ?? "");
      const rawBg = cellStyle["background-color"];
      const cellBg = rawBg ? canonicalizeBg(rawBg, tok) ?? undefined : undefined;
      const cellAlign = getAlign(cellStyle) ??
        (cellEl.getAttribute("align") as "left" | "center" | "right" | undefined);
      const colspan = parseInt(cellEl.getAttribute("colspan") ?? "1");
      const border = parseBorderSpec(cellStyle, tok);
      const children = fromDom(cellEl as Element, cellBg ?? bg, tok, warn);
      return {
        type: "cell" as const,
        bg: cellBg,
        border,
        align: cellAlign,
        colspan: colspan > 1 ? colspan : undefined,
        children,
      };
    });

    if (cells.length > 0) rows.push({ type: "row", cells });
  }

  if (rows.length === 0) return null;
  return { type: "table", rows, colWidths };
}

// ── Entry point ───────────────────────────────────────────────────────────────

export function fromDom(
  root: Element,
  bg = "#ffffff",
  tok: Tokens = defaultTokens,
  warn?: WarnFn,
): StructuralNode[] {
  const nodes: StructuralNode[] = [];

  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const el = child as Element;
    const tag = el.tagName.toUpperCase();

    if (tag === "META" || tag === "STYLE" || tag === "SCRIPT") continue;
    if (tag === "BR") continue; // top-level <br> = paragraph break, spacing via blockPadY

    if (tag === "IMG") {
      const img = parseImage(el, warn);
      if (img) nodes.push(img);
      continue;
    }

    if (/^H[1-6]$/.test(tag) || tag === "P") {
      const { before, after } = extractImages(el, warn);
      nodes.push(...before);
      const p = parseParagraph(el, bg, tok);
      if (p) nodes.push(p);
      nodes.push(...after);
      continue;
    }

    if (tag === "DIV" || tag === "BLOCKQUOTE" || tag === "SECTION" ||
        tag === "ARTICLE" || tag === "HEADER" || tag === "FOOTER" ||
        tag === "FIGURE" || tag === "MAIN" || tag === "ASIDE") {
      nodes.push(...fromDom(el, bg, tok, warn));
      continue;
    }

    if (tag === "TABLE") {
      const table = parseTable(el, bg, tok, warn);
      if (table) nodes.push(table);
      continue;
    }

    if (tag === "UL" || tag === "OL") {
      let idx = 1;
      for (const li of Array.from(el.querySelectorAll(":scope > li"))) {
        const p = parseParagraph(li as Element, bg, tok);
        if (p) {
          // Drop leading empty lines (e.g. <li><br>text</li> produces an empty first line)
          while (p.lines.length > 1 && p.lines[0].length === 0) p.lines.shift();
          const prefix: Run = { text: tag === "UL" ? "• " : `${idx++}. ` };
          p.lines = [[prefix, ...(p.lines[0] ?? [])], ...p.lines.slice(1)];
          // Adjacent list items always merge with a single <br>, never a paragraph gap —
          // structurally certain here (we're inside <ul>/<ol>), no heuristic needed.
          p.listItem = true;
          nodes.push(p);
        }
      }
      continue;
    }

    // Fallback: extract images, then try to parse as paragraph
    const { before, after } = extractImages(el, warn);
    nodes.push(...before);
    const p = parseParagraph(el, bg, tok);
    if (p) nodes.push(p);
    nodes.push(...after);
  }

  return nodes;
}
