// All markup lives here — render/ calls these functions, never builds HTML directly.
// `buildTemplates(tok)` bakes a token set into every template so profile overrides
// (TTT, Alfa, …) propagate automatically without forking markup.

import { tokens as defaultTokens } from "./tokens";
import type { Tokens } from "./tokens";
import { htmlTemplates } from "../../templates";
import { PLACEHOLDER_URL } from "../../constants";
import { isDarkBg } from "../ir/color";
import type { Run } from "../ir/types";

export type { Run };

// ── Opts (templates receive pre-rendered HTML strings) ────────────────────────

export interface ParagraphOpts {
  innerHtml: string;
  align?: "left" | "center" | "right";
  size: "body" | "small" | "headline";
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
export interface HeaderOpts  { brandRuns: Run[]; authorRuns?: Run[] }
export interface WarningOpts { runs: Run[] }
export interface AuthorOpts  { imgSrc: string; imgAlt?: string; imgHref?: string; textRuns: Run[] }

// ── Exported helpers — accept tok for profile-aware use ───────────────────────

export function baseStyle(
  opts: {
    align?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    extraStyle?: string;
  } = {},
  tok: Tokens = defaultTokens,
): string {
  const {
    align      = "left",
    fontSize   = tok.font.bodyPx,
    fontWeight = "normal",
    color      = tok.color.black,
    extraStyle = "",
  } = opts;
  return `font-family:${tok.font.stack};font-size:${fontSize}px;font-style:normal;font-weight:${fontWeight};line-height:${tok.font.lineHeight};text-align:${align};color:${color};${extraStyle}`;
}

export function blockRow(
  innerHtml: string,
  opts: Parameters<typeof baseStyle>[0] & { padY?: number } = {},
  tok: Tokens = defaultTokens,
): string {
  const { padY = tok.layout.blockPadY, ...styleOpts } = opts;
  const align = styleOpts.align ?? "left";
  const style = baseStyle(styleOpts, tok);
  return `<tr>
  <td align="${align}" style="${style} padding-top:${padY}px;padding-bottom:${padY}px;">${innerHtml}</td>
</tr>`;
}

function escHref(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function buttonTableHtml(
  label: string,
  href: string,
  bg: string,
  tok: Tokens = defaultTokens,
): string {
  const { radius, height, padding, innerPadding, target } = tok.button;
  const textColor = isDarkBg(bg) ? tok.color.white : tok.color.black;
  const style = baseStyle({ align: "center", fontWeight: "bold", color: textColor }, tok);
  const safeHref = escHref(href);
  return `<table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="width:100%;max-width:100%;">
  <tr>
    <td class="${tok.classes.btnWrap}" height="${height}" align="center"
        style="${style} padding:${padding};background-color:${bg};border-radius:${radius}px;" bgcolor="${bg}">
      <a href="${safeHref}" target="${target}"
         style="font-weight:bold;text-decoration:none;color:${textColor};padding:${innerPadding};display:block;${style};background-color:${bg};border-radius:${radius}px;">
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

    document: htmlTemplates.fullStructure,

    spacer(heightPx: number): string {
      return `<tr><td height="${heightPx}" width="100%" style="max-width:100%" class="${tok.classes.spacer}"></td></tr>`;
    },

    paragraph(opts: ParagraphOpts): string {
      const { innerHtml, align = "left", size } = opts;
      const fontSize =
        size === "headline" ? tok.font.headlinePx :
        size === "small"    ? tok.font.smallPx    :
        tok.font.bodyPx;
      return blockRow(innerHtml, { align, fontSize }, tok);
    },

    alertBand(opts: AlertBandOpts): string {
      const { innerHtml, bg } = opts;
      const textColor = isDarkBg(bg) ? tok.color.white : tok.color.black;
      const style = baseStyle({ color: textColor }, tok);
      const p = pad();
      return `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
    <table align="center" border="0" bgcolor="${bg}" cellspacing="0" cellpadding="0" width="100%" style="width:100%;max-width:100%;padding:0;margin:0;" role="presentation">
      <tr>
        <td style="${style} padding-left:10px;padding-right:10px;padding-top:4px;padding-bottom:4px;">${innerHtml}</td>
      </tr>
    </table>
  </td>
</tr>`;
    },

    calloutLeft(innerHtml: string, opts: CalloutOpts): string {
      const { accentColor, bg = "#f5f5f5" } = opts;
      const style = baseStyle({}, tok);
      const p = pad();
      const accent = tok.layout.calloutAccentPx;
      return `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
    <table align="center" border="0" bgcolor="${bg}" cellspacing="0" cellpadding="0" width="100%" style="width:100%;max-width:100%;padding:0;margin:0;border-left:${accent}px solid ${accentColor};" role="presentation">
      <tr>
        <td align="left" style="${style} padding-left:10px;padding-right:10px;padding-top:${p}px;padding-bottom:${p}px;">${innerHtml}</td>
      </tr>
    </table>
  </td>
</tr>`;
    },

    calloutBox(innerHtml: string, opts: CalloutOpts): string {
      const { accentColor, bg = "#f5f5f5" } = opts;
      const style = baseStyle({}, tok);
      const p = pad();
      return `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
    <table align="center" border="0" bgcolor="${bg}" cellspacing="0" cellpadding="0" width="100%" style="width:100%;max-width:100%;padding:0;margin:0;border:2px solid ${accentColor};" role="presentation">
      <tr>
        <td align="left" style="${style} padding-left:10px;padding-right:10px;padding-top:${p}px;padding-bottom:${p}px;">${innerHtml}</td>
      </tr>
    </table>
  </td>
</tr>`;
    },

    buttonBand(opts: ButtonBandOpts): string {
      const { innerHtml, href, bg, subtitleHtml } = opts;
      const p = pad();
      const subtitle = subtitleHtml
        ? `\n<tr>\n  <td align="center" style="padding-top:8px;">${subtitleHtml}</td>\n</tr>`
        : "";
      return `<tr>
  <td align="center" style="padding-top:${p}px;padding-bottom:${p}px;">
    ${buttonTableHtml(innerHtml, href, bg, tok)}${subtitle}
  </td>
</tr>`;
    },

    statsGrid(cells: string[], opts: GridOpts): string {
      const { n } = opts;
      const pct = Math.floor(100 / n);
      const p = pad();
      const cellStyle = baseStyle({ align: "center", fontSize: tok.font.smallPx }, tok);
      const cellsHtml = cells.map(cellHtml =>
        `<td valign="top" align="center" class="${tok.classes.inlineCell}" width="${pct}%"
          style="display:inline-block;width:${pct}%;max-width:100%;min-width:${tok.layout.gridMinWidth}px;border:${tok.layout.gridBorder};">
          <table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="width:100%;">
            <tr>
              <td style="${cellStyle} padding:10px 6px;">${cellHtml}</td>
            </tr>
          </table>
        </td>`
      ).join("\n");

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
      return `<tr>
  <td style="padding-top:${p}px;padding-bottom:${p}px;">
    <table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="width:100%;">
      <tr>
        <td height="1" style="border-top:1px solid ${color};font-size:0;line-height:0;mso-line-height-rule:exactly;"></td>
      </tr>
    </table>
  </td>
</tr>`;
    },

    recordRow(opts: RecordOpts): string {
      const { rows } = opts;
      if (!rows.length) return "";
      const p = pad();
      const borderColor = "#E4E4E4";

      const rowsHtml = rows.map(row => {
        const firstBg = row.cells[0]?.bg ?? row.bg;
        const rowTextColor = firstBg && isDarkBg(firstBg) ? tok.color.white : tok.color.black;

        const cellsHtml = row.cells.map(cell => {
          const bg = cell.bg ?? row.bg;
          const bgAttr = bg ? ` bgcolor="${bg}"` : "";
          const textColor = bg && isDarkBg(bg) ? tok.color.white : rowTextColor;
          const style = baseStyle({ fontSize: tok.font.smallPx, color: textColor }, tok);
          const align = cell.align ?? "left";
          return `<td align="${align}"${bgAttr} style="${style} padding:4px 6px;border-bottom:1px solid ${borderColor};">${cell.innerHtml}</td>`;
        }).join("\n");

        const rowBgAttr = row.bg ? ` bgcolor="${row.bg}"` : "";
        return `<tr${rowBgAttr}>${cellsHtml}</tr>`;
      }).join("\n");

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
      void PLACEHOLDER_URL;
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
