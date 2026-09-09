import type { ButtonNode, DividerLogoNode, DividerNode, HeaderImageNode } from "../../types";
import { PLACEHOLDER_IMAGE_SRC } from "../placeholder";
import { renderButton, renderButtonCell } from "../renderButton";
import { renderDivider } from "../renderDivider";
import { renderDividerLogo } from "../renderDividerLogo";
import { renderHeaderImage } from "../renderHeaderImage";

// Unlike renderNode.test.ts's toMatchSnapshot() (which only pins whatever the renderer
// currently outputs), these constants are copied verbatim from the user's own filled-in
// blocks in figma-to-html/content-blocks-template.html — the actual source of truth the
// snippet renderers were written against. The outer <tr><td class="button-pad">/<td
// align="center" valign="top"> gutter wrapper from each block is deliberately NOT included:
// every renderXxx() function explicitly excludes it (see the file-level comments in
// renderButton.ts/renderDivider.ts/renderDividerLogo.ts/renderHeaderImage.ts) — that
// spacing is the parent frame's responsibility, not the snippet's. Plain documentation
// comments the user left inside the template ("<!-- Line left -->" etc.) are dropped too,
// since they were never part of the renderable snippet; functional MSO conditional
// comments ("<!--[if !mso 9]><!-->") are kept because the renderer emits those verbatim.

// Collapses ALL whitespace runs (including newlines/indentation between attributes) to a
// single space, then strips any space touching a tag boundary on either side — which also
// removes the leading/trailing padding the source formatting leaves around inline text like
// "Learn more". None of these snippets rely on multi-space sequences inside an attribute
// value or on meaningful leading/trailing text whitespace, so this can't hide a real diff.
function normalize(html: string): string {
  return html
    .replace(/\s+/g, " ")
    .replace(/>\s+/g, ">")
    .replace(/\s+</g, "<")
    .trim();
}

// verified against the user's real footer-button markup on 2026-08-13 — this is now the
// canonical no-icon button, replacing the earlier button-no-icon shape from
// content-blocks-template.html. The outer neutral row wrapper (<tr><td style="margin:0;
// padding:0"><table ...font-size:0;text-align:center...>) that renderButton() adds around this
// cell is asserted separately below (see "renderButton: no-icon self-wraps in a neutral row").

const GOLDEN_BUTTON_NO_ICON_CELL = `
  <td class="footer-button" width="200"
    style="margin: 0; padding: 0; display: inline-block; vertical-align: top; font-size: 0; width: 200px;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%"
      style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; min-width: 100%;">
      <tr>
        <td class="footer-button-pad" style="margin: 0; padding-right: 10px; padding-bottom: 8px; padding-left: 10px;">
          <table border="0" bgcolor="#333333" cellpadding="0" cellspacing="0" width="100%"
            style="margin: 0; padding: 0; border-spacing: 0; border-collapse: separate; min-width: 100%; border-radius: 4px; background-color: #333333;">
            <tr>
              <td height="40" align="center"
                style="margin: 0; padding: 0; color: #ffffff; text-align: center; font-family: 'Roboto', sans-serif; font-size: 14px; font-weight: 700; line-height: 1;">
                <a href="urlhere"
                  style="color: #ffffff; text-align: center; font-family: 'Roboto', sans-serif; font-size: 14px; font-weight: 700; line-height: 1; text-decoration: none; display: block; padding-top: 12px; padding-bottom: 12px; padding-right: 6px; padding-left: 6px;">
                  Learn more
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
`;

