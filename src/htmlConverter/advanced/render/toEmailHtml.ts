// Phase 3-4: ComponentNode tree → email HTML string.
// Converts Run[] → HTML before delegating to templates (avoids circular dep).
// All functions accept optional (tmpl, tok) so profile overrides propagate.

import {
  type AlertBandOpts,
  type AlertBandSegment,
  buildTemplates,
  type ButtonBandOpts,
  type CalloutBoxOpts,
  type CalloutOpts,
  type GridCell,
  type GridOpts,
  type ImageOpts,
  type ParagraphOpts,
  type RecordOpts,
  type SplitRowOpts,
  templates as defaultTemplates,
} from "../config/templates";
import type { Tokens } from "../config/tokens";
import { tokens as defaultTokens } from "../config/tokens";
import { escapeHtml as esc } from "../escape";
import { isDarkBg } from "../ir/color";
import type { AlertBandProps,ComponentNode, Run } from "../ir/types";

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
    // Source-formatting newlines (indented HTML input) collapse to a single space —
    // same as browser rendering — so they don't leak into the formatted output.
    const html = esc(run.text.replace(/\s*\n\s*/g, " "));

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
    // Callers always pass a complete line/label bounded by block edges, so edge
    // whitespace is invisible in rendering — trim it out of the formatted output.
  }).join("").trim();
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
      // Paragraph boundary → <br><br> on its own line; within-paragraph break →
      // single <br> closing the previous line. Newlines are re-indented by the
      // enclosing template (indentHtml), so text lines stay at cell depth.
      result.push(paraBreaks?.has(i) ? "\n<br><br>\n" : " <br>\n");
    }
    result.push(renderRuns(l, tok, baseColor));
  }
  return result.join("");
}

/**
 * alertBand content interleaved with nested buttons (see AlertBandProps.buttons):
 * splits the cell into text/button segments for tmpl.alertBand to render as
 * stacked <tr> rows — each button gets its own <td bgcolor> row rather than a
 * bare <a> mid-flow, since clients that strip inline styles off anchors
 * (Outlook's Word engine) would otherwise drop the background/padding/display
 * and degrade the CTA to a plain underlined link.
 */
function buildAlertBandSegments(
  p: AlertBandProps,
  tok: Tokens,
  textColor: string,
): AlertBandSegment[] {
  const segments: AlertBandSegment[] = [];
  let groupStart = 0;
  const flushTextGroup = (end: number) => {
    if (end <= groupStart) return;
    const groupLines = p.lines.slice(groupStart, end);
    const groupBreaks = new Set<number>();
    for (const idx of p.paraBreaks ?? []) {
      if (idx > groupStart && idx < end) groupBreaks.add(idx - groupStart);
    }
    const html = renderLines(groupLines, tok, textColor, groupBreaks);
    if (html) segments.push({ kind: "text", html });
  };
  const sortedButtons = [...(p.buttons ?? [])].sort((a, b) => a.atLine - b.atLine);
  for (const { atLine, props: btn } of sortedButtons) {
    flushTextGroup(atLine);
    const btnTextColor = isDarkBg(btn.bg, tok) ? tok.color.white : tok.color.black;
    // Unlike renderNode's standalone buttonBand case, keep each run's own color here:
    // this button is nested inside a hand-styled banner where the author already chose
    // an explicit text color (e.g. white on an orange CTA that isDarkBg doesn't classify
    // as dark) — btnTextColor above is only the fallback for runs with no color of their
    // own. href is still stripped: a nested <a> inside this button's <a> would be invalid.
    const buttonRuns = btn.runs.map(r => ({ ...r, href: undefined }));
    const label = renderRuns(buttonRuns, tok, btnTextColor);
    segments.push({ kind: "button", label, href: btn.href ?? tok.placeholderHref, bg: btn.bg, radius: btn.radius, border: btn.border });
    groupStart = atLine;
  }
  flushTextGroup(p.lines.length);
  return segments;
}

// ── ComponentNode → HTML row ──────────────────────────────────────────────────

