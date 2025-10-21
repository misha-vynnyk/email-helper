import { EmailBlock } from '../types/block';

const EditorWithCustomFrame: EmailBlock = {
  id: 'editor-with-custom-frame',
  name: 'Editor with custom frame',
  category: 'Custom',
  keywords: ['editor', 'custom frame', 'background frame', 'editor name'],
  preview: '',
  html: `
<!--=============== Editor ===============-->
                                      <tr>
                                        <td align="center"
                                          class="editor-pad"
                                          style="padding-bottom: 10px; padding-right: 4px; padding-left: 4px;">
                                          <table align="center"
                                            border="0"
                                            cellspacing="0"
                                            cellpadding="0"
                                            width="100%"
                                            style="width: 100%; max-width: 100%; padding: 0; margin: 0;background-image: url(https://storage.5th-elementagency.com/files/templates/daily-market-clue-v1/editor-bg-top.png); background-position: top center; background-repeat: no-repeat; background-size: contain;"
                                            role="presentation">
                                            <tr>
                                              <td>
                                                <table border="0"
                                                  cellspacing="0"
                                                  role="presentation"
                                                  cellpadding="0"
                                                  width="100%"
                                                  style="width: 100%; padding: 0; margin: 0; background-image: url(https://storage.5th-elementagency.com/files/templates/daily-market-clue-v1/editor-icon.png); background-position: top left; background-repeat: no-repeat;">
                                                  <!--[if mso | IE]>
                                                  <tr>
                                                    <td align="left">
                                                      <table class="main-table" border="0"
                                                        cellspacing="0"
                                                        cellpadding="0"
                                                        width="210" style="width: 210px;max-width: 100%;">
                                                  <![endif]-->
                                                  <tr>
                                                    <td align="left"
                                                      style="padding-right: 30px; padding-left: 30px; ">
                                                      <table align="left"
                                                        border="0"
                                                        cellspacing="0"
                                                        cellpadding="0"
                                                        width="150"
                                                        style="width: 100%; max-width:150px; padding: 0; margin: 0; background-color: #515568;"
                                                        role="presentation">
                                                        <tr>
                                                          <td style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:16px;font-style:normal;font-weight:700;line-height:1.5;text-align:center;color:#F1ECE2;padding-top: 3px; padding-bottom: 3px; white-space: nowrap;text-transform: uppercase;">
                                                            <span style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:16px;font-style:normal;font-weight:700;line-height:1.5;text-align:center;color:#F1ECE2; white-space: nowrap; text-transform: uppercase;">
                                                              Editor Name
                                                            </span>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                  <!--[if mso | IE]>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                  <![endif]-->
                                                  <tr>
                                                    <td align="center">
                                                      <table align="center"
                                                        border="0"
                                                        cellspacing="0"
                                                        cellpadding="0"
                                                        width="100%"
                                                        style="width: 100%; max-width:100%; padding: 0; margin: 0;"
                                                        role="presentation">
                                                        <tr>
                                                          <td align="center"
                                                            style="padding-bottom: 36px;background-image: url(https://storage.5th-elementagency.com/files/templates/daily-market-clue-v1/editor-bg-bottom.png); background-position: bottom center; background-repeat: no-repeat; background-size: contain;">
                                                            <table align="center"
                                                              border="0"
                                                              cellspacing="0"
                                                              cellpadding="0"
                                                              width="100%"
                                                              style="width: 100%; max-width:100%; padding: 0; margin: 0;border-radius: 8px; background-image: url(https://storage.5th-elementagency.com/files/templates/daily-market-clue-v1/editor-pattern.png); background-position: center center; background-repeat: repeat-y; background-size: contain;"
                                                              role="presentation">
                                                              <tr>
                                                                <td style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:16px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#1F1F1F;padding-top: 17px; padding-right: 16px; padding-left: 16px;">
                                                                  <span style="font-family:'Roboto', Arial, Helvetica, sans-serif;font-size:16px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#1F1F1F;">
                                                                    Vestibulum auctor ornare leo, non suscipit magna interdum eu. Curabitur pellentesque nibh nibh, at maximus ante fermentum sit amet. Pellentesque commodo lacus at sodales sodales.
                                                                  </span>
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
                                      <!--=============== Editor-end ===============-->
  `.trim(),
  createdAt: Date.now(),
};

export default EditorWithCustomFrame;