// The <a> style below has one corrected byte vs. the raw template: the source has
// "line-height: normal;font-family:" with no space after that semicolon (a plain transcription
// typo, harmless to CSS parsing) — normalize() only collapses/strips existing whitespace, it
// can't insert a missing character, so the space is restored here rather than removed from
// renderButton.ts's already-correct output.
const GOLDEN_BUTTON_WITH_ICON_LEFT = `
  <table class="button" border="0" bgcolor="#333333" cellpadding="0" cellspacing="0" width="200"
    style="margin: 0; padding: 0; border-spacing: 0; border-collapse: separate; max-width: 200px; width: 100%; border-radius: 4px; background-color: #333333;">
    <tr>
      <td align="center" height="42"
        style="margin: 0; padding: 0; color: #ffffff; font-size: 16px; font-weight: 400; line-height: normal; font-family: 'Manrope', Arial, Helvetica, sans-serif; text-decoration: none;">
        <a href="urlhere" target="_blank"
          style="color: #ffffff; font-size: 16px; font-weight: 400; line-height: normal; font-family: 'Manrope', Arial, Helvetica, sans-serif; text-decoration: none; display: block;">
          <span style="display: table">
            <!--[if !mso 9]><!-->
            <span
              style="display: table-cell; vertical-align: middle; text-align: left; width: 30px; min-width: 30px; padding-right: 5px; padding-left: 5px;">
              <img alt="---" height="20" width="20"
                src="${PLACEHOLDER_IMAGE_SRC}"
                style="border: 0 none; margin: 0; padding: 0; width: 20px; height: 20px; object-fit: contain; object-position: center; font-size: 0" />
            </span>
            <!--<![endif]-->
            <span
              style="display: table-cell; vertical-align: middle; color: #ffffff; text-align: center; font-size: 16px; font-weight: 400; line-height: normal; text-decoration: none; font-family: 'Manrope', Arial, Helvetica, sans-serif; padding-left: 8px; padding-right: 8px; padding-top: 9px; padding-bottom: 9px;">Unsubscribe</span>
          </span>
        </a>
      </td>
    </tr>
  </table>
`;

const GOLDEN_BUTTON_WITH_ICON_RIGHT = `
  <table class="button" border="0" bgcolor="#333333" cellpadding="0" cellspacing="0" width="200"
    style="margin: 0; padding: 0; border-spacing: 0; border-collapse: separate; max-width: 200px; width: 100%; border-radius: 4px; background-color: #333333;">
    <tr>
      <td align="center" height="42"
        style="margin: 0; padding: 0; color: #ffffff; font-size: 16px; font-weight: 400; line-height: normal; font-family: 'Manrope', Arial, Helvetica, sans-serif; text-decoration: none;">
        <a href="urlhere" target="_blank"
          style="color: #ffffff; font-size: 16px; font-weight: 400; line-height: normal; font-family: 'Manrope', Arial, Helvetica, sans-serif; text-decoration: none; display: block;">
          <span style="display: table">
            <span
              style="display: table-cell; vertical-align: middle; color: #ffffff; text-align: center; font-size: 16px; font-weight: 400; line-height: normal; text-decoration: none; font-family: 'Manrope', Arial, Helvetica, sans-serif; padding-left: 8px; padding-right: 8px; padding-top: 9px; padding-bottom: 9px;">Unsubscribe</span>
            <!--[if !mso 9]><!-->
            <span
              style="display: table-cell; vertical-align: middle; text-align: left; width: 30px; min-width: 30px; padding-right: 5px; padding-left: 5px;">
              <img alt="---" height="20" width="20"
                src="${PLACEHOLDER_IMAGE_SRC}"
                style="border: 0 none; margin: 0; padding: 0; width: 20px; height: 20px; object-fit: contain; object-position: center; font-size: 0" />
            </span>
            <!--<![endif]-->
          </span>
        </a>
      </td>
    </tr>
  </table>
`;

const GOLDEN_DIVIDER_PLAIN = `
  <table align="center" border="0" cellspacing="0" cellpadding="0" width="100%" role="presentation"
    style="width: 100%; max-width: 100%; padding: 0; margin: 0;">
    <tr>
      <td height="1" style="padding-top: 1px; height: 1px; border-bottom: 1px solid #676767;">
      </td>
    </tr>
  </table>
`;

const GOLDEN_DIVIDER_LOGO = `
  <table border="0" cellpadding="0" cellspacing="0" width="520" role="presentation"
    style="margin: 0; padding: 0; border-spacing: 0; border-collapse: collapse; width: 100%; max-width: 520px;">
    <tr>
      <td width="45%" valign="middle" style="margin: 0; padding: 0; width: 45%;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="width: 100%;">
          <tr>
            <td height="1" style="margin: 0; height: 1px; padding-top: 1px; border-bottom: 1px solid #676767;"></td>
          </tr>
        </table>
      </td>
      <td align="center" valign="middle" style="margin: 0; padding-right: 13px; padding-left: 13px;">
        <img alt="Icon" width="35" src="${PLACEHOLDER_IMAGE_SRC}"
          style="border: 0; margin: 0; padding: 0; width: 35px; max-width: 35px; height: auto; display: block; object-fit: contain; object-position: center; font-size: 0;" />
      </td>
      <td width="45%" valign="middle" style="margin: 0; padding: 0; width: 45%;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="width: 100%;">
          <tr>
            <td height="1" style="margin: 0; height: 1px; padding-top: 1px; border-bottom: 1px solid #676767;"></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

const GOLDEN_HEADER_SINGLE_IMAGE = `
  <a href="urlhere" target="_blank"
    style="padding: 0; margin: 0; border: 0; text-decoration: none; display: block;">
    <img width="600" src="${PLACEHOLDER_IMAGE_SRC}" alt="Logo"
      style="display: block; margin: 0; padding: 0; border: 0; width: 100%; max-width: 600px; height: auto; object-position: center; object-fit: contain;" />
  </a>
