// All markup lives here — render/ calls these functions, never builds HTML directly.
// `buildTemplates(tok)` bakes a token set into every template so profile overrides
// (TTT, Alfa, …) propagate automatically without forking markup.

import { escapeHtml } from "../escape";
import { isDarkBg } from "../ir/color";
import type { Align,BorderSpec, Run } from "../ir/types";
import type { Tokens } from "./tokens";
import { tokens as defaultTokens } from "./tokens";

export type { Run };

// ── Opts (templates receive pre-rendered HTML strings) ────────────────────────

export interface ParagraphOpts {
  innerHtml: string;
  align?: "left" | "center" | "right";
  size: "body" | "small" | "headline";
  variant?: "quote";  // h4 marker: extra horizontal indent
  /** § between this and the previous/next paragraph couldn't merge (different
   *  size/align/variant) — zero the corresponding padding to approximate a single-<br> gap. */
  tightAfter?: boolean;
  tightBefore?: boolean;
}

export interface ListOpts {
  ordered: boolean;
}

export interface AlertBandOpts {
  bg: string;
  /** Cell border from the source document (e.g. a white outline on a dark CTA) */
  border?: BorderSpec;
  /** Text alignment from the source cell — defaults to left. */
  align?: "left" | "center" | "right";
  /** Plain flowing content (no nested buttons) — rendered as a single <td>. */
  innerHtml?: string;
  /**
   * Present when the source cell has nested h5-button(s) (see AlertBandProps.buttons):
   * each segment becomes its own stacked <tr> instead of interleaving a bare button
   * mid-flow — a real button needs its own <td bgcolor> row to survive clients that
   * strip inline styles off <a> tags (see buttonTableHtml).
   */
  segments?: AlertBandSegment[];
  /**
   * Present when the source cell has image(s) but no buttons/bands of its own — pre-rendered
   * <tr> rows (text-group rows via blockRow, image rows via imageRowHtml), nested directly in
   * the bg/border table with no extra side-padding wrapper (unlike `segments`, which always
   * wraps in the standard 20px block side padding — see e2e.test.ts's "uses the standard block
   * side padding" regression for why that stays untouched for the button/band case). Each row
   * carries its own horizontal inset instead.
   */
  rows?: string[];
}

export type AlertBandSegment =
  | { kind: "text"; html: string }
  | { kind: "button"; label: string; href: string; bg: string; radius?: number; border?: BorderSpec }
  /** Nested colored band (its own bg/border) rendered as a separate row inside the outer band. */
  | { kind: "band"; html: string; bg: string; border?: BorderSpec; align?: "left" | "center" | "right" }
  /** An image that was a direct child of the source cell — see AlertBandProps.images. Its
   *  own src/alt are never rendered (see imageRowHtml); the kind only fixes its position. */
  | { kind: "image" };

export interface ButtonBandOpts {
  bg: string;
  href: string;
  innerHtml: string;
  subtitleHtml?: string;
  radius?: number;  // overrides tok.button.radius; 0 = no rounding (GDocs table-cell buttons)
  /** Cell border from the source document (e.g. a white outline on a dark CTA) */
  border?: BorderSpec;
}

export interface CalloutOpts {
  accentColor: string;
  /** Author-declared left-border width in px; tok.layout.calloutAccentPx when absent. */
  accentWidthPx?: number;
  /** Author-declared left-border style; "solid" when absent. */
  accentStyle?: "dashed" | "dotted";
  /** Author-declared gap between the accent and the text; tok.layout.calloutPadX when absent. */
  accentPadX?: number;
  bg?: string;
  /** Present when the source cell has nested h5-button(s)/band(s) — same convention as
   *  AlertBandOpts.segments — rendered as stacked rows instead of the plain innerHtml. */
  segments?: AlertBandSegment[];
  /** Present when the source cell has image(s) but no buttons/bands — same convention as
   *  AlertBandOpts.rows. */
  rows?: string[];
}

export interface CalloutBoxOpts {
  border: BorderSpec;
  bg?: string;
  /**
   * Present when the box has exactly one plain-text (body, no variant) paragraph child —
   * the common case (a bordered note/callout, no nested button/table). Skips the
   * children-rows wrapper table entirely: one <td> carries both the horizontal inset and
   * the paragraph's own vertical padding, instead of nesting a second <table> just to hold
   * a single row. Any other shape (nested button, image, multiple children) still goes
   * through `childrenHtml` so F10-style nested CTAs keep working.
   */
  innerHtml?: string;
  /** The single paragraph's own alignment (only meaningful alongside innerHtml); "left" when absent. */
  align?: Align;
}

