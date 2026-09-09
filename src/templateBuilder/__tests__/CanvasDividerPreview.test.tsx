import { render } from "@testing-library/react";

import { CanvasDividerPreview } from "../canvas/CanvasDividerPreview";
import { renderDivider } from "../render/renderDivider";
import { addLeaf, resetBuilderState, updateNodeFields } from "../state/builderStore";
import { tbodyInnerHtml } from "../testSupport/domHtml";
import type { DividerBlock } from "../types";

describe("CanvasDividerPreview", () => {
  beforeEach(() => {
    resetBuilderState();
  });

  it("renders the exact same markup renderDivider produces for the same block", () => {
    const id = addLeaf(null, "divider");
    updateNodeFields(id, { thicknessPx: 3 });
    const block = { id, parentId: null, type: "divider", color: "#e2e2e2", thicknessPx: 3, widthPercent: 100 } as DividerBlock;

    const { container } = render(<CanvasDividerPreview id={id} />);

    expect(container.querySelector("tbody")?.innerHTML).toBe(tbodyInnerHtml(renderDivider(block, 0)));
  });

  it("renders nothing for a missing block", () => {
    const { container } = render(<CanvasDividerPreview id='missing' />);
    expect(container).toBeEmptyDOMElement();
  });
});
