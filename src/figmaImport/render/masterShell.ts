/**
 * Literal copy of figma-to-html/master-shell-reference.html, cut at the
 * `<!--[------ Content start/end ------]-->` bracket comments into "before"/"after"
 * constants. Copied into src/ now (not read from disk at build/run time) because
 * figma-to-html/ is .gitignore'd — the reference file itself won't survive a checkout
 * that never had it, so this is the durable copy. See "Майстер-шаблон обгортки" in
 * FIGMA_TEMPLATE_IMPORT_PLAN.md.
 */

const TITLE_TOKEN = "__FIGMA_IMPORT_TITLE__";
const FONT_LINK_TOKEN = "__FIGMA_IMPORT_FONT_LINK__";
const FONT_RULES_TOKEN = "__FIGMA_IMPORT_FONT_RULES__";

export interface DocumentFont {
  family: string;
  googleQuery: string; // value for one `family=` param in the Google Fonts css2 API, e.g. "Roboto:wght@400;700"
  fallback?: string; // default "Arial, Helvetica, sans-serif"
}

export interface DocumentSlots {
  title: string;
  fonts?: DocumentFont[]; // one entry per family actually used by the rendered nodes — no entry, no
  // `<link>`/`[style*=]` rule is emitted for it, so an unlisted family silently falls back to
  // whatever the browser/client substitutes (see LESSONS.md's `[style*="FontName"]` convention).
}

