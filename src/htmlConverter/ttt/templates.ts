/**
 * HTML and MJML templates for TTT email generation
 *
 * Key differences from the default profile:
 *  - Body text uses <div> instead of <span>
 *  - Padding: 15px (vs 14px in default)
 *  - Signature image width: 220px (vs 200px)
 *  - Storage URL: https://terratranst.com/
 *  - Outer table uses `content-wrapper` class with 21px horizontal padding
 */

import { STORAGE_PROVIDERS_CONFIG } from "../constants";
import { config } from "../utils/config";

export const TTT_PLACEHOLDER_URL = "urlhere";

// ─── TTT specific overrides ───────────────────────────────────────────────────
const TTT_STORAGE_URL = STORAGE_PROVIDERS_CONFIG.providers.publicBaseUrl + "/";
const TTT_PADDING = "15px";
const FULL_IMAGE_WIDTH = "400";

// ─── HTML helpers ────────────────────────────────────────────────────────────

interface BlockOptions {
  align?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  paddingTop?: string;
  paddingBottom?: string;
  tag?: string;
  extraStyle?: string;
  paddingLeft?: string;
  paddingRight?: string;
}

/**
 * Creates the "break-out" HTML structure for TTT.
 * Uses <div> instead of <span> for the body text container.
 */
function createHtmlBlock(content: string, options: BlockOptions = {}): string {
  const {
    align = "left",
    fontSize = "18px",
    fontWeight = "normal",
    color = "#000000",
    paddingTop = TTT_PADDING,
    paddingBottom = TTT_PADDING,
    paddingLeft,
    paddingRight,
    tag = "div",
    extraStyle = "",
  } = options;

  const fontStyle = `font-family:${config.fontFamily};font-size:${fontSize};font-style:normal;font-weight:${fontWeight};line-height:1.5;text-align:${align};color:${color};${extraStyle}`;
  const paddingLR =
    paddingLeft || paddingRight
      ? `padding-left: ${paddingLeft || "0"}; padding-right: ${paddingRight || "0"};`
      : "";

  return `
            </div>
            </td>
        </tr>
        <tr>
            <td align="${align}" style="${fontStyle} ${paddingLR} padding-top: ${paddingTop}; padding-bottom: ${paddingBottom};">
              <${tag} style="${fontStyle}">
                ${content}
              </${tag}>
            </td>
        </tr>
        <tr>
           <td style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-top: ${TTT_PADDING}; padding-bottom: ${TTT_PADDING};">
              <div style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
    `;
}

// ─── Shared button HTML ──────────────────────────────────────────────────────

function buttonTableHtml(content: string): string {
  return `<table cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td class="creative-button" height="51" align="center" style="border-radius: 10px;font-family:${config.fontFamily};font-size:18px;font-style:normal;line-height:1.5;text-align:center;font-weight: bold; color: #FFFFFF; padding: 3px 5px; background-color: ${config.colors.button};" bgcolor="${config.colors.button}">
        <a href="${TTT_PLACEHOLDER_URL}" target="_blank" style="font-weight: bold;text-decoration:none;color:#ffffff;padding: 9px 15px;display: block;font-family:${config.fontFamily};font-size:18px;font-style:normal;line-height:1.5;text-align:center;background-color: ${config.colors.button};border-radius: 10px;">
          ${content}
        </a>
      </td>
    </tr>
  </table>`;
}

// ─── MJML helpers ────────────────────────────────────────────────────────────

interface MjmlBlockOptions {
  align?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingX?: string;
  extraStyle?: string;
}

function createMjmlBlock(content: string, options: MjmlBlockOptions = {}): string {
  const {
    align = "left",
    fontSize = "18px",
    fontWeight = "normal",
    color = "#000000",
    paddingTop = "10px",
    paddingBottom = "10px",
    paddingX = "25px",
    extraStyle = "",
  } = options;

  const fontStyle = `font-family:${config.fontFamily};font-size:${fontSize};font-style:normal;font-weight:${fontWeight};line-height:1.5;text-align:${align};color:${color};${extraStyle}`;

  return `
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="${align}" style="font-size:0px;padding:${paddingTop} ${paddingX} ${paddingBottom} ${paddingX};word-break:break-word;">
                    <div style="${fontStyle}">
                        ${content}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                    <div style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
    `;
}

// ─── HTML Templates ──────────────────────────────────────────────────────────

