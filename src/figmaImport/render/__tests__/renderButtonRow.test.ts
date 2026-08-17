import type { ButtonNode, ButtonRowNode } from "../../types";
import { renderButtonCell } from "../renderButton";
import { renderButtonRow } from "../renderButtonRow";

const learnMoreButton: ButtonNode = {
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

const termsButton: ButtonNode = { ...learnMoreButton, id: "btn-terms", label: "Terms & Conditions", widthPx: 180 };

// A button with an icon inside a ButtonRowNode — the icon must be silently ignored (real
// footer button-rows never mix icons in; every entry renders through the no-icon
// renderButtonCell path only, see FIGMA_TEMPLATE_IMPORT_PLAN.md).
const buttonWithIgnoredIcon: ButtonNode = {
  ...learnMoreButton,
  id: "btn-with-icon",
  icon: { altDescription: "icon", side: "left", gapPx: 5, widthPx: 20, heightPx: 20 },
};

const twoButtonsRow: ButtonRowNode = {
  id: "footer-buttons",
  type: "buttonRow",
  buttons: [learnMoreButton, termsButton],
};

describe("renderButtonRow", () => {
  it("renders 2+ buttons as sibling <td> cells sharing one row-table", () => {
    expect(renderButtonRow(twoButtonsRow)).toMatchSnapshot();
  });

  it("places each button's renderButtonCell output as-is, in order", () => {
    const html = renderButtonRow(twoButtonsRow);
    expect(html).toContain(renderButtonCell(learnMoreButton));
    expect(html).toContain(renderButtonCell(termsButton));
    expect(html.indexOf(renderButtonCell(learnMoreButton))).toBeLessThan(html.indexOf(renderButtonCell(termsButton)));
  });

  it("shares a single neutral row-table wrapper, not one per button", () => {
    const html = renderButtonRow(twoButtonsRow);
    expect(html.match(/font-size: 0; text-align: center;/g)).toHaveLength(1);
  });

  it("silently ignores a button's icon field (no-icon path only)", () => {
    const node: ButtonRowNode = { id: "row-with-icon-button", type: "buttonRow", buttons: [buttonWithIgnoredIcon] };
    const html = renderButtonRow(node);
    expect(html).not.toContain("<img");
    expect(html).toContain(renderButtonCell(buttonWithIgnoredIcon));
  });
});
