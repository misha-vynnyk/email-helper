# Template Builder Stage 1 — питання для авторства блоків

Заповніть відповіді прямо під кожним питанням (замініть `_відповідь тут_` своїм текстом або вставте розмітку в блок ```html). Коли готово — скажіть мені, я перечитаю файл і допишу/оновлю план.

Не обов'язково відповідати на все одразу і в цьому порядку — можна частинами.

---

## Блок 1 — MainContainer / майстер-шелл

Це зовнішня обгортка всього листа (те, що завжди однакове, незалежно від вмісту).

### 1.1 Розмітка
Вставте повний HTML цього шелла (від `<html>`/`<body>` чи від того рівня, який ви вважаєте "завжди однаковим"):
```html
<!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  lang="en" dir="ltr">

  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Title</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Jost:ital,wght@0,100..900;1,100..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">

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

      [style*="Roboto"] {
        font-family: "Roboto", Arial, Helvetica, sans-serif;
      }

      @media screen and (-webkit-min-device-pixel-ratio: 0) {
        [style*="Roboto"] {
          font-family: "Roboto", Arial, Helvetica, sans-serif;
        }
      }

      @media screen and (max-width: 602px) {
        table.main-bg    { width: 100% !important; max-width: 100% !important; min-width: 100% !important; }
        img              { background-color: transparent !important; }
        .main-image-bg   { background-color: transparent !important; }
        .footer-button   { display: block !important; width: 100% !important; max-width: 100% !important; min-width: 100% !important; }
        .spacer-hide     { display: none !important; }
        .no-radius          { border-radius: 0 !important; }

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
              bgcolor="#e8eef4"
              border="0"
              cellpadding="0"
              cellspacing="0"
              width="100%"
              role="presentation"
              style="border-spacing: 0; border-collapse: collapse; padding: 0; margin: 0; max-width: 1000px; background-color: #e8eef4;">
              <tr>

                <!--[ BG Pattern — optional repeating background image ]-->
                <td class="main-image-bg"
                  style="margin: 0; padding: 0; background: url('https://storage.5th-elementagency.com/files/'); background-position: center top; background-repeat: repeat-y;">

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
                          width="600"
                          style="width: 600px; max-width: 100%;">
                    <![endif]-->

                    <tr>
                      <td align="center"
                        valign="top"
                        style="margin: 0; padding: 0;">

                        <!--[ Inner — 600px content table ]-->
                        <table bgcolor="#ffffff"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          width="600"
                          role="presentation"
                          style="border-spacing: 0; border-collapse: separate; padding: 0; margin: 0; max-width: 600px; width: 100%; background-color: #ffffff;">
                          <!--[------ Content start ------]-->
                          <tr>
                            <td style="margin: 0; padding: 0;">
                              Title
                            </td>
                          </tr>
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

```

### 1.2 Що в ній динамічне?
- [x] Назва листа (`<title>`) — потрібна?
- [x] Шрифт — один на весь лист, чи може відрізнятись у різних блоках? Якщо шрифт не web-safe — потрібен `<link>` на Google Fonts?
- [-] Фон — колір самого `<body>` окремо від фону контентної таблиці, чи це один і той самий колір?
- [-] Ширина контенту — фіксована (напр. 600px), чи має бути редагована в UI?
- [ ] Чи є щось інше, що має змінюватись через UI (напр. preheader-текст, favicon, щось інше)?

### 1.3 Чи є вже готовий референс-файл?
Наприклад чи є десь у проєкті вже готовий HTML-файл з таким шеллом, на який можна орієнтуватись (шлях)?
<!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  lang="en">

  <head>
    <meta http-equiv="Content-Type"
      content="text/html; charset=utf-8" />
    <meta name="viewport"
      content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>america health mail</title>
    <link rel="preconnect"
      href="https://fonts.googleapis.com">
    <link rel="preconnect"
      href="https://fonts.gstatic.com"
      crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Jost:ital,wght@0,100..900;1,100..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
      rel="stylesheet">
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

      [style*="Roboto"] {
        font-family: "Roboto", Arial, Helvetica, sans-serif;
      }

      @media screen and (-webkit-min-device-pixel-ratio: 0) {
        [style*="Roboto"] {
          font-family: "Roboto", Arial, Helvetica, sans-serif;
        }
      }

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
          width: 100% !important;
          max-width: 280px !important;
        }

        .spacer-hide {
          display: none !important;
        }

        .no-radius {
          border-radius: 0 !important;
        }

        .footer-bg-mob {
          background-image: url(https://storage.5th-elementagency.com/files/templates/america-health-mail-2-v1/footer-env-mob.png) !important;
        }

        .footer-pad-bot {
          padding-bottom: 210px !important;
        }
      }

      @media screen and (max-width: 464px) {
        .footer-pad-bot {
          padding-bottom: 180px !important;
        }

        .sm-pb-4 {
          padding-bottom: 4px !important;
        }

        .sm-font-14 {
          font-size: 14px !important;
        }
      }

      @media screen and (max-width: 380px) {
        .footer-pad-bot {
          padding-bottom: 150px !important;
        }
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
              bgcolor="#DFEEF9"
              border="0"
              cellpadding="0"
              cellspacing="0"
              width="100%"
              role="presentation"
              style="border-spacing: 0; border-collapse: collapse; padding: 0; margin: 0; max-width: 1000px; background-color: #DFEEF9;">
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
                          width="600"
                          style="width: 600px; max-width: 100%;">
                    <![endif]-->
                    <!--[------ Spacer start ------]-->
                    <tr>
                      <td class="spacer-hide"
                        height="24"
                        style="margin: 0; padding: 0; height: 24px; line-height: 24px; font-size: 0;">
                      </td>
                    </tr>
                    <!--[------ Spacer / end ------]-->
                    <tr>
                      <td align="center"
                        valign="top"
                        style="margin: 0; padding: 0;">
                        <!--[ Inner — 600px content table ]-->
                        <table bgcolor="#ffffff"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          width="600"
                          role="presentation"
                          style="border-spacing: 0; border-collapse: separate; padding: 0; margin: 0; max-width: 600px; width: 100%; background-color: #ffffff;border-radius: 5px;">
                          <!--[------ Header start ------]-->
                          <tr>
                            <td align="center"
                              bgcolor="#FCFBF5"
                              style="border-radius: 5px 5px 0 0;">
                              <table align="center"
                                border="0"
                                cellspacing="0"
                                cellpadding="0"
                                width="100%"
                                style="width: 100%; max-width:100%; padding: 0; margin: 0; background-image: url(https://storage.5th-elementagency.com/files/templates/america-health-mail-2-v1/header-bg-1.png); background-repeat: repeat-y; background-position: center top;border-radius: 5px 5px 0 0;"
                                role="presentation">
                                <tr>
                                  <td align="center"
                                    style="background-image: url(https://storage.5th-elementagency.com/files/templates/america-health-mail-2-v1/header-bg-2.png); background-repeat: repeat-y; background-position: center top;border-radius: 5px 5px 0 0;padding-top: 17px; padding-bottom: 17px; padding-right: 20px; padding-left: 20px;">
                                    <table align="center"
                                      border="0"
                                      cellspacing="0"
                                      cellpadding="0"
                                      width="552"
                                      style="width: 100%; max-width:552px; padding: 0; margin: 0"
                                      role="presentation">
                                      <tr>
                                        <td align="left"
                                          valign="top"
                                          width="50%"
                                          style="padding: 0; width: 50%;">
                                          <a href="urlhere"
                                            target="_blank">
                                            <img alt="America Health Mail"
                                              height="auto"
                                              src="https://storage.5th-elementagency.com/files/templates/america-health-mail-2-v1/header-image.png"
                                              style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;max-width: 195px;font-size:13px;"
                                              width="195" />
                                          </a>
                                        </td>
                                        <td class="sm-font-14"
                                          valign="top"
                                          style="font-family:'Arial Black', Arial, Helvetica, sans-serif;font-size:16px;font-style:normal;font-weight:900;line-height:1.5;text-align:right;color:#325E70;padding-left: 10px; letter-spacing: 2.72px; text-transform: uppercase;">
                                          25 nov. <br>
                                          2025
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td align="center"
                              style="margin: 0; padding: 0">
                              <img width="600"
                                height="37"
                                src="https://storage.5th-elementagency.com/files/templates/america-health-mail-2-v1/slogan-1.gif"
                                alt="Slogan"
                                style="display: block; margin: 0; padding: 0; border: 0; width: 100%; max-height: 37px; height: auto; line-height: 0; font-size: 0;" />
                            </td>
                          </tr>
                          <!--[------ Header / end ------]-->
                          <!--[------ Note start ------]-->
                          <tr>
                            <td align="center"
                              style="padding-right: 20px; padding-left: 20px; padding-top: 26px;">
                              <table align="center"
                                border="0"
                                cellspacing="0"
                                cellpadding="0"
                                width="552"
                                style="width: 100%; max-width:552px; padding: 0; margin: 0"
                                role="presentation">
                                <!-- item start -->
                                <tr>
                                  <td align="center"
                                    style="padding-top: 6px; padding-bottom: 6px;">
                                    <table align="center"
                                      border="0"
                                      bgcolor="#FFF9E9"
                                      cellspacing="0"
                                      cellpadding="0"
                                      width="100%"
                                      style="width: 100%; max-width:100%; padding: 0; margin: 0"
                                      role="presentation">
                                      <tr>
                                        <td align="center"
                                          style="padding-right: 16px; padding-left: 16px; padding-top: 16px; padding-bottom: 16px;">
                                          <table align="center"
                                            border="0"
                                            cellspacing="0"
                                            cellpadding="0"
                                            width="100%"
                                            style="width: 100%; max-width:100%; padding: 0; margin: 0"
                                            role="presentation">
                                            <tr>
                                              <td style="font-family:Arial, Helvetica, sans-serif;font-size:14px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#003A52; padding-bottom: 8px;">
                                                <b>Sponsored content</b>
                                              </td>
                                            </tr>
                                            <!--[------ Divider start ------]-->
                                            <tr>
                                              <td align="center"
                                                valign="top"
                                                style="margin: 0;padding-bottom: 16px;">
                                                <table align="center"
                                                  border="0"
                                                  cellspacing="0"
                                                  cellpadding="0"
                                                  width="100%"
                                                  role="presentation"
                                                  style="width: 100%; max-width: 100%; padding: 0; margin: 0;">
                                                  <tr>
                                                    <td height="1"
                                                      style="padding-top: 1px; height: 1px; border-bottom: 1px solid #F1EBDC;">
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                            <!--[------ Divider / end ------]-->
                                            <tr>
                                              <td style="font-family:'Arial Hebrew Scholar', 'Arial Hebrew', David, Arial, sans-serif;font-size:14px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#003A52; padding-bottom: 8px;">
                                                <a href="urlhere"
                                                  style="font-family:'Arial Hebrew Scholar', 'Arial Hebrew', David, Arial, sans-serif;text-decoration: underline;font-weight: 700; color: #007A9B;">
                                                  Viverra nulla mattis quis nascetur donec neque, vulputate eget quam.
                                                </a>
                                              </td>
                                            </tr>
                                            <tr>
                                              <td style="font-family:'Arial Hebrew Scholar', 'Arial Hebrew', David, Arial, sans-serif;font-size:12px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#003A52;">
                                                By Partner Name
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                                <!-- item / end -->
                                <!-- item start -->
                                <tr>
                                  <td align="center"
                                    style="padding-top: 6px; padding-bottom: 6px;">
                                    <table align="center"
                                      border="0"
                                      bgcolor="#FFF9E9"
                                      cellspacing="0"
                                      cellpadding="0"
                                      width="100%"
                                      style="width: 100%; max-width:100%; padding: 0; margin: 0"
                                      role="presentation">
                                      <tr>
                                        <td align="center"
                                          style="padding-right: 16px; padding-left: 16px; padding-top: 16px; padding-bottom: 16px;">
                                          <table align="center"
                                            border="0"
                                            cellspacing="0"
                                            cellpadding="0"
                                            width="100%"
                                            style="width: 100%; max-width:100%; padding: 0; margin: 0"
                                            role="presentation">
                                            <tr>
                                              <td style="font-family:Arial, Helvetica, sans-serif;font-size:14px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#003A52; padding-bottom: 8px;">
                                                <b>Sponsored content</b>
                                              </td>
                                            </tr>
                                            <!--[------ Divider start ------]-->
                                            <tr>
                                              <td align="center"
                                                valign="top"
                                                style="margin: 0;padding-bottom: 16px;">
                                                <table align="center"
                                                  border="0"
                                                  cellspacing="0"
                                                  cellpadding="0"
                                                  width="100%"
                                                  role="presentation"
                                                  style="width: 100%; max-width: 100%; padding: 0; margin: 0;">
                                                  <tr>
                                                    <td height="1"
                                                      style="padding-top: 1px; height: 1px; border-bottom: 1px solid #F1EBDC;">
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                            <!--[------ Divider / end ------]-->
                                            <tr>
                                              <td style="font-family:'Arial Hebrew Scholar', 'Arial Hebrew', David, Arial, sans-serif;font-size:14px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#003A52; padding-bottom: 8px;">
                                                <a href="urlhere"
                                                  style="font-family:'Arial Hebrew Scholar', 'Arial Hebrew', David, Arial, sans-serif;text-decoration: underline;font-weight: 700; color: #007A9B;">
                                                  Viverra nulla mattis quis nascetur donec neque, vulputate eget quam.
                                                </a>
                                              </td>
                                            </tr>
                                            <tr>
                                              <td style="font-family:'Arial Hebrew Scholar', 'Arial Hebrew', David, Arial, sans-serif;font-size:12px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#003A52;">
                                                By Partner Name
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                                <!-- item / end -->
                              </table>
                            </td>
                          </tr>
                          <!--[------ Note / end ------]-->
                          <!--[------ Content start ------]-->
                          <tr>
                            <td style="margin: 0; padding: 0;">
                              <!--=== PROMO-COPY ===-->
                              <table width="100%"
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                role="presentation"
                                style="max-width: 100%;">
                                <tr>
                                  <td align="center"
                                    valign="top">
                                    <table class="primary-table-limit content-table"
                                      bgcolor="#ffffff"
                                      border="0"
                                      cellspacing="0"
                                      cellpadding="0"
                                      role="presentation"
                                      width="100%"
                                      style="max-width: 600px;">
                                      <tr>
                                        <td class="content-vertical-space"
                                          align="center"
                                          style="padding-left: 20px; padding-right: 20px;">
                                          <table class="content-inner-table"
                                            border="0"
                                            cellspacing="0"
                                            role="presentation"
                                            cellpadding="0"
                                            width="100%"
                                            style="width: 100%;">
                                            <tr>
                                              <td height="16"
                                                width="100%"
                                                style="max-width: 100%"
                                                class="md-horizontal-space"></td>
                                            </tr>
                                            <tr>
                                              <td align="left"
                                                style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:24px;font-style:normal;font-weight:bold;line-height:1.5;text-align:left;color:#000000;padding-top: 14px; padding-bottom: 14px;">
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
                                              <td height="16"
                                                width="100%"
                                                style="max-width: 100%"
                                                class="md-horizontal-space"></td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                              <!--=== PROMO-COPY-end ===-->
                            </td>
                          </tr>
                          <!--[------ Content / end ------]-->
                          <!--[------ Note start ------]-->
                          <tr>
                            <td align="center"
                              style="padding-right: 20px; padding-left: 20px; padding-top: 0px; padding-bottom: 24px;">
                              <table align="center"
                                border="0"
                                bgcolor="#EFF8F9"
                                cellspacing="0"
                                cellpadding="0"
                                width="552"
                                style="width: 100%; max-width:552px; padding: 0; margin: 0"
                                role="presentation">
                                <tr>
                                  <td align="center"
                                    style="padding-right: 16px; padding-left: 16px; padding-top: 22px; padding-bottom: 22px;">
                                    <table align="center"
                                      border="0"
                                      cellspacing="0"
                                      cellpadding="0"
                                      width="100%"
                                      style="width: 100%; max-width:100%; padding: 0; margin: 0"
                                      role="presentation">
                                      <tr>
                                        <td align="center"
                                          style="font-family: 'Arial Hebrew Scholar', 'Arial Hebrew', David, Arial, sans-serif;font-size:18px;font-style:normal;font-weight:bold;line-height:1.5;text-align:center;color:#003743;padding-bottom: 20px; text-transform: uppercase;">
                                          <b> Lorem ipsum dolor sit amet consectetur.</b>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td align="center"
                                          style="font-family: 'Arial Hebrew Scholar', 'Arial Hebrew', David, Arial, sans-serif;font-size:16px;font-style:normal;font-weight:300;line-height:1.5;text-align:left;color:#003743;padding-bottom: 20px;">
                                          Arcu, vitae ullamcorper interdum nulla nulla volutpat massa. Faucibus tellus, eu, adipiscing rutrum mattis magna sollicitudin lectus pellentesque. Nec ipsum ornare suspendisse lectus. Viverra nulla mattis quis nascetur donec neque, vulputate eget quam. Facilisis diam vitae, cursus egestas diam amet sagittis nibh nec. Arcu, vitae ullamcorper interdum nulla nulla volutpat massa. Faucibus tellus, eu, adipiscing rutrum mattis magna sollicitudin lectus pellentesque.
                                          Nec ipsum ornare suspendisse lectus. Viverra nulla mattis quis nascetur donec neque, vulputate eget quam. Facilisis diam vitae, cursus egestas diam amet sagittis nibh nec.
                                          <br><br>
                                          Arcu, vitae ullamcorper interdum nulla nulla volutpat massa. Faucibus tellus, eu, adipiscing rutrum mattis magna sollicitudin lectus pellentesque. .
                                          Massa, id vitae sem tellus. Aliquam et facilisi libero tellus tellus neque blandit. Orci at dolor nulla nam. Commodo dignissim luctus fringilla lacus, pulvinar. Non pulvinar ullamcorper diam massa. Senectus congue mi, aliquam scelerisque ac, mauris, adipiscing tristique.
                                          <br><br>
                                          Arcu, vitae ullamcorper interdum nulla nulla volutpat massa. Faucibus tellus, eu, adipiscing rutrum mattis magna sollicitudin lectus pellentesque. Nec ipsum ornare suspendisse lectus. Viverra nulla mattis quis nascetur donec neque, vulputate eget quam. Facilisis diam vitae, cursus egestas diam amet sagittis nibh nec. Arcu, vitae ullamcorper interdum nulla nulla volutpat massa. Faucibus tellus, eu, adipiscing rutrum mattis magna sollicitudin lectus pellentesque.
                                          Nec ipsum ornare suspendisse lectus. Viverra nulla mattis quis nascetur donec neque, vulputate eget quam. Facilisis diam vitae, cursus egestas diam amet sagittis nibh nec.
                                        </td>
                                      </tr>
                                      <!--[------ Button start ------]-->
                                      <tr>
                                        <td align="center"
                                          valign="top"
                                          style="margin: 0;padding: 0;">
                                          <table border="0"
                                            cellpadding="0"
                                            cellspacing="0"
                                            width="210"
                                            role="presentation"
                                            style="margin: 0; padding: 0; border-spacing: 0; border-collapse: separate; width: 100%; max-width: 210px;background-color: #325E70;">
                                            <tr>
                                              <td height="40"
                                                align="center"
                                                valign="middle"
                                                style="margin: 0; padding: 0;">
                                                <a href="urlhere"
                                                  target="_blank"
                                                  style="display: block; padding-top: 12px; padding-bottom: 12px; padding-left: 6px; padding-right: 6px; color: #ffffff; font-family: 'Arial Black', sans-serif; font-size: 14px; font-weight: 700; line-height: 1; text-align: center; text-decoration: none; text-transform: none;">
                                                  LEARN MORE
                                                </a>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                      <!--[------ Button / end ------]-->
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <!--[------ Note / end ------]-->
                          <!--[------ Divider start ------]-->
                          <tr>
                            <td align="center"
                              style="padding-right: 20px; padding-left: 20px; padding-bottom: 24px;">
                              <table align="center"
                                border="0"
                                cellspacing="0"
                                cellpadding="0"
                                width="552"
                                style="width: 100%; max-width:552px; padding: 0; margin: 0; border-bottom: 2px solid #325E70;"
                                role="presentation">
                                <!--[------ Logo start ------]-->
                                <tr>
                                  <td align="left"
                                    valign="top"
                                    style="margin: 0; padding: 0;">
                                    <a href="urlhere"
                                      target="_blank"
                                      style="padding: 0; margin: 0; border: 0; text-decoration: none;">
                                      <img width="214"
                                        src="https://storage.5th-elementagency.com/files/templates/america-health-mail-2-v1/divider-logo.png"
                                        alt="Logo"
                                        style="width: 214px; max-width: 214px; border: 0; display: block; outline: none; text-decoration: none; height: auto; font-size: 13px;" />
                                    </a>
                                  </td>
                                </tr>
                                <!--[------ Logo / end ------]-->
                              </table>
                            </td>
                          </tr>
                          <!--[------ Divider / end ------]-->
                          <!--[------ Note start ------]-->
                          <tr>
                            <td class="sm-pb-4"
                              style="padding-right: 20px; padding-left: 20px; padding-bottom: 26px;">
                              <table border="0"
                                cellspacing="0"
                                cellpadding="0"
                                role="presentation"
                                width="564"
                                style="width: 100%; max-width: 564px; font-size: 0; line-height: 0; mso-line-height-rule:exactly; text-align: center;">
                                <tr>
                                  <td valign="top"
                                    align="center"
                                    class="xs-w-full"
                                    width="50%"
                                    style="display: inline-block; width: 50%; max-width: 100%; min-width: 100px;font-size: 0; line-height: 0; mso-line-height-rule:exactly;">
                                    <table border="0"
                                      cellspacing="0"
                                      cellpadding="0"
                                      role="presentation"
                                      width="100%"
                                      style="width: 100%;">
                                      <tr>
                                        <td align="center"
                                          style="padding-right: 6px; padding-left: 6px; padding-top: 6px; padding-bottom: 6px;">
                                          <table align="center"
                                            border="0"
                                            bgcolor="#FFF9E9"
                                            cellspacing="0"
                                            cellpadding="0"
                                            width="100%"
                                            style="width: 100%; max-width:100%; padding: 0; margin: 0"
                                            role="presentation">
                                            <tr>
                                              <td align="center"
                                                style="padding-right: 16px; padding-left: 16px; padding-top: 16px; padding-bottom: 16px;">
                                                <table align="center"
                                                  border="0"
                                                  cellspacing="0"
                                                  cellpadding="0"
                                                  width="100%"
                                                  style="width: 100%; max-width:100%; padding: 0; margin: 0"
                                                  role="presentation">
                                                  <tr>
                                                    <td style="font-family:Arial, Helvetica, sans-serif;font-size:16px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#003A52; padding-bottom: 8px;">
                                                      Sponsored content
                                                    </td>
                                                  </tr>
                                                  <!--[------ Divider start ------]-->
                                                  <tr>
                                                    <td align="center"
                                                      valign="top"
                                                      style="margin: 0;padding-bottom: 16px;">
                                                      <table align="center"
                                                        border="0"
                                                        cellspacing="0"
                                                        cellpadding="0"
                                                        width="100%"
                                                        role="presentation"
                                                        style="width: 100%; max-width: 100%; padding: 0; margin: 0;">
                                                        <tr>
                                                          <td height="1"
                                                            style="padding-top: 1px; height: 1px; border-bottom: 1px solid #F1EBDC;">
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                  <!--[------ Divider / end ------]-->
                                                  <tr>
                                                    <td style="font-family:'Arial Hebrew Scholar', 'Arial Hebrew', David, Arial, sans-serif;font-size:14px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#003A52; padding-bottom: 8px;">
                                                      <a href="urlhere"
                                                        style="font-family:'Arial Hebrew Scholar', 'Arial Hebrew', David, Arial, sans-serif;text-decoration: underline;font-weight: 700; color: #007A9B;">
                                                        Daily Skincare Rituals for Healthy Glow
                                                      </a>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td style="font-family:'Arial Hebrew Scholar', 'Arial Hebrew', David, Arial, sans-serif;font-size:12px;font-style:normal;font-weight:normal;line-height:1.5;text-align:right;color:#003A52;">
                                                      By Partner Name
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                  <td valign="top"
                                    align="center"
                                    class="xs-w-full"
                                    width="50%"
                                    style="display: inline-block; width: 50%; max-width: 100%; min-width: 100px;font-size: 0; line-height: 0; mso-line-height-rule:exactly;">
                                    <table border="0"
                                      cellspacing="0"
                                      cellpadding="0"
                                      role="presentation"
                                      width="100%"
                                      style="width: 100%;">
                                      <tr>
                                        <td align="center"
                                          style="padding-right: 6px; padding-left: 6px; padding-top: 6px; padding-bottom: 6px;">
                                          <table align="center"
                                            border="0"
                                            bgcolor="#FFF9E9"
                                            cellspacing="0"
                                            cellpadding="0"
                                            width="100%"
                                            style="width: 100%; max-width:100%; padding: 0; margin: 0"
                                            role="presentation">
                                            <tr>
                                              <td align="center"
                                                style="padding-right: 16px; padding-left: 16px; padding-top: 16px; padding-bottom: 16px;">
                                                <table align="center"
                                                  border="0"
                                                  cellspacing="0"
                                                  cellpadding="0"
                                                  width="100%"
                                                  style="width: 100%; max-width:100%; padding: 0; margin: 0"
                                                  role="presentation">
                                                  <tr>
                                                    <td style="font-family:Arial, Helvetica, sans-serif;font-size:16px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#003A52; padding-bottom: 8px;">
                                                      Sponsored content
                                                    </td>
                                                  </tr>
                                                  <!--[------ Divider start ------]-->
                                                  <tr>
                                                    <td align="center"
                                                      valign="top"
                                                      style="margin: 0;padding-bottom: 16px;">
                                                      <table align="center"
                                                        border="0"
                                                        cellspacing="0"
                                                        cellpadding="0"
                                                        width="100%"
                                                        role="presentation"
                                                        style="width: 100%; max-width: 100%; padding: 0; margin: 0;">
                                                        <tr>
                                                          <td height="1"
                                                            style="padding-top: 1px; height: 1px; border-bottom: 1px solid #F1EBDC;">
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                  <!--[------ Divider / end ------]-->
                                                  <tr>
                                                    <td style="font-family:'Arial Hebrew Scholar', 'Arial Hebrew', David, Arial, sans-serif;font-size:14px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#003A52; padding-bottom: 8px;">
                                                      <a href="urlhere"
                                                        style="font-family:'Arial Hebrew Scholar', 'Arial Hebrew', David, Arial, sans-serif;text-decoration: underline;font-weight: 700; color: #007A9B;">
                                                        Daily Skincare Rituals for Healthy Glow
                                                      </a>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td style="font-family:'Arial Hebrew Scholar', 'Arial Hebrew', David, Arial, sans-serif;font-size:12px;font-style:normal;font-weight:normal;line-height:1.5;text-align:right;color:#003A52;">
                                                      By Partner Name
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <!--[------ Note / end ------]-->
                          <!--[------ Editor start ------]-->
                          <tr>
                            <td align="center"
                              style="padding-right: 20px; padding-left: 20px; padding-bottom: 24px;">
                              <table align="center"
                                border="0"
                                cellspacing="0"
                                cellpadding="0"
                                width="552"
                                style="width: 100%; max-width:552px; padding: 0; margin: 0"
                                role="presentation">
                                <tr>
                                  <td align="left"
                                    valign="bottom"
                                    style="padding-right: 16px; padding-left: 16px; margin: 0;">
                                    <img alt="---"
                                      height="auto"
                                      src="https://storage.5th-elementagency.com/files/templates/america-health-mail-2-v1/editor-quote-top.png"
                                      style="border:0; display:block; outline:none;text-decoration:none; height:auto; width:36px;max-width: 36px; font-size:13px;"
                                      width="36" />
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center"
                                    bgcolor="#FFF9E9">
                                    <table align="center"
                                      border="0"
                                      cellspacing="0"
                                      cellpadding="0"
                                      width="100%"
                                      style="width: 100%; max-width:100%; padding: 0; margin: 0;background-image: url(https://storage.5th-elementagency.com/files/templates/america-health-mail-2-v1/editor-bg.png); background-repeat: no-repeat; background-position: center top;"
                                      role="presentation">
                                      <tr>
                                        <td align="left"
                                          valign="top"
                                          style="padding-right: 16px; padding-left: 16px; margin: 0;">
                                          <img alt="---"
                                            height="auto"
                                            src="https://storage.5th-elementagency.com/files/templates/america-health-mail-2-v1/editor-quote-bot.png"
                                            style="border:0; display:block; outline:none;text-decoration:none; height:auto; width:36px;max-width: 36px; font-size:13px;"
                                            width="36" />
                                        </td>
                                      </tr>
                                      <tr>
                                        <td style="font-family:'Arial Hebrew Scholar', Arial, Helvetica, sans-serif;font-size:14px;font-style:normal;font-weight:normal;line-height:1.5;text-align:center;color:#365373;padding-top: 16px; padding-bottom: 16px; padding-right: 16px; padding-left: 16px;">
                                          <b style="font-size: 16px;">EDITORS NOTE</b>
                                          <br><br>
                                          Dolor sit amet, consectetur adipiscing elit. A sed vestibulum urna pellentesque aliquam ornare consequat, neque, amet. Venenatis et lobortis dignissim pellentesque fusce.
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <!--[------ Editor / end ------]-->
                          <!--[------ Footer-top start ------]-->
                          <tr>
                            <td align="center"
                              style="padding-right: 12px; padding-left: 12px; padding-bottom: 8px;">
                              <table align="center"
                                border="0"
                                cellspacing="0"
                                cellpadding="0"
                                width="568"
                                style="width: 100%; max-width:568px; padding: 0; margin: 0"
                                role="presentation">
                                <tr>
                                  <td style="font-family:'Arial Hebrew Scholar', Arial, Helvetica, sans-serif;font-size:12px;font-style:normal;font-weight:normal;line-height:1.5;text-align:center;color:#000000;padding-bottom: 24px; padding-right: 8px; padding-left: 8px;">
                                    Evidence-based. Reader-first. <br>
                                    Your trusted source for health and wellness news. <br>
                                    Domain Name is a health-focused digital publication operated by Harbor Wealth LLC.
                                    <br><br>
                                    136 E 2nd St, Casper, WY 82601
                                    <br><br>
                                    <a href="mailto:support@domainname.com"
                                      style="font-family:'Arial Hebrew Scholar', Arial, Helvetica, sans-serif;text-decoration: underline;font-weight: 700; color: #000000;">
                                      support@domainname.com
                                    </a>
                                  </td>
                                </tr>
                                <!--=== Buttons ===-->
                                <tr>
                                  <td style="margin: 0; padding: 0">
                                    <table border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      width="100%"
                                      style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; min-width: 100%; font-size: 0; text-align: center">
                                      <tr>
                                        <td class="footer-button"
                                          width="186"
                                          style="margin: 0; padding: 0; display: inline-block; vertical-align: top; font-size: 0; width: 186px">
                                          <table border="0"
                                            cellpadding="0"
                                            cellspacing="0"
                                            width="100%"
                                            style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; min-width: 100%">
                                            <tr>
                                              <td class="footer-button-pad"
                                                style="margin: 0; padding-right: 8px; padding-bottom: 16px; padding-left: 8px">
                                                <table border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="margin: 0; padding: 0; border-spacing: 0; border-collapse: separate; min-width: 100%; border: 1px solid #365373; border-radius: 25px">
                                                  <tr>
                                                    <td height="34"
                                                      align="center"
                                                      style="margin: 0; padding: 0; color: #365373; text-align: center; font-family: 'Arial Hebrew Scholar', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; line-height: 1;">
                                                      <a href="urlhere"
                                                        style="color: #365373; text-align: center; font-family: 'Arial Hebrew Scholar', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; line-height: 1; text-decoration: none; display: block; padding-top: 9px; padding-bottom: 9px; padding-right: 6px; padding-left: 6px;">
                                                        Privacy Policy
                                                      </a>
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                        <td class="footer-button"
                                          width="186"
                                          style="margin: 0; padding: 0; display: inline-block; vertical-align: top; font-size: 0; width: 186px">
                                          <table border="0"
                                            cellpadding="0"
                                            cellspacing="0"
                                            width="100%"
                                            style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; min-width: 100%">
                                            <tr>
                                              <td class="footer-button-pad"
                                                style="margin: 0; padding-right: 8px; padding-bottom: 16px; padding-left: 8px">
                                                <table border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="margin: 0; padding: 0; border-spacing: 0; border-collapse: separate; min-width: 100%; border: 1px solid #365373; border-radius: 25px">
                                                  <tr>
                                                    <td height="34"
                                                      align="center"
                                                      style="margin: 0; padding: 0; color: #365373; text-align: center; font-family: 'Arial Hebrew Scholar', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; line-height: 1;">
                                                      <a href="urlhere"
                                                        style="color: #365373; text-align: center; font-family: 'Arial Hebrew Scholar', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; line-height: 1; text-decoration: none; display: block; padding-top: 9px; padding-bottom: 9px; padding-right: 6px; padding-left: 6px;">
                                                        Terms &amp; Conditions
                                                      </a>
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                        <td class="footer-button"
                                          width="186"
                                          style="margin: 0; padding: 0; display: inline-block; vertical-align: top; font-size: 0; width: 186px">
                                          <table border="0"
                                            cellpadding="0"
                                            cellspacing="0"
                                            width="100%"
                                            style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; min-width: 100%">
                                            <tr>
                                              <td class="footer-button-pad"
                                                style="margin: 0; padding-right: 8px; padding-bottom: 16px; padding-left: 8px">
                                                <table border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  width="100%"
                                                  style="margin: 0; padding: 0; border-spacing: 0; border-collapse: separate; min-width: 100%; border: 2px solid #365373; border-radius: 25px">
                                                  <tr>
                                                    <td height="32"
                                                      align="center"
                                                      style="margin: 0; padding: 0; color: #365373; text-align: center; font-family: 'Arial Hebrew Scholar', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 700; line-height: 1;">
                                                      <a href="urlhere"
                                                        style="color: #365373; text-align: center; font-family: 'Arial Hebrew Scholar', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 700; line-height: 1; text-decoration: none; display: block; padding-top: 9px; padding-bottom: 9px; padding-right: 6px; padding-left: 6px;">
                                                        Unsubscribe
                                                      </a>
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                                <!--=== Buttons-end ===-->
                              </table>
                            </td>
                          </tr>
                          <!--[------ Footer-top / end ------]-->
                        </table>
                        <!--[ Inner / end ]-->
                      </td>
                    </tr>
                    <!--[------ Footer-bot start ------]-->
                    <tr>
                      <td align="center">
                        <table align="center"
                          border="0"
                          cellspacing="0"
                          cellpadding="0"
                          width="702"
                          style="width: 100%; max-width:702px; padding: 0; margin: 0;background-image: url(https://storage.5th-elementagency.com/files/templates/america-health-mail-2-v1/footer-env-bot.png); background-position: center bottom; background-repeat: no-repeat;"
                          role="presentation">
                          <tr>
                            <td align="center">
                              <table align="center"
                                border="0"
                                bgcolor="#ffffff"
                                cellspacing="0"
                                cellpadding="0"
                                width="600"
                                style="width: 100%; max-width:600px; padding: 0; margin: 0;"
                                role="presentation">
                                <tr>
                                  <td class="footer-bg-mob footer-pad-bot"
                                    align="center"
                                    style="padding-right: 20px; padding-left: 20px; padding-bottom: 256px;background-image: url(https://storage.5th-elementagency.com/files/templates/america-health-mail-2-v1/footer-env-top.png); background-position: center bottom; background-size: 100% auto; background-repeat: no-repeat;">
                                    <table align="center"
                                      border="0"
                                      cellspacing="0"
                                      cellpadding="0"
                                      width="420"
                                      style="width: 100%; max-width:420px; padding: 0; margin: 0"
                                      role="presentation">
                                      <tr>
                                        <td style="font-family:'Arial Hebrew Scholar', Arial, Helvetica, sans-serif;font-size:12px;font-style:normal;font-weight:normal;line-height:1.5;text-align:center;color:#000000;padding-bottom: 24px; padding-right: 8px; padding-left: 8px;">
                                          Advertisement: This email contains promotional content.
                                          <br><br>
                                          &copy; 2026 Domain Name. All rights reserved.
                                          <br><br>
                                          This email is published for informational and educational purposes only.
                                          Nothing in this content constitutes medical advice, diagnosis,
                                          or a recommendation for any course of treatment.
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <!--[------ Footer-bot / end ------]-->
                    <!--[------ Spacer start ------]-->
                    <tr>
                      <td class="spacer-hide"
                        height="44"
                        style="margin: 0; padding: 0; height: 44px; line-height: 44px; font-size: 0;">
                      </td>
                    </tr>
                    <!--[------ Spacer / end ------]-->
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

</html>

---

## Блок 2 — Контентний контейнер (Frame)

Блок, у який кладуться текст/зображення. У Stage 1 — лише один такий контейнер, без вкладеності.

### 2.1 Розмітка
```html
   <!--[------ Section start ------]-->
                       <tr>
                         <td align="center"
                           style="padding-right: 20px; padding-left: 20px; padding-top: 32px; padding-bottom: 24px;">
                           <table align="center"
                             border="0"
                             cellspacing="0"
                             cellpadding="0"
                             width="552"
                             style="width: 100%; max-width:552px; padding: 0; margin: 0"
                             role="presentation">
                             
                           </table>
                         </td>
                       </tr>
                       <!--[------ Section / end ------]-->
```

### 2.2 Що в ній динамічне?
- [x ] Padding (top/right/bottom/left) — усі 4 сторони незалежно, чи одне значення на всі?
- [ x] Фон контейнера (колір) — суцільний, чи потрібен градієнт?
- [ x] Рамка (border) — потрібна в Stage 1, чи можна відкласти?
- [ x] Corner-radius (закруглені кути) — потрібен у Stage 1?
- [x ] Тінь (shadow) — потрібна у Stage 1?
- [ x] Ширина контейнера —  теж редагована окремо (менше за ширину шелла, з центруванням)?

### 2.3 Gap між дітьми
Коли в контейнері кілька дітей (текст + зображення) — відступ між ними: через `padding-bottom` на не-останній дитині (як у вже існуючому figmaImport-конвеєрі), чи інакше?
`padding-bottom`

---

## Блок 3 — Текст

### 3.1 Розмітка
```html
     <tr>
                               <td style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-bottom: 14px;">
<a href="urlhere"
   style="font-family:'Roboto', Arial, Helvetica, sans-serif;text-decoration: underline;font-weight: 700; color: #0000EE;">

</a>
                               </td>
                             </tr>
```

### 3.2 Що в ній динамічне?
- [ x] Сам текст — простий рядок, чи потрібна підтримка кількох абзаців?
- [ x] Кілька стилів В ОДНОМУ абзаці (напр. частина тексту — лінк іншим кольором) — потрібно в Stage 1, чи один стиль на весь текстовий блок?
- [ x] Розмір шрифту — px, редагований в UI?
- [x ] Вага шрифту (bold/normal чи числова 100-900)?
- [ x] Колір тексту?
- [x ] Вирівнювання (left/center/right)?
- [x ] Лінк на весь текстовий блок (href) — потрібен у Stage 1?
- [ x] Шрифт —  можна перевизначити на рівні конкретного текстового блока?

---

## Блок 4 — Зображення

### 4.1 Розмітка
```html
  <tr>
                               <td class="img-bg-block" align="center"
                                   style="padding-bottom: 14px;">
                                 <a href="urlhere" target="_blank">
                                   <img alt="Video preview" height="auto"
                                        src="https://storage.5th-elementagency.com/files/"
                                        style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;max-width: 560px;font-size:13px;"
                                        width="560"/>
                                 </a>
                               </td>
                             </tr>
```

### 4.2 Що в ній динамічне?
- [x ] `src` — завжди плейсхолдер, що замінюється пізніше через флоу завантаження?
- [x ] `alt` — редагований текст?
- [x ] Ширина зображення — px, чи `%` від контейнера?
- [x ] Посилання (`href urlhere`, зображення-як-кнопка) — потрібне в Stage 1?
- [- ] `aspectRatio`/висота — потрібна явна висота, чи природна? пізніше

---

## Загальні питання (не про конкретний блок)

### 5.1 Редагування тексту в UI
Просте текстове поле (`<textarea>`), чи потрібен інлайн rich-text (bold/italic/лінк прямо в тексті) вже в Stage 1?
що буде краще

### 5.2 Категорія темплейту при збереженні
У проєкті вже є фіксовані категорії: `Newsletter | Transactional | Marketing | Internal | Other` (`src/types/template.ts`). Використовуємо їх для Stage 1, чи потрібно щось інше?
зараз скачування темплейта без категорії

### 5.3 Одиниці / округлення
У вже існуючому figmaImport-конвеєрі є правило "округлення px-полів до кратного 4" (padding/gap/fontSize/...). Застосовувати те саме правило тут, чи довільні px-значення без округлення?
без заокруглення

### 5.4 Placeholder-URL для зображень
Якщо зображення — плейсхолдер (не реальний src), який саме URL/константу використовувати? (Existing storage-провайдери в проєкті: `default`/`alphaone`/`ttt`/`red` — чи прив'язуватись до одного з них, чи власний нейтральний плейсхолдер для Builder?)
https://storage.5th-elementagency.com/files/
---

Коли заповните — просто напишіть "готово" або скажіть, які секції вже готові, а які ще ні.
