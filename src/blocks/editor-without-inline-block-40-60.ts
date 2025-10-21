import { EmailBlock } from '../types/block';

const EditorWithoutInlineBlock4060: EmailBlock = {
  id: 'editor-without-inline-block-40-60',
  name: 'Editor without inline-block 40/60',
  category: 'Content',
  keywords: ['editor', 'image left', 'text right', '40/60', 'transparent bg'],
  preview: '',
  html: `
<!--=============== Editor ===============-->
  <tr>
    <td align="center"
      class="editor-pad"
      style="padding-bottom: 30px; padding-right: 10px; padding-left: 10px;">
      <table align="center"
        border="0"
        cellspacing="0"
        cellpadding="0"
        width="550"
        style="width: 100%; max-width:550px; padding: 0; margin: 0"
        role="presentation">
        <tr>
          <td valign="top"
            align="center"
            style="padding-right: 10px; padding-left: 10px; width: 36%;">
            <a href="urlhere"
              target="_blank">
              <img alt="Woman"
                height="auto"
                src="https://storage.5th-elementagency.com/files/templates/fit-as-fiddles-v1/editor-image.png"
                style="border:0; display:block; outline:none;text-decoration:none; height:auto; width:100%;max-width: 174px; font-size:13px;"
                width="174" />
            </a>
          </td>
          <td class="editor-text"
            style="font-family:'Montserrat', Arial, Helvetica, sans-serif;font-size:16px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-right: 10px; padding-left: 10px;">
            <span style="font-family:'Montserrat', Arial, Helvetica, sans-serif;font-size:16px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
              Balance, strength, and rhythm Fit as Fiddles brings you the best of both worlds. <br>
              The message above is in perfect harmony with what we love—check it out!
              <br><br>
              <b>
                Move with passion, play with heart, <br>
                Emma & Sophie Carter <br>
                Chief Editors of Fit as Fiddles
              </b>
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

export default EditorWithoutInlineBlock4060;