export const tttHtmlTemplates = {
  smallCenterText: (content: string) =>
    createHtmlBlock(content, { align: "center", fontSize: "12px" }),

  smallText: (content: string) => createHtmlBlock(content, { fontSize: "12px" }),

  centerHeadline: (content: string) =>
    createHtmlBlock(content, { align: "center", fontSize: "22px", fontWeight: "bold", tag: "b" }),

  headline: (content: string) =>
    createHtmlBlock(content, { fontSize: "22px", fontWeight: "bold", tag: "b" }),

  centerQuote: (content: string) =>
    createHtmlBlock(content, { align: "center", paddingLeft: "20px", paddingRight: "20px" }),

  quote: (content: string) =>
    createHtmlBlock(content, { paddingLeft: "20px", paddingRight: "20px" }),

  centerText: (content: string) => createHtmlBlock(content, { align: "center" }),

  button: (content: string) => `
            </div>
            </td>
        </tr>
         <tr>
            <td align="center" style="padding-top: ${TTT_PADDING}; padding-bottom: ${TTT_PADDING};">
              ${buttonTableHtml(content)}
            </td>
          </tr>
        <tr>
           <td style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-top: ${TTT_PADDING}; padding-bottom: ${TTT_PADDING};">
              <div style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
    `,

  rightSideImg: (content: string) => `
            </div>
            </td>
        </tr>
          <tr>
            <td align="left" style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-bottom: ${TTT_PADDING}; padding-top: ${TTT_PADDING};">
              <a align="right" href="${TTT_PLACEHOLDER_URL}" target="_blank" style="display: inline-block; float: right; width: 50%; max-width: 50%; margin-left: 18px; margin-bottom: 12px;">
                <img alt="Preview" height="224"
                     align="right"
                     src="${TTT_STORAGE_URL}"
                     style="border:0;display:inline-block;outline:none;text-decoration:none;height:auto;max-height: 224px;max-width: 100%; width: 100%;font-size:13px;object-fit: contain;"
                     width="250"/>
              </a>
              <div style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                ${content}
              </div>
            </td>
          </tr>
        <tr>
           <td style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-top: ${TTT_PADDING}; padding-bottom: ${TTT_PADDING};">
              <div style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
    `,

  leftSideImg: (content: string) => `
            </div>
            </td>
        </tr>
          <tr>
            <td align="left" style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-bottom: ${TTT_PADDING}; padding-top: ${TTT_PADDING};">
              <a align="left" href="${TTT_PLACEHOLDER_URL}" target="_blank" style="display: inline-block; float: left; width: 50%; max-width: 50%; margin-right: 18px; margin-bottom: 12px;">
                <img alt="Preview" height="224"
                     align="left"
                     src="${TTT_STORAGE_URL}"
                     style="border:0;display:inline-block;outline:none;text-decoration:none;height:auto;max-height: 224px;max-width: 100%; width: 100%;font-size:13px;object-fit: contain;"
                     width="250"/>
              </a>
              <div style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                ${content}
              </div>
            </td>
          </tr>
        <tr>
           <td style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-top: ${TTT_PADDING}; padding-bottom: ${TTT_PADDING};">
              <div style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
    `,

  footerBlock: (content: string) =>
    createHtmlBlock(content, { fontSize: "12px", paddingTop: "25px" }),

  footerCenterBlock: (content: string) =>
    createHtmlBlock(content, { align: "center", fontSize: "12px", paddingTop: "25px" }),

  signatureImg: (_content: string) => {
    void _content;
    return `
            </div>
            </td>
        </tr>
          <tr>
            <td class="img-bg-block" align="left" style="padding-top: ${TTT_PADDING}; padding-bottom: ${TTT_PADDING};">
               <img alt="Signature" height="auto"
                    src="${TTT_STORAGE_URL}"
                    style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:220px;max-width: 220px;font-size:13px;"
                    width="220"/>
            </td>
          </tr>
        <tr>
           <td style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-top: ${TTT_PADDING}; padding-bottom: ${TTT_PADDING};">
              <div style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
    `;
  },

  wrapImg: (_content: string) => {
    void _content;
    return `            </div>
                   </td>
               </tr>
               <tr>
                   <td class="img-bg-block" align="center" style="padding-top: ${TTT_PADDING}; padding-bottom: ${TTT_PADDING};">
                       <a href="${TTT_PLACEHOLDER_URL}" target="_blank">
                           <img alt="Video preview" height="auto"
                                src="${TTT_STORAGE_URL}"
                                style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;max-width: ${FULL_IMAGE_WIDTH}px;font-size:13px;"
                                width="${FULL_IMAGE_WIDTH}"/>
                       </a>
                   </td>
                </tr>
                <tr>
                   <td style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-top: ${TTT_PADDING}; padding-bottom: ${TTT_PADDING};">
                        <div style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">`;
  },

  /**
   * Outer full table structure for TTT.
   * Note: 21px horizontal padding matches the original TTT tool.
   */
  fullStructure: (content: string) => `
    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 100%;">
        <tr>
            <td align="center" valign="top">
                <table class="main-table" bgcolor="#FFFFFF" border="0" cellspacing="0"
                       cellpadding="0" role="presentation" width="100%" style="max-width: 600px;">
                    <tr>
                        <td class="content-wrapper" align="center" style="padding-left: 21px; padding-right: 21px;">
                            <table class="inner-content-wrapper" border="0" cellspacing="0" role="presentation"
                                   cellpadding="0" width="100%" style="width: 100%;">
                                <tr>
                                    <td height="15" width="100%" style="max-width: 100%" class="space-between-sections"></td>
                                </tr>
                                ${content}
                                <tr>
                                    <td height="15" width="100%" style="max-width: 100%" class="space-between-sections"></td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>`,
};

