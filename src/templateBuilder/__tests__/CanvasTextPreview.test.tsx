import { render } from "@testing-library/react";

import { CanvasTextPreview } from "../canvas/CanvasTextPreview";
import { renderText } from "../render/renderText";
import { addLeaf, getShellConfig, resetBuilderState, updateNodeFields } from "../state/builderStore";
import { tbodyInnerHtml } from "../testSupport/domHtml";
import type { TextBlock } from "../types";

describe("CanvasTextPreview", () => {
  beforeEach(() => {
    resetBuilderState();
  });

  it("renders the exact same markup renderText produces for the same block", () => {
    const id = addLeaf(null, "text");
    updateNodeFields(id, { contentHtml: "Hello canvas", color: "#ff00aa", fontSizePx: 22 });
    const block = { id, parentId: null, type: "text", contentHtml: "Hello canvas", color: "#ff00aa", fontSizePx: 22, fontWeight: 400, align: "left" } as TextBlock;

    const { container } = render(<CanvasTextPreview id={id} />);

    expect(container.querySelector("tbody")?.innerHTML).toBe(tbodyInnerHtml(renderText(block, getShellConfig().fontFamily, 0)));
  });

  it("renders nothing for a missing block", () => {
    const { container } = render(<CanvasTextPreview id='missing' />);
    expect(container).toBeEmptyDOMElement();
  });
});
