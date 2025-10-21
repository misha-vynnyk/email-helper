import { EmailBlock } from '../types/block';

const Divider: EmailBlock = {
  id: 'divider',
  name: 'Divider',
  category: 'Custom',
  keywords: ['divider', 'divider-icon', 'divider-combi'],
  preview: '',
  html: `
<!--=============== Divider ===============-->
                          <tr>
                            <td class="divider-padding"
                              align="center"
                              style="margin: 0; padding-right: 20px; padding-left: 20px; padding-bottom: 30px;">
                              <table border="0"
                                cellpadding="0"
                                cellspacing="0"
                                width="520"
                                style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; width: 100%; max-width: 520px;">
                                <tr>
                                  <td width="40%"
                                    align="left"
                                    style="margin: 0; padding: 0; width: 45%;">
                                    <table border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      width="100%"
                                      style="width: 100%; max-width: 100%;">
                                      <tr>
                                        <td align="left"
                                          height="1"
                                          style="margin: 0; height: 1px; padding-top: 1px; border-bottom: 1px dashed #74A719;">
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                  <td align="center"
                                    style="margin: 0; padding-right: 13px; padding-left: 13px;">
                                    <img class="logo-divider"
                                      alt="Hearth"
                                      width="145"
                                      src="https://storage.5th-elementagency.com/files/templates/health-prime-goods-v1/divider-icon.png"
                                      style="border: 0 none; margin: 0; padding: 0; width: 35px; max-width: 35px; object-fit: contain; object-position: center; font-size: 0" />
                                  </td>
                                  <td width="45%"
                                    align="right"
                                    style="margin: 0; padding: 0; width: 40%;">
                                    <table border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      width="100%"
                                      style="width: 100%; max-width: 100%;">
                                      <tr>
                                        <td align="right"
                                          height="1"
                                          style="margin: 0; height: 1px; padding-top: 1px; border-bottom: 1px dashed #74A719;">
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <!--=============== Divider-end ===============-->
  `.trim(),
  createdAt: Date.now(),
};

export default Divider;