export interface TextDividerOpts {
  align?: "left" | "center" | "right";
  ruleColor: string;
  /** Author-declared rule style; "solid" when absent. */
  ruleStyle?: "dashed" | "dotted";
}

export interface GridCell {
  innerHtml: string;
  /** Optional highlight background (e.g. a featured stat tile) — text color adapts via isDarkBg */
  bg?: string;
  /**
   * `border` (full per-side spec from the source doc) takes precedence when present and draws
   * every declared side — e.g. a distinguishing divider color on one side (a white border-right
   * between two same-colored cells) that collapsing to a single color would lose. `borderColor`
   * falls back to GridOpts.borderColor and draws a uniform frame; no border when neither is present.
   */
  border?: BorderSpec;
  borderColor?: string;
  /** Text alignment from the source cell — defaults to center. */
  align?: "left" | "center" | "right";
}

export interface GridOpts {
  n: number;
  /** Integer column widths in %, summing to 100 (from GDocs <colgroup>); equal split when absent */
  widths?: number[];
  /** Cell border color from the source document; no border drawn when absent */
  borderColor?: string;
}

export interface ImageOpts {
  /** § next to the image — zero the corresponding padding (see ImageProps). */
  tightBefore?: boolean;
  tightAfter?: boolean;
}

export interface SplitRowOpts {
  leftHtml: string;
  rightHtml: string;
}

export interface RecordOpts {
  /** Integer column widths in %, summing to 100 (from GDocs <colgroup>); equal split when absent */
  widths?: number[];
  /** Cell border color from the source document; no border drawn when absent */
  borderColor?: string;
  rows: Array<{
    bg?: string;
    /**
     * `border` (full per-side spec from the source doc) takes precedence when present and draws
     * every declared side; `borderColor` falls back to RecordOpts.borderColor and draws a single
     * bottom rule; no border is drawn when neither is present.
     */
    cells: Array<{ innerHtml: string; align?: string; bg?: string; border?: BorderSpec; borderColor?: string }>;
  }>;
}

// ── Exported helpers — accept tok for profile-aware use ───────────────────────

/**
 * Shift a multi-line HTML fragment right by `spaces`. Every template builds its
 * markup rooted at column 0; the parent re-indents the fragment at the insertion
 * point, so nesting depth stays consistent no matter how deep the composition goes.
 */
export function indentHtml(html: string, spaces: number): string {
  if (!html) return html;
  const pad = " ".repeat(spaces);
  return html
    .split("\n")
    .map(line => (line.length ? pad + line : line))
    .join("\n");
}

export function baseStyle(
  opts: {
    align?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    extraStyle?: string;
  } = {},
  tok: Tokens = defaultTokens
): string {
  const { align = "left", fontSize = tok.font.bodyPx, fontWeight = "normal", color = tok.color.black, extraStyle = "" } = opts;
  return `font-family:${tok.font.stack};font-size:${fontSize}px;font-style:normal;font-weight:${fontWeight};line-height:${tok.font.lineHeight};text-align:${align};color:${color};${extraStyle}`;
}

/**
 * Wraps already-rendered inner HTML in the block-level tag (span/div, per tok.tags.blockWrap)
 * with the SAME style already applied to the surrounding <td> — a defensive duplication for
 * email clients (notably Outlook's Word engine) that don't reliably inherit font styles from
 * a <td> onto its text content. Shared by every template whose <td> holds plain flowing text
 * but isn't blockRow (which needs its own tag selection when the block is bold).
 */
export function wrapBlockStyle(innerHtml: string, style: string, tok: Tokens = defaultTokens): string {
  const tag = tok.tags.blockWrap;
  return `<${tag} style="${style}">
${indentHtml(innerHtml, 2)}
</${tag}>`;
}

export function blockRow(
  innerHtml: string,
  opts: Parameters<typeof baseStyle>[0] & { padY?: number; padTop?: number; padBottom?: number } = {},
  tok: Tokens = defaultTokens,
): string {
  const { padY = tok.layout.blockPadY, padTop = padY, padBottom = padY, extraStyle, ...coreOpts } = opts;
  const align = coreOpts.align ?? "left";
  // spanStyle has no extraStyle and no padding — matches simple converter's inner <span> style
  const spanStyle = baseStyle(coreOpts, tok);
  // td gets extraStyle (e.g. quote padding-left/right) + block padding-top/bottom
  const tdExtra = extraStyle ? ` ${extraStyle}` : "";
  // headline → tok.tags.bold (e.g. "b" or "strong"); all others → tok.tags.blockWrap (e.g. "span" or "div")
  const tag = coreOpts.fontWeight === "bold" ? tok.tags.bold : tok.tags.blockWrap;
  return `<tr>
  <td align="${align}"
    style="${spanStyle}${tdExtra} padding-top:${padTop}px;padding-bottom:${padBottom}px;">
    <${tag} style="${spanStyle}">
${indentHtml(innerHtml, 6)}
    </${tag}>
  </td>
</tr>`;
}

