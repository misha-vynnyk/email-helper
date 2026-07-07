// Phase 3-4: ComponentNode tree → email HTML string.
// Converts Run[] → HTML before delegating to templates (avoids circular dep).
// All functions accept optional (tmpl, tok) so profile overrides propagate.

import {
  type AlertBandOpts,
  buildTemplates,
  type ButtonBandOpts,
  type CalloutOpts,
  type GridCell,
  type GridOpts,
  type ImageOpts,
  type ParagraphOpts,
  type RecordOpts,
  templates as defaultTemplates,
} from "../config/templates";
import type { Tokens } from "../config/tokens";
import { tokens as defaultTokens } from "../config/tokens";
import { escapeHtml as esc } from "../escape";
import { isDarkBg } from "../ir/color";
import type { ComponentNode, Run } from "../ir/types";

type Templates = ReturnType<typeof buildTemplates>;

// ── Run → HTML ────────────────────────────────────────────────────────────────

function isSafeHref(href: string): boolean {
  const lower = href.trimStart().toLowerCase();
  return !lower.startsWith("javascript:") && !lower.startsWith("data:") && !lower.startsWith("vbscript:");
}

// Strip leading/trailing whitespace from inside inline tags and place it outside.
// e.g. <b> text </b> → <space><b>text</b><space>
// This avoids whitespace artifacts from HTML-indented source documents.
function wrapInline(tag: string, inner: string, style?: string): string {
  const leading = inner.match(/^[\s\n]+/)?.[0] ?? "";
  const trailing = inner.match(/[\s\n]+$/)?.[0] ?? "";
  const core = inner.slice(leading.length, inner.length - trailing.length);
  if (!core) return inner; // whitespace-only run — don't wrap
  const openTag = style ? `<${tag} style="${style};">` : `<${tag}>`;
  return `${leading}${openTag}${core}</${tag}>${trailing}`;
}

export function renderRuns(runs: Run[], tok: Tokens = defaultTokens, baseColor?: string): string {
  const { bold: B, italic: I, underline: U, colorWrap: S } = tok.tags;
  return runs.map(run => {
    const html = esc(run.text);

    if (run.href && isSafeHref(run.href)) {
      const linkColor = run.color ?? tok.color.link;
      // Match simple converter link format: placeholder href, full style with font-family + bold
      const inner = run.italic ? `<${I}>${html}</${I}>` : html;
      return `<a href="${tok.placeholderHref}" style="font-family:${tok.font.stack};text-decoration:${tok.font.linkDecoration};font-weight:${tok.font.linkWeight};color:${linkColor};">${inner}</a>`;
    }

    const hasColor = Boolean(run.color) &&
      run.color!.toLowerCase() !== (baseColor ?? "").toLowerCase();

    if (!run.bold && !run.italic && !run.underline && !hasColor) return html;

    // Combine all formatting into one tag to avoid nesting (e.g. bold+italic → <b style="font-style:italic;">)
    const styleParts: string[] = [];
    let tag: string;

    if (run.bold) {
      tag = B;
      if (run.italic)    styleParts.push("font-style:italic");
      if (run.underline) styleParts.push("text-decoration:underline");
    } else if (run.italic) {
      tag = I;
      if (run.underline) styleParts.push("text-decoration:underline");
    } else if (run.underline) {
      tag = U;
    } else {
      tag = S;
    }

    if (hasColor) styleParts.push(`color:${run.color}`);

    return wrapInline(tag, html, styleParts.length ? styleParts.join(";") : undefined);
  }).join("");
}

export function renderLines(
  lines: Run[][],
  tok: Tokens = defaultTokens,
  baseColor?: string,
  paraBreaks?: Set<number>,
): string {
  const result: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.length === 0) continue;
    if (result.length > 0) {
      // Paragraph boundary → double break; within-paragraph <br> → single break
      result.push(paraBreaks?.has(i) ? "<br><br>\n" : "<br>\n");
    }
    result.push(renderRuns(l, tok, baseColor));
  }
  return result.join("");
}

// ── ComponentNode → HTML row ──────────────────────────────────────────────────

