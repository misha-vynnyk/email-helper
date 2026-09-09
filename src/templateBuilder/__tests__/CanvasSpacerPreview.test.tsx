import { render } from "@testing-library/react";

import { CanvasSpacerPreview } from "../canvas/CanvasSpacerPreview";
import { renderSpacer } from "../render/renderSpacer";
import { addLeaf, resetBuilderState, updateNodeFields } from "../state/builderStore";
import { tbodyInnerHtml } from "../testSupport/domHtml";
import type { SpacerBlock } from "../types";

describe("CanvasSpacerPreview", () => {
  beforeEach(() => {
    resetBuilderState();
  });

  it("renders the exact same markup renderSpacer produces for the same block", () => {
    const id = addLeaf(null, "spacer");
    updateNodeFields(id, { heightPx: 48 });
    const block = { id, parentId: null, type: "spacer", heightPx: 48 } as SpacerBlock;

    const { container } = render(<CanvasSpacerPreview id={id} />);

    expect(container.querySelector("tbody")?.innerHTML).toBe(tbodyInnerHtml(renderSpacer(block)));
  });

  it("renders nothing for a missing block", () => {
    const { container } = render(<CanvasSpacerPreview id='missing' />);
    expect(container).toBeEmptyDOMElement();
  });
});
