/**
 * Email Template for Block Previews
 */

export const EMAIL_TEMPLATE = `<!DOCTYPE html
PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  lang="en">

  <head>
    <meta http-equiv="Content-Type"
      content="text/html; charset=utf-8" />
    <title>Email Preview</title>
    <meta name="viewport"
      content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect"
      href="https://fonts.googleapis.com">
    <link rel="preconnect"
      href="https://fonts.gstatic.com"
      crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap"
      rel="stylesheet">
    <link rel="stylesheet"
      href="https://use.typekit.net/gwv4ydc.css">
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

      table td {
        border-collapse: collapse;
      }

      table {
        border-collapse: collapse;
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
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

        .horizontal-space {
          display: none !important;
        }
      }
    </style>
    <!--[if (gte mso 9)|(IE)]>
  <style type="text/css">
    table {
      border-collapse: collapse !important;
    }
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

  <body style="margin: 0; padding: 0; background-color: #ffffff">
    <center>
      <table bgcolor="#ffffff"
        border="0"
        cellpadding="0"
        cellspacing="0"
        width="100%"
        style="border-spacing: 0; border-collapse: collapse; background-color: #ffffff; min-width: 100%">
        <tr>
          <td align="center"
            valign="top"
            style="margin-left: 0; margin-right: 0; margin-top: 0; margin-bottom: 0; padding-left: 0; padding-right: 0; padding-top: 0; padding-bottom: 0">
            <table class="main-bg"
              bgcolor="#232931"
              border="0"
              cellpadding="0"
              cellspacing="0"
              width="100%"
              style="border-spacing: 0; border-collapse: collapse; padding: 0; margin: 0; max-width: 1000px;background-color: #232931;">
              <tr>
                <td class="main-image-bg"
                  bgcolor="#ffffff"
                  style="margin: 0; padding: 0; background: url(); background-position: center bottom; background-repeat: repeat-y">
                  <table class="main-bg"
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    width="100%"
                    style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; min-width: 100%">
                    <!--[if mso | IE]>
                <tr>
                  <td align="center">
                    <table class="main-table" border="0"
                      cellspacing="0"
                      cellpadding="0"
                      width="600" style="width: 600px;max-width: 100%;">
                <![endif]-->
                    <tr>
                      <td align="center"
                        style="margin: 0; padding-left: 10px; padding-right: 10px;">
                        <table bgcolor="#ffffff"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          width="600"
                          style="border-spacing: 0; border-collapse: separate; padding: 0; margin: 0; max-width: 600px; width: 100%">
                        {{CONTENT}}
                        </table>
                      </td>
                    </tr>
                    <!--[if mso | IE]>
                    </table>
                  </td>
                </tr>
                <![endif]-->
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>`;

export const wrapInTemplate = (html: string): string => {
  return EMAIL_TEMPLATE.replace('{{CONTENT}}', html);
};
