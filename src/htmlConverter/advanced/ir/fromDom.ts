// Phase 3: DOM → StructuralNode tree (dumb DOM map, no house-logic).

import type { StructuralNode, Paragraph, TableNode, RowNode, CellNode, Run } from "./types";
import { parseStyle, isBold, isItalic, isUnderline, getAlign, ptToSizeRole } from "./style";
import { canonicalizeText, canonicalizeBg } from "./color";
import { tokens } from "../config/tokens";
import { isLinkColor } from "../../utils/colorUtils";
import { PLACEHOLDER_URL } from "../../constants";

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

function sizeFromStyle(style: Record<string, string>): "body" | "small" | "headline" | null {
  const fs = style["font-size"];
  if (!fs) return null;
  if (fs.endsWith("pt")) {
    const role = ptToSizeRole(fs);
    return role; // "body" or "small"
  }
  if (fs.endsWith("px")) {
    const px = parseFloat(fs);
    if (px <= tokens.font.smallPx + 2) return "small";
    if (px >= tokens.font.headlinePx - 2) return "headline";
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

function collectRuns(el: Element | Node, ctx: Ctx): Run[] {
  const runs: Run[] = [];

  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").replace(/ /g, " ");
      if (text) runs.push(makeRun(text, ctx));
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

    if (tag === "B" || tag === "STRONG" || isBold(style)) childCtx.bold = true;
    if (tag === "EM" || tag === "I" || isItalic(style)) childCtx.italic = true;
    if (tag === "U" || isUnderline(style)) childCtx.underline = true;

    const rawColor = style["color"];
    if (rawColor) {
      childCtx.color = canonicalizeText(rawColor, ctx.bg) ?? ctx.color;
    }

    if (tag === "A") {
      childCtx.href = child.getAttribute("href") ?? ctx.href;
    }

    // Span with link-color styling but no surrounding <a> → treat as placeholder link
    if (tag === "SPAN" && rawColor && !childCtx.href && isLinkColor(rawColor)) {
      childCtx.href = PLACEHOLDER_URL;
    }

    const sizeOverride = sizeFromStyle(style);
    if (sizeOverride) childCtx.size = sizeOverride;

    runs.push(...collectRuns(child, childCtx));
  }

  return runs;
}

// ── Paragraph ────────────────────────────────────────────────────────────────

function parseParagraph(el: Element, bg: string): Paragraph | null {
  const tag = el.tagName.toUpperCase();
  const style = parseStyle(el.getAttribute("style") ?? "");
  const align = getAlign(style);
  const isHeading = /^H[1-6]$/.test(tag);
  const size = isHeading ? sizeFromTag(tag) : "body";

  const ctx: Ctx = { bold: isHeading, italic: false, underline: false, size, bg };
  const rawRuns = collectRuns(el, ctx);
  const merged = mergeRuns(rawRuns);
  const lines = splitIntoLines(merged);

  if (!lines.some(l => l.length > 0)) return null;
  return { type: "p", align, size, lines };
}

// ── Table ────────────────────────────────────────────────────────────────────

function parseTable(el: Element, bg: string): TableNode | null {
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
      const cellBg = rawBg ? canonicalizeBg(rawBg) ?? undefined : undefined;
      const cellAlign = getAlign(cellStyle) ??
        (cellEl.getAttribute("align") as "left" | "center" | "right" | undefined);
      const colspan = parseInt(cellEl.getAttribute("colspan") ?? "1");
      const children = fromDom(cellEl as Element, cellBg ?? bg);
      return {
        type: "cell" as const,
        bg: cellBg,
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

export function fromDom(root: Element, bg = "#ffffff"): StructuralNode[] {
  const nodes: StructuralNode[] = [];

  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const el = child as Element;
    const tag = el.tagName.toUpperCase();

    if (tag === "META" || tag === "STYLE" || tag === "SCRIPT") continue;
    if (tag === "BR") continue; // top-level <br> = paragraph break, spacing via blockPadY

    if (/^H[1-6]$/.test(tag) || tag === "P") {
      const p = parseParagraph(el, bg);
      if (p) nodes.push(p);
      continue;
    }

    if (tag === "DIV" || tag === "BLOCKQUOTE" || tag === "SECTION" ||
        tag === "ARTICLE" || tag === "HEADER" || tag === "FOOTER" ||
        tag === "FIGURE" || tag === "MAIN" || tag === "ASIDE") {
      nodes.push(...fromDom(el, bg));
      continue;
    }

    if (tag === "TABLE") {
      const table = parseTable(el, bg);
      if (table) nodes.push(table);
      continue;
    }

    if (tag === "UL" || tag === "OL") {
      let idx = 1;
      for (const li of Array.from(el.querySelectorAll(":scope > li"))) {
        const p = parseParagraph(li as Element, bg);
        if (p) {
          // Drop leading empty lines (e.g. <li><br>text</li> produces an empty first line)
          while (p.lines.length > 1 && p.lines[0].length === 0) p.lines.shift();
          const prefix: Run = { text: tag === "UL" ? "• " : `${idx++}. ` };
          p.lines = [[prefix, ...(p.lines[0] ?? [])], ...p.lines.slice(1)];
          nodes.push(p);
        }
      }
      continue;
    }

    // Fallback: try to extract as paragraph
    const p = parseParagraph(el, bg);
    if (p) nodes.push(p);
  }

  return nodes;
}
