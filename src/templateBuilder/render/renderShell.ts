import { fontFamilyStack, GOOGLE_FONT_CATALOG } from "../googleFontCatalog";
import { READY_MADE_BY_ID } from "../readyMadeCatalog";
import { RESPONSIVE_BREAKPOINT_PX, RESPONSIVE_TIER_ORDER, UTILITY_CLASS_CATALOG } from "../responsiveUtilityCatalog";
import type { ShellConfig } from "../types";
import { escapeHtml } from "./escape";
import { sanitizeFontFamily } from "./security";

/** Always shipped regardless of tree-shaking — intrinsic to the shell's own literal Wrapper/
 * Outer/BG-Pattern markup below (`table.main-bg` / `.main-image-bg`), not opt-in utility classes
 * a user picks per block. */
const STRUCTURAL_MEDIA_RULES = `        table.main-bg    { width: 100% !important; max-width: 100% !important; min-width: 100% !important; }
        img              { background-color: transparent !important; }
        .main-image-bg   { background-color: transparent !important; }`;

/**
 * Tree-shaken: a breakpoint's `@media` block is only emitted when at least one of its utility
 * classes — or a used ready-made block's own `extraShellCss` rule scoped to that tier — is
 * actually referenced by something on the canvas (the `base` tier is the one exception — it
 * always carries `STRUCTURAL_MEDIA_RULES`). Source order (base -> sm -> xs, per
 * `RESPONSIVE_TIER_ORDER`) is preserved so a narrower tier still wins the cascade when a viewport
 * matches more than one `@media` block at once — see responsiveUtilityCatalog.ts.
 *
 * Ready-made rules are folded into THIS builder (not emitted as a separate, unscoped block) —
 * each one names its own tier precisely so it only ever applies at that breakpoint, never at
 * every width regardless of screen size.
 */
function buildUtilityMediaBlocks(usedClassNames: ReadonlySet<string>, usedReadyMadeIds: ReadonlySet<string>): string {
  const readyMadeRules = [...usedReadyMadeIds].flatMap((id) => READY_MADE_BY_ID.get(id)?.extraShellCss ?? []);

  return RESPONSIVE_TIER_ORDER.map((tier) => {
    const usedEntries = UTILITY_CLASS_CATALOG.filter((entry) => entry.tier === tier && usedClassNames.has(entry.className));
    const tierReadyMadeRules = readyMadeRules.filter((rule) => rule.tier === tier);
    const isBaseTier = tier === "base";
    if (usedEntries.length === 0 && tierReadyMadeRules.length === 0 && !isBaseTier) return "";

    const rules = [
      isBaseTier ? STRUCTURAL_MEDIA_RULES : undefined,
      ...usedEntries.map((entry) => `        .${entry.className} { ${entry.declaration} }`),
      ...tierReadyMadeRules.map((rule) => `        ${rule.selector} { ${rule.declaration} }`),
    ]
      .filter((rule): rule is string => Boolean(rule))
      .join("\n");

    return `
      @media screen and (max-width: ${RESPONSIVE_BREAKPOINT_PX[tier]}px) {
${rules}
      }
`;
  }).join("");
}

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
    // Both land inside <style> as raw CSS text (a CSS attribute selector's quoted value, and a
    // declaration value) — not an HTML attribute — so escapeHtml is the wrong sanitizer here: it
    // turns a legitimate `"` in a quoted font stack (e.g. `"Comic Sans MS", cursive`, which
    // sanitizeFontFamily deliberately allows through) into the literal text `&quot;`, corrupting
    // the CSS. sanitizeFontFamily already strips everything that could break out of the
    // declaration/rule (`<`, `>`, `{`, `}`, `;`, backslash, ...) while keeping real quotes intact.
    const safeSelector = sanitizeFontFamily(e.selector);
    const safeFamily = sanitizeFontFamily(e.family);
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
export function renderShell(
  config: ShellConfig,
  contentHtml: string,
  usedResponsiveClassNames: ReadonlySet<string> = new Set(),
  usedReadyMadeIds: ReadonlySet<string> = new Set(),
): string {
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
${fontMatchRules(buildFontMatchEntries(config))}${buildUtilityMediaBlocks(usedResponsiveClassNames, usedReadyMadeIds)}
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
