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
  type ListOpts,
  type ParagraphOpts,
  type RecordOpts,
  type SplitRowOpts,
  templates as defaultTemplates,
  type TextDividerOpts,
} from "../config/templates";
import type { Tokens } from "../config/tokens";
import { tokens as defaultTokens } from "../config/tokens";
import { escapeHtml as esc } from "../escape";
import { isDarkBg } from "../ir/color";
import type { AlertBandProps, ButtonBandProps, ComponentNode, ListProps, ParagraphProps,Run } from "../ir/types";

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

function renderListItems(items: Run[][], tok: Tokens): string {
  return items.map(runs => `<li>${renderRuns(runs, tok, tok.color.black)}</li>`).join("\n");
}

/** Raw <ul>/<ol> markup (tag included, no block wrapper) — for splicing inline into a
 *  paragraph's flowing text. See renderParagraphInner. */
function renderListInline(props: ListProps, tok: Tokens): string {
  const tag = props.ordered ? "ol" : "ul";
  return `<${tag}>\n${renderListItems(props.items, tok)}\n</${tag}>`;
}

/**
 * A paragraph's innerHtml, splicing in any attached lists (ParagraphProps.lists) at their
 * atLine position — "intro line" → <ul> → "continuing prose", all in one <td>, matching
 * GDocs' own layout instead of the list becoming its own separate block. No lists → same
 * as a plain renderLines call.
 */
