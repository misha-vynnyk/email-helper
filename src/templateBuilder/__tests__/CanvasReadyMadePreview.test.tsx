import { render } from "@testing-library/react";

import { CanvasReadyMadePreview } from "../canvas/CanvasReadyMadePreview";
import { renderReadyMade } from "../render/renderReadyMade";
import { addReadyMade, resetBuilderState, updateNodeFields } from "../state/builderStore";
import { tbodyInnerHtml } from "../testSupport/domHtml";
import type { ReadyMadeBlock } from "../types";

describe("CanvasReadyMadePreview", () => {
  beforeEach(() => {
    resetBuilderState();
  });

  it("renders the exact same markup renderReadyMade produces for the same block", () => {
    const id = addReadyMade(null, "header-simple");
    updateNodeFields(id, { values: { src: "https://cdn.example.com/logo.png", href: "https://example.com" } });
    const block = { id, parentId: null, type: "ready-made", definitionId: "header-simple", values: { src: "https://cdn.example.com/logo.png", href: "https://example.com" } } as ReadyMadeBlock;

    const { container } = render(<CanvasReadyMadePreview id={id} />);

    expect(container.querySelector("tbody")?.innerHTML).toBe(tbodyInnerHtml(renderReadyMade(block)));
  });

  it("renders nothing for a missing block", () => {
    const { container } = render(<CanvasReadyMadePreview id='missing' />);
    expect(container).toBeEmptyDOMElement();
  });
});
