/**
 * `buildSimpleTemplates(tok)` — factory replacing the three hand-forked
 * `templates.ts`/`ttt/templates.ts`/`alphaone/templates.ts` files with one
 * parameterized implementation, same pattern as `advanced/config/templates.ts`'s
 * `buildTemplates(tok)`.
 *
 * Stage 2 of /Users/mykhailovynnyk/.claude/plans/tidy-bubbling-oasis.md. Not
 * wired into any formatter yet (Stage 3) — the three original template files
 * are untouched and still what `formatter.ts`/`ttt/formatter.ts`/`alphaone/formatter.ts`
 * consume.
 *
 * Whitespace note (explicitly approved deviation, not a byte-identical
 * invariant): the three original files differ in pure indentation/line-break
 * style around identical HTML blocks — cosmetic only, since HTML whitespace
 * between tags collapses in every browser/email client and none of these
 * templates use `white-space: pre`. This factory normalizes to one
 * consistent indentation style (matching the former default-profile file,
 * since that profile has zero token overrides). This means the ttt/alphaone
 * baseline snapshots captured in Stage 0 will show whitespace-only diffs
 * once this factory is wired in during Stage 3/4 — content and structure do
 * not change, only formatting.
 */
import type { SimpleTokens } from "./tokens";

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

export type SimpleTemplateKey =
  | "smallCenterText"
  | "smallText"
  | "centerHeadline"
  | "headline"
  | "centerQuote"
  | "quote"
  | "centerText"
  | "button"
  | "rightSideImg"
  | "leftSideImg"
  | "footerBlock"
  | "footerCenterBlock"
  | "signatureImg"
  | "wrapImg"
  | "fullStructure";

export type SimpleTemplateSet = Record<SimpleTemplateKey, (content: string) => string>;