// ─── MJML Templates ──────────────────────────────────────────────────────────

export const tttMjmlTemplates = {
  smallCenterText: (content: string) =>
    createMjmlBlock(content, { align: "center", fontSize: "12px" }),

  smallText: (content: string) => createMjmlBlock(content, { fontSize: "12px" }),

  centerHeadline: (content: string) =>
    createMjmlBlock(content, { align: "center", fontSize: "22px", fontWeight: "bold" }),

  headline: (content: string) =>
    createMjmlBlock(content, { fontSize: "22px", fontWeight: "bold" }),

  centerQuote: (content: string) => createMjmlBlock(content, { align: "center", paddingX: "45px" }),

  quote: (content: string) => createMjmlBlock(content, { paddingX: "45px" }),

  centerText: (content: string) => createMjmlBlock(content, { align: "center" }),

  button: (content: string) => `
                     </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="font-size:0px;padding:10px 25px; word-break:break-word;">
                      ${buttonTableHtml(content)}
                    </td>
                  </tr>
                  <tr>
                    <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                      <div style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
    `,

  rightSideImg: (content: string) => `
                     </div>
                    </td>
                  </tr>
                  <tr>
                      <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                          <table class="content-inner-table" border="0" cellspacing="0" role="presentation"
                                 cellpadding="0" width="100%" style="width: 100%;">
                              <tr>
                                  <td align="left" style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-bottom: ${TTT_PADDING}; padding-top: ${TTT_PADDING};">
                                      <a align="right" href="${TTT_PLACEHOLDER_URL}" target="_blank" style="display: inline-block; float: right; width: 50%; max-width: 50%; margin-left: 18px; margin-bottom: 12px;">
                                          <img alt="Preview" height="224"
                                               align="right"
                                               src="${TTT_STORAGE_URL}"
                                               style="border:0;display:inline-block;outline:none;text-decoration:none;height:auto;max-height: 224px;max-width: 100%; width: 100%;font-size:13px;object-fit: contain;"
                                               width="250"/>
                                      </a>
                                      <div style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                                      ${content}
                                    </div>
                                  </td>
                              </tr>
                          </table>
                      </td>
                  </tr>
                  <tr>
                    <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                      <div style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
    `,

  leftSideImg: (content: string) => `
                     </div>
                    </td>
                  </tr>
                  <tr>
                      <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                          <table class="content-inner-table" border="0" cellspacing="0" role="presentation"
                                 cellpadding="0" width="100%" style="width: 100%;">
                                <tr>
                                  <td align="left" style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-bottom: ${TTT_PADDING}; padding-top: ${TTT_PADDING};">
                                    <a align="left" href="${TTT_PLACEHOLDER_URL}" target="_blank" style="display: inline-block; float: left; width: 50%; max-width: 50%; margin-right: 18px; margin-bottom: 12px;">
                                      <img alt="Preview" height="224"
                                           align="left"
                                           src="${TTT_STORAGE_URL}"
                                           style="border:0;display:inline-block;outline:none;text-decoration:none;height:auto;max-height: 224px;max-width: 100%; width: 100%;font-size:13px;object-fit: contain;"
                                           width="250"/>
                                    </a>
                                    <div style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                                      ${content}
                                    </div>
                                  </td>
                                </tr>
                          </table>
                      </td>
                  </tr>
                  <tr>
                    <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                      <div style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
    `,

  signatureImg: (_content: string) => {
    void _content;
    return `
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;">
                      <tbody>
                        <tr>
                          <td style="width:220px;">
                            <img alt="Signature" src="${TTT_STORAGE_URL}" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="220" height="auto" />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                    <div style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
    `;
  },

  footerBlock: (content: string) =>
    createMjmlBlock(content, { fontSize: "12px", paddingTop: "30px", paddingBottom: "10px" }),

  footerCenterBlock: (content: string) =>
    createMjmlBlock(content, {
      align: "center",
      fontSize: "12px",
      paddingTop: "30px",
      paddingBottom: "10px",
    }),

  wrapImg: (_content: string) => {
    void _content;
    return `       </div>
                       </td>
                     </tr>
                    <tr>
                       <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                         <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;">
                           <tbody>
                             <tr>
                               <td style="width:550px;">
                                 <a href="${TTT_PLACEHOLDER_URL}" target="_blank">
                                   <img alt="Video preview" src="${TTT_STORAGE_URL}" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="550" height="auto" />
                                 </a>
                               </td>
                             </tr>
                           </tbody>
                         </table>
                       </td>
                     </tr>
                     <tr>
                       <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                         <div style="font-family:${config.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                 `;
  },

  fullStructure: (content: string) => `
    <div style="background-color:#FFFFFF;">
    <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
        <div style="margin:0px auto;max-width:600px;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                <tbody>
                <tr>
                    <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
                        <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:top;width:600px;" ><![endif]-->
                        <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                                <tbody>
                                    ${content}
                                </tbody>
                            </table>
                        </div>
                        <!--[if mso | IE]></td></tr></table><![endif]-->
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
        <!--[if mso | IE]></td></tr></table><![endif]-->
    </div>`,
};
