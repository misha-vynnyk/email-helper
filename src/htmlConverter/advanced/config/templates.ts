// All markup lives here — render/ calls these functions, never builds HTML directly.
// `buildTemplates(tok)` bakes a token set into every template so profile overrides
// (TTT, Alfa, …) propagate automatically without forking markup.

import { escapeHtml } from "../escape";
import { isDarkBg } from "../ir/color";
import type { BorderSpec, Run } from "../ir/types";
import type { Tokens } from "./tokens";
import { tokens as defaultTokens } from "./tokens";

export type { Run };

// ── Opts (templates receive pre-rendered HTML strings) ────────────────────────

export interface ParagraphOpts {
  innerHtml: string;
  align?: "left" | "center" | "right";
  size: "body" | "small" | "headline";
  variant?: "quote";  // h4 marker: extra horizontal indent
}

export interface AlertBandOpts {
  innerHtml: string;
  bg: string;
  /** Cell border from the source document (e.g. a white outline on a dark CTA) */
  border?: BorderSpec;
}

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
  bg?: string;
}

export interface CalloutBoxOpts {
  border: BorderSpec;
  bg?: string;
}

export interface GridCell {
  innerHtml: string;
  /** Optional highlight background (e.g. a featured stat tile) — text color adapts via isDarkBg */
  bg?: string;
  /** This cell's own border color; falls back to GridOpts.borderColor, then tok.color.tableBorder */
  borderColor?: string;
}

export interface GridOpts {
  n: number;
  /** Integer column widths in %, summing to 100 (from GDocs <colgroup>); equal split when absent */
  widths?: number[];
  /** Cell border color from the source document; falls back to tok.color.tableBorder */
  borderColor?: string;
}

export interface ImageOpts {
  src: string;
  alt?: string;
}

export interface RecordOpts {
  /** Integer column widths in %, summing to 100 (from GDocs <colgroup>); equal split when absent */
  widths?: number[];
  /** Cell border color from the source document; falls back to tok.color.tableBorder */
  borderColor?: string;
  rows: Array<{
    bg?: string;
    /** This cell's own border color; falls back to RecordOpts.borderColor, then tok.color.tableBorder */
    cells: Array<{ innerHtml: string; align?: string; bg?: string; borderColor?: string }>;
  }>;
}

// ── Exported helpers — accept tok for profile-aware use ───────────────────────

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

export function blockRow(innerHtml: string, opts: Parameters<typeof baseStyle>[0] & { padY?: number } = {}, tok: Tokens = defaultTokens): string {
  const { padY = tok.layout.blockPadY, extraStyle, ...coreOpts } = opts;
  const align = coreOpts.align ?? "left";
  // spanStyle has no extraStyle and no padding — matches simple converter's inner <span> style
  const spanStyle = baseStyle(coreOpts, tok);
  // td gets extraStyle (e.g. quote padding-left/right) + block padding-top/bottom
  const tdExtra = extraStyle ? ` ${extraStyle}` : "";
  // headline → tok.tags.bold (e.g. "b" or "strong"); all others → tok.tags.blockWrap (e.g. "span" or "div")
  const tag = coreOpts.fontWeight === "bold" ? tok.tags.bold : tok.tags.blockWrap;
  return `<tr>
  <td align="${align}" style="${spanStyle}${tdExtra} padding-top:${padY}px;padding-bottom:${padY}px;">
    <${tag} style="${spanStyle}">${innerHtml}</${tag}>
  </td>
</tr>`;
}

/** Per-side `border-<side>:<width>px solid <color>;` — only sides present in `border` are drawn. */
export function borderSpecToStyle(border: BorderSpec | undefined, tok: Tokens = defaultTokens): string {
  if (!border) return "";
  const bw = tok.layout.calloutBoxBorderPx;
  const sides: Array<[keyof BorderSpec, string]> = [
    ["top", "border-top"], ["right", "border-right"],
    ["bottom", "border-bottom"], ["left", "border-left"],
  ];
  return sides
    .filter(([key]) => border[key])
    .map(([key, prop]) => `${prop}:${bw}px solid ${border[key]!.color};`)
    .join("");
}

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
    <td class="${tok.classes.btnWrap}" height="${height}" align="center"
        style="${style} padding:${padding};background-color:${bg};${radiusStyle}${borderStyle}" bgcolor="${bg}">
      <a href="${safeHref}" target="${target}"
         style="text-decoration:${tok.button.textDecoration};color:${textColor};padding:${innerPadding};display:block;${style};background-color:${bg};${radiusStyle}">
        ${label}
      </a>
    </td>
  </tr>
