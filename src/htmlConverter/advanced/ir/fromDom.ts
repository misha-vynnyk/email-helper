// Phase 3: DOM → StructuralNode tree (dumb DOM map, no house-logic).
// Accepts (tok, warn) so profile overrides apply during IR construction and
// silently-dropped content is reported to the conversion warnings list.

import { isLinkColor } from "../../utils/colorUtils";
import type { Tokens } from "../config/tokens";
import { tokens as defaultTokens } from "../config/tokens";
import { canonicalizeBg,canonicalizeText } from "./color";
import { getAlign, isBold, isExplicitNonBold, isExplicitNonItalic, isExplicitNonUnderline, isItalic, isUnderline, parseStyle } from "./style";
import { WARN } from "../warnings";
import type { BorderSide, BorderSpec, CellNode, ImageNode, Paragraph, RowNode, Run,StructuralNode, TableNode, WarnFn } from "./types";

// ── Inline run collection ─────────────────────────────────────────────────────

interface Ctx {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color?: string;
  href?: string;
  bg: string;
}

const LINE_BREAK = "\n";

// Size role comes ONLY from the tag — inline font-size on spans is document noise
// (GDocs serializes the full computed style on every run) and is deliberately never
// read: px values are always the size tokens (body/small/headline/cell in tokens.ts).
function sizeFromTag(tag: string): "body" | "small" | "headline" {
  if (tag === "H1" || tag === "H2") return "headline";
  if (tag === "H5" || tag === "H6") return "small";
  return "body";
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

/**
 * Splits runs into lines at each LINE_BREAK. A trailing empty line (from a <br> right
 * before </p>) is trimmed since renderers skip empty lines — but if that trailing
 * break came from a § marker (oneBr), its "no gap before what follows" intent must
 * survive the trim, so it's reported back as tightNext rather than silently dropped.
 * Symmetrically, a LEADING empty line (a <br> right after <p>) is reported as
 * tightBefore when it's a § marker — "no gap before ME", the mirror signal for
 * when the author places § at the start of the next paragraph instead of the end
 * of the previous one.
 */
function splitIntoLines(runs: Run[]): { lines: Run[][]; tightNext: boolean; tightBefore: boolean } {
  const lines: Run[][] = [[]];
  let firstBreakWasOneBr = false;
  let lastBreakWasOneBr = false;
  let sawBreak = false;
  for (const run of runs) {
    if (run.text === LINE_BREAK) {
      if (!sawBreak) { firstBreakWasOneBr = run.oneBr === true; sawBreak = true; }
      lastBreakWasOneBr = run.oneBr === true;
      lines.push([]);
    } else {
      lines[lines.length - 1].push(run);
    }
  }
  const tightNext = lines.length > 1 && lines[lines.length - 1].length === 0 && lastBreakWasOneBr;
  const tightBefore = lines.length > 1 && lines[0].length === 0 && firstBreakWasOneBr;
  while (lines.length > 1 && lines[lines.length - 1].length === 0) lines.pop();
  return { lines, tightNext, tightBefore };
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

    if (tag === "BR") {
      const oneBr = child.hasAttribute("data-one-br") ? { oneBr: true as const } : {};
      runs.push({ text: LINE_BREAK, ...oneBr });
      continue;
    }
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
    // Test the canonicalized color (childCtx.color), not the raw CSS value, so named/rgb()
    // blues resolve to hex first — isLinkColor's parser only understands hex/rgb, not names.
    if (tag === "SPAN" && rawColor && !childCtx.href && childCtx.underline &&
        isLinkColor(childCtx.color ?? rawColor)) {
      childCtx.href = tok.placeholderHref;
    }

    runs.push(...collectRuns(child, childCtx, tok));
  }

  return runs;
}

// ── Paragraph ────────────────────────────────────────────────────────────────

// Explicit "0" (any unit) — absence of a declaration is NOT zero.
function isZeroLength(value: string | undefined): boolean {
  return value !== undefined && parseFloat(value) === 0;
}

function parseParagraph(el: Element, bg: string, tok: Tokens): Paragraph | null {
  const tag = el.tagName.toUpperCase();
  const style = parseStyle(el.getAttribute("style") ?? "");
  const align = getAlign(style);
  const headingMatch = tag.match(/^H([1-6])$/);
  const isHeading = Boolean(headingMatch);
  const headingLevel = headingMatch ? parseInt(headingMatch[1]) : undefined;
  const size = isHeading ? sizeFromTag(tag) : "body";

  // Headings do NOT start bold — bold comes only from explicit <b>/<strong> tags or
  // font-weight:700 spans. GDocs HTML always encodes weight explicitly; and Chrome's
  // DOM serializer drops font-weight:400 (initial value) before we can detect it, so
  // relying on "cancel heading bold via font-weight:400 span" is unreliable in-browser.
  const ctx: Ctx = { bold: false, italic: false, underline: false, bg };
  const rawRuns = collectRuns(el, ctx, tok);
  const merged = mergeRuns(rawRuns);
  const { lines: rawLines, tightNext, tightBefore } = splitIntoLines(merged);

  // An empty line inside one <p> is an author-typed blank line (<br><br> between two
  // sentences without a new paragraph). Renderers skip empty lines, so keeping it as a
  // line would silently glue the sentences with a single <br> — collapse it and record
  // a paragraph break at that index instead. Leading empties (residual <br> at block
  // start) add no break, so paraBreaks indices stay aligned.
  const lines: Run[][] = [];
  const paraBreaks = new Set<number>();
  for (const line of rawLines) {
    if (line.length === 0) {
      if (lines.length > 0) paraBreaks.add(lines.length);
    } else {
      lines.push(line);
    }
  }

  if (lines.length === 0) return null;
  return {
    type: "p", align, size, headingLevel, lines,
    paraBreaks: paraBreaks.size ? paraBreaks : undefined,
    tightNext: tightNext || undefined,
    tightBefore: tightBefore || undefined,
    // Pairwise zero-gap signal halves (see pushMerged): the author explicitly zeroed
    // this paragraph's outer spacing in the document — the only structural way to tell
    // "Enter with no visible gap" apart from a normally-spaced paragraph boundary.
    zeroTopMargin: isZeroLength(style["margin-top"]) || undefined,
    zeroBottomMargin: isZeroLength(style["margin-bottom"]) || undefined,
  };
}