const BEFORE_CONTENT = `<!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">

<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${TITLE_TOKEN}</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  ${FONT_LINK_TOKEN}

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

    ${FONT_RULES_TOKEN}

    @media screen and (max-width: 602px) {
      table.main-bg {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 100% !important;
      }

      img {
        background-color: transparent !important;
      }

      .main-image-bg {
        background-color: transparent !important;
      }

      .footer-button {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 100% !important;
      }

      .spacer-hide {
        display: none !important;
      }

      .no-radius {
        border-radius: 0 !important;
      }

      /* -- Display -- */
      /* .block              { display: block !important; } */
      /* .hidden             { display: none !important; } */
      /* .inline-block       { display: inline-block !important; } */
      /* .table              { display: table !important; } */
      /* .table-cell         { display: table-cell !important; } */

      /* -- Width -- */
      /* .w-full             { width: 100% !important; max-width: 100% !important; min-width: 100% !important; } */
      /* .w-half             { width: 50% !important; } */
      /* .w-third            { width: 33.33% !important; } */
      /* .w-two-thirds       { width: 66.66% !important; } */
      /* .w-auto             { width: auto !important; } */
      /* .max-w-full         { max-width: 100% !important; } */
      /* .min-w-full         { min-width: 100% !important; } */

      /* -- Height -- */
      /* .h-auto             { height: auto !important; } */

      /* -- Padding Top -- */
      /* .pt-0               { padding-top: 0 !important; } */
      /* .pt-4               { padding-top: 4px !important; } */
      /* .pt-8               { padding-top: 8px !important; } */
      /* .pt-12              { padding-top: 12px !important; } */
      /* .pt-16              { padding-top: 16px !important; } */
      /* .pt-20              { padding-top: 20px !important; } */
      /* .pt-24              { padding-top: 24px !important; } */
      /* .pt-32              { padding-top: 32px !important; } */
      /* .pt-40              { padding-top: 40px !important; } */
      /* .pt-48              { padding-top: 48px !important; } */

      /* -- Padding Bottom -- */
      /* .pb-0               { padding-bottom: 0 !important; } */
      /* .pb-4               { padding-bottom: 4px !important; } */
      /* .pb-8               { padding-bottom: 8px !important; } */
      /* .pb-12              { padding-bottom: 12px !important; } */
      /* .pb-16              { padding-bottom: 16px !important; } */
      /* .pb-20              { padding-bottom: 20px !important; } */
      /* .pb-24              { padding-bottom: 24px !important; } */
      /* .pb-32              { padding-bottom: 32px !important; } */
      /* .pb-40              { padding-bottom: 40px !important; } */
      /* .pb-48              { padding-bottom: 48px !important; } */
      /* .pb-64              { padding-bottom: 64px !important; } */

      /* -- Padding Left -- */
      /* .pl-0               { padding-left: 0 !important; } */
      /* .pl-8               { padding-left: 8px !important; } */
      /* .pl-16              { padding-left: 16px !important; } */
      /* .pl-24              { padding-left: 24px !important; } */

      /* -- Padding Right -- */
      /* .pr-0               { padding-right: 0 !important; } */
      /* .pr-8               { padding-right: 8px !important; } */
      /* .pr-16              { padding-right: 16px !important; } */
      /* .pr-24              { padding-right: 24px !important; } */

      /* -- Padding X (left + right) -- */
      /* .px-0               { padding-left: 0 !important; padding-right: 0 !important; } */
      /* .px-8               { padding-left: 8px !important; padding-right: 8px !important; } */
      /* .px-12              { padding-left: 12px !important; padding-right: 12px !important; } */
      /* .px-16              { padding-left: 16px !important; padding-right: 16px !important; } */
      /* .px-20              { padding-left: 20px !important; padding-right: 20px !important; } */
      /* .px-24              { padding-left: 24px !important; padding-right: 24px !important; } */

      /* -- Padding Y (top + bottom) -- */
      /* .py-8               { padding-top: 8px !important; padding-bottom: 8px !important; } */
      /* .py-16              { padding-top: 16px !important; padding-bottom: 16px !important; } */
      /* .py-24              { padding-top: 24px !important; padding-bottom: 24px !important; } */
      /* .py-32              { padding-top: 32px !important; padding-bottom: 32px !important; } */
      /* .py-40              { padding-top: 40px !important; padding-bottom: 40px !important; } */

      /* -- Font Size -- */
      /* .text-xs            { font-size: 12px !important; } */
      /* .text-sm            { font-size: 14px !important; } */
      /* .text-base          { font-size: 16px !important; } */
      /* .text-lg            { font-size: 18px !important; } */
      /* .text-xl            { font-size: 20px !important; } */
      /* .text-2xl           { font-size: 24px !important; } */
      /* .text-3xl           { font-size: 28px !important; } */
      /* .text-4xl           { font-size: 32px !important; } */

      /* -- Line Height -- */
      /* .leading-tight      { line-height: 1.2 !important; } */
      /* .leading-snug       { line-height: 1.35 !important; } */
      /* .leading-normal     { line-height: 1.5 !important; } */
      /* .leading-relaxed    { line-height: 1.75 !important; } */

      /* -- Text Align -- */
      /* .text-left          { text-align: left !important; } */
      /* .text-center        { text-align: center !important; } */
      /* .text-right         { text-align: right !important; } */

      /* -- Vertical Align -- */
      /* .align-top          { vertical-align: top !important; } */
      /* .align-middle       { vertical-align: middle !important; } */
      /* .align-bottom       { vertical-align: bottom !important; } */

      /* -- Misc -- */
      /* .no-shadow          { box-shadow: none !important; } */
      /* .no-border          { border: none !important; } */
      /* .img-full           { width: 100% !important; height: auto !important; max-width: 100% !important; } */
      /* .bg-transparent     { background-color: transparent !important; } */
      /* .float-none         { float: none !important; } */
    }

    @media screen and (max-width: 464px) {

      /* -- Display -- */
      /* .sm-block           { display: block !important; } */
      /* .sm-hidden          { display: none !important; } */
      /* .sm-inline-block    { display: inline-block !important; } */

      /* -- Width -- */
      /* .sm-w-full          { width: 100% !important; max-width: 100% !important; min-width: 100% !important; } */
      /* .sm-w-half          { width: 50% !important; } */
      /* .sm-w-auto          { width: auto !important; } */
      /* .sm-max-w-full      { max-width: 100% !important; } */

      /* -- Height -- */
      /* .sm-h-auto          { height: auto !important; } */

      /* -- Padding Top -- */
      /* .sm-pt-0            { padding-top: 0 !important; } */
      /* .sm-pt-4            { padding-top: 4px !important; } */
      /* .sm-pt-8            { padding-top: 8px !important; } */
      /* .sm-pt-12           { padding-top: 12px !important; } */
      /* .sm-pt-16           { padding-top: 16px !important; } */
      /* .sm-pt-20           { padding-top: 20px !important; } */
      /* .sm-pt-24           { padding-top: 24px !important; } */
      /* .sm-pt-32           { padding-top: 32px !important; } */

      /* -- Padding Bottom -- */
      /* .sm-pb-0            { padding-bottom: 0 !important; } */
      /* .sm-pb-4            { padding-bottom: 4px !important; } */
      /* .sm-pb-8            { padding-bottom: 8px !important; } */
      /* .sm-pb-12           { padding-bottom: 12px !important; } */
      /* .sm-pb-16           { padding-bottom: 16px !important; } */
      /* .sm-pb-20           { padding-bottom: 20px !important; } */
      /* .sm-pb-24           { padding-bottom: 24px !important; } */
      /* .sm-pb-32           { padding-bottom: 32px !important; } */
      /* .sm-pb-40           { padding-bottom: 40px !important; } */

      /* -- Padding Left -- */
      /* .sm-pl-0            { padding-left: 0 !important; } */
      /* .sm-pl-8            { padding-left: 8px !important; } */
      /* .sm-pl-16           { padding-left: 16px !important; } */

      /* -- Padding Right -- */
      /* .sm-pr-0            { padding-right: 0 !important; } */
      /* .sm-pr-8            { padding-right: 8px !important; } */
      /* .sm-pr-16           { padding-right: 16px !important; } */

      /* -- Padding X -- */
      /* .sm-px-0            { padding-left: 0 !important; padding-right: 0 !important; } */
      /* .sm-px-8            { padding-left: 8px !important; padding-right: 8px !important; } */
      /* .sm-px-16           { padding-left: 16px !important; padding-right: 16px !important; } */
      /* .sm-px-20           { padding-left: 20px !important; padding-right: 20px !important; } */

      /* -- Padding Y -- */
      /* .sm-py-8            { padding-top: 8px !important; padding-bottom: 8px !important; } */
      /* .sm-py-16           { padding-top: 16px !important; padding-bottom: 16px !important; } */
      /* .sm-py-24           { padding-top: 24px !important; padding-bottom: 24px !important; } */
      /* .sm-py-32           { padding-top: 32px !important; padding-bottom: 32px !important; } */

      /* -- Font Size -- */
      /* .sm-text-xs         { font-size: 12px !important; } */
      /* .sm-text-sm         { font-size: 14px !important; } */
      /* .sm-text-base       { font-size: 16px !important; } */
      /* .sm-text-lg         { font-size: 18px !important; } */
      /* .sm-text-xl         { font-size: 20px !important; } */
      /* .sm-text-2xl        { font-size: 24px !important; } */
      /* .sm-text-3xl        { font-size: 28px !important; } */

      /* -- Line Height -- */
      /* .sm-leading-tight   { line-height: 1.2 !important; } */
      /* .sm-leading-normal  { line-height: 1.5 !important; } */

      /* -- Text Align -- */
      /* .sm-text-left       { text-align: left !important; } */
      /* .sm-text-center     { text-align: center !important; } */
      /* .sm-text-right      { text-align: right !important; } */

      /* -- Vertical Align -- */
      /* .sm-align-top       { vertical-align: top !important; } */
      /* .sm-align-middle    { vertical-align: middle !important; } */

      /* -- Misc -- */
      /* .sm-no-radius       { border-radius: 0 !important; } */
      /* .sm-no-shadow       { box-shadow: none !important; } */
      /* .sm-img-full        { width: 100% !important; height: auto !important; } */
      /* .sm-bg-transparent  { background-color: transparent !important; } */
      /* .sm-float-none      { float: none !important; } */
    }

    @media screen and (max-width: 380px) {

      /* -- Display -- */
      /* .xs-block           { display: block !important; } */
      /* .xs-hidden          { display: none !important; } */
      /* .xs-inline-block    { display: inline-block !important; } */

      /* -- Width -- */
      /* .xs-w-full          { width: 100% !important; max-width: 100% !important; min-width: 100% !important; } */
      /* .xs-w-auto          { width: auto !important; } */
      /* .xs-max-w-full      { max-width: 100% !important; } */

      /* -- Height -- */
      /* .xs-h-auto          { height: auto !important; } */

      /* -- Padding Top -- */
      /* .xs-pt-0            { padding-top: 0 !important; } */
      /* .xs-pt-4            { padding-top: 4px !important; } */
      /* .xs-pt-8            { padding-top: 8px !important; } */
      /* .xs-pt-12           { padding-top: 12px !important; } */
      /* .xs-pt-16           { padding-top: 16px !important; } */
      /* .xs-pt-24           { padding-top: 24px !important; } */

      /* -- Padding Bottom -- */
      /* .xs-pb-0            { padding-bottom: 0 !important; } */
      /* .xs-pb-4            { padding-bottom: 4px !important; } */
      /* .xs-pb-8            { padding-bottom: 8px !important; } */
      /* .xs-pb-12           { padding-bottom: 12px !important; } */
      /* .xs-pb-16           { padding-bottom: 16px !important; } */
      /* .xs-pb-24           { padding-bottom: 24px !important; } */
      /* .xs-pb-32           { padding-bottom: 32px !important; } */

      /* -- Padding Left -- */
      /* .xs-pl-0            { padding-left: 0 !important; } */
      /* .xs-pl-8            { padding-left: 8px !important; } */

      /* -- Padding Right -- */
      /* .xs-pr-0            { padding-right: 0 !important; } */
      /* .xs-pr-8            { padding-right: 8px !important; } */

      /* -- Padding X -- */
      /* .xs-px-0            { padding-left: 0 !important; padding-right: 0 !important; } */
      /* .xs-px-8            { padding-left: 8px !important; padding-right: 8px !important; } */
      /* .xs-px-12           { padding-left: 12px !important; padding-right: 12px !important; } */

      /* -- Padding Y -- */
      /* .xs-py-8            { padding-top: 8px !important; padding-bottom: 8px !important; } */
      /* .xs-py-16           { padding-top: 16px !important; padding-bottom: 16px !important; } */
      /* .xs-py-24           { padding-top: 24px !important; padding-bottom: 24px !important; } */

      /* -- Font Size -- */
      /* .xs-text-xs         { font-size: 11px !important; } */
      /* .xs-text-sm         { font-size: 13px !important; } */
      /* .xs-text-base       { font-size: 15px !important; } */
      /* .xs-text-lg         { font-size: 17px !important; } */
      /* .xs-text-xl         { font-size: 20px !important; } */
      /* .xs-text-2xl        { font-size: 22px !important; } */

      /* -- Line Height -- */
      /* .xs-leading-tight   { line-height: 1.2 !important; } */
      /* .xs-leading-normal  { line-height: 1.5 !important; } */

      /* -- Text Align -- */
      /* .xs-text-left       { text-align: left !important; } */
      /* .xs-text-center     { text-align: center !important; } */

      /* -- Vertical Align -- */
      /* .xs-align-top       { vertical-align: top !important; } */

      /* -- Misc -- */
      /* .xs-no-radius       { border-radius: 0 !important; } */
      /* .xs-img-full        { width: 100% !important; height: auto !important; } */
      /* .xs-bg-transparent  { background-color: transparent !important; } */
    }
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
  <center>

    <!--[ Wrapper ]-->
    <table bgcolor="#ffffff" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"
      style="border-spacing: 0; border-collapse: collapse; background-color: #ffffff; min-width: 100%;">
      <tr>
        <td align="center" valign="top" style="margin: 0; padding: 0;">

          <!--[ Outer — max-width wrap + background ]-->
          <table class="main-bg" bgcolor="#e8eef4" border="0" cellpadding="0" cellspacing="0" width="100%"
            role="presentation"
            style="border-spacing: 0; border-collapse: collapse; padding: 0; margin: 0; max-width: 1000px; background-color: #e8eef4;">
            <tr>

              <!--[ BG Pattern — optional repeating background image ]-->
              <td class="main-image-bg"
                style="margin: 0; padding: 0;
                  background: url('https://storage.5th-elementagency.com/'); background-position: center top; background-repeat: repeat-y;">

                <table class="main-bg" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"
                  style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; min-width: 100%;">

                  <!--[if mso | IE]>
                    <tr>
                      <td align="center">
                        <table
                          border="0"
                          cellspacing="0"
                          cellpadding="0"
                          width="600"
                          style="width: 600px; max-width: 100%;">
                    <![endif]-->

                  <tr>
                    <td align="center" valign="top" style="margin: 0; padding: 0;">

                      <!--[ Inner — 600px content table ]-->
                      <table bgcolor="#ffffff" border="0" cellpadding="0" cellspacing="0" width="600"
                        role="presentation"
                        style="border-spacing: 0; border-collapse: separate; padding: 0; margin: 0; max-width: 600px; width: 100%; background-color: #ffffff;">
                        <!--[------ Content start ------]-->`;

