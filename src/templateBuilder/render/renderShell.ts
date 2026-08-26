import { fontFamilyStack, GOOGLE_FONT_CATALOG } from "../googleFontCatalog";
import type { ShellConfig } from "../types";
import { escapeHtml } from "./escape";
import { sanitizeFontFamily } from "./security";

const UTILITY_MEDIA_BLOCKS = `
      @media screen and (max-width: 602px) {
        table.main-bg    { width: 100% !important; max-width: 100% !important; min-width: 100% !important; }
        img              { background-color: transparent !important; }
        .main-image-bg   { background-color: transparent !important; }
        .footer-button   { display: block !important; width: 100% !important; max-width: 100% !important; min-width: 100% !important; }
        .spacer-hide     { display: none !important; }
        .no-radius          { border-radius: 0 !important; }
      }
`;

interface FontMatchEntry {
  selector: string;
  family: string;
}

const GOOGLE_FONT_CATEGORY_BY_NAME = new Map(GOOGLE_FONT_CATALOG.map((f) => [f.name, f.category]));

/**
 * One match entry for the shell's own fontMatchSelector/fontFamily (kept as a free-text escape
 * hatch — doesn't have to be a catalog font), plus one for every OTHER selected Google Font, so
 * content pasted with any of them in an inline style (e.g. `style="font-family: Lato"`) resolves
 * to that font's real family+fallback instead of only ever matching the single default.
 */
function buildFontMatchEntries(config: ShellConfig): FontMatchEntry[] {
  const entries: FontMatchEntry[] = [];
  const seen = new Set<string>();

  if (config.fontMatchSelector) {
    entries.push({ selector: config.fontMatchSelector, family: config.fontFamily });
    seen.add(config.fontMatchSelector);
  }
  for (const name of config.googleFonts) {
    if (seen.has(name)) continue;
    const category = GOOGLE_FONT_CATEGORY_BY_NAME.get(name);
    if (!category) continue;
    entries.push({ selector: name, family: fontFamilyStack(name, category) });
    seen.add(name);
  }
  return entries;
}

function fontMatchRules(entries: FontMatchEntry[]): string {
  if (entries.length === 0) return "";
  const rule = (e: FontMatchEntry, indent: string) => {
    const safeSelector = escapeHtml(e.selector);
    const safeFamily = escapeHtml(sanitizeFontFamily(e.family));
    return `${indent}[style*="${safeSelector}"] {
${indent}  font-family: ${safeFamily};
${indent}}`;
  };
  return `
${entries.map((e) => rule(e, "      ")).join("\n")}

      @media screen and (-webkit-min-device-pixel-ratio: 0) {
${entries.map((e) => rule(e, "        ")).join("\n")}
      }
`;
}

/** No rel="preconnect" — most email clients never load external stylesheets/fonts at all, so the
 * connection-warmup optimization has nothing real to speed up in the exported HTML; the one place
 * it would matter (this app's own Preview iframe) doesn't need it either at this scale. */
function googleFontsLinks(googleFontsHref: string | undefined): string {
  if (!googleFontsHref) return "";
  return `
    <link href="${escapeHtml(googleFontsHref)}" rel="stylesheet">
`;
}

/**
 * Буквальне відтворення наданого користувачем master-shell сніпету (TEMPLATE_BUILDER_STAGE1_QUESTIONS.md, блок 1).
 * body/Wrapper лишаються завжди білими (незмінна "хром"-частина шаблону, як у наданому прикладі) —
 * лише Outer (outerBackground) і Inner 600px-контент (contentBackground) редаговані.
 */
export function renderShell(config: ShellConfig, contentHtml: string): string {
  const widthPx = config.contentWidthPx;
  return `<!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  lang="en" dir="ltr">

  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${escapeHtml(config.title)}</title>
${googleFontsLinks(config.googleFontsHref)}
    <style type="text/css">

      body {
        width: 100% !important;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
        margin: 0;
        padding: 0;
        line-height: 100%;
      }

      * {
        box-sizing: border-box !important;
      }

      img {
        outline: none;
        text-decoration: none;
        border: none;
        -ms-interpolation-mode: bicubic;
        max-width: 100%;
        margin: 0;
        padding: 0;
      }

      table {
        border-collapse: collapse;
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }

      table td {
        border-collapse: collapse;
      }
${fontMatchRules(buildFontMatchEntries(config))}${UTILITY_MEDIA_BLOCKS}
    </style>

    <!--[if (gte mso 9)|(IE)]>
    <style type="text/css">
      table { border-collapse: collapse !important; }
    </style>
    <![endif]-->

    <!--[if (gte mso 9)|(IE)]>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG />
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->

  </head>

  <body style="margin: 0; padding: 0; background-color: #ffffff;">
<div lang="en" dir="ltr">
    <center>

      <!--[ Wrapper ]-->
      <table bgcolor="#ffffff"
        border="0"
        cellpadding="0"
        cellspacing="0"
        width="100%"
        role="presentation"
        style="border-spacing: 0; border-collapse: collapse; background-color: #ffffff; min-width: 100%;">
        <tr>
          <td align="center"
            valign="top"
            style="margin: 0; padding: 0;">

            <!--[ Outer — max-width wrap + background ]-->
            <table class="main-bg"
              bgcolor="${escapeHtml(config.outerBackground)}"
              border="0"
              cellpadding="0"
              cellspacing="0"
              width="100%"
              role="presentation"
              style="border-spacing: 0; border-collapse: collapse; padding: 0; margin: 0; max-width: 1000px; background-color: ${escapeHtml(config.outerBackground)};">
              <tr>

                <!--[ BG Pattern — optional repeating background image ]-->
                <td class="main-image-bg"
                  style="margin: 0; padding: 0;">

                  <table class="main-bg"
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    width="100%"
                    role="presentation"
                    style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; min-width: 100%;">

                    <!--[if mso | IE]>
                    <tr>
                      <td align="center">
                        <table
                          border="0"
                          cellspacing="0"
                          cellpadding="0"
                          width="${widthPx}"
                          style="width: ${widthPx}px; max-width: 100%;">
                    <![endif]-->

                    <tr>
                      <td align="center"
                        valign="top"
                        style="margin: 0; padding: 0;">

                        <!--[ Inner — ${widthPx}px content table ]-->
                        <table bgcolor="${escapeHtml(config.contentBackground)}"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          width="${widthPx}"
                          role="presentation"
                          style="border-spacing: 0; border-collapse: separate; padding: 0; margin: 0; max-width: ${widthPx}px; width: 100%; background-color: ${escapeHtml(config.contentBackground)};">
                          <!--[------ Content start ------]-->
${contentHtml}
                          <!--[------ Content / end ------]-->
                        </table>
                        <!--[ Inner / end ]-->

                      </td>
                    </tr>

                    <!--[if mso | IE]>
                        </table>
                      </td>
                    </tr>
                    <![endif]-->

                  </table>

                </td>
                <!--[ BG Pattern / end ]-->

              </tr>
            </table>
            <!--[ Outer / end ]-->

          </td>
        </tr>
      </table>
      <!--[ Wrapper / end ]-->

    </center>
   </div>
  </body>

</html>
`;
}