</table>`;
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
              ${content}
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
      const { innerHtml, align = "left", size, variant } = opts;
      const fontSize = size === "headline" ? tok.font.headlinePx : size === "small" ? tok.font.smallPx : tok.font.bodyPx;
      const fontWeight = size === "headline" ? "bold" : "normal";
      const qp = variant === "quote" ? tok.layout.quotePadX : 0;
      const extraStyle = qp ? `padding-left:${qp}px;padding-right:${qp}px;` : "";
      return blockRow(innerHtml, { align, fontSize, fontWeight, extraStyle }, tok);
    },

    alertBand(opts: AlertBandOpts): string {
      const { innerHtml, bg, border } = opts;
      const textColor = isDarkBg(bg, tok) ? tok.color.white : tok.color.black;
      const style = baseStyle({ color: textColor }, tok);
      const p = pad();
      const ph = tok.layout.alertBandPadH;
      const pv = tok.layout.alertBandPadV;
      const borderStyle = borderSpecToStyle(border, tok);
      return `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
    <table align="center" border="0" bgcolor="${bg}" cellspacing="0" cellpadding="0" width="100%" style="width:100%;max-width:100%;padding:0;margin:0;${borderStyle}" role="presentation">
      <tr>
        <td style="${style} padding-left:${ph}px;padding-right:${ph}px;padding-top:${pv}px;padding-bottom:${pv}px;">${innerHtml}</td>
      </tr>
    </table>
  </td>
</tr>`;
    },

    calloutLeft(innerHtml: string, opts: CalloutOpts): string {
      const { accentColor, bg = tok.color.calloutBg } = opts;
      const style = baseStyle({}, tok);
      const p = pad();
      const px = tok.layout.calloutPadX;
      const accent = tok.layout.calloutAccentPx;
      return `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
    <table align="center" border="0" bgcolor="${bg}" cellspacing="0" cellpadding="0" width="100%" style="width:100%;max-width:100%;padding:0;margin:0;border-left:${accent}px solid ${accentColor};" role="presentation">
      <tr>
        <td align="left" style="${style} padding-left:${px}px;padding-right:${px}px;padding-top:${p}px;padding-bottom:${p}px;">${innerHtml}</td>
      </tr>
    </table>
  </td>