// ── Image ────────────────────────────────────────────────────────────────────

function parseImage(el: Element, warn?: WarnFn): ImageNode | null {
  const src = el.getAttribute("src");
  if (!src) {
    warn?.(WARN.imageWithoutSrc);
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

// Author-declared border widths survive into the IR quantized to whole px —
// fractional pt values (GDocs emits 0.5pt/0.75pt/1.25pt/1.75pt) render unreliably in
// email clients, but rounded integer px are stable and preserve the thin-line vs
// heavy-bar intent. Clamped to [1, 12] so a typo'd huge width can't blow up a layout.
const BORDER_WIDTH_MAX_PX = 12;

function parseBorderSide(value: string | undefined, tok: Tokens): BorderSide | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  if (!v || v === "none") return undefined;
  const colorToken = extractBorderColorToken(v, tok);
  if (!colorToken) return undefined;
  // A declared width of 0 means no visible border, even if a color is present.
  const widthMatch = v.match(/([\d.]+)\s*(pt|px)/);
  const width = widthMatch ? parseFloat(widthMatch[1]) : 1;
  if (width <= 0) return undefined;
  const color = canonicalizeBg(colorToken, tok);
  if (!color) return undefined;
  const side: BorderSide = { color };
  if (widthMatch) {
    const px = widthMatch[2] === "pt" ? width * (96 / 72) : width;
    side.widthPx = Math.min(BORDER_WIDTH_MAX_PX, Math.max(1, Math.round(px)));
  }
  return side;
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

  // Top-level <br> tracking: GDocs serializes an author-typed blank line between
  // paragraphs as a bare <br/> at block level. The <br> itself renders nothing
  // (rhythm comes from blockPadY / paraBreaks), but it IS an explicit "I want a gap
  // here" — recorded as gapBefore on the next paragraph so pushMerged doesn't tight-
  // merge across it. A top-level <br data-one-br> is the opposite explicit signal
  // (a § typed on its own line between paragraphs) — recorded as tightBefore.
  let pendingGap = false;
  let pendingTight = false;
  const applyPending = (p: Paragraph) => {
    if (pendingGap) p.gapBefore = true;
    if (pendingTight) p.tightBefore = true;
    pendingGap = pendingTight = false;
  };

  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const el = child as Element;
    const tag = el.tagName.toUpperCase();

    if (tag === "META" || tag === "STYLE" || tag === "SCRIPT") continue;
    if (tag === "BR") {
      if (el.hasAttribute("data-one-br")) pendingTight = true;
      else pendingGap = true;
      continue;
    }

    if (tag === "IMG") {
      const img = parseImage(el, warn);
      if (img) nodes.push(img);
      pendingGap = pendingTight = false;
      continue;
    }

    if (/^H[1-6]$/.test(tag) || tag === "P") {
      const { before, after } = extractImages(el, warn);
      nodes.push(...before);
      const p = parseParagraph(el, bg, tok);
      if (p) {
        applyPending(p);
        nodes.push(p);
      }
      nodes.push(...after);
      continue;
    }

    if (tag === "DIV" || tag === "BLOCKQUOTE" || tag === "SECTION" ||
        tag === "ARTICLE" || tag === "HEADER" || tag === "FOOTER" ||
        tag === "FIGURE" || tag === "MAIN" || tag === "ASIDE") {
      nodes.push(...fromDom(el, bg, tok, warn));
      pendingGap = pendingTight = false;
      continue;
    }

    if (tag === "TABLE") {
      const table = parseTable(el, bg, tok, warn);
      if (table) nodes.push(table);
      pendingGap = pendingTight = false;
      continue;
    }

    if (tag === "UL" || tag === "OL") {
      let idx = 1;
      for (const li of Array.from(el.querySelectorAll(":scope > li"))) {
        const p = parseParagraph(li as Element, bg, tok);
        if (p) {
          // parseParagraph never emits empty lines, so lines[0] is real content
          const prefix: Run = { text: tag === "UL" ? "• " : `${idx++}. ` };
          p.lines = [[prefix, ...(p.lines[0] ?? [])], ...p.lines.slice(1)];
          // Adjacent list items always merge with a single <br>, never a paragraph gap —
          // structurally certain here (we're inside <ul>/<ol>), no heuristic needed.
          p.listItem = true;
          applyPending(p);
          nodes.push(p);
        }
      }
      continue;
    }

    // Fallback: extract images, then try to parse as paragraph
    const { before, after } = extractImages(el, warn);
    nodes.push(...before);
    const p = parseParagraph(el, bg, tok);
    if (p) {
      applyPending(p);
      nodes.push(p);
    }
    nodes.push(...after);
  }

  return nodes;
}
