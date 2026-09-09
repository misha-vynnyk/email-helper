import { render } from "@testing-library/react";

import { CanvasImagePreview } from "../canvas/CanvasImagePreview";
import { renderImage } from "../render/renderImage";
import { addLeaf, resetBuilderState, updateNodeFields } from "../state/builderStore";
import { tbodyInnerHtml } from "../testSupport/domHtml";
import type { ImageBlock } from "../types";

describe("CanvasImagePreview", () => {
  beforeEach(() => {
    resetBuilderState();
  });

  it("renders the exact same markup renderImage produces for the same block", () => {
    const id = addLeaf(null, "image");
    updateNodeFields(id, { src: "https://cdn.example.com/pic.png", alt: "A picture", widthPx: 400 });
    const block = { id, parentId: null, type: "image", src: "https://cdn.example.com/pic.png", alt: "A picture", widthPx: 400 } as ImageBlock;

    const { container } = render(<CanvasImagePreview id={id} />);

    expect(container.querySelector("tbody")?.innerHTML).toBe(tbodyInnerHtml(renderImage(block, 0)));
  });

  it("renders nothing for a missing block", () => {
    const { container } = render(<CanvasImagePreview id='missing' />);
    expect(container).toBeEmptyDOMElement();
  });
});