</tr>`;
    },

    // Full/partial frame around recursively-rendered children (e.g. a bordered CTA box
    // that contains its own buttonBand) — only the sides present in `border` are drawn.
    calloutBox(childrenHtml: string, opts: CalloutBoxOpts): string {
      const { border, bg } = opts;
      const borderStyle = borderSpecToStyle(border, tok);
      const p = pad();
      const px = tok.layout.calloutPadX;
      const bgAttr = bg ? ` bgcolor="${bg}"` : "";
      const bgStyle = bg ? `background-color:${bg};` : "";
      return `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
    <table align="center" border="0"${bgAttr} cellspacing="0" cellpadding="0" width="100%" style="width:100%;max-width:100%;padding:0;margin:0;${bgStyle}${borderStyle}" role="presentation">
      <tr>
        <td style="padding-left:${px}px;padding-right:${px}px;">
          <table border="0" cellspacing="0" cellpadding="0" width="100%" role="presentation" style="width:100%;">
            ${childrenHtml}
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
    },

    buttonBand(opts: ButtonBandOpts): string {
      const { innerHtml, href, bg, subtitleHtml, radius, border } = opts;
      const p = pad();
      const subtitle = subtitleHtml ? `\n<tr>\n  <td align="center" style="padding-top:${tok.layout.buttonSubtitlePadTop}px;">${subtitleHtml}</td>\n</tr>` : "";
      return `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
    ${buttonTableHtml(innerHtml, href, bg, tok, radius, border)}${subtitle}
  </td>
</tr>`;
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
          const cellStyle = baseStyle({ align: "center", fontSize: tok.font.smallPx, color: textColor }, tok);
          const bgAttr = cell.bg ? ` bgcolor="${cell.bg}"` : "";
          const bgStyle = cell.bg ? `background-color:${cell.bg};` : "";
          const cellBorder = `${tok.layout.recordBorderPx}px solid ${cell.borderColor ?? borderColor ?? tok.color.tableBorder}`;
          return `<td valign="top" align="center" class="${tok.classes.inlineCell}" width="${w}%"${bgAttr}
          style="display:inline-block;width:${w}%;max-width:100%;min-width:${tok.layout.gridMinWidth}px;border:${cellBorder};${bgStyle}">
          <table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="width:100%;">
            <tr>
              <td${bgAttr} style="${cellStyle} padding:${cy}px ${cx}px;${bgStyle}">${cell.innerHtml}</td>
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
        ${cellsHtml}
      </tr>
    </table>
  </td>
</tr>`;
    },

    image(opts: ImageOpts): string {
      const { src, alt = "Image" } = opts;
      const p = pad();
      // Content width inside side padding (600 − 2×20 = 560) — matches simple wrapImg
      const w = tok.layout.containerMaxWidth - 2 * tok.layout.sidePadding;
      return `<tr>
  <td class="${tok.classes.imgBg}" align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
    <a href="${tok.placeholderHref}" target="${tok.button.target}">
      <img alt="${escapeHtml(alt)}" height="auto"
           src="${escapeHtml(src)}"
           style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;max-width:${w}px;font-size:13px;"
           width="${w}"/>
    </a>
  </td>
</tr>`;
    },

    recordRow(opts: RecordOpts): string {
      const { rows, widths, borderColor } = opts;
      if (!rows.length) return "";
      const p = pad();
      const ry = tok.layout.recordCellPadY;
      const rx = tok.layout.recordCellPadX;

      const rowsHtml = rows
        .map((row) => {
          const firstBg = row.cells[0]?.bg ?? row.bg;
          const rowTextColor = firstBg && isDarkBg(firstBg, tok) ? tok.color.white : tok.color.black;
          const ncols = row.cells.length;
          const colPct = ncols > 1 ? Math.floor(100 / ncols) : 0;
          const rowWidths = widths?.length === ncols ? widths : undefined;

          const cellsHtml = row.cells
            .map((cell, i) => {
              const bg = cell.bg ?? row.bg;
              const bgAttr = bg ? ` bgcolor="${bg}"` : "";
              const textColor = bg && isDarkBg(bg, tok) ? tok.color.white : rowTextColor;
              const style = baseStyle({ fontSize: tok.font.smallPx, color: textColor }, tok);
              const align = cell.align ?? "left";
              const w = rowWidths?.[i] ?? (i === ncols - 1 ? 100 - colPct * (ncols - 1) : colPct);
              const widthAttr = ncols > 1 ? ` width="${w}%"` : "";
              const cellBorder = cell.borderColor ?? borderColor ?? tok.color.tableBorder;
              return `<td align="${align}"${bgAttr}${widthAttr} style="${style} padding:${ry}px ${rx}px;border-bottom:${tok.layout.recordBorderPx}px solid ${cellBorder};">${cell.innerHtml}</td>`;
            })
            .join("\n");

          const rowBgAttr = row.bg ? ` bgcolor="${row.bg}"` : "";
          return `<tr${rowBgAttr}>${cellsHtml}</tr>`;
        })
        .join("\n");

      return `<tr>
  <td style="padding-top:${p}px;padding-bottom:${p}px;">
    <table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="width:100%;border-collapse:collapse;">
      ${rowsHtml}
    </table>
  </td>
</tr>`;
    },
  };
}

// Default instance — used everywhere that doesn't need a profile override.
export const templates = buildTemplates(defaultTokens);