const AFTER_CONTENT = `<!--[------ Content / end ------]-->
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
</body>

</html>`;

function fontLinkHtml(fonts: DocumentFont[]): string {
  if (fonts.length === 0) return "";
  const families = fonts.map((f) => `family=${f.googleQuery.replace(/ /g, "+")}`).join("&");
  return `<link href="https://fonts.googleapis.com/css2?${families}&display=swap" rel="stylesheet">`;
}

function fontRulesCss(fonts: DocumentFont[]): string {
  return fonts
    .map((f) => {
      const fallback = f.fallback ?? "Arial, Helvetica, sans-serif";
      const rule = `[style*="${f.family}"] { font-family: "${f.family}", ${fallback}; }`;
      return `${rule}\n@media screen and (-webkit-min-device-pixel-ratio: 0) { ${rule} }`;
    })
    .join("\n\n");
}

export function assembleDocument(contentHtml: string, slots: DocumentSlots): string {
  const fonts = slots.fonts ?? [];
  const before = BEFORE_CONTENT.replace(TITLE_TOKEN, slots.title)
    .replace(FONT_LINK_TOKEN, fontLinkHtml(fonts))
    .replace(FONT_RULES_TOKEN, fontRulesCss(fonts));
  return `${before}${contentHtml}${AFTER_CONTENT}`;
}
