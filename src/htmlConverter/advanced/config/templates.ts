// All markup lives here — render/ calls these functions, never builds HTML directly.
// `buildTemplates(tok)` bakes a token set into every template so profile overrides
// (TTT, Alfa, …) propagate automatically without forking markup.

import { isDarkBg } from "../ir/color";
import type { Run } from "../ir/types";
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
}

export interface ButtonBandOpts {
  bg: string;
  href: string;
  innerHtml: string;
  subtitleHtml?: string;
  radius?: number;  // overrides tok.button.radius; 0 = no rounding (GDocs table-cell buttons)
}

export interface CalloutOpts {
  accentColor: string;
  bg?: string;
}

export interface GridOpts {
  n: number;
}

export interface DividerOpts {
  color: string;
}

export interface RecordOpts {
  rows: Array<{
    bg?: string;
    cells: Array<{ innerHtml: string; align?: string; bg?: string }>;
  }>;
}

// Phase 4 stubs
export interface HeaderOpts {
  brandRuns: Run[];
  authorRuns?: Run[];
}
export interface WarningOpts {
  runs: Run[];
}
export interface AuthorOpts {
  imgSrc: string;
  imgAlt?: string;
  imgHref?: string;
  textRuns: Run[];
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

function escHref(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function buttonTableHtml(label: string, href: string, bg: string, tok: Tokens = defaultTokens, radiusOverride?: number): string {
  const { height, padding, innerPadding, target } = tok.button;
  const r = radiusOverride !== undefined ? radiusOverride : tok.button.radius;
  const radiusStyle = r > 0 ? `border-radius:${r}px;` : "";
  const textColor = isDarkBg(bg) ? tok.color.white : tok.color.black;
  const style = baseStyle({ align: "center", fontWeight: "bold", color: textColor }, tok);
  const safeHref = escHref(href);
  return `<table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="width:100%;max-width:100%;">
  <tr>
    <td class="${tok.classes.btnWrap}" height="${height}" align="center"
        style="${style} padding:${padding};background-color:${bg};${radiusStyle}" bgcolor="${bg}">
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
      const { innerHtml, bg } = opts;
      const textColor = isDarkBg(bg) ? tok.color.white : tok.color.black;
      const style = baseStyle({ color: textColor }, tok);
      const p = pad();
      const ph = tok.layout.alertBandPadH;
      const pv = tok.layout.alertBandPadV;
      return `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
    <table align="center" border="0" bgcolor="${bg}" cellspacing="0" cellpadding="0" width="100%" style="width:100%;max-width:100%;padding:0;margin:0;" role="presentation">
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

    calloutBox(innerHtml: string, opts: CalloutOpts): string {
      const { accentColor, bg = tok.color.calloutBg } = opts;
      const style = baseStyle({}, tok);
      const p = pad();
      const px = tok.layout.calloutPadX;
      const bw = tok.layout.calloutBoxBorderPx;
      return `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
    <table align="center" border="0" bgcolor="${bg}" cellspacing="0" cellpadding="0" width="100%" style="width:100%;max-width:100%;padding:0;margin:0;border:${bw}px solid ${accentColor};" role="presentation">
      <tr>
        <td align="left" style="${style} padding-left:${px}px;padding-right:${px}px;padding-top:${p}px;padding-bottom:${p}px;">${innerHtml}</td>
      </tr>
    </table>
  </td>
</tr>`;
    },

    buttonBand(opts: ButtonBandOpts): string {
      const { innerHtml, href, bg, subtitleHtml, radius } = opts;
      const p = pad();
      const subtitle = subtitleHtml ? `\n<tr>\n  <td align="center" style="padding-top:${tok.layout.buttonSubtitlePadTop}px;">${subtitleHtml}</td>\n</tr>` : "";
      return `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
    ${buttonTableHtml(innerHtml, href, bg, tok, radius)}${subtitle}
  </td>
</tr>`;
    },

    statsGrid(cells: string[], opts: GridOpts): string {
      const { n } = opts;
      const pct = Math.floor(100 / n);
      const p = pad();
      const cy = tok.layout.gridCellPadY;
      const cx = tok.layout.gridCellPadX;
      const cellStyle = baseStyle({ align: "center", fontSize: tok.font.smallPx }, tok);
      const gridBorder = `${tok.layout.recordBorderPx}px solid ${tok.color.tableBorder}`;
      const cellsHtml = cells
        .map((cellHtml, i) => {
          const w = i === cells.length - 1 ? 100 - pct * (cells.length - 1) : pct;
          return `<td valign="top" align="center" class="${tok.classes.inlineCell}" width="${w}%"
          style="display:inline-block;width:${w}%;max-width:100%;min-width:${tok.layout.gridMinWidth}px;border:${gridBorder};">
          <table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="width:100%;">
            <tr>
              <td style="${cellStyle} padding:${cy}px ${cx}px;">${cellHtml}</td>
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

    divider(opts: DividerOpts): string {
      const { color } = opts;
      const p = pad();
      const d = tok.layout.dividerPx;
      return `<tr>
  <td style="padding-top:${p}px;padding-bottom:${p}px;">
    <table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="width:100%;">
      <tr>
        <td height="${d}" style="border-top:${d}px solid ${color};font-size:0;line-height:0;mso-line-height-rule:exactly;"></td>
      </tr>
    </table>
  </td>
</tr>`;
    },

    recordRow(opts: RecordOpts): string {
      const { rows } = opts;
      if (!rows.length) return "";
      const p = pad();
      const ry = tok.layout.recordCellPadY;
      const rx = tok.layout.recordCellPadX;
      const border = tok.color.tableBorder;

      const rowsHtml = rows
        .map((row) => {
          const firstBg = row.cells[0]?.bg ?? row.bg;
          const rowTextColor = firstBg && isDarkBg(firstBg) ? tok.color.white : tok.color.black;
          const ncols = row.cells.length;
          const colPct = ncols > 1 ? Math.floor(100 / ncols) : 0;

          const cellsHtml = row.cells
            .map((cell, i) => {
              const bg = cell.bg ?? row.bg;
              const bgAttr = bg ? ` bgcolor="${bg}"` : "";
              const textColor = bg && isDarkBg(bg) ? tok.color.white : rowTextColor;
              const style = baseStyle({ fontSize: tok.font.smallPx, color: textColor }, tok);
              const align = cell.align ?? "left";
              const widthAttr = ncols > 1 ? ` width="${i === ncols - 1 ? 100 - colPct * (ncols - 1) : colPct}%"` : "";
              return `<td align="${align}"${bgAttr}${widthAttr} style="${style} padding:${ry}px ${rx}px;border-bottom:${tok.layout.recordBorderPx}px solid ${border};">${cell.innerHtml}</td>`;
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

    // ── Phase 4 stubs ───────────────────────────────────────────────────────

    header(_opts: HeaderOpts): string {
      throw new Error("TODO Phase 4: header");
    },

    authorBlock(_opts: AuthorOpts): string {
      throw new Error("TODO Phase 4: authorBlock");
    },

    warningLine(_opts: WarningOpts): string {
      throw new Error("TODO Phase 4: warningLine");
    },
  };
}

// Default instance — used everywhere that doesn't need a profile override.
export const templates = buildTemplates(defaultTokens);
