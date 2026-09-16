import{o as e}from"./rolldown-runtime-DAXXjFlN.js";import{n as t,t as n}from"./jsx-runtime-BhgoufuK.js";import{t as r}from"./logger-BJWAVfa2.js";import{n as i,t as a}from"./api-Dftz51Kh.js";import{t as o}from"./input-BBsitEGu.js";import{a as s,c,d as l,i as u,n as d,o as f,r as p,s as m,t as h,u as g}from"./types-DmEdKO2H.js";var _=e(t());function v(e,t,n){t&&(e.has(t)||e.set(t,new Set),e.get(t).add(n??400))}function y(e,t){v(t,e.defaultStyle.fontFamily,e.defaultStyle.fontWeight),e.runs.forEach(n=>v(t,n.fontFamily??e.defaultStyle.fontFamily,n.fontWeight??e.defaultStyle.fontWeight))}function b(e,t){v(t,e.fontFamily,e.fontWeight)}function x(e,t){e.cards.forEach(e=>{y(e.title,t),y(e.secondary,t)})}function S(e,t){switch(e.type){case`frame`:e.children.forEach(e=>S(e,t));break;case`text`:y(e,t);break;case`button`:b(e,t);break;case`buttonRow`:e.buttons.forEach(e=>b(e,t));break;case`row`:e.columns.forEach(e=>e.children.forEach(e=>S(e,t)));break;case`cardList`:x(e,t);break;default:break}}function C(e){let t=new Map;return e.forEach(e=>S(e,t)),Array.from(t.entries()).map(([e,t])=>({family:e,googleQuery:`${e}:wght@${Array.from(t).sort((e,t)=>e-t).join(`;`)}`}))}var w=`__FIGMA_IMPORT_TITLE__`,T=`__FIGMA_IMPORT_FONT_LINK__`,E=`__FIGMA_IMPORT_FONT_RULES__`,D=`__FIGMA_IMPORT_RESPONSIVE_UTILITY_CSS__`,ee=`    @media screen and (max-width: 602px) {
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

      .footer-button-pad {
        padding-right: 0 !important;
        padding-left: 0 !important;
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
    }`,te=`<!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office" lang="en" dir="ltr">

<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${w}</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  ${T}

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

    ${E}

    ${D}
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
  <div lang="en"
    dir="ltr">
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
                        <!--[------ Content start ------]-->`,O=`<!--[------ Content / end ------]-->
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

</html>`;function k(e){return e.length===0?``:`<link href="https://fonts.googleapis.com/css2?${e.map(e=>`family=${e.googleQuery.replace(/ /g,`+`)}`).join(`&`)}&display=swap" rel="stylesheet">`}function ne(e){return e.map(e=>{let t=e.fallback??`Arial, Helvetica, sans-serif`,n=`[style*="${e.family}"] { font-family: "${e.family}", ${t}; }`;return`${n}\n@media screen and (-webkit-min-device-pixel-ratio: 0) { ${n} }`}).join(`

`)}function re(e,t){let n=t.fonts??[];return`${te.replace(w,t.title).replace(T,k(n)).replace(E,ne(n)).replace(D,ee)}${e}${O}`}function ie(e,t){let n=t.fonts??[],r=[`.footer-button { display: block !important; width: 100% !important; max-width: 100% !important; min-width: 100% !important; }`,`.footer-button-pad { padding-right: 0 !important; padding-left: 0 !important; }`,`.spacer-hide { display: none !important; }`,`.no-radius { border-radius: 0 !important; }`],i=Array.from(t.cssRules.values()),a=i.length===0?``:`@media screen and (max-width: 602px) {\n      ${r.concat(i).join(`
      `)}\n    }`;return`${te.replace(w,t.title).replace(T,k(n)).replace(E,ne(n)).replace(D,a)}${e}${O}`}function A(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function j(e){return A(e)}function ae(e){switch(e.kind){case`solid`:return`background-color: ${e.color};`;case`linearGradient`:{let t=e.stops.map(e=>`${e.color} ${e.position*100}%`).join(`, `);return`background: linear-gradient(${e.angleDeg}deg, ${t});`}case`radialGradient`:return`background: radial-gradient(${e.stops.map(e=>`${e.color} ${e.position*100}%`).join(`, `)});`}}function M(e){return typeof e==`number`?`border-radius: ${e}px;`:`border-radius: ${e.topLeft??0}px ${e.topRight??0}px ${e.bottomRight??0}px ${e.bottomLeft??0}px;`}function N(e){return`${e.widthPx}px ${e.style??`solid`} ${e.color}`}function oe(e){let t=[];return e.top&&t.push(`border-top: ${N(e.top)};`),e.right&&t.push(`border-right: ${N(e.right)};`),e.bottom&&t.push(`border-bottom: ${N(e.bottom)};`),e.left&&t.push(`border-left: ${N(e.left)};`),t.join(` `)}function se(e){return`box-shadow: ${e.xPx}px ${e.yPx}px ${e.blurPx}px ${e.color};`}function P(e){return!e||e.kind!==`solid`?``:` bgcolor="${e.color}"`}function F(e,t){return!e||t===``?t:`\n<!-- ${e} -->\n${t}\n<!-- ${e} end -->\n`}var I=`https://storage.5th-elementagency.com/placeholder.png`,ce=10,le=8,ue=10;function de(e){let t=e.textColor??`#000000`,n=e.background===void 0?``:` background-color: ${e.background};`,r=e.border?` border: ${e.border.widthPx}px ${e.border.style??`solid`} ${e.border.color};`:``,i=e.cornerRadius===void 0?``:` ${M(e.cornerRadius)}`,a=e.textTransform&&e.textTransform!==`none`?` text-transform: ${e.textTransform};`:``,o=`color: ${t}; text-align: center; font-family: '${e.fontFamily}', sans-serif; font-size: ${e.fontSizePx}px; font-weight: ${e.fontWeight}; line-height: ${e.lineHeight};${a}`;return`<td class="footer-button" width="${e.widthPx}" style="margin: 0; padding: 0; display: inline-block; vertical-align: top; font-size: 0; width: ${e.widthPx}px;"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; min-width: 100%;"><tr><td class="footer-button-pad" style="margin: 0; padding-right: ${ce}px; padding-bottom: ${le}px; padding-left: ${ue}px;"><table border="0"${P(e.background===void 0?void 0:{kind:`solid`,color:e.background})} cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 0; border-spacing: 0; border-collapse: separate; min-width: 100%;${i}${n}${r}"><tr><td height="${e.targetHeightPx}" align="center" style="margin: 0; padding: 0; ${o}"><a href="${j(e.href)}" style="${o} text-decoration: none; display: block; padding-top: ${e.paddingTopPx}px; padding-bottom: ${e.paddingBottomPx}px; padding-right: ${e.paddingRightPx}px; padding-left: ${e.paddingLeftPx}px;">${A(e.label)}</a></td></tr></table></td></tr></table></td>`}function fe(e,t=0){return`<tr><td style="margin: 0; padding: 0;${t?` padding-bottom: ${t}px;`:``}"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; min-width: 100%; font-size: 0; text-align: center;"><tr>${e}</tr></table></td></tr>`}function pe(e){return`<img alt="${j(e.altDescription)}" height="${e.heightPx}" width="${e.widthPx}" src="${I}" style="border: 0 none; margin: 0; padding: 0; width: ${e.widthPx}px; height: ${e.heightPx}px; object-fit: contain; object-position: center; font-size: 0" />`}function me(e){let t=e.widthPx+e.gapPx*2;return`<!--[if !mso 9]><!--><span style="display: table-cell; vertical-align: middle; text-align: left; width: ${t}px; min-width: ${t}px; padding-right: ${e.gapPx}px; padding-left: ${e.gapPx}px;">`+pe(e)+`</span><!--<![endif]-->`}function he(e){let t=e.background!==void 0,n=t?` bgcolor="${j(e.background)}"`:``,r=t?` background-color: ${e.background};`:``,i=e.border?` border: ${e.border.widthPx}px ${e.border.style??`solid`} ${e.border.color};`:``,a=e.cornerRadius===void 0?``:` ${M(e.cornerRadius)}`;return`class="button" border="0"${n} cellpadding="0" cellspacing="0" width="${e.widthPx}" style="margin: 0; padding: 0; border-spacing: 0; border-collapse: separate; max-width: ${e.widthPx}px; width: 100%;${a}${r}${i}"`}function ge(e,t){let n=e.textColor??`#000000`,r=e.textTransform&&e.textTransform!==`none`?` text-transform: ${e.textTransform};`:``,i=`color: ${n}; font-size: ${e.fontSizePx}px; font-weight: ${e.fontWeight}; line-height: normal; font-family: '${e.fontFamily}', Arial, Helvetica, sans-serif; text-decoration: none; display: block;`,a=`<span style="display: table-cell; vertical-align: middle; color: ${n}; text-align: center; font-size: ${e.fontSizePx}px; font-weight: ${e.fontWeight}; line-height: normal; text-decoration: none; font-family: '${e.fontFamily}', Arial, Helvetica, sans-serif; padding-left: ${e.paddingLeftPx}px; padding-right: ${e.paddingRightPx}px; padding-top: ${e.paddingTopPx}px; padding-bottom: ${e.paddingBottomPx}px;${r}">${A(e.label)}</span>`,o=me(t),s=t.side===`left`?o+a:a+o;return`<table ${he(e)}><tr><td align="center" height="${e.targetHeightPx}" style="margin: 0; padding: 0; color: ${n}; font-size: ${e.fontSizePx}px; font-weight: ${e.fontWeight}; line-height: normal; font-family: '${e.fontFamily}', Arial, Helvetica, sans-serif; text-decoration: none;"><a href="${j(e.href)}" target="_blank" style="${i}"><span style="display: table">${s}</span></a></td></tr></table>`}function _e(e,t=0){return e.icon?`<tr><td style="margin: 0; padding: 0;${t?` padding-bottom: ${t}px;`:``}">${ge(e,e.icon)}</td></tr>`:fe(de(e),t)}function ve(e,t=0){return fe(e.buttons.map(e=>de(e)).join(``),t)}function ye(e){return`font-family: '${e}', Arial, Helvetica, sans-serif;`}function be(e){let t=[];return e.fontFamily!==void 0&&t.push(ye(e.fontFamily)),e.fontSizePx!==void 0&&t.push(`font-size: ${e.fontSizePx}px;`),t.push(`font-style: ${e.italic?`italic`:`normal`};`),t.push(`font-weight: ${e.fontWeight??`normal`};`),e.letterSpacing!==void 0&&t.push(`letter-spacing: ${e.letterSpacing}px;`),e.lineHeight!==void 0&&t.push(`line-height: ${e.lineHeight};`),e.color!==void 0&&t.push(`color: ${e.color};`),e.underline&&t.push(`text-decoration: underline;`),e.textTransform!==void 0&&e.textTransform!==`none`&&t.push(`text-transform: ${e.textTransform};`),t.join(` `)}function xe(e,t,n){let r=[t.fontFamily===void 0?``:ye(t.fontFamily),`text-decoration: ${t.underline?`underline`:`none`};`,t.fontWeight===void 0?``:`font-weight: ${t.fontWeight};`,t.color===void 0?`color: inherit;`:`color: ${t.color};`].filter(Boolean).join(` `);return`<a href="${j(e)}" style="${r}">${A(n)}</a>`}function Se(e,t){let{text:n,href:r,...i}=e,a={...t,...i},o=r??t.href;return o?xe(o,a,n):`<span style="${be(a)}">${A(n)}</span>`}function Ce(e,t=0,n){let r=` text-align: ${e.align??`left`};`,i=e.defaultStyle.lineHeight??`normal`,a=be({...e.defaultStyle,lineHeight:void 0}),o=e.padding.bottom+t,s=`${a}${r} line-height: ${i}; ${[e.padding.top?`padding-top: ${e.padding.top}px;`:``,o?`padding-bottom: ${o}px;`:``].filter(Boolean).join(` `)}`;return`<tr><td${n?` class="${n}"`:``} style="${s}">${e.runs.map(t=>Se(t,e.defaultStyle)).join(``)}</td></tr>`}function we(e,t){let n=e.padding.bottom+t;return[e.padding.top?`padding-top: ${e.padding.top}px;`:``,e.padding.right?`padding-right: ${e.padding.right}px;`:``,n?`padding-bottom: ${n}px;`:``,e.padding.left?`padding-left: ${e.padding.left}px;`:``].filter(Boolean).join(` `)}function Te(e,t){let n=`<tr><td style="${we(e,t)} margin: 0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">${Ce(e.title)}${Ce(e.secondary)}</table></td></tr>`;return F(e.name,n)}function Ee(e,t=0){let n=e.cards.length-1;return e.cards.map((r,i)=>Te(r,i===n?t:e.gap??0)).join(``)}function De(e){return`<table align="center" border="0" cellspacing="0" cellpadding="0" width="100%" role="presentation" style="width: 100%; max-width: 100%; padding: 0; margin: 0;"><tr><td height="1" style="padding-top: 1px; height: 1px; border-bottom: ${e.thicknessPx??1}px solid ${e.color};"></td></tr></table>`}function Oe(e){return`<td width="45%" valign="middle" style="margin: 0; padding: 0; width: 45%;"><table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="width: 100%;"><tr><td height="1" style="margin: 0; height: 1px; padding-top: 1px; border-bottom: ${e.lineThicknessPx??1}px solid ${e.lineColor};"></td></tr></table></td>`}function ke(e){let t=`<img alt="${j(e.iconAltDescription)}" width="${e.iconWidthPx}" src="${I}" style="border: 0; margin: 0; padding: 0; width: ${e.iconWidthPx}px; max-width: ${e.iconWidthPx}px; height: auto; display: block; object-fit: contain; object-position: center; font-size: 0;" />`;return`<table border="0" cellpadding="0" cellspacing="0" width="${e.widthPx}" role="presentation" style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; width: 100%; max-width: ${e.widthPx}px;"><tr>`+Oe(e)+`<td align="center" valign="middle" style="margin: 0; padding-right: ${e.iconGapPx}px; padding-left: ${e.iconGapPx}px;">${t}</td>`+Oe(e)+`</tr></table>`}function Ae(e){let t=`<img width="${e.widthPx}" src="${I}" alt="${j(e.altDescription)}" style="display: block; margin: 0; padding: 0; border: 0; width: 100%; max-width: ${e.widthPx}px; height: auto; object-position: center; object-fit: contain;" />`;return e.href?`<a href="${j(e.href)}" target="_blank" style="padding: 0; margin: 0; border: 0; text-decoration: none; display: block;">`+t+`</a>`:t}function je(e,t=0,n){let r=e.widthMode??`fluid`,i=e.align??`center`,a=r===`fluid`?`width:100%;max-width: ${e.widthPx}px;`:`width: ${e.widthPx}px; max-width: ${e.widthPx}px;`,o=r===`fixed`&&e.aspectRatio?Math.round(e.widthPx/e.aspectRatio):void 0,s=o??`auto`,c=o?`height: ${o}px;`:`height:auto;`,l=!o&&e.aspectRatio?`aspect-ratio: ${e.aspectRatio};`:``,u=`<img alt="${j(e.altDescription)}" height="${s}" src="${I}" style="border:0;display:block;outline:none;text-decoration:none;${c}${a}${l}font-size:13px;" width="${e.widthPx}" />`,d=e.href?`<a href="${j(e.href)}" target="_blank">${u}</a>`:u,f=e.padding.bottom+t,p=[e.padding.top?`padding-top: ${e.padding.top}px;`:``,f?`padding-bottom: ${f}px;`:``].filter(Boolean).join(` `);return`<tr><td align="${i}"${n?` class="${n}"`:``}${p?` style="${p}"`:``}>${d}</td></tr>`}function Me(){return`
  <!--=== PROMO-COPY ===-->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 100%;">
    <tr>
      <td align="center" valign="top">
        <table class="primary-table-limit content-table" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="max-width: 600px;">
          <tr>
            <td class="content-vertical-space" align="center" style="padding-left: 20px; padding-right: 20px;">
              <table class="content-inner-table" border="0" cellspacing="0" role="presentation" cellpadding="0" width="100%" style="width: 100%;">
                <tr>
                  <td height="16" width="100%" style="max-width: 100%" class="md-horizontal-space"></td>
                </tr>
                <tr>
                  <td align="left" style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:24px;font-style:normal;font-weight:bold;line-height:1.5;text-align:left;color:#000000;padding-top: 14px; padding-bottom: 14px;">
                    <strong style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:24px;font-style:normal;font-weight:bold;line-height:1.5;text-align:left;color:#000000; text-transform: uppercase;">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. </strong>
                  </td>
                </tr>
                <tr>
                  <td style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-top: 14px; padding-bottom: 14px;">
                    <span style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Arcu, vitae
                      ullamcorper interdum nulla nulla volutpat massa. Faucibus tellus, eu,
                      adipiscing rutrum mattis magna sollicitudin lectus pellentesque. Nec
                      ipsum ornare suspendisse lectus. Viverra nulla mattis quis nascetur
                      donec neque, vulputate eget quam. Facilisis diam vitae, cursus egestas
                      diam amet sagittis nibh nec. <br><br> Massa, id vitae sem tellus.
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-top: 14px; padding-bottom: 14px;">
                    <span style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                      Aliquam et facilisi libero tellus tellus neque blandit. Orci at dolor
                      <blockquote><em>&quot;Non
                          pulvinar ullamcorper diam massa. Senectus congue mi, aliquam
                          scelerisque ac, mauris, adipiscing tristique.&quot;</em></blockquote>
                      nulla nam. Commodo dignissim luctus fringilla lacus, pulvinar. Non
                      pulvinar ullamcorper diam massa. Senectus congue mi, aliquam
                      scelerisque ac, mauris, adipiscing tristique. <br><br> Rutrum
                      vestibulum hendrerit a vitae nisi eleifend vitae. In pharetra lobortis
                      semper enim.
                    </span>
                  </td>
                </tr>
                <tr>
                  <td height="16" width="100%" style="max-width: 100%" class="md-horizontal-space"></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <!--=== PROMO-COPY-end ===-->
`}var Ne=560;function Pe(e,t,n=`sm-w-full`,r=``){return`<td valign="top" align="center" class="${n}" width="${e}%" style="${`display: inline-block; width: ${e}%; max-width: 100%; min-width: ${Math.round(Ne*e/100)}px; font-size: 0; line-height: 0; mso-line-height-rule: exactly;${r?` ${r}`:``}`}"><table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="width: 100%;">${t}</table></td>`}function Fe(e,t){let n=Ke(e.children,t);return Pe(e.widthPercent,n)}function Ie(e,t=0){return`<tr><td align="center"${t?` style="padding-bottom: ${t}px;"`:``}><table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="width: 100%; min-width: 100%; font-size: 0; line-height: 0; mso-line-height-rule: exactly; text-align: center;"><tr>${e}</tr></table></td></tr>`}function Le(e,t,n=0){return Ie(e.columns.map(e=>Fe(e,t)).join(``),n)}function Re(e,t=0){let n=t?` padding-bottom: ${t}px;`:``;return`<tr><td class="spacer-hide" height="${e.heightPx}" style="margin: 0; padding: 0; height: ${e.heightPx}px; line-height: ${e.heightPx}px; font-size: 0;${n}"></td></tr>`}var ze=new Set([`frame`,`text`,`image`,`button`,`buttonRow`,`row`,`cardList`,`spacer`]);function L(e){return ze.has(e)}function Be(e){return e===void 0||e===`fill`?`100%`:e===`hug`?`auto`:`${e}`}function R(e){return typeof e==`number`?`width: 100%; max-width: ${e}px;`:e===`hug`?``:`width: 100%;`}function Ve(e){let t=e.cornerRadius!==void 0,n=[R(e.width)];return e.fill&&n.push(ae(e.fill)),e.border&&n.push(oe(e.border)),t&&n.push(M(e.cornerRadius)),e.shadow&&n.push(se(e.shadow)),n.filter(Boolean).join(` `)}function He(e,t){let n=e.padding.bottom+t;return[e.padding.top?`padding-top: ${e.padding.top}px;`:``,e.padding.right?`padding-right: ${e.padding.right}px;`:``,n?`padding-bottom: ${n}px;`:``,e.padding.left?`padding-left: ${e.padding.left}px;`:``].filter(Boolean).join(` `)}function Ue(e,t){return!e.visibility||e.visibility===`both`?!0:e.visibility===(t===`desktop`?`desktopOnly`:`mobileOnly`)}function We(e,t){return e.filter(e=>Ue(e,t))}function Ge(e,t,n){let r=We(e,t),i=r.length-1;return r.map((e,r)=>{let a=n&&r!==i?n:0;if(L(e.type))return z(e,t,a);let o=z(e,t);return`<tr><td${a?` style="padding-bottom: ${a}px;"`:``}>${o}</td></tr>`}).join(``)}function Ke(e,t,n){return Ge(e,t,n)}function qe(e,t){return L(e.type)?`<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="${e.type===`frame`&&e.width===`hug`?`auto`:`100%`}">${t}</table>`:t}function Je(e,t,n,r){let i=We(e,t),a=i.length-1,o=r===`spaceBetween`&&a>0;return`<tr>${i.map((e,r)=>{let i=r===a,s=n&&!i?`padding-right: ${n}px;`:``,c=qe(e,z(e,t));return o&&i?`<td align="right" style="${s}"><table role="presentation" border="0" cellpadding="0" cellspacing="0" align="right" style="padding: 0; margin: 0;"><tr><td>${c}</td></tr></table></td>`:`<td style="${s}">${c}</td>`}).join(``)}</tr>`}function Ye(e,t,n,r){let i=Be(e.width),a=e.direction===`column`?Ge(e.children,t,e.gap):Je(e.children,t,e.gap,e.justify),o=`${He(e,n)} margin: 0; ${Ve(e)}`.trim();return`<tr><td align="center"${r?` class="${r}"`:``}${P(e.fill)} style="${o}"><table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" width="${i}" style="border-collapse: collapse; padding: 0; margin: 0; ${R(e.width)}">${a}</table></td></tr>`}function Xe(e,t,n,r){switch(e.type){case`frame`:return Ye(e,t,n,r);case`text`:return Ce(e,n,r);case`image`:return je(e,n,r);case`spacer`:return Re(e,n);case`button`:return _e(e,n);case`buttonRow`:return ve(e,n);case`row`:return Le(e,t,n);case`divider`:return De(e);case`dividerLogo`:return ke(e);case`headerImage`:return Ae(e);case`promoCopy`:return Me();case`cardList`:return Ee(e,n)}}function z(e,t,n=0,r){if(!Ue(e,t))return``;let i=Xe(e,t,n,r);return e.type===`promoCopy`?i:F(e.name,i)}function B(e,t){return e.map(e=>({node:e,html:z(e,t)})).filter(({html:e})=>e!==``).map(({node:e,html:t})=>L(e.type)?t:`<tr><td style="margin: 0; padding: 0;">${t}</td></tr>`).join(``)}var Ze={base:{maxWidthPx:602,prefix:``},sm:{maxWidthPx:464,prefix:`sm-`},xs:{maxWidthPx:380,prefix:`xs-`}},Qe={base:{pt:[0,4,8,12,16,20,24,32,40,48],pb:[0,4,8,12,16,20,24,32,40,48,64],pl:[0,8,16,24],pr:[0,8,16,24],px:[0,8,12,16,20,24],py:[0,8,16,24,32,40]},sm:{pt:[0,4,8,12,16,20,24,32],pb:[0,4,8,12,16,20,24,32,40],pl:[0,8,16],pr:[0,8,16],px:[0,8,16,20],py:[0,8,16,24,32]},xs:{pt:[0,4,8,12,16,24],pb:[0,4,8,12,16,24,32],pl:[0,8],pr:[0,8],px:[0,8,12],py:[0,8,16,24]}},$e={pt:`padding-top`,pb:`padding-bottom`,pl:`padding-left`,pr:`padding-right`,px:`padding-left/padding-right`,py:`padding-top/padding-bottom`},et={full:`w-full`,half:`w-half`,third:`w-third`,twoThirds:`w-two-thirds`,auto:`w-auto`},tt={base:[`full`,`half`,`third`,`twoThirds`,`auto`],sm:[`full`,`half`,`auto`],xs:[`full`,`auto`]},nt={base:[{name:`xs`,px:12},{name:`sm`,px:14},{name:`base`,px:16},{name:`lg`,px:18},{name:`xl`,px:20},{name:`2xl`,px:24},{name:`3xl`,px:28},{name:`4xl`,px:32}],sm:[{name:`xs`,px:12},{name:`sm`,px:14},{name:`base`,px:16},{name:`lg`,px:18},{name:`xl`,px:20},{name:`2xl`,px:24},{name:`3xl`,px:28}],xs:[{name:`xs`,px:11},{name:`sm`,px:13},{name:`base`,px:15},{name:`lg`,px:17},{name:`xl`,px:20},{name:`2xl`,px:22}]},rt={base:[{name:`tight`,value:1.2},{name:`snug`,value:1.35},{name:`normal`,value:1.5},{name:`relaxed`,value:1.75}],sm:[{name:`tight`,value:1.2},{name:`normal`,value:1.5}],xs:[{name:`tight`,value:1.2},{name:`normal`,value:1.5}]},it={base:[`left`,`center`,`right`],sm:[`left`,`center`,`right`],xs:[`left`,`center`]},at={base:[`block`,`hidden`,`inline-block`,`table`,`table-cell`],sm:[`block`,`hidden`,`inline-block`],xs:[`block`,`hidden`,`inline-block`]},ot={block:`block`,hidden:`none`,"inline-block":`inline-block`,table:`table`,"table-cell":`table-cell`},st={noRadius:`no-radius`,noShadow:`no-shadow`,noBorder:`no-border`,imgFull:`img-full`,bgTransparent:`bg-transparent`,floatNone:`float-none`,heightAuto:`h-auto`},ct={noRadius:`border-radius: 0`,noShadow:`box-shadow: none`,noBorder:`border: none`,imgFull:`width: 100%; height: auto; max-width: 100%`,bgTransparent:`background-color: transparent`,floatNone:`float: none`,heightAuto:`height: auto`},lt={base:[`noShadow`,`noBorder`,`imgFull`,`bgTransparent`,`floatNone`,`heightAuto`],sm:[`noRadius`,`noShadow`,`imgFull`,`bgTransparent`,`floatNone`,`heightAuto`],xs:[`noRadius`,`imgFull`,`bgTransparent`,`heightAuto`]};function V(e,t){return`${Ze[e].prefix}${t}`}function H(e,t){return`.${e} { ${t} !important; }`}function U(e,t,n){let r=Qe[e][t],i=V(e,`${t}-${n}`);return{className:i,cssRule:H(i,t===`px`?`padding-left: ${n}px; padding-right: ${n}px`:t===`py`?`padding-top: ${n}px; padding-bottom: ${n}px`:`${$e[t]}: ${n}px`),isNew:!r.includes(n)}}function ut(e,t){if(!tt[e].includes(t))return;let n=V(e,et[t]);return{className:n,cssRule:H(n,{full:`width: 100%; max-width: 100%; min-width: 100%`,half:`width: 50%`,third:`width: 33.33%`,twoThirds:`width: 66.66%`,auto:`width: auto`}[t]),isNew:!1}}function dt(e,t){let n=nt[e].find(e=>e.px===t);if(n){let r=V(e,`text-${n.name}`);return{className:r,cssRule:H(r,`font-size: ${t}px`),isNew:!1}}let r=V(e,`text-${t}px`);return{className:r,cssRule:H(r,`font-size: ${t}px`),isNew:!0}}function ft(e,t){let n=rt[e].find(e=>e.value===t);if(n){let r=V(e,`leading-${n.name}`);return{className:r,cssRule:H(r,`line-height: ${t}`),isNew:!1}}let r=V(e,`leading-${String(t).replace(`.`,`_`)}`);return{className:r,cssRule:H(r,`line-height: ${t}`),isNew:!0}}function pt(e,t){if(!it[e].includes(t))return;let n=V(e,`text-${t}`);return{className:n,cssRule:H(n,`text-align: ${t}`),isNew:!1}}function W(e,t){let n=V(e,t===`hidden`?`hidden`:t),r=!at[e].includes(t);return{className:n,cssRule:H(n,`display: ${ot[t]}`),isNew:r}}function mt(e,t){let n=V(e,st[t]),r=!lt[e].includes(t);return{className:n,cssRule:H(n,ct[t]),isNew:r}}function G(e,t){return e.cssRules.has(t.className)||e.cssRules.set(t.className,t.cssRule),t.className}function K(e,t,n,r){return`<tr><td class="${n}" style="display: ${r};">${L(e.type)?`<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">${t}</table>`:t}</td></tr>`}function ht(e,t,n){let r=G(n,W(`base`,`hidden`)),i=G(n,W(`base`,`block`)),a=K(e,z(e,`desktop`),r,`block`),o=K(t,z(t,`mobile`),i,`none`);return n.diagnostics.push(`id="${e.id}": desktop/mobile structure diverges (not just a leaf style value) — rendered both, toggled via .${r}/.${i} at 602px`),{html:a+o,selfWrapping:!0}}function gt(e,t,n){if(t===`desktop`){let t=G(n,W(`base`,`hidden`));return{html:K(e,z(e,`desktop`),t,`block`),selfWrapping:!0}}let r=G(n,W(`base`,`block`));return{html:K(e,z(e,`mobile`),r,`none`),selfWrapping:!0}}function _t(e,t){return e.type===t.type?e.type===`frame`&&t.type===`frame`?e.direction!==t.direction||e.children.length!==t.children.length?!1:e.children.every((e,n)=>e.id===t.children[n].id):!0:!1}function vt(e,t){return e.type===`frame`&&t.type===`frame`&&e.direction===`row`&&t.direction===`column`&&e.children.length===t.children.length&&e.children.every((e,n)=>e.id===t.children[n].id)}function yt(e){let t=e.map(e=>e.type===`frame`&&typeof e.width==`number`?e.width:void 0);if(t.every(e=>e!==void 0)){let e=t.reduce((e,t)=>e+t,0);return t.map(t=>Math.round(t/e*100))}let n=Math.round(100/e.length);return e.map(()=>n)}function bt(e,t){return e.type!==`frame`||typeof e.width!=`number`?[e,t]:[{...e,width:`fill`},t.type===`frame`?{...t,width:`fill`}:t]}function xt(e,t,n,r){let i=yt(e.children),a=G(n,ut(`base`,`full`)),o=e.gap??0,s=e.children.length-1,c=e.children.map((e,r)=>{let c=t.children[r],[l,u]=bt(e,c),d=q(l,u,n,0),f=d.selfWrapping?d.html:`<tr><td>${d.html}</td></tr>`,p=o&&r!==s?`padding-right: ${o}px;`:``;return Pe(i[r],f,a,p)}).join(``);return n.diagnostics.push(`id="${e.id}": desktop row / mobile stacked column merged into one adaptive row (inline-block + min-width technique, .${a} at 602px) instead of duplicated toggle markup`),{html:F(e.name,Ie(c,r)),selfWrapping:!0}}var St={top:`pt`,right:`pr`,bottom:`pb`,left:`pl`};function Ct(e,t,n,r){[`top`,`right`,`bottom`,`left`].forEach(i=>{e.padding[i]!==t.padding[i]&&r.push(G(n,U(`base`,St[i],t.padding[i])))})}function wt(e){return e===void 0?!1:typeof e==`number`?e!==0:Object.values(e).some(e=>(e??0)!==0)}function Tt(e,t,n){let r=[];Ct(e,t,n,r);let i=wt(e.cornerRadius),a=wt(t.cornerRadius);i&&!a?r.push(G(n,mt(`base`,`noRadius`))):(i!==a||JSON.stringify(e.cornerRadius)!==JSON.stringify(t.cornerRadius))&&n.diagnostics.push(`frame id="${e.id}": cornerRadius differs in a way no utility class can express — desktop's value wins`);let o=!!e.shadow,s=!!t.shadow;return o&&!s?r.push(G(n,mt(`base`,`noShadow`))):o!==s&&n.diagnostics.push(`frame id="${e.id}": shadow differs in a way no utility class can express — desktop's value wins`),e.gap!==t.gap&&n.diagnostics.push(`frame id="${e.id}": gap differs (${e.gap} vs ${t.gap}) — no utility-class category for gap, desktop's value wins`),JSON.stringify(e.fill)!==JSON.stringify(t.fill)&&n.diagnostics.push(`frame id="${e.id}": fill differs — not supported, desktop's value wins`),JSON.stringify(e.border)!==JSON.stringify(t.border)&&n.diagnostics.push(`frame id="${e.id}": border differs — not supported, desktop's value wins`),e.width!==t.width&&n.diagnostics.push(`frame id="${e.id}": width differs (${JSON.stringify(e.width)} vs ${JSON.stringify(t.width)}) — numeric/hug/fill width has no utility-class scale, desktop's value wins`),r.length?r.join(` `):void 0}function Et(e,t,n,r){let i=e.direction===`column`?jt(e.children,t.children,n,e.gap):Mt(e.children,t.children,n,e.gap,e.justify),a=Tt(e,t,n),o=Be(e.width),s=`${He(e,r)} margin: 0; ${Ve(e)}`.trim(),c=`<tr><td align="center"${a?` class="${a}"`:``}${P(e.fill)} style="${s}"><table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" width="${o}" style="border-collapse: collapse; padding: 0; margin: 0; ${R(e.width)}">${i}</table></td></tr>`;return{html:F(e.name,c),selfWrapping:!0}}function Dt(e,t,n){let r=[],i=e.defaultStyle.fontSizePx,a=t.defaultStyle.fontSizePx;i!==a&&(i!==void 0&&a!==void 0?r.push(G(n,dt(`base`,a))):n.diagnostics.push(`text id="${e.id}": fontSizePx differs but is unset on one side — skipped`));let o=e.defaultStyle.lineHeight,s=t.defaultStyle.lineHeight;o!==s&&(o!==void 0&&s!==void 0?r.push(G(n,ft(`base`,s))):n.diagnostics.push(`text id="${e.id}": lineHeight differs but is unset (falls back to "normal") on one side — skipped`));let c=e.align??`left`,l=t.align??`left`;if(c!==l){let t=pt(`base`,l);t?r.push(G(n,t)):n.diagnostics.push(`text id="${e.id}": align differs (${c} → ${l}) but no class exists for that value at this tier`)}return e.padding.top!==t.padding.top&&r.push(G(n,U(`base`,`pt`,t.padding.top))),e.padding.bottom!==t.padding.bottom&&r.push(G(n,U(`base`,`pb`,t.padding.bottom))),[`fontFamily`,`fontWeight`,`color`,`letterSpacing`,`textTransform`,`italic`,`underline`,`href`].forEach(r=>{e.defaultStyle[r]!==t.defaultStyle[r]&&n.diagnostics.push(`text id="${e.id}": defaultStyle.${r} differs — no utility-class category for it, desktop's value wins`)}),JSON.stringify(e.runs)!==JSON.stringify(t.runs)&&n.diagnostics.push(`text id="${e.id}": per-run overrides differ between desktop/mobile — only defaultStyle is diffed, desktop's runs win`),r.length?r.join(` `):void 0}function Ot(e,t,n,r){return{html:z(e,`desktop`,r,Dt(e,t,n)),selfWrapping:!0}}function kt(e,t,n){let r=[],i=e.align??`center`,a=t.align??`center`;if(i!==a){let t=pt(`base`,a);t?r.push(G(n,t)):n.diagnostics.push(`image id="${e.id}": align differs (${i} → ${a}) but no class exists for that value at this tier`)}return e.padding.top!==t.padding.top&&r.push(G(n,U(`base`,`pt`,t.padding.top))),e.padding.bottom!==t.padding.bottom&&r.push(G(n,U(`base`,`pb`,t.padding.bottom))),e.widthPx!==t.widthPx&&n.diagnostics.push(`image id="${e.id}": widthPx differs (${e.widthPx} vs ${t.widthPx}) — no px-based width-class scale, desktop's value wins`),e.altDescription!==t.altDescription&&n.diagnostics.push(`image id="${e.id}": altDescription differs — desktop's text wins`),e.href!==t.href&&n.diagnostics.push(`image id="${e.id}": href differs — desktop's value wins`),r.length?r.join(` `):void 0}function At(e,t,n,r){return{html:z(e,`desktop`,r,kt(e,t,n)),selfWrapping:!0}}function q(e,t,n,r=0){let i=z(e,`desktop`,r);if(i===z(t,`mobile`,r))return{html:i,selfWrapping:L(e.type)};if(vt(e,t))return xt(e,t,n,r);if(!_t(e,t))return ht(e,t,n);switch(e.type){case`frame`:return Et(e,t,n,r);case`text`:return Ot(e,t,n,r);case`image`:return At(e,t,n,r);default:return ht(e,t,n)}}function jt(e,t,n,r){let i=e.length-1;return e.map((e,a)=>{let o=t[a],s=r&&a!==i?r:0,c=q(e,o,n,s);return c.selfWrapping?c.html:`<tr><td${s?` style="padding-bottom: ${s}px;"`:``}>${c.html}</td></tr>`}).join(``)}function Mt(e,t,n,r,i){let a=e.length-1,o=i===`spaceBetween`&&a>0;return`<tr>${e.map((e,i)=>{let s=t[i],c=i===a,l=r&&!c?`padding-right: ${r}px;`:``,u=q(e,s,n,0),d=u.selfWrapping?`<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">${u.html}</table>`:u.html;return o&&c?`<td align="right" style="${l}"><table role="presentation" border="0" cellpadding="0" cellspacing="0" align="right" style="padding: 0; margin: 0;"><tr><td>${d}</td></tr></table></td>`:`<td style="${l}">${d}</td>`}).join(``)}</tr>`}function Nt(e,t){let n={cssRules:new Map,diagnostics:[]},r=new Map(e.map(e=>[e.id,e])),i=new Map(t.map(e=>[e.id,e])),a=e.map(e=>e.id);return t.forEach(e=>{r.has(e.id)||a.push(e.id)}),{contentHtml:a.map(e=>{let t=r.get(e),a=i.get(e);if(t&&a)return q(t,a,n,0);if(t)return gt(t,`desktop`,n);if(a)return gt(a,`mobile`,n)}).filter(e=>!!e&&e.html!==``).map(e=>e.selfWrapping?e.html:`<tr><td style="margin: 0; padding: 0;">${e.html}</td></tr>`).join(``),cssRules:n.cssRules,diagnostics:n.diagnostics}}var Pt=u([`both`,`desktopOnly`,`mobileOnly`]),J={id:g().min(1,`id is required`),name:g().optional(),visibility:Pt.optional()},Ft=l([m(),c({topLeft:m().optional(),topRight:m().optional(),bottomRight:m().optional(),bottomLeft:m().optional()}).strict()]),It=p(`kind`,[c({kind:f(`solid`),color:g()}).strict(),c({kind:f(`linearGradient`),angleDeg:m(),stops:h(c({color:g(),position:m().min(0).max(1)}).strict()).min(2)}).strict(),c({kind:f(`radialGradient`),stops:h(c({color:g(),position:m().min(0).max(1)}).strict()).min(2)}).strict()]),Y=c({widthPx:m(),color:g(),style:u([`solid`,`dashed`,`dotted`]).optional()}).strict(),Lt=c({top:Y.optional(),right:Y.optional(),bottom:Y.optional(),left:Y.optional()}).strict(),Rt=c({top:m(),right:m(),bottom:m(),left:m()}).strict(),zt=c({xPx:m(),yPx:m(),blurPx:m(),color:g()}).strict(),Bt=u([`uppercase`,`lowercase`,`capitalize`,`none`]),Vt={fontSizePx:m().optional(),fontFamily:g().optional(),fontWeight:m().min(100).max(900).optional(),letterSpacing:m().optional(),lineHeight:m().optional(),color:g().optional(),italic:d().optional(),underline:d().optional(),textTransform:Bt.optional(),href:g().optional()},Ht=c(Vt).strict(),Ut=c({text:g(),...Vt}).strict(),Wt=c({top:m(),bottom:m()}).strict(),Gt=c({...J,type:f(`frame`),direction:u([`row`,`column`]),fill:It.optional(),border:Lt.optional(),cornerRadius:Ft.optional(),padding:Rt,gap:m().optional(),width:l([m(),f(`fill`),f(`hug`)]).optional(),justify:u([`start`,`center`,`end`,`spaceBetween`]).optional(),crossAlign:u([`start`,`center`,`end`]).optional(),shadow:zt.optional(),children:h(s(()=>on))}).strict(),Kt=c({...J,type:f(`text`),defaultStyle:Ht,runs:h(Ut).min(1),align:u([`left`,`center`,`right`]).optional(),padding:Wt}).strict(),qt=c({...J,type:f(`image`),altDescription:g().min(1,`altDescription is required`),widthPx:m(),widthMode:u([`fluid`,`fixed`]).optional(),align:u([`left`,`center`,`right`]).optional(),padding:Wt,aspectRatio:m().optional(),href:g().optional()}).strict(),Jt=c({altDescription:g().min(1,`altDescription is required`),side:u([`left`,`right`]),gapPx:m(),widthPx:m(),heightPx:m()}).strict(),Yt=c({...J,type:f(`button`),label:g(),href:g(),background:g().optional(),textColor:g().optional(),border:Y.optional(),cornerRadius:Ft.optional(),widthPx:m(),targetHeightPx:m(),fontFamily:g(),fontSizePx:m(),fontWeight:m().min(100).max(900),lineHeight:m(),paddingTopPx:m(),paddingBottomPx:m(),paddingLeftPx:m(),paddingRightPx:m(),textTransform:Bt.optional(),icon:Jt.optional()}).strict(),Xt=c({...J,type:f(`divider`),color:g(),thicknessPx:m().optional()}).strict(),Zt=c({...J,type:f(`dividerLogo`),widthPx:m(),lineColor:g(),lineThicknessPx:m().optional(),iconAltDescription:g().min(1,`iconAltDescription is required`),iconWidthPx:m(),iconGapPx:m()}).strict(),Qt=c({...J,type:f(`headerImage`),widthPx:m(),altDescription:g().min(1,`altDescription is required`),href:g().optional()}).strict(),$t=c({...J,type:f(`spacer`),heightPx:m()}).strict(),en=c({...J,type:f(`promoCopy`)}).strict(),tn=c({widthPercent:m(),children:h(s(()=>on))}).strict(),nn=c({...J,type:f(`row`),columns:h(tn)}).strict(),rn=c({...J,type:f(`buttonRow`),buttons:h(Yt)}).strict(),an=c({id:g().min(1,`id is required`),name:g().optional(),padding:Rt,title:Kt,secondary:Kt}).strict(),on=p(`type`,[Gt,Kt,qt,Yt,Xt,Zt,Qt,$t,en,nn,rn,c({...J,type:f(`cardList`),variant:f(`sponsoredLink`),gap:m().optional(),cards:h(an).min(1)}).strict()]),sn=h(on);function X(e,t,n){try{return JSON.parse(e)}catch(e){n.push({file:t,path:`(root)`,message:`Invalid JSON: ${e instanceof Error?e.message:String(e)}`});return}}function cn(e,t){return e.issues.map(e=>({file:t,path:e.path.length>0?e.path.join(`.`):`(root)`,message:e.message}))}function ln(e){let t=new Map,n=e=>{if(t.set(e.id,e.visibility??`both`),e.type===`frame`&&e.children.forEach(e=>n(e)),e.type===`button`){let n=e.icon;n&&t.set(n.id,n.visibility??`both`)}e.type===`row`&&e.columns.forEach(e=>e.children.forEach(e=>n(e))),e.type===`cardList`&&e.cards.forEach(e=>{t.set(e.id,e.visibility??`both`),n(e.title),n(e.secondary)}),e.type===`buttonRow`&&e.buttons.forEach(e=>n(e))};return e.forEach(e=>n(e)),t}function un(e,t){let n=[];for(let[r,i]of t)!e.has(r)&&i!==`mobileOnly`&&n.push({file:`mobile`,path:`id="${r}"`,message:`Present only in mobile.json but missing visibility:"mobileOnly" — likely a typo or a desync between the two files`});for(let[r,i]of e)!t.has(r)&&i!==`desktopOnly`&&n.push({file:`desktop`,path:`id="${r}"`,message:`Present only in desktop.json but missing visibility:"desktopOnly" — likely a typo or a desync between the two files`});return n}function dn(e){return typeof e==`object`&&!!e&&!Array.isArray(e)&&`nodes`in e}function fn(e){let t=[],n=X(e,`tree`,t);if(n===void 0)return{valid:!1,errors:t};let r=dn(n),i=r&&typeof n.title==`string`?n.title:void 0,a=r?n.nodes:n,o=sn.safeParse(a);return o.success?{valid:!0,errors:[],nodes:o.data,title:i}:{valid:!1,errors:cn(o.error,`tree`)}}function pn(e,t){let n=[],r=X(e,`desktop`,n),i=X(t,`mobile`,n);if(r===void 0||i===void 0)return{valid:!1,errors:n};let a=sn.safeParse(r);a.success||n.push(...cn(a.error,`desktop`));let o=sn.safeParse(i);if(o.success||n.push(...cn(o.error,`mobile`)),!a.success||!o.success)return{valid:!1,errors:n};let s=a.data,c=o.data;return n.push(...un(ln(s),ln(c))),{valid:n.length===0,errors:n,desktopNodes:s,mobileNodes:c}}function mn(e,t,n){try{return{desktopHtml:re(B(e,`desktop`),{title:n}),mobileHtml:re(B(t,`mobile`),{title:n})}}catch(e){return{error:e instanceof Error?e.message:String(e)}}}function hn(e,t,n){try{let{contentHtml:r,cssRules:i,diagnostics:a}=Nt(e,t);return{html:ie(r,{title:n,cssRules:i}),diagnostics:a}}catch(e){return{error:e instanceof Error?e.message:String(e)}}}function gn(e){let t=e.trim();if(!t)return`Figma Import Preview`;let n=t.split(/[/\\]+/).filter(Boolean);return n[n.length-1]||`Figma Import Preview`}function _n(e){return e.trim().toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``)||`figma-import-preview`}function Z(e,t){let n=new Blob([e],{type:`text/html`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=`${_n(t)}.html`,i.click(),URL.revokeObjectURL(r)}function vn(e,t){let n=fn(e);if(!n.valid||!n.nodes)return{errors:n.errors};let r=n.title||t.trim()||`Figma Import Preview`;try{let e=C(n.nodes);return{html:re(B(n.nodes,`desktop`),{title:r,fonts:e}),resolvedTitle:r}}catch(e){return{error:e instanceof Error?e.message:String(e),resolvedTitle:r}}}var Q=n(),yn={"description.md":`description`,"desktop.json":`desktop`,"mobile.json":`mobile`},bn={description:`description.md`,desktop:`desktop.json`,mobile:`mobile.json`};function xn({onFilesReady:e}){let t=_.useRef({}),[n,r]=_.useState({}),[i,a]=_.useState([]),[o,s]=_.useState(!1),c=_.useRef(null),l=async n=>{let i=Array.from(n),o=[],s=await Promise.all(i.map(async e=>{let t=yn[e.name];return t?[t,{name:e.name,content:await e.text()}]:(o.push(e.name),null)})),c={...t.current};for(let e of s)e&&(c[e[0]]=e[1]);t.current=c,r(c),a(o),c.desktop&&c.mobile&&e({descriptionContent:c.description?.content,desktopRaw:c.desktop.content,mobileRaw:c.mobile.content})};return(0,Q.jsxs)(`div`,{className:`flex flex-col gap-2`,children:[(0,Q.jsxs)(`div`,{onDragOver:e=>{e.preventDefault(),s(!0)},onDragLeave:()=>s(!1),onDrop:e=>{e.preventDefault(),s(!1),l(e.dataTransfer.files)},onClick:()=>c.current?.click(),className:`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center text-sm transition-colors ${o?`border-primary bg-primary/10`:`border-border text-muted-foreground`}`,children:[`Перетягни сюди description.md, desktop.json, mobile.json — окремо або разом`,(0,Q.jsx)(`input`,{ref:c,type:`file`,multiple:!0,accept:`.md,.json`,className:`hidden`,onChange:e=>e.target.files&&void l(e.target.files)})]}),(0,Q.jsx)(`ul`,{className:`flex gap-4 text-xs`,children:Object.keys(bn).map(e=>(0,Q.jsxs)(`li`,{"data-testid":`figma-import-slot-${e}`,className:n[e]?`text-primary`:`text-muted-foreground`,children:[n[e]?`✓`:`○`,` `,bn[e]]},e))}),i.length>0&&(0,Q.jsxs)(`div`,{className:`text-xs text-destructive`,children:[`Невідомі файли (очікую description.md/desktop.json/mobile.json): `,i.join(`, `)]})]})}var Sn=new class{async request(e,t){if(!i()){let t=Error(`API is not configured. Backend server is not available.`);throw r.warn(`ApiClient`,`API not available, skipping request: ${e}`),t}try{let n=await fetch(`${a()}${e}`,{...t,headers:{"Content-Type":`application/json`,...t?.headers}});if(!n.ok){let e=await n.json().catch(()=>({}));throw Error(e.error||`HTTP ${n.status}`)}return n.json()}catch(t){throw i()&&r.error(`ApiClient`,`Request failed: ${e}`,t),t}}get(e,t){return this.request(e,{...t,method:`GET`})}post(e,t,n){return this.request(e,{...n,method:`POST`,body:t?JSON.stringify(t):void 0})}put(e,t,n){return this.request(e,{...n,method:`PUT`,body:t?JSON.stringify(t):void 0})}delete(e,t){return this.request(e,{...t,method:`DELETE`})}},Cn={readFolder:e=>Sn.get(`/api/figma-import/files?folder=${encodeURIComponent(e)}`)},$={loading:!1,descriptionExists:!1};function wn(){let[e,t]=(0,_.useState)($),n=(0,_.useCallback)(e=>{let n=pn(e.desktopRaw,e.mobileRaw);t({loading:!1,descriptionExists:e.descriptionContent!==void 0,description:e.descriptionContent,desktopRaw:e.desktopRaw,mobileRaw:e.mobileRaw,validation:n})},[]),r=(0,_.useCallback)(async e=>{t({...$,loading:!0});try{let n=await Cn.readFolder(e);if(!n.desktopJson.exists||!n.mobileJson.exists){t({loading:!1,descriptionExists:n.description.exists,description:n.description.content,error:n.desktopJson.exists?`mobile.json not found in folder`:`desktop.json not found in folder`});return}let r=pn(n.desktopJson.content,n.mobileJson.content);t({loading:!1,descriptionExists:n.description.exists,description:n.description.content,desktopRaw:n.desktopJson.content,mobileRaw:n.mobileJson.content,validation:r})}catch(e){t({...$,loading:!1,error:e instanceof Error?e.message:`Failed to load folder`})}},[]),i=(0,_.useCallback)(()=>{t($)},[]);return{...e,load:r,setFromFiles:n,reset:i}}var Tn=`OPEN QUESTION for confirmation before build:`;function En(e){return e?e.split(`
`).map(e=>e.trim()).filter(e=>e.includes(Tn)):[]}function Dn(e){if(!e)return 0;try{let t=JSON.parse(e);return Array.isArray(t)?t.length:0}catch{return 0}}function On(){let[e,t]=_.useState(``),[n,r]=_.useState(null),[i,a]=_.useState(null),{loading:s,error:c,description:l,descriptionExists:u,desktopRaw:d,mobileRaw:f,validation:p,load:m,setFromFiles:h,reset:g}=wn(),v=gn(e),[y,b]=_.useState(``),[x,S]=_.useState(``),[C,w]=_.useState(null),T=()=>{let e=vn(y,x);w(e),e.resolvedTitle&&S(e.resolvedTitle)},E=()=>{e.trim()&&(r(null),a(null),m(e.trim()))},D=e=>{r(null),a(null),h(e)},ee=()=>{!p?.valid||!p.desktopNodes||!p.mobileNodes||r(mn(p.desktopNodes,p.mobileNodes,v))},te=()=>{!p?.valid||!p.desktopNodes||!p.mobileNodes||a(hn(p.desktopNodes,p.mobileNodes,v))},O=()=>{t(``),r(null),a(null),g()},k=En(l);return(0,Q.jsxs)(`div`,{className:`mx-auto flex max-w-3xl flex-col gap-4 p-6`,children:[(0,Q.jsxs)(`div`,{children:[(0,Q.jsx)(`h2`,{className:`text-lg font-bold`,children:`Figma Import — Етап 2`}),(0,Q.jsx)(`p`,{className:`text-sm text-muted-foreground`,children:`Читання + валідація опису/JSON пари, рендер генеричних примітивів (frame/text/image/spacer) у прев'ю.`})]}),(0,Q.jsxs)(`div`,{className:`flex flex-col gap-2 rounded-xl border border-border bg-card p-4`,children:[(0,Q.jsxs)(`div`,{children:[(0,Q.jsx)(`h3`,{className:`text-sm font-bold`,children:`Дерево значень (JSON)`}),(0,Q.jsx)(`p`,{className:`text-xs text-muted-foreground`,children:`Вставте JSON-дерево вручну або оберіть файл — назва/шрифти підставляються з дерева й назви темплейту, окремо вводити нічого не треба.`})]}),(0,Q.jsx)(o,{value:x,onChange:e=>S(e.target.value),placeholder:`Назва темплейту (title)`}),(0,Q.jsx)(`textarea`,{value:y,onChange:e=>{w(null),b(e.target.value)},placeholder:`Вставте JSON-масив DesignNode сюди...`,rows:10,className:`w-full rounded-xl border border-border bg-background p-3 font-mono text-xs`}),(0,Q.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,Q.jsxs)(`label`,{className:`flex-shrink-0 cursor-pointer rounded-xl border border-border px-4 py-2 text-sm font-bold text-foreground transition-all hover:bg-accent`,children:[`Обрати файл`,(0,Q.jsx)(`input`,{type:`file`,accept:`.json`,className:`hidden`,onChange:async e=>{let t=e.target.files?.[0];t&&(w(null),b(await t.text()),e.target.value=``)}})]}),(0,Q.jsx)(`button`,{onClick:T,disabled:!y.trim(),className:`rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50`,children:`Generate`})]}),C?.errors&&(0,Q.jsxs)(`div`,{className:`rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive`,children:[(0,Q.jsxs)(`div`,{className:`font-bold`,children:[`Помилки валідації (`,C.errors.length,`)`]}),(0,Q.jsx)(`ul`,{className:`list-disc pl-5 font-mono text-xs`,children:C.errors.map((e,t)=>(0,Q.jsxs)(`li`,{children:[e.path,`: `,e.message]},t))})]}),C?.error&&(0,Q.jsxs)(`div`,{className:`rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive`,children:[(0,Q.jsx)(`div`,{className:`font-bold`,children:`Помилка рендеру`}),(0,Q.jsx)(`div`,{className:`font-mono text-xs`,children:C.error})]}),C?.html&&(0,Q.jsxs)(`div`,{className:`flex flex-col gap-2`,children:[(0,Q.jsx)(`button`,{onClick:()=>Z(C.html,x),className:`self-start rounded-xl border border-border px-4 py-2 text-sm font-bold text-foreground transition-all hover:bg-accent`,children:`Download HTML`}),(0,Q.jsx)(`iframe`,{title:`Tree preview`,srcDoc:C.html,className:`h-[600px] w-full rounded-xl border border-border`})]})]}),(0,Q.jsxs)(`div`,{className:`flex items-center gap-3 text-xs text-muted-foreground`,children:[(0,Q.jsx)(`div`,{className:`h-px flex-1 bg-border`}),`Етап 2 (стара пара desktop.json/mobile.json — нижче)`,(0,Q.jsx)(`div`,{className:`h-px flex-1 bg-border`})]}),(0,Q.jsxs)(`div`,{className:`flex gap-2`,children:[(0,Q.jsx)(o,{value:e,onChange:e=>t(e.target.value),onKeyDown:e=>e.key===`Enter`&&E(),placeholder:`/шлях/до/папки/з/темплейтом`}),(0,Q.jsx)(`button`,{onClick:E,disabled:s||!e.trim(),className:`flex-shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50`,children:s?`Завантаження...`:`Load`})]}),(0,Q.jsxs)(`div`,{className:`flex items-center gap-3 text-xs text-muted-foreground`,children:[(0,Q.jsx)(`div`,{className:`h-px flex-1 bg-border`}),`або`,(0,Q.jsx)(`div`,{className:`h-px flex-1 bg-border`})]}),(0,Q.jsx)(xn,{onFilesReady:D}),c&&(0,Q.jsx)(`div`,{className:`rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive`,children:c}),(p||n||i)&&(0,Q.jsx)(`button`,{onClick:O,className:`self-start text-xs font-bold text-muted-foreground underline transition-all hover:text-foreground`,children:`Reset — почати заново`}),p&&p.valid&&(0,Q.jsxs)(`div`,{className:`flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary`,children:[(0,Q.jsx)(`div`,{className:`font-bold`,children:`Валідація пройшла успішно`}),(0,Q.jsxs)(`div`,{children:[`Template: `,v]}),(0,Q.jsxs)(`div`,{children:[`Desktop: `,Dn(d),` топ-левел вузлів`]}),(0,Q.jsxs)(`div`,{children:[`Mobile: `,Dn(f),` топ-левел вузлів`]}),k.length>0&&(0,Q.jsxs)(`div`,{className:`mt-1`,children:[(0,Q.jsx)(`div`,{className:`font-bold`,children:`Відкриті питання:`}),(0,Q.jsx)(`ul`,{className:`list-disc pl-5`,children:k.map((e,t)=>(0,Q.jsx)(`li`,{children:e},t))})]}),(0,Q.jsxs)(`div`,{className:`flex gap-2`,children:[(0,Q.jsx)(`button`,{onClick:ee,className:`mt-1 self-start rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:brightness-110`,children:`Build`}),(0,Q.jsx)(`button`,{onClick:te,title:`Один адаптивний .html — diff desktop/mobile по id, mapped на utility-class довідник (Етап 3)`,className:`mt-1 self-start rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary transition-all hover:bg-primary/10`,children:`Build Responsive`})]})]}),n?.error&&(0,Q.jsxs)(`div`,{className:`rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive`,children:[(0,Q.jsx)(`div`,{className:`font-bold`,children:`Помилка рендеру`}),(0,Q.jsx)(`div`,{className:`font-mono text-xs`,children:n.error})]}),n?.desktopHtml&&n?.mobileHtml&&(0,Q.jsxs)(`div`,{className:`grid grid-cols-2 gap-4`,children:[(0,Q.jsxs)(`div`,{children:[(0,Q.jsxs)(`div`,{className:`mb-1 flex items-center justify-between`,children:[(0,Q.jsx)(`div`,{className:`text-sm font-bold`,children:`Desktop`}),(0,Q.jsx)(`button`,{onClick:()=>Z(n.desktopHtml,`${v} desktop`),className:`rounded-xl border border-border px-3 py-1 text-xs font-bold text-foreground transition-all hover:bg-accent`,children:`Download HTML`})]}),(0,Q.jsx)(`iframe`,{title:`Desktop preview`,srcDoc:n.desktopHtml,className:`h-[600px] w-full rounded-xl border border-border`})]}),(0,Q.jsxs)(`div`,{children:[(0,Q.jsxs)(`div`,{className:`mb-1 flex items-center justify-between`,children:[(0,Q.jsx)(`div`,{className:`text-sm font-bold`,children:`Mobile`}),(0,Q.jsx)(`button`,{onClick:()=>Z(n.mobileHtml,`${v} mobile`),className:`rounded-xl border border-border px-3 py-1 text-xs font-bold text-foreground transition-all hover:bg-accent`,children:`Download HTML`})]}),(0,Q.jsx)(`iframe`,{title:`Mobile preview`,srcDoc:n.mobileHtml,className:`h-[600px] w-full rounded-xl border border-border`})]})]}),i?.error&&(0,Q.jsxs)(`div`,{className:`rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive`,children:[(0,Q.jsx)(`div`,{className:`font-bold`,children:`Помилка рендеру (Responsive)`}),(0,Q.jsx)(`div`,{className:`font-mono text-xs`,children:i.error})]}),i?.html&&(0,Q.jsxs)(`div`,{className:`flex flex-col gap-2`,children:[(0,Q.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,Q.jsx)(`div`,{className:`text-sm font-bold`,children:`Responsive (один файл)`}),(0,Q.jsx)(`button`,{onClick:()=>Z(i.html,v),className:`rounded-xl border border-border px-4 py-2 text-sm font-bold text-foreground transition-all hover:bg-accent`,children:`Download HTML`})]}),(0,Q.jsx)(`iframe`,{title:`Responsive preview`,srcDoc:i.html,className:`h-[600px] w-full rounded-xl border border-border`}),i.diagnostics&&i.diagnostics.length>0&&(0,Q.jsxs)(`div`,{className:`rounded-xl border border-border bg-card p-4`,children:[(0,Q.jsxs)(`div`,{className:`mb-2 text-sm font-bold`,children:[`Diagnostics (`,i.diagnostics.length,`)`]}),(0,Q.jsx)(`p`,{className:`mb-2 text-xs text-muted-foreground`,children:`Diffs the merge couldn't express as a utility class — desktop's value silently wins for each, never a silent drop.`}),(0,Q.jsx)(`ul`,{className:`max-h-64 list-disc overflow-auto pl-5 font-mono text-xs`,children:i.diagnostics.map((e,t)=>(0,Q.jsx)(`li`,{children:e},t))})]})]}),p&&!p.valid&&(0,Q.jsxs)(`div`,{className:`flex flex-col gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive`,children:[(0,Q.jsxs)(`div`,{className:`font-bold`,children:[`Помилки валідації (`,p.errors.length,`)`]}),(0,Q.jsx)(`ul`,{className:`list-disc pl-5 font-mono text-xs`,children:p.errors.map((e,t)=>(0,Q.jsxs)(`li`,{children:[e.file,`.json — `,e.path,`: `,e.message]},t))})]}),u&&l&&(0,Q.jsxs)(`div`,{className:`rounded-xl border border-border bg-card p-4`,children:[(0,Q.jsx)(`div`,{className:`mb-2 text-sm font-bold`,children:`description.md`}),(0,Q.jsx)(`pre`,{className:`max-h-96 overflow-auto whitespace-pre-wrap text-xs text-foreground`,children:l})]})]})}export{On as default};