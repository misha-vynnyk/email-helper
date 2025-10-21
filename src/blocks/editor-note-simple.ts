import { EmailBlock } from '../types/block';

const EditorNoteSimple: EmailBlock = {
  id: 'editor-note-simple',
  name: 'Editor note simple',
  category: 'Custom',
  keywords: ['editor', 'simple editor', 'only text'],
  preview: '',
  html: `
<!--=============== Editor ===============-->
                          <tr>
                            <td align="center"
                              style="padding-right: 20px; padding-left: 20px; padding-bottom: 24px;">
                              <table align="center"
                                border="0"
                                cellspacing="0"
                                cellpadding="0"
                                width="552"
                                style="width: 100%; max-width:552px; padding: 0; margin: 0; background-color: #DADDE0;"
                                role="presentation">
                                <tr>
                                  <td style="font-family:'Times New Roman', Arial, Helvetica, sans-serif;font-size:20px;font-style:normal;font-weight:700;line-height:1.5;text-align:center;color:#ECE9E2;padding-top: 2px; padding-bottom: 2px; background-color: #333333;">
                                    <span style="font-family:'Times New Roman', Arial, Helvetica, sans-serif;font-size:20px;font-style:normal;font-weight:700;line-height:1.5;text-align:center;color:#ECE9E2;">
                                      Editor's Note
                                    </span>
                                  </td>
                                </tr>
                                <tr>
                                  <td class="editor-text editor-text-pad"
                                    style="font-family:'Times New Roman', Arial, Helvetica, sans-serif;font-size:16px;font-style:normal;font-weight:700;line-height:1.5;text-align:left;color:#000000;padding-top: 27px; padding-bottom: 32px; padding-right: 16px; padding-left: 16px;">
                                    <span style="font-family:'Times New Roman', Arial, Helvetica, sans-serif;font-size:16px;font-style:normal;font-weight:700;line-height:1.5;text-align:left;color:#000000;">
                                      At times, our affiliate partners reach out to the Editors at The King of Stocks with special opportunities for our readers. The message below is one we think you should take a close, serious look at
                                    </span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <!--=============== Editor-end ===============-->
  `.trim(),
  createdAt: Date.now(),
};

export default EditorNoteSimple;
