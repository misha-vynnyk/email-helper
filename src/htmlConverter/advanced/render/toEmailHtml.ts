// Phase 3-4: ComponentNode tree → email HTML string.
// Converts Run[] → HTML before delegating to templates (avoids circular dep).
// All functions accept optional (tmpl, tok) so profile overrides propagate.

import type { ComponentNode, Run } from "../ir/types";
import { isDarkBg } from "../ir/color";
import {
  templates as defaultTemplates,
  buildTemplates,
  type ParagraphOpts,
  type AlertBandOpts,
  type ButtonBandOpts,
  type CalloutOpts,
  type GridOpts,
  type DividerOpts,
  type RecordOpts,
} from "../config/templates";
import { tokens as defaultTokens } from "../config/tokens";
import type { Tokens } from "../config/tokens";

type Templates = ReturnType<typeof buildTemplates>;

// ── Run → HTML ────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderRuns(runs: Run[], tok: Tokens = defaultTokens, baseColor?: string): string {
  return runs.map(run => {
    let html = esc(run.text);
    if (run.href) {
      html = `<a href="${esc(run.href)}" target="_blank" style="color:${tok.color.link};text-decoration:underline;">${html}</a>`;
    } else if (run.underline) {
      html = `<u>${html}</u>`;
    }
    if (run.italic) html = `<em>${html}</em>`;
    const hasColor = Boolean(run.color) &&
      run.color!.toLowerCase() !== (baseColor ?? "").toLowerCase();
    if (run.bold && hasColor) {
      html = `<b style="color:${run.color};">${html}</b>`;
    } else if (run.bold) {
      html = `<b>${html}</b>`;
    } else if (hasColor) {
      html = `<span style="color:${run.color};">${html}</span>`;
    }
    return html;
  }).join("");
}

export function renderLines(lines: Run[][], tok: Tokens = defaultTokens, baseColor?: string): string {
  return lines
    .filter(l => l.length > 0)
    .map(l => renderRuns(l, tok, baseColor))
    .join("<br>\n");
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
        innerHtml: renderLines(p["lines"] as Run[][], tok, tok.color.black),
        align: (p["align"] as ParagraphOpts["align"]) ?? "left",
        size: (p["size"] as ParagraphOpts["size"]) ?? "body",
      };
      return tmpl.paragraph(opts);
    }

    case "alertBand": {
      const bg = p["bg"] as string;
      const textColor = isDarkBg(bg) ? tok.color.white : tok.color.black;
      const opts: AlertBandOpts = {
        innerHtml: renderRuns(p["runs"] as Run[], tok, textColor),
        bg,
      };
      return tmpl.alertBand(opts);
    }

    case "buttonBand": {
      const runs = (p["runs"] ?? p["label"]) as Run[];
      const bg = p["bg"] as string;
      const textColor = isDarkBg(bg) ? tok.color.white : tok.color.black;
      const opts: ButtonBandOpts = {
        innerHtml: renderRuns(runs, tok, textColor),
        href: (p["href"] as string) ?? tok.color.placeholderHref,
        bg,
      };
      return tmpl.buttonBand(opts);
    }

    case "calloutLeft":
    case "calloutBox": {
      const innerHtml = renderRuns(p["runs"] as Run[], tok, tok.color.black);
      const opts: CalloutOpts = {
        accentColor: (p["accentColor"] as string) ?? tok.color.button,
        bg: p["bg"] as string | undefined,
      };
      return node.kind === "calloutLeft"
        ? tmpl.calloutLeft(innerHtml, opts)
        : tmpl.calloutBox(innerHtml, opts);
    }

    case "statsGrid": {
      const cellsHtml = (node.children ?? []).map(child => {
        const cp = child.props as { lines?: Run[][] };
        return renderLines(cp.lines ?? [], tok, tok.color.black);
      });
      const opts: GridOpts = { n: (p["n"] as number) || cellsHtml.length };
      return tmpl.statsGrid(cellsHtml, opts);
    }

    case "recordRow": {
      type RowData = { bg?: string; cells: Array<{ runs: Run[]; align?: string; bg?: string }> };
      const rawRows = p["rows"] as RowData[];
      const opts: RecordOpts = {
        rows: rawRows.map(row => ({
          bg: row.bg,
          cells: row.cells.map(c => {
            const bg = c.bg ?? row.bg;
            const textColor = bg && isDarkBg(bg) ? tok.color.white : tok.color.black;
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

    case "divider":
      return tmpl.divider(p as unknown as DividerOpts);

    case "spacer":
      return tmpl.spacer(((p["heightPx"] as number) | 0) || tok.layout.spacerPx);

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