`;

const buttonNoIconFixture: ButtonNode = {
  id: "btn-learn-more",
  type: "button",
  label: "Learn more",
  href: "urlhere",
  background: "#333333",
  textColor: "#ffffff",
  cornerRadius: 4,
  widthPx: 200,
  targetHeightPx: 40,
  fontFamily: "Roboto",
  fontSizePx: 14,
  fontWeight: 700,
  lineHeight: 1,
  paddingTopPx: 12,
  paddingBottomPx: 12,
  paddingLeftPx: 6,
  paddingRightPx: 6,
};

const buttonWithIconFixture: ButtonNode = {
  id: "btn-unsubscribe",
  type: "button",
  label: "Unsubscribe",
  href: "urlhere",
  background: "#333333",
  textColor: "#ffffff",
  cornerRadius: 4,
  widthPx: 200,
  targetHeightPx: 42,
  fontFamily: "Manrope",
  fontSizePx: 16,
  fontWeight: 400,
  lineHeight: 1,
  paddingTopPx: 9,
  paddingBottomPx: 9,
  paddingLeftPx: 8,
  paddingRightPx: 8,
  icon: {
    altDescription: "---",
    side: "left",
    gapPx: 5,
    widthPx: 20,
    heightPx: 20,
  },
};

const dividerFixture: DividerNode = { id: "divider-1", type: "divider", color: "#676767" };

const dividerLogoFixture: DividerLogoNode = {
  id: "divider-logo-1",
  type: "dividerLogo",
  widthPx: 520,
  lineColor: "#676767",
  iconAltDescription: "Icon",
  iconWidthPx: 35,
  iconGapPx: 13,
};

const headerImageFixture: HeaderImageNode = {
  id: "header-1",
  type: "headerImage",
  widthPx: 600,
  altDescription: "Logo",
  href: "urlhere",
};

describe("golden snippets — output matches the user's real markup verbatim", () => {
  it("renderButton: footer-button no-icon cell", () => {
    expect(normalize(renderButtonCell(buttonNoIconFixture))).toBe(normalize(GOLDEN_BUTTON_NO_ICON_CELL));
  });

  it("renderButton: no-icon self-wraps in a neutral row (no padding of its own)", () => {
    const html = renderButton(buttonNoIconFixture);
    expect(html).toContain('<tr><td style="margin: 0; padding: 0;">');
    expect(html).toContain('font-size: 0; text-align: center;');
    expect(normalize(html)).toContain(normalize(GOLDEN_BUTTON_NO_ICON_CELL));
  });

  it("renderButton: button-with-icon-left (unchanged internal markup, just self-wrapped)", () => {
    const html = renderButton(buttonWithIconFixture);
    expect(html.startsWith('<tr><td style="margin: 0; padding: 0;">')).toBe(true);
    expect(normalize(html)).toBe(normalize(`<tr><td style="margin: 0; padding: 0;">${GOLDEN_BUTTON_WITH_ICON_LEFT}</td></tr>`));
  });

  it("renderButton: button-with-icon-right (unchanged internal markup, just self-wrapped)", () => {
    const node: ButtonNode = { ...buttonWithIconFixture, icon: { ...buttonWithIconFixture.icon!, side: "right" } };
    const html = renderButton(node);
    expect(normalize(html)).toBe(normalize(`<tr><td style="margin: 0; padding: 0;">${GOLDEN_BUTTON_WITH_ICON_RIGHT}</td></tr>`));
  });

  it("renderDivider: divider-plain", () => {
    expect(normalize(renderDivider(dividerFixture))).toBe(normalize(GOLDEN_DIVIDER_PLAIN));
  });

  it("renderDividerLogo: divider-logo", () => {
    expect(normalize(renderDividerLogo(dividerLogoFixture))).toBe(normalize(GOLDEN_DIVIDER_LOGO));
  });

  it("renderHeaderImage: header-single-image", () => {
    expect(normalize(renderHeaderImage(headerImageFixture))).toBe(normalize(GOLDEN_HEADER_SINGLE_IMAGE));
  });
});