/** Per-side `border-<side>:<width>px solid <color>;` — only sides present in `border` are
 *  drawn. Each side's author-declared width (BorderSide.widthPx) wins; `widthPx`/token is
 *  the fallback for sides whose source declaration had no width. When all four sides are
 *  present, collapses the MAJORITY of matching sides into a single `border:` shorthand and
 *  overrides only the side(s) that differ — e.g. 3 identical grey sides + 1 thicker black
 *  top rule becomes `border:1px solid grey;border-top:3px solid black;` instead of 4
 *  near-duplicate declarations. All-4-identical (a plain frame) is the majority=4 case of
 *  this same rule. Never applied with fewer than 4 sides present — `border:` resets literally
 *  all four sides, so a partial spec (e.g. a border-left-only accent bar) must never gain
 *  sides the source document never declared. */
export function borderSpecToStyle(border: BorderSpec | undefined, tok: Tokens = defaultTokens, widthPx?: number): string {
  if (!border) return "";
  const bw = widthPx ?? tok.layout.calloutBoxBorderPx;
  const sides: Array<[keyof BorderSpec, string]> = [
    ["top", "border-top"], ["right", "border-right"],
    ["bottom", "border-bottom"], ["left", "border-left"],
  ];
  const present = sides.filter(([key]) => border[key]);
  const sideCss = (key: keyof BorderSpec) => {
    const s = border[key]!;
    return `${s.widthPx ?? bw}px ${s.style ?? "solid"} ${s.color}`;
  };

  if (present.length === 4) {
    const counts = new Map<string, number>();
    for (const [key] of present) {
      const css = sideCss(key);
      counts.set(css, (counts.get(css) ?? 0) + 1);
    }
    let modeCss = sideCss(present[0][0]);
    let modeCount = 0;
    for (const [key] of present) {
      const css = sideCss(key);
      const count = counts.get(css)!;
      if (count > modeCount) { modeCss = css; modeCount = count; }
    }
    if (modeCount === 4) {
      return `border:${modeCss};`;
    }
    if (modeCount >= 2) {
      const overrides = present
        .filter(([key]) => sideCss(key) !== modeCss)
        .map(([key, prop]) => `${prop}:${sideCss(key)};`)
        .join("");
      return `border:${modeCss};${overrides}`;
    }
  }
  return present
    .map(([key, prop]) => `${prop}:${sideCss(key)};`)
    .join("");
}

/** Always puts tok.classes.btnWrap on the colored inner <td> — the element the
 *  destination platform's editor targets to identify/style the button. */
export function buttonTableHtml(label: string, href: string, bg: string, tok: Tokens = defaultTokens, radiusOverride?: number, border?: BorderSpec): string {
  const { height, padding, innerPadding, target } = tok.button;
  const r = radiusOverride !== undefined ? radiusOverride : tok.button.radius;
  const radiusStyle = r > 0 ? `border-radius:${r}px;` : "";
  const borderStyle = borderSpecToStyle(border, tok);
  const textColor = isDarkBg(bg, tok) ? tok.color.white : tok.color.black;
  const style = baseStyle({ align: "center", fontWeight: "bold", color: textColor }, tok);
  const safeHref = escapeHtml(href);
  return `<table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="width:100%;max-width:100%;">
  <tr>
    <td class="${tok.classes.btnWrap}" height="${height}" align="center" bgcolor="${bg}"
      style="${style} padding:${padding};background-color:${bg};${radiusStyle}${borderStyle}">
      <a href="${safeHref}" target="${target}"
        style="text-decoration:${tok.button.textDecoration};padding:${innerPadding};display:block;${style}background-color:${bg};${radiusStyle}">
${indentHtml(label, 8)}
      </a>
    </td>
  </tr>
</table>`;
}

