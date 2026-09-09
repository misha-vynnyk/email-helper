import { render, screen } from "@testing-library/react";

import { CanvasNode } from "../canvas/CanvasNode";
import { addContainer, addLeaf, addReadyMade, resetBuilderState } from "../state/builderStore";

describe("CanvasNode", () => {
  beforeEach(() => {
    resetBuilderState();
  });

  it.each(["text", "image", "button", "divider", "spacer"] as const)("dispatches leaf type %s to its real-preview component (renders real markup)", (type) => {
    const id = addLeaf(null, type);
    const { container } = render(<CanvasNode id={id} />);
    expect(container.querySelector('table[role="presentation"]')).toBeInTheDocument();
  });

  it("dispatches a ready-made id to its real-preview component", () => {
    const id = addReadyMade(null, "header-simple");
    const { container } = render(<CanvasNode id={id} />);
    expect(container.querySelector('table[role="presentation"]')).toBeInTheDocument();
  });

  it("dispatches a section id to CanvasSectionBox", () => {
    const id = addContainer(null, "section");
    render(<CanvasNode id={id} />);
    expect(screen.getByTestId("wysiwyg-box")).toBeInTheDocument();
  });

  it("dispatches a row id to CanvasRowBox", () => {
    const id = addContainer(null, "row", 2);
    render(<CanvasNode id={id} />);
    expect(screen.getByTestId("wysiwyg-box")).toBeInTheDocument();
  });

  it("renders nothing for an unknown id", () => {
    const { container } = render(<CanvasNode id='missing' />);
    expect(container).toBeEmptyDOMElement();
  });
});