export function renderNode(
  node: ComponentNode,
  tmpl: Templates = defaultTemplates,
  tok: Tokens = defaultTokens,
): string {
  const p = node.props as Record<string, unknown>;

  switch (node.kind) {
    case "paragraph": {
      const opts: ParagraphOpts = {
        innerHtml: renderLines(
          p["lines"] as Run[][],
          tok,
          tok.color.black,
          p["paraBreaks"] as Set<number> | undefined,
        ),
        align: (p["align"] as ParagraphOpts["align"]) ?? "left",
        size: (p["size"] as ParagraphOpts["size"]) ?? "body",
        variant: p["variant"] as ParagraphOpts["variant"],
      };
      return tmpl.paragraph(opts);
    }

    case "alertBand": {
      const bg = p["bg"] as string;
      const textColor = isDarkBg(bg, tok) ? tok.color.white : tok.color.black;
      const opts: AlertBandOpts = {
        innerHtml: renderRuns(p["runs"] as Run[], tok, textColor),
        bg,
      };
      return tmpl.alertBand(opts);
    }

    case "buttonBand": {
      const runs = (p["runs"] ?? p["label"]) as Run[];
      const bg = p["bg"] as string;
      const textColor = isDarkBg(bg, tok) ? tok.color.white : tok.color.black;
      // Strip per-run color and href: button template controls text color/link,
      // and nested <a> inside a button link would produce invalid HTML.
      const buttonRuns = runs.map(r => ({ ...r, color: undefined, href: undefined }));
      const opts: ButtonBandOpts = {
        innerHtml: renderRuns(buttonRuns, tok, textColor),
        href: (p["href"] as string) ?? tok.placeholderHref,
        bg,
        radius: p["radius"] as number | undefined,
      };
      return tmpl.buttonBand(opts);
    }

    case "calloutLeft": {
      const innerHtml = renderRuns(p["runs"] as Run[], tok, tok.color.black);
      const opts: CalloutOpts = {
        accentColor: (p["accentColor"] as string) ?? tok.color.button,
        bg: p["bg"] as string | undefined,
      };
      return tmpl.calloutLeft(innerHtml, opts);
    }

    case "statsGrid": {
      const cells: GridCell[] = (node.children ?? []).map(child => {
        const cp = child.props as { lines?: Run[][]; bg?: string };
        const baseColor = cp.bg && isDarkBg(cp.bg, tok) ? tok.color.white : tok.color.black;
        return { innerHtml: renderLines(cp.lines ?? [], tok, baseColor), bg: cp.bg };
      });
      const opts: GridOpts = {
        n: (p["n"] as number) || cells.length,
        widths: p["widths"] as number[] | undefined,
      };
      return tmpl.statsGrid(cells, opts);
    }

    case "recordRow": {
      type RowData = { bg?: string; cells: Array<{ runs: Run[]; align?: string; bg?: string }> };
      const rawRows = p["rows"] as RowData[];
      const opts: RecordOpts = {
        widths: p["widths"] as number[] | undefined,
        rows: rawRows.map(row => ({
          bg: row.bg,
          cells: row.cells.map(c => {
            const bg = c.bg ?? row.bg;
            const textColor = bg && isDarkBg(bg, tok) ? tok.color.white : tok.color.black;
            return {
              innerHtml: renderRuns(c.runs, tok, textColor),
              align: c.align,
              bg: c.bg,
            };
          }),
        })),
      };
      return tmpl.recordRow(opts);
    }

    case "image": {
      const opts: ImageOpts = {
        src: p["src"] as string,
        alt: p["alt"] as string | undefined,
      };
      return opts.src ? tmpl.image(opts) : "";
    }

    case "spacer":
      return tmpl.spacer(Math.trunc((p["heightPx"] as number) || 0) || tok.layout.spacerPx);

    default:
      return "";
  }
}

export function renderAll(
  nodes: ComponentNode[],
  tmpl: Templates = defaultTemplates,
  tok: Tokens = defaultTokens,
): string {
  return nodes.map(n => renderNode(n, tmpl, tok)).filter(Boolean).join("\n");
}