/**
 * Standalone-image markup (img-bg-block class, wrapped in a bulletproof <a>, capped at the
 * fixed content width) — shared by the top-level image ComponentNode (`image()`) and image
 * rows nested inside an alertBand/calloutLeft box (see AlertBandOpts.rows), where `padX` adds
 * the box's own horizontal inset. 0 for the standalone/top-level case, which already sits
 * inside the document's side padding and needs no inset of its own.
 *
 * src/alt are never read from the source document — every advanced-converter image is
 * re-uploaded through the app's own storage flow after conversion, which finds/replaces this
 * exact placeholder (tok.placeholderImageSrc/Alt). Matches the Simple converter's
 * wrapImg/signatureImg convention (src/htmlConverter/templates.ts) — same fixed alt text,
 * same per-provider storage root URL and base width (see profiles/ttt.ts, profiles/alphaone.ts,
 * and Tokens.layout.placeholderImageWidth — the three Simple-converter variants each hand-pick
 * their own base width, not a shared formula).
 */
export function imageRowHtml(
  opts: { tightBefore?: boolean; tightAfter?: boolean },
  tok: Tokens = defaultTokens,
  padX = 0,
): string {
  const { tightBefore, tightAfter } = opts;
  const padTop = tightBefore ? 0 : tok.layout.blockPadY;
  const padBottom = tightAfter ? 0 : tok.layout.blockPadY;
  // Outlook's Word engine honors the HTML width attribute literally (unlike width:100% in
  // style, which every other client uses) — if the row sits inside a padded box (padX > 0),
  // the true usable width is narrower than the base placeholder width, or the fixed-width
  // <img> overflows its <td> by 2×padX in Outlook specifically.
  const w = tok.layout.placeholderImageWidth - 2 * padX;
  const padXCss = padX ? `padding-left:${padX}px;padding-right:${padX}px;` : "";
  return `<tr>
  <td class="${tok.classes.imgBg}" align="center" style="padding-top:${padTop}px;padding-bottom:${padBottom}px;${padXCss}">
    <a href="${tok.placeholderHref}" target="${tok.button.target}">
      <img alt="${escapeHtml(tok.placeholderImageAlt)}" height="auto" src="${escapeHtml(tok.placeholderImageSrc)}" width="${w}"
        style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;max-width:${w}px;font-size:13px;"/>
    </a>
  </td>
</tr>`;
}

/**
 * One <tr> per segment — shared by alertBand and calloutLeft (both can hold a nested
 * button/band table; see AlertBandOpts.segments). A real button gets its own <td bgcolor>
 * row instead of a bare <a> interleaved with text, since clients that strip inline styles
 * off anchors (Outlook's Word engine) would otherwise drop the background/padding/display.
 */