export function renderNode(
  node: ComponentNode,
  tmpl: Templates = defaultTemplates,
  tok: Tokens = defaultTokens,
): string {
  switch (node.kind) {
    case "paragraph": {
      const p = node.props;
      const opts: ParagraphOpts = {
        innerHtml: renderLines(p.lines, tok, tok.color.black, p.paraBreaks),
        align: p.align ?? "left",
        size: p.size ?? "body",
        variant: p.variant,
      };
      return tmpl.paragraph(opts);
    }

    case "alertBand": {
      const p = node.props;
      const textColor = isDarkBg(p.bg, tok) ? tok.color.white : tok.color.black;
      const opts: AlertBandOpts = p.buttons?.length
        ? { segments: buildAlertBandSegments(p, tok, textColor), bg: p.bg, border: p.border, align: p.align }
        : { innerHtml: renderLines(p.lines, tok, textColor, p.paraBreaks), bg: p.bg, border: p.border, align: p.align };
      return tmpl.alertBand(opts);
    }

    case "buttonBand": {
      const p = node.props;
      const textColor = isDarkBg(p.bg, tok) ? tok.color.white : tok.color.black;
      // Strip per-run color and href: button template controls text color/link,
      // and nested <a> inside a button link would produce invalid HTML.
      const buttonRuns = p.runs.map(r => ({ ...r, color: undefined, href: undefined }));
      const opts: ButtonBandOpts = {
        innerHtml: renderRuns(buttonRuns, tok, textColor),
        href: p.href ?? tok.placeholderHref,
        bg: p.bg,
        radius: p.radius,
        border: p.border,
      };
      return tmpl.buttonBand(opts);
    }

    case "calloutLeft": {
      const p = node.props;
      const innerHtml = renderLines(p.lines, tok, tok.color.black, p.paraBreaks);
      const opts: CalloutOpts = {
        accentColor: p.accentColor ?? tok.color.button,
        bg: p.bg,
      };
      return tmpl.calloutLeft(innerHtml, opts);
    }

    case "calloutBox": {
      const childrenHtml = renderAll(node.children, tmpl, tok);
      const opts: CalloutBoxOpts = {
        border: node.props.border,
        bg: node.props.bg,
      };
      return tmpl.calloutBox(childrenHtml, opts);
    }

    case "statsGrid": {
      const cells: GridCell[] = node.children.map(child => {
        // statsGrid children are always paragraph nodes (built by cellToChild)
        if (child.kind !== "paragraph") return { innerHtml: "" };
        const cp = child.props;
        const baseColor = cp.bg && isDarkBg(cp.bg, tok) ? tok.color.white : tok.color.black;
        return { innerHtml: renderLines(cp.lines, tok, baseColor), bg: cp.bg, borderColor: cp.borderColor };
      });
      const opts: GridOpts = {
        n: node.props.n || cells.length,
        widths: node.props.widths,
        borderColor: node.props.borderColor,
      };
      return tmpl.statsGrid(cells, opts);
    }

    case "recordRow": {
      const p = node.props;
      const opts: RecordOpts = {
        widths: p.widths,
        borderColor: p.borderColor,
        rows: p.rows.map(row => ({
          bg: row.bg,
          cells: row.cells.map(c => {
            const bg = c.bg ?? row.bg;
            const textColor = bg && isDarkBg(bg, tok) ? tok.color.white : tok.color.black;
            return {
              innerHtml: renderLines(c.lines, tok, textColor),
              align: c.align,
              bg: c.bg,
              border: c.border,
              borderColor: c.borderColor,
            };
          }),
        })),
      };
      return tmpl.recordRow(opts);
    }

    case "splitRow": {
      const opts: SplitRowOpts = {
        leftHtml: renderRuns(node.props.left, tok, tok.color.black),
        rightHtml: renderRuns(node.props.right, tok, tok.color.black),
      };
      return tmpl.splitRow(opts);
    }

    case "image": {
      const opts: ImageOpts = { src: node.props.src, alt: node.props.alt };
      return opts.src ? tmpl.image(opts) : "";
    }

    case "spacer":
      return tmpl.spacer(Math.trunc(node.props.heightPx || 0) || tok.layout.spacerPx);

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