function renderParagraphInner(p: ParagraphProps, tok: Tokens): string {
  if (!p.lists?.length) return renderLines(p.lines, tok, tok.color.black, p.paraBreaks);
  const sorted = [...p.lists].sort((a, b) => a.atLine - b.atLine);
  const parts: string[] = [];
  let groupStart = 0;
  const flushText = (end: number) => {
    if (end <= groupStart) return;
    const groupLines = p.lines.slice(groupStart, end);
    const groupBreaks = new Set<number>();
    for (const idx of p.paraBreaks ?? []) {
      if (idx > groupStart && idx < end) groupBreaks.add(idx - groupStart);
    }
    const html = renderLines(groupLines, tok, tok.color.black, groupBreaks);
    if (html) parts.push(html);
  };
  for (const { atLine, props: listProps } of sorted) {
    flushText(atLine);
    // A single <br> before the list — matches the simple converter's own convention
    // (addBrAfterClosingP collapses any run of <br>s before a <ul>/<ol> down to exactly
    // one, never zero, even though <ul> is already block-level): without it the
    // preceding line and the list sit flush against each other with no visual gap.
    // Skipped when the list opens the paragraph (atLine 0, nothing flushed yet).
    if (parts.length > 0) parts.push("<br>");
    parts.push(renderListInline(listProps, tok));
    groupStart = atLine;
  }
  flushText(p.lines.length);
  return parts.join("\n");
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
  p: Pick<AlertBandProps, "lines" | "paraBreaks" | "buttons" | "bands">,
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
  const pushButton = (btn: ButtonBandProps) => {
    const btnTextColor = isDarkBg(btn.bg, tok) ? tok.color.white : tok.color.black;
    // href is always stripped: a nested <a> inside this button's own <a> would be invalid.
    // Color is stripped only on runs that carried an href: a real <a> inside the cell
    // carries the browser's default link-blue, an artifact of it being a link, not a
    // color the author chose — trusting it would print blue-on-green instead of
    // white-on-green (see the h5-with-real-link regression this guards against).
    // A plain colored span with no href (e.g. an explicit white span hand-picked to
    // contrast against an orange bg that isDarkBg doesn't classify as dark) IS a
    // deliberate author choice and survives — btnTextColor is only the fallback for
    // runs with no color of their own.
    const buttonRuns = btn.runs.map(r => ({ ...r, color: r.href ? undefined : r.color, href: undefined }));
    const label = renderRuns(buttonRuns, tok, btnTextColor);
    segments.push({ kind: "button", label, href: btn.href ?? tok.placeholderHref, bg: btn.bg, radius: btn.radius, border: btn.border });
  };
  const nested = [
    ...(p.buttons ?? []).map(b => ({ atLine: b.atLine, kind: "button" as const, btn: b.props })),
    ...(p.bands ?? []).map(b => ({ atLine: b.atLine, kind: "band" as const, band: b.props })),
  ].sort((a, b) => a.atLine - b.atLine);
  for (const item of nested) {
    flushTextGroup(item.atLine);
    if (item.kind === "button") {
      pushButton(item.btn);
    } else {
      // Nested colored band (e.g. a dark pseudo-button cell inside a dark bordered box):
      // its own bg survives as a separate row instead of flattening to plain text.
      const band = item.band;
      const bandTextColor = isDarkBg(band.bg, tok) ? tok.color.white : tok.color.black;
      const html = renderLines(band.lines, tok, bandTextColor, band.paraBreaks);
      segments.push({ kind: "band", html, bg: band.bg, border: band.border, align: band.align });
      // Double nesting (the inner band has buttons of its own) — keep those CTAs too,
      // appended right after the band's text.
      for (const b of band.buttons ?? []) pushButton(b.props);
    }
    groupStart = item.atLine;
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
        innerHtml: renderParagraphInner(p, tok),
        align: p.align ?? "left",
        size: p.size ?? "body",
        variant: p.variant,
        tightAfter: p.tightAfter,
        tightBefore: p.tightBefore,
      };
      return tmpl.paragraph(opts);
    }

    case "list": {
      const p = node.props;
      const opts: ListOpts = { ordered: p.ordered };
      return tmpl.list(renderListItems(p.items, tok), opts);
    }

    case "alertBand": {
      const p = node.props;
      const textColor = isDarkBg(p.bg, tok) ? tok.color.white : tok.color.black;
      const opts: AlertBandOpts = p.buttons?.length || p.bands?.length
        ? { segments: buildAlertBandSegments(p, tok, textColor), bg: p.bg, border: p.border, align: p.align }
        : { innerHtml: renderLines(p.lines, tok, textColor, p.paraBreaks), bg: p.bg, border: p.border, align: p.align };
      return tmpl.alertBand(opts);
    }

    case "buttonBand": {
      const p = node.props;
      const textColor = isDarkBg(p.bg, tok) ? tok.color.white : tok.color.black;
      // Strip per-run color and href unconditionally here — unlike pushButton
      // (buildAlertBandSegments), which keeps a plain span's color since that button was
      // found inside a hand-styled banner cell where color choices are deliberate, a
      // standalone buttonBand comes straight from GDocs' bare h5-in-colored-cell marker
      // convention (see classifySingleCell's hasButtonMarker branch) with no such context —
      // the h5's own heading style carries a baked-in default color (often grey) even with
      // no <a> in sight, an artifact of GDocs' markup, not an author choice. Trusting it
      // would print near-invisible grey text on an arbitrary button background.
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
      const hasNested = Boolean(p.buttons?.length || p.bands?.length);
      const innerHtml = hasNested ? "" : renderLines(p.lines, tok, tok.color.black, p.paraBreaks);
      const opts: CalloutOpts = {
        accentColor: p.accentColor,
        accentWidthPx: p.accentWidthPx,
        accentStyle: p.accentStyle,
        accentPadX: p.accentPadX,
        bg: p.bg,
        segments: hasNested ? buildAlertBandSegments(p, tok, tok.color.black) : undefined,
      };
      return tmpl.calloutLeft(innerHtml, opts);
    }

    case "calloutBox": {
      // Common case: one plain (body, no variant) paragraph and nothing else — e.g. a
      // dashed note box with a single line of text. Skip the children-rows wrapper table
      // (see CalloutBoxOpts.innerHtml) instead of nesting a second <table> for one row.
      // Anything else (a nested button/image, multiple children) keeps the general
      // children-recursion path so F10-style nested CTAs still survive.
      const only = node.children.length === 1 ? node.children[0] : undefined;
      if (only?.kind === "paragraph" && only.props.size === "body" && !only.props.variant) {
        // renderParagraphInner (not a bare renderLines) so an attached list
        // (ParagraphProps.lists) survives instead of vanishing — see fix-advanced.md,
        // Ітерація 7.
        const innerHtml = renderParagraphInner(only.props, tok);
        const opts: CalloutBoxOpts = { border: node.props.border, bg: node.props.bg, innerHtml, align: only.props.align ?? "left" };
        return tmpl.calloutBox(undefined, opts);
      }
      const childrenHtml = renderAll(node.children, tmpl, tok);
      const opts: CalloutBoxOpts = {
        border: node.props.border,
        bg: node.props.bg,
      };
      return tmpl.calloutBox(childrenHtml, opts);
    }

    case "textDivider": {
      const p = node.props;
      const innerHtml = renderLines(p.lines, tok, tok.color.black, p.paraBreaks);
      const opts: TextDividerOpts = { align: p.align, ruleColor: p.ruleColor, ruleStyle: p.ruleStyle };
      return tmpl.textDivider(innerHtml, opts);
    }

    case "statsGrid": {
      const cells: GridCell[] = node.children.map(child => {
        // statsGrid children are always paragraph nodes (built by cellToChild)
        if (child.kind !== "paragraph") return { innerHtml: "" };
        const cp = child.props;
        const baseColor = cp.bg && isDarkBg(cp.bg, tok) ? tok.color.white : tok.color.black;
        return { innerHtml: renderLines(cp.lines, tok, baseColor), bg: cp.bg, borderColor: cp.borderColor, align: cp.align };
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
      const opts: ImageOpts = {
        src: node.props.src,
        alt: node.props.alt,
        tightBefore: node.props.tightBefore,
        tightAfter: node.props.tightAfter,
      };
      return opts.src ? tmpl.image(opts) : "";
    }

    // No classify/detect path ever produces kind:"spacer" — this branch is reachable
    // only from manually-built IR (tests, future callers). Kept for completeness.
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