export function buildSegmentRows(
  segments: AlertBandSegment[],
  align: "left" | "center" | "right",
  textColor: string,
  tok: Tokens = defaultTokens,
): string {
  const p = tok.layout.blockPadY;
  return segments.map(seg => {
    if (seg.kind === "button") {
      const btnTable = buttonTableHtml(seg.label, seg.href, seg.bg, tok, seg.radius, seg.border);
      return `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
${indentHtml(btnTable, 4)}
  </td>
</tr>`;
    }
    if (seg.kind === "band") {
      const bandColor = isDarkBg(seg.bg, tok) ? tok.color.white : tok.color.black;
      const bandStyle = baseStyle({ align: seg.align ?? "left", color: bandColor }, tok);
      const bandBorder = borderSpecToStyle(seg.border, tok);
      const bh = tok.layout.alertBandPadH;
      const bv = tok.layout.alertBandPadV;
      return `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
    <table align="center" border="0" bgcolor="${seg.bg}" cellspacing="0" cellpadding="0" width="100%" style="width:100%;max-width:100%;padding:0;margin:0;${bandBorder}" role="presentation">
      <tr>
        <td style="${bandStyle} padding-left:${bh}px;padding-right:${bh}px;padding-top:${bv}px;padding-bottom:${bv}px;">
${indentHtml(seg.html, 10)}
        </td>
      </tr>
    </table>
  </td>
</tr>`;
    }
    if (seg.kind === "image") {
      return imageRowHtml({}, tok);
    }
    return blockRow(seg.html, { align, color: textColor }, tok);
  }).join("\n");
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function buildTemplates(tok: Tokens = defaultTokens) {
  const pad = () => tok.layout.blockPadY;

  return {
    document(content: string): string {
      const { sidePadding: sp, spacerPx, containerMaxWidth: maxW } = tok.layout;
      const { primaryTable, verticalSpace, innerTable, spacer } = tok.classes;
      return `<table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:100%;">
  <tr>
    <td align="center" valign="top">
      <table class="${primaryTable}" bgcolor="${tok.color.rootBackground}" border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="max-width:${maxW}px;">
        <tr>
          <td class="${verticalSpace}" align="center" style="padding-left:${sp}px;padding-right:${sp}px;">
            <table class="${innerTable}" border="0" cellspacing="0" role="presentation" cellpadding="0" width="100%" style="width:100%;">
              <tr><td height="${spacerPx}" width="100%" style="max-width:100%" class="${spacer}">&#160;</td></tr>
${indentHtml(content, 14)}
              <tr><td height="${spacerPx}" width="100%" style="max-width:100%" class="${spacer}">&#160;</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
    },

    spacer(heightPx: number): string {
      return `<tr><td height="${heightPx}" width="100%" style="max-width:100%" class="${tok.classes.spacer}">&#160;</td></tr>`;
    },

    paragraph(opts: ParagraphOpts): string {
      const { innerHtml, align = "left", size, variant, tightAfter, tightBefore } = opts;
      const fontSize = size === "headline" ? tok.font.headlinePx : size === "small" ? tok.font.smallPx : tok.font.bodyPx;
      const fontWeight = size === "headline" ? "bold" : "normal";
      const qp = variant === "quote" ? tok.layout.quotePadX : 0;
      const extraStyle = qp ? `padding-left:${qp}px;padding-right:${qp}px;` : "";
      const padTop = tightBefore ? 0 : undefined;
      const padBottom = tightAfter ? 0 : undefined;
      return blockRow(innerHtml, { align, fontSize, fontWeight, extraStyle, padTop, padBottom }, tok);
    },

    // Real <ul>/<ol> — matches the simple converter's convention of keeping actual list
    // markup (removeStylesFromLists/addBrAfterClosingP in the shared htmlUtils): no <br>
    // between <li> items, the destination platform supplies its own list bullet/spacing
    // styling, so only body font/color is inlined here (not a full reset).
    list(itemsHtml: string, opts: ListOpts): string {
      const { ordered } = opts;
      const tag = ordered ? "ol" : "ul";
      const style = baseStyle({}, tok);
      const p = pad();
      const indent = tok.layout.listIndentPx;
      return `<tr>
  <td style="padding-top:${p}px;padding-bottom:${p}px;">
    <${tag} style="${style} margin:0;padding-left:${indent}px;">
${indentHtml(itemsHtml, 6)}
    </${tag}>
  </td>
</tr>`;
    },

    alertBand(opts: AlertBandOpts): string {
      const { innerHtml, segments, rows, bg, border, align = "left" } = opts;
      const textColor = isDarkBg(bg, tok) ? tok.color.white : tok.color.black;
      const p = pad();
      const borderStyle = borderSpecToStyle(border, tok);

      if (rows) {
        // Image(s) but no buttons/bands — stack rows directly in the bg/border table, each
        // carrying its own horizontal inset (see AlertBandOpts.rows), instead of the
        // segments path's extra side-padding wrapper (which stays reserved for buttons/bands).
        return `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
    <table align="center" border="0" bgcolor="${bg}" cellspacing="0" cellpadding="0" width="100%" style="width:100%;max-width:100%;padding:0;margin:0;${borderStyle}" role="presentation">
${indentHtml(rows.join("\n"), 6)}
    </table>
  </td>
</tr>`;
      }

      if (segments) {
        // One <tr> per segment — a real button row (its own <td bgcolor>) instead of a
        // bare <a> interleaved with text; see AlertBandOpts.segments and buttonTableHtml.
        const sp = tok.layout.sidePadding;
        const rowsHtml = buildSegmentRows(segments, align, textColor, tok);
        return `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
    <table align="center" border="0" bgcolor="${bg}" cellspacing="0" cellpadding="0" width="100%" style="width:100%;max-width:100%;padding:0;margin:0;${borderStyle}" role="presentation">
      <tr>
        <td align="center" style="padding-left:${sp}px;padding-right:${sp}px;">
          <table align="center" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;max-width:100%;padding:0;margin:0;" role="presentation">
${indentHtml(rowsHtml, 12)}
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
      }

      const style = baseStyle({ align, color: textColor }, tok);
      const ph = tok.layout.alertBandPadH;
      const pv = tok.layout.alertBandPadV;
      return `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
    <table align="center" border="0" bgcolor="${bg}" cellspacing="0" cellpadding="0" width="100%" style="width:100%;max-width:100%;padding:0;margin:0;${borderStyle}" role="presentation">
      <tr>
        <td style="${style} padding-left:${ph}px;padding-right:${ph}px;padding-top:${pv}px;padding-bottom:${pv}px;">
${indentHtml(wrapBlockStyle(innerHtml!, style, tok), 10)}
        </td>
      </tr>
    </table>
  </td>
</tr>`;
    },

    calloutLeft(innerHtml: string, opts: CalloutOpts): string {
      const { accentColor, bg, segments, rows } = opts;
      const style = baseStyle({}, tok);
      const p = pad();
      const px = opts.accentPadX ?? tok.layout.calloutPadX;
      const accent = opts.accentWidthPx ?? tok.layout.calloutAccentPx;
      const accentStyle = opts.accentStyle ?? "solid";
      const bgAttr = bg ? ` bgcolor="${bg}"` : "";
      const bgStyle = bg ? `background-color:${bg};` : "";
      const accentBorder = `border-left:${accent}px ${accentStyle} ${accentColor};`;

      if (rows) {
        // Image(s) but no buttons/bands — same reasoning as AlertBandOpts.rows: stack rows
        // directly in the accent-bordered table, each carrying its own horizontal inset,
        // instead of the segments path's single wrapping <td>.
        return `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
    <table align="center" border="0"${bgAttr} cellspacing="0" cellpadding="0" width="100%" style="width:100%;max-width:100%;padding:0;margin:0;${bgStyle}${accentBorder}" role="presentation">
${indentHtml(rows.join("\n"), 6)}
    </table>
  </td>
</tr>`;
      }

      const wrapOpen = `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
    <table align="center" border="0"${bgAttr} cellspacing="0" cellpadding="0" width="100%" style="width:100%;max-width:100%;padding:0;margin:0;${bgStyle}${accentBorder}" role="presentation">
      <tr>`;
      const wrapClose = `      </tr>
    </table>
  </td>
</tr>`;

      // A nested button/band table (see CalloutLeftProps.buttons/bands) can't share the
      // plain flowing-text <td> below — same reasoning as alertBand's segments branch:
      // a real button needs its own <td bgcolor> row to survive Outlook's Word engine.
      if (segments) {
        return `${wrapOpen}
        <td align="left" style="padding-left:${px}px;padding-right:${px}px;">
          <table align="center" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;max-width:100%;padding:0;margin:0;" role="presentation">
${indentHtml(buildSegmentRows(segments, "left", tok.color.black, tok), 12)}
          </table>
        </td>
${wrapClose}`;
      }

      return `${wrapOpen}
        <td align="left"
          style="${style} padding-left:${px}px;padding-right:${px}px;padding-top:${p}px;padding-bottom:${p}px;">
${indentHtml(wrapBlockStyle(innerHtml, style, tok), 10)}
        </td>
${wrapClose}`;
    },

    // Full/partial frame around recursively-rendered children (e.g. a bordered CTA box
    // that contains its own buttonBand) — only the sides present in `border` are drawn.
    calloutBox(childrenHtml: string | undefined, opts: CalloutBoxOpts): string {
      const { border, bg, innerHtml, align = "left" } = opts;
      const borderStyle = borderSpecToStyle(border, tok);
      const p = pad();
      const px = tok.layout.calloutPadX;
      const bgAttr = bg ? ` bgcolor="${bg}"` : "";
      const bgStyle = bg ? `background-color:${bg};` : "";
      const wrapOpen = `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
    <table align="center" border="0"${bgAttr} cellspacing="0" cellpadding="0" width="100%" style="width:100%;max-width:100%;padding:0;margin:0;${bgStyle}${borderStyle}" role="presentation">
      <tr>`;
      const wrapClose = `      </tr>
    </table>
  </td>
</tr>`;

      if (innerHtml !== undefined) {
        const style = baseStyle({ align }, tok);
        return `${wrapOpen}
        <td align="${align}"
          style="${style} padding-top:${p}px;padding-bottom:${p}px;padding-left:${px}px;padding-right:${px}px;">
${indentHtml(wrapBlockStyle(innerHtml, style, tok), 10)}
        </td>
${wrapClose}`;
      }

      return `${wrapOpen}
        <td style="padding-left:${px}px;padding-right:${px}px;">
          <table border="0" cellspacing="0" cellpadding="0" width="100%" role="presentation" style="width:100%;">
${indentHtml(childrenHtml!, 12)}
          </table>
        </td>
${wrapClose}`;
    },

    // Plain flowing text (no box/padding) followed by a thin rule row — GDocs' 1×1
    // table-with-border-bottom idiom for a divider, not a boxed callout. A literal
    // <hr> is avoided: cleanEmptyHtmlTags (shared with the simple converter's
    // typed-<hr> feature) rewrites every <hr> in the final HTML to force
    // "<br><br><hr><br>" spacing around it, which would inject unwanted blank
    // lines inside this <td>. border-bottom directly on a <td> renders reliably
    // in every major client, including Outlook's Word engine — no <hr> needed.
    textDivider(innerHtml: string, opts: TextDividerOpts): string {
      const { align = "left", ruleColor, ruleStyle = "solid" } = opts;
      const textRow = blockRow(innerHtml, { align }, tok);
      const p = pad();
      return `${textRow}
<tr>
  <td height="1" style="font-size:1px;line-height:1px;border-bottom:1px ${ruleStyle} ${ruleColor};padding-bottom:${p}px;">&#160;</td>
</tr>`;
    },

    buttonBand(opts: ButtonBandOpts): string {
      const { innerHtml, href, bg, subtitleHtml, radius, border } = opts;
      const p = pad();
      const subtitle = subtitleHtml ? `\n<tr>\n  <td align="center" style="padding-top:${tok.layout.buttonSubtitlePadTop}px;">${subtitleHtml}</td>\n</tr>` : "";
      return `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
${indentHtml(buttonTableHtml(innerHtml, href, bg, tok, radius, border), 4)}
  </td>
</tr>${subtitle}`;
    },

    statsGrid(cells: GridCell[], opts: GridOpts): string {
      const { n, widths, borderColor } = opts;
      const pct = Math.floor(100 / n);
      const p = pad();
      const cy = tok.layout.gridCellPadY;
      const cx = tok.layout.gridCellPadX;
      const cellsHtml = cells
        .map((cell, i) => {
          const w = widths?.[i] ?? (i === cells.length - 1 ? 100 - pct * (cells.length - 1) : pct);
          const textColor = cell.bg && isDarkBg(cell.bg, tok) ? tok.color.white : tok.color.black;
          // cell.align always comes from cellToChild (detect/tableBlock.ts), which never
          // returns undefined — this ?? is only a defensive fallback for a GridCell built
          // outside that path (e.g. directly in a test). Reads the same token as
          // cellToChild's own fallback so there's exactly one place to change the default,
          // not two that could silently drift apart.
          const cellStyle = baseStyle({ align: cell.align ?? tok.statsGridDefaultAlign, fontSize: tok.font.cellPx, color: textColor }, tok);
          const bgAttr = cell.bg ? ` bgcolor="${cell.bg}"` : "";
          const bgStyle = cell.bg ? `background-color:${cell.bg};` : "";
          // background-color grouped with the rest of the "look" properties (right after
          // color), padding appended last — same flow as blockRow's spanStyle+extraStyle,
          // instead of interrupting padding with a trailing bg declaration.
          const cellTdStyle = bgStyle ? `${cellStyle}${bgStyle}` : cellStyle;
          const effectiveBorderColor = cell.borderColor ?? borderColor;
          // Full per-side spec (e.g. a white divider on one side between two same-colored cells)
          // takes precedence over the single collapsed color, same convention as recordRow.
          const borderCss = cell.border
            ? borderSpecToStyle(cell.border, tok, tok.layout.recordBorderPx)
            : effectiveBorderColor ? `border:${tok.layout.recordBorderPx}px solid ${effectiveBorderColor};` : "";
          return `<td valign="top" align="center" class="${tok.classes.inlineCell}" width="${w}%"${bgAttr}
  style="display:inline-block;width:${w}%;max-width:100%;min-width:${tok.layout.gridMinWidth}px;${borderCss}${bgStyle}">
  <table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="width:100%;">
    <tr>
      <td${bgAttr ? `${bgAttr}\n       ` : ""} style="${cellTdStyle} padding-top:${cy}px;padding-right:${cx}px;padding-bottom:${cy}px;padding-left:${cx}px;">
${indentHtml(wrapBlockStyle(cell.innerHtml, cellStyle, tok), 8)}
      </td>
    </tr>
  </table>
</td>`;
        })
        .join("\n");

      return `<tr>
  <td style="padding-top:${p}px;padding-bottom:${p}px;">
    <table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%"
      style="width:100%;min-width:100%;font-size:0;line-height:0;mso-line-height-rule:exactly;text-align:center;">
      <tr>
${indentHtml(cellsHtml, 8)}
      </tr>
    </table>
  </td>
</tr>`;
    },

    // Letterhead/byline row: left cell flows normally, right cell sits in its own
    // align="right" nested table — independent column alignment that survives Outlook,
    // where a plain <td align="right"> next to a left-aligned <td> is unreliable.
    splitRow(opts: SplitRowOpts): string {
      const { leftHtml, rightHtml } = opts;
      const style = baseStyle({ align: "left", fontSize: tok.font.bodyPx }, tok);
      const p = pad();
      const cx = tok.layout.recordCellPadX;
      const tag = tok.tags.blockWrap;
      return `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
    <table align="center" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;max-width:100%;padding:0;margin:0;" role="presentation">
      <tr>
        <td style="${style} padding-right:${cx}px;padding-left:${cx}px;">
          <${tag} style="${style}">${leftHtml}</${tag}>
        </td>
        <td align="right">
          <table align="right" border="0" cellspacing="0" cellpadding="0" style="padding:0;margin:0;" role="presentation">
            <tr>
              <td style="${style} padding-right:${cx}px;padding-left:${cx}px;">
                <${tag} style="${style}">${rightHtml}</${tag}>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
    },

    image(opts: ImageOpts): string {
      return imageRowHtml(opts, tok);
    },

    recordRow(opts: RecordOpts): string {
      const { rows, widths, borderColor } = opts;
      if (!rows.length) return "";
      const p = pad();
      const ry = tok.layout.recordCellPadY;
      const rx = tok.layout.recordCellPadX;

      const nrows = rows.length;
      const rowsHtml = rows
        .map((row, rowIdx) => {
          // Fallback color for cells with no bg of their own — derived from the row's
          // *uniform* background (row.bg), never a sibling cell's individual bg. A row
          // with mixed per-cell backgrounds (e.g. a dark label cell + a light content
          // cell) has row.bg === undefined, so cells without their own bg correctly
          // default to black instead of inheriting a neighboring cell's dark-bg white text.
          const rowTextColor = row.bg && isDarkBg(row.bg, tok) ? tok.color.white : tok.color.black;
          const ncols = row.cells.length;
          const colPct = ncols > 1 ? Math.floor(100 / ncols) : 0;
          const rowWidths = widths?.length === ncols ? widths : undefined;
          const isLastRow = rowIdx === nrows - 1;

          const cellsHtml = row.cells
            .map((cell, i) => {
              // bgcolor lives on the <td> only — a <tr bgcolor> would be redundant since every
              // cell already resolves its own effective background (cell.bg ?? row.bg).
              const bg = cell.bg ?? row.bg;
              const bgAttr = bg ? ` bgcolor="${bg}"` : "";
              const textColor = bg && isDarkBg(bg, tok) ? tok.color.white : rowTextColor;
              const align = cell.align ?? "left";
              const style = baseStyle({ align, fontSize: tok.font.cellPx, color: textColor }, tok);
              const w = rowWidths?.[i] ?? (i === ncols - 1 ? 100 - colPct * (ncols - 1) : colPct);
              const widthAttr = ncols > 1 ? ` width="${w}%"` : "";
              const isLastCol = i === ncols - 1;
              // Full per-side border from the source doc (e.g. a bordered comparison card): every
              // cell always draws top+left, but bottom/right are only suppressed on interior
              // cells when the OPPOSITE side (top/left) is also declared — that's the only case
              // where the neighboring cell's edge would double up. A "bottom-only" divider table
              // (no top declared) has nothing to double against, so every row keeps its rule,
              // matching the split-border technique already used by statsGrid.
              const hasExplicitBorder = cell.border && Object.values(cell.border).some(Boolean);
              const effectiveBorderColor = cell.borderColor ?? borderColor;
              const drawBottom = Boolean(cell.border?.bottom) && (isLastRow || !cell.border?.top);
              const drawRight = Boolean(cell.border?.right) && (isLastCol || !cell.border?.left);
              const borderStyle = hasExplicitBorder
                ? borderSpecToStyle(
                  {
                    top: cell.border!.top,
                    left: cell.border!.left,
                    bottom: drawBottom ? cell.border!.bottom : undefined,
                    right: drawRight ? cell.border!.right : undefined,
                  },
                  tok,
                  tok.layout.recordBorderPx,
                )
                : effectiveBorderColor
                  ? `border-bottom:${tok.layout.recordBorderPx}px solid ${effectiveBorderColor};`
                  : "";
              return `<td align="${align}"${bgAttr}${widthAttr}
  style="${style} padding-top:${ry}px;padding-right:${rx}px;padding-bottom:${ry}px;padding-left:${rx}px;${borderStyle}">
${indentHtml(wrapBlockStyle(cell.innerHtml, style, tok), 2)}
</td>`;
            })
            .join("\n");

          return `<tr>
${indentHtml(cellsHtml, 2)}
</tr>`;
        })
        .join("\n");

      return `<tr>
  <td style="padding-top:${p}px;padding-bottom:${p}px;">
    <table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="width:100%;border-collapse:collapse;">
${indentHtml(rowsHtml, 6)}
    </table>
  </td>
</tr>`;
    },
  };
}

// Default instance — used everywhere that doesn't need a profile override.
export const templates = buildTemplates(defaultTokens);
