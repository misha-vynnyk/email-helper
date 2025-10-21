import { EmailBlock } from '../types/block';

const NoteSponsoredContent: EmailBlock = {
  id: 'note-sponsored-content',
  name: 'Note Sponsored content',
  category: 'Custom',
  keywords: ['note', 'sponsored', 'content', 'sponsored content', 'link with dots', 'dots'],
  preview: '',
  html: `
<!--=============== Note ===============-->
                          <tr>
                            <td align="center"
                              bgcolor="#ffffff"
                              style="padding-top: 10px; padding-right: 16px; padding-left: 16px; padding-bottom: 12px; background-color: #ffffff">
                              <table align="center"
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                width="100%"
                                style="width: 100%; max-width: 552px">
                                <tr>
                                  <td align="left"
                                    style="padding-right: 10px; margin: 0; color: #747474; font-family: 'Roboto', Arial, Helvetica, sans-serif; font-size: 14px; font-style: normal; font-weight: 500; line-height: 1.2; text-transform: uppercase;">
                                    <span style="padding: 0; margin: 0; color: #747474; font-family: 'Roboto', Arial, Helvetica, sans-serif; font-size: 14px; font-style: normal; font-weight: 500; line-height: 1.2; text-transform: uppercase;">Sponsored Content</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td class="note-padding"
                              align="center"
                              bgcolor="#ffffff"
                              style="padding-right: 16px; padding-left: 16px; padding-bottom: 24px;">
                              <table border="0"
                                cellpadding="0"
                                cellspacing="0"
                                bgcolor="#F8F8F8"
                                width="100%"
                                style="width: 100%; max-width: 552px; background-color: #F8F8F8; border: 1px solid #E8E8E8; border-radius: 4px; border-collapse: separate;">
                                <tr>
                                  <td align="left"
                                    valign="top"
                                    width="25"
                                    style="width: 25px; max-width: 25px; color: #6E3C9F; margin: 0; font-family: 'Montserrat', Arial, Helvetica, sans-serif; font-size: 16px; font-style: normal; font-weight: 00; line-height: 1.5; padding-top: 24px; padding-bottom: 8px; padding-left: 10px;">•</td>
                                  <td align="left"
                                    style=" margin: 0; color: #ADADAD; font-family: 'Montserrat', Arial, Helvetica, sans-serif; font-size: 16px; font-style: normal; font-weight: 400; line-height: 1.5; padding-top: 24px; padding-bottom: 8px; padding-right: 15px;">
                                    <a href="urlhere"
                                      target="_blank"
                                      style="padding: 0; margin: 0; color: #6E3C9F; font-family: 'Montserrat', Arial, Helvetica, sans-serif; font-size: 16px; font-style: normal; font-weight: 700; line-height: 1.5; text-decoration: underline">Aliquam et facilisi libero tellus tellus neque blandit.</a> <br>
                                    (partner’s name)
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <!--=============== Note-end ===============-->
  `.trim(),
  createdAt: Date.now(),
};

export default NoteSponsoredContent;