export function buildSimpleTemplates(tok: SimpleTokens): { htmlTemplates: SimpleTemplateSet; mjmlTemplates: SimpleTemplateSet } {
  function createHtmlBlock(content: string, options: BlockOptions = {}): string {
    const {
      align = "left",
      fontSize = "18px",
      fontWeight = "normal",
      color = "#000000",
      paddingTop = tok.blockPaddingV,
      paddingBottom = tok.blockPaddingV,
      paddingLeft,
      paddingRight,
      tag = tok.blockWrapTag,
      extraStyle = "",
    } = options;

    const fontStyle = `font-family:${tok.fontFamily};font-size:${fontSize};font-style:normal;font-weight:${fontWeight};line-height:1.5;text-align:${align};color:${color};${extraStyle}`;
    const paddingLR = paddingLeft || paddingRight ? `padding-left: ${paddingLeft || "0"}; padding-right: ${paddingRight || "0"};` : "";
    const bodyStyle = `font-family:${tok.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;`;

    // The "Close Previous / Open Next" pattern
    return `
            </${tok.blockWrapTag}>
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
               <td style="${bodyStyle}padding-top: ${tok.blockPaddingV}; padding-bottom: ${tok.blockPaddingV};">
                  <${tok.blockWrapTag} style="${bodyStyle}">
        `;
  }

  function buttonTableHtml(content: string): string {
    return `<table cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td class="${tok.button.className}" height="${tok.button.height}" align="center" style="border-radius: ${tok.button.radius};font-family:${tok.fontFamily};font-size:18px;font-style:normal;line-height:1.5;text-align:center;font-weight: bold; color: #FFFFFF; padding: ${tok.button.outerPadding}; background-color: ${tok.color.button};" bgcolor="${tok.color.button}">
        <a href="${tok.placeholderHref}" target="_blank" style="font-weight: bold;text-decoration:none;color:#ffffff;padding: ${tok.button.innerPadding};display: block;font-family:${tok.fontFamily};font-size:18px;font-style:normal;line-height:1.5;text-align:center;background-color: ${tok.color.button};border-radius: ${tok.button.radius};">
          ${content}
        </a>
      </td>
    </tr>
  </table>`;
  }

  function createMjmlBlock(content: string, options: MjmlBlockOptions = {}): string {
    const { align = "left", fontSize = "18px", fontWeight = "normal", color = "#000000", paddingTop = "10px", paddingBottom = "10px", paddingX = "25px", extraStyle = "" } = options;

    const fontStyle = `font-family:${tok.fontFamily};font-size:${fontSize};font-style:normal;font-weight:${fontWeight};line-height:1.5;text-align:${align};color:${color};${extraStyle}`;
    const bodyStyle = `font-family:${tok.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;`;

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
                        <div style="${bodyStyle}">
        `;
  }

  const htmlBodyStyle = `font-family:${tok.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;`;

  const htmlTemplates: SimpleTemplateSet = {
    smallCenterText: (content) => createHtmlBlock(content, { align: "center", fontSize: "12px" }),

    smallText: (content) => createHtmlBlock(content, { fontSize: "12px" }),

    centerHeadline: (content) => createHtmlBlock(content, { align: "center", fontSize: tok.headlineFontSize, fontWeight: "bold", tag: tok.headlineWrapTag }),

    headline: (content) => createHtmlBlock(content, { fontSize: tok.headlineFontSize, fontWeight: "bold", tag: tok.headlineWrapTag }),

    centerQuote: (content) => createHtmlBlock(content, { align: "center", paddingLeft: "20px", paddingRight: "20px" }),

    quote: (content) => createHtmlBlock(content, { paddingLeft: "20px", paddingRight: "20px" }),

    centerText: (content) => createHtmlBlock(content, { align: "center" }),

    button: (content) => `
            </${tok.blockWrapTag}>
                </td>
            </tr>
             <tr>
                <td align="center" style="padding-top: ${tok.blockPaddingV}; padding-bottom: ${tok.blockPaddingV};">
                  ${buttonTableHtml(content)}
                </td>
              </tr>
            <tr>
               <td style="${htmlBodyStyle}padding-top: ${tok.blockPaddingV}; padding-bottom: ${tok.blockPaddingV};">
                  <${tok.blockWrapTag} style="${htmlBodyStyle}">
        `,

    rightSideImg: (content) => `
            </${tok.blockWrapTag}>
                </td>
            </tr>
              <tr>
                <td align="left" style="${htmlBodyStyle}padding-bottom: ${tok.rightSideImgHtmlPaddingV}; padding-top: ${tok.rightSideImgHtmlPaddingV};">
                  <a align="right" href="${tok.placeholderHref}" target="_blank" style="display: inline-block; float: right; width: 50%; max-width: 50%; margin-left: 18px; margin-bottom: 12px;">
                    <img alt="Preview" height="224"
                         align="right"
                         src="${tok.storageUrl}"
                         style="border:0;display:inline-block;outline:none;text-decoration:none;height:auto;max-height: 224px;max-width: 100%; width: 100%;font-size:13px;object-fit: contain;"
                         width="250"/>
                  </a>
                  <${tok.blockWrapTag} style="${htmlBodyStyle}">
                    ${content}
                  </${tok.blockWrapTag}>
                </td>
              </tr>
            <tr>
               <td style="${htmlBodyStyle}padding-top: ${tok.blockPaddingV}; padding-bottom: ${tok.blockPaddingV};">
                  <${tok.blockWrapTag} style="${htmlBodyStyle}">
        `,

    leftSideImg: (content) => `
            </${tok.blockWrapTag}>
                </td>
            </tr>
              <tr>
                <td align="left" style="${htmlBodyStyle}padding-bottom: ${tok.blockPaddingV}; padding-top: ${tok.blockPaddingV};">
                  <a align="left" href="${tok.placeholderHref}" target="_blank" style="display: inline-block; float: left; width: 50%; max-width: 50%; margin-right: 18px; margin-bottom: 12px;">
                    <img alt="Preview" height="224"
                         align="left"
                         src="${tok.storageUrl}"
                         style="border:0;display:inline-block;outline:none;text-decoration:none;height:auto;max-height: 224px;max-width: 100%; width: 100%;font-size:13px;object-fit: contain;"
                         width="250"/>
                  </a>
                  <${tok.blockWrapTag} style="${htmlBodyStyle}">
                    ${content}
                  </${tok.blockWrapTag}>
                </td>
              </tr>
            <tr>
               <td style="${htmlBodyStyle}padding-top: ${tok.blockPaddingV}; padding-bottom: ${tok.blockPaddingV};">
                  <${tok.blockWrapTag} style="${htmlBodyStyle}">
        `,

    footerBlock: (content) => createHtmlBlock(content, { fontSize: "12px", paddingTop: tok.footerPaddingTopHtml, paddingBottom: tok.footerPaddingBottomHtml }),

    footerCenterBlock: (content) => createHtmlBlock(content, { align: "center", fontSize: "12px", paddingTop: tok.footerPaddingTopHtml, paddingBottom: tok.footerPaddingBottomHtml }),

    signatureImg: (_content) => {
      void _content;
      return `
            </${tok.blockWrapTag}>
                </td>
            </tr>
              <tr>
                <td class="${tok.signature.className}" align="left" style="padding-top: ${tok.blockPaddingV}; padding-bottom: ${tok.blockPaddingV};">
                  <img alt="Signature" height="auto"
                       src="${tok.storageUrl}"
                       style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:${tok.signature.widthHtml}px;max-width: ${tok.signature.maxWidthHtml};font-size:13px;"
                       width="${tok.signature.widthHtml}"/>
                </td>
              </tr>
            <tr>
               <td style="${htmlBodyStyle}padding-top: ${tok.blockPaddingV}; padding-bottom: ${tok.blockPaddingV};">
                  <${tok.blockWrapTag} style="${htmlBodyStyle}">
        `;
    },

    wrapImg: (_content) => {
      void _content;
      return `            </${tok.blockWrapTag}>
                       </td>
                   </tr>
                   <tr>
                       <td class="${tok.wrapImg.className}" align="center" style="padding-top: ${tok.blockPaddingV}; padding-bottom: ${tok.blockPaddingV};">
                           <a href="${tok.placeholderHref}" target="_blank">
                               <img alt="Video preview" height="auto"
                                    src="${tok.storageUrl}"
                                    style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;max-width: ${tok.wrapImg.widthHtml}px;font-size:${tok.wrapImg.fontSizeHtml};"
                                    width="${tok.wrapImg.widthHtml}"/>
                           </a>
                       </td>
                    </tr>
                    <tr>
                       <td style="${htmlBodyStyle}padding-top: ${tok.blockPaddingV}; padding-bottom: ${tok.blockPaddingV};">
                            <${tok.blockWrapTag} style="${htmlBodyStyle}">`;
    },

    // Attribute order on the middle <table> (`cellspacing`/`cellpadding`) is tokenized —
    // see Tokens["fullStructure"]["cellPaddingFirst"] — since default/ttt's own scripts
    // write `cellspacing` first while alphaone/red's write `cellpadding` first, and
    // profiles capture the source's exact byte order, not just its rendered output (HTML
    // attribute order itself has no visual/semantic effect either way).
    fullStructure: (content) => {
      const fs = tok.fullStructure;
      const spacerRow = fs.spacer.hasRows ? `<tr>\n                                    <td height="${fs.spacer.heightPx}" width="100%" style="max-width: 100%" class="${fs.spacer.className}"></td>\n                                </tr>` : "";
      const contentPadding = fs.spacer.hasRows
        ? `padding-left: ${fs.sidePaddingH}; padding-right: ${fs.sidePaddingH};`
        : `padding-top: ${fs.spacer.verticalPaddingV}; padding-left: ${fs.sidePaddingH}; padding-bottom: ${fs.spacer.verticalPaddingV}; padding-right: ${fs.sidePaddingH};`;
      const cellAttrs = fs.cellPaddingFirst ? `cellpadding="0" cellspacing="0"` : `cellspacing="0" cellpadding="0"`;

      return `
    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 100%;">
        <tr>
            <td align="center" valign="top">
                <table class="${fs.tableClassName}" bgcolor="#FFFFFF" border="0" ${cellAttrs} role="presentation" width="100%" style="max-width: 600px;">
                    <tr>
                        <td class="${fs.contentClassName}" align="center" style="${contentPadding}">
                            <table class="${fs.innerTableClassName}" border="0" cellspacing="0" role="presentation"
                                   cellpadding="0" width="100%" style="width: 100%;">
                                ${spacerRow}
                                ${content}
                                ${spacerRow}
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>`;
    },
  };

  const mjmlTemplates: SimpleTemplateSet = {
    smallCenterText: (content) => createMjmlBlock(content, { align: "center", fontSize: "12px" }),

    smallText: (content) => createMjmlBlock(content, { fontSize: "12px" }),

    centerHeadline: (content) => createMjmlBlock(content, { align: "center", fontSize: tok.headlineFontSize, fontWeight: "bold" }),

    headline: (content) => createMjmlBlock(content, { fontSize: tok.headlineFontSize, fontWeight: "bold" }),

    centerQuote: (content) => createMjmlBlock(content, { align: "center", paddingX: "45px" }),

    quote: (content) => createMjmlBlock(content, { paddingX: "45px" }),

    centerText: (content) => createMjmlBlock(content, { align: "center" }),

    button: (content) => `
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
                        <div style="${htmlBodyStyle}">
        `,

    rightSideImg: (content) => `
                       </div>
                      </td>
                    </tr>
                    <tr>
                        <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                            <table class="content-inner-table" border="0" cellspacing="0" role="presentation"
                                   cellpadding="0" width="100%" style="width: 100%;">
                                <tr>
                                    <td align="left" style="${htmlBodyStyle}padding-bottom: ${tok.blockPaddingV}; padding-top: ${tok.blockPaddingV};">
                                        <a align="right" href="${tok.placeholderHref}" target="_blank" style="display: inline-block; float: right; width: 50%; max-width: 50%; margin-left: 18px; margin-bottom: 12px;">
                                            <img alt="Preview" height="224"
                                                 align="right"
                                                 src="${tok.storageUrl}"
                                                 style="border:0;display:inline-block;outline:none;text-decoration:none;height:auto;max-height: 224px;max-width: 100%; width: 100%;font-size:13px;object-fit: contain;"
                                                 width="250"/>
                                        </a>
                                        <${tok.blockWrapTag} style="${htmlBodyStyle}">
                                        ${content}
                                      </${tok.blockWrapTag}>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                      <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                        <div style="${htmlBodyStyle}">
        `,

    leftSideImg: (content) => `
                       </div>
                      </td>
                    </tr>
                    <tr>
                        <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                            <table class="content-inner-table" border="0" cellspacing="0" role="presentation"
                                   cellpadding="0" width="100%" style="width: 100%;">
                                      <tr>
                                        <td align="left" style="${htmlBodyStyle}padding-bottom: ${tok.blockPaddingV}; padding-top: ${tok.blockPaddingV};">
                                          <a align="left" href="${tok.placeholderHref}" target="_blank" style="display: inline-block; float: left; width: 50%; max-width: 50%; margin-right: 18px; margin-bottom: 12px;">
                                            <img alt="Preview" height="224"
                                                 align="left"
                                                 src="${tok.storageUrl}"
                                                 style="border:0;display:inline-block;outline:none;text-decoration:none;height:auto;max-height: 224px;max-width: 100%; width: 100%;font-size:13px;object-fit: contain;"
                                                 width="250"/>
                                          </a>
                                          <${tok.blockWrapTag} style="${htmlBodyStyle}">
                                            ${content}
                                          </${tok.blockWrapTag}>
                                        </td>
                                      </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                      <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                        <div style="${htmlBodyStyle}">
        `,

    footerBlock: (content) => createMjmlBlock(content, { fontSize: "12px", paddingTop: "30px", paddingBottom: "10px" }),

    footerCenterBlock: (content) => createMjmlBlock(content, { align: "center", fontSize: "12px", paddingTop: "30px", paddingBottom: "10px" }),

    signatureImg: (_content) => {
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
                              <td style="width:${tok.signature.widthMjml}px;">
                                <img alt="Signature" src="${tok.storageUrl}" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="${tok.signature.widthMjml}" height="auto" />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                        <div style="${htmlBodyStyle}">
        `;
    },

    wrapImg: (_content) => {
      void _content;
      return `       </div>
                       </td>
                     </tr>
                    <tr>
                       <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                         <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;">
                           <tbody>
                             <tr>
                               <td style="width:${tok.wrapImg.widthMjml}px;">
                                 <a href="${tok.placeholderHref}" target="_blank">
                                   <img alt="Video preview" src="${tok.storageUrl}" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="${tok.wrapImg.widthMjml}" height="auto" />
                                 </a>
                               </td>
                             </tr>
                           </tbody>
                         </table>
                       </td>
                     </tr>
                     <tr>
                       <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                         <div style="${htmlBodyStyle}">
                 `;
    },

    // Identical across all three original forks — not tokenized.
    fullStructure: (content) => `
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

  return { htmlTemplates, mjmlTemplates };
}
