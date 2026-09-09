import { render } from "@testing-library/react";

import { CanvasButtonPreview } from "../canvas/CanvasButtonPreview";
import { renderButton } from "../render/renderButton";
import { addLeaf, getShellConfig, resetBuilderState, updateNodeFields } from "../state/builderStore";
import { tbodyInnerHtml } from "../testSupport/domHtml";
import type { ButtonBlock } from "../types";

describe("CanvasButtonPreview", () => {
  beforeEach(() => {
    resetBuilderState();
  });

  it("renders the exact same markup renderButton produces for the same block", () => {
    const id = addLeaf(null, "button");
    updateNodeFields(id, { label: "Buy now", bgColor: "#123456" });
    const block = {
      id,
      parentId: null,
      type: "button",
      label: "Buy now",
      href: "urlhere",
      bgColor: "#123456",
      textColor: "#ffffff",
      borderRadiusPx: 4,
      align: "center",
      fontSizePx: 14,
      fontWeight: 700,
      width: "full",
    } as ButtonBlock;

    const { container } = render(<CanvasButtonPreview id={id} />);

    expect(container.querySelector("tbody")?.innerHTML).toBe(tbodyInnerHtml(renderButton(block, getShellConfig().fontFamily, 0)));
  });

  it("renders nothing for a missing block", () => {
    const { container } = render(<CanvasButtonPreview id='missing' />);
    expect(container).toBeEmptyDOMElement();
  });
});
