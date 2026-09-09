import { fireEvent, render, screen } from "@testing-library/react";
import { Type } from "lucide-react";

import { CanvasChipShell } from "../canvas/CanvasChipShell";
import { addLeaf, getNode, resetBuilderState } from "../state/builderStore";
import { getSelectedId } from "../state/selectionStore";

describe("CanvasChipShell", () => {
  beforeEach(() => {
    resetBuilderState();
  });

  it("renders its children as the block's content instead of a flat label", () => {
    const id = addLeaf(null, "text");

    render(
      <CanvasChipShell id={id} parentId={null} icon={Type}>
        <div data-testid='real-preview'>real content</div>
      </CanvasChipShell>,
    );

    expect(screen.getByTestId("real-preview")).toHaveTextContent("real content");
  });

  it("selects the block on click", () => {
    const id = addLeaf(null, "text");
    render(
      <CanvasChipShell id={id} parentId={null} icon={Type}>
        <span>content</span>
      </CanvasChipShell>,
    );

    fireEvent.click(screen.getByText("content"));

    expect(getSelectedId()).toBe(id);
  });

  it("removes the block on remove-button click without selecting it", () => {
    const id = addLeaf(null, "text");
    render(
      <CanvasChipShell id={id} parentId={null} icon={Type}>
        <span>content</span>
      </CanvasChipShell>,
    );

    fireEvent.click(screen.getByLabelText("Remove"));

    expect(getNode(id)).toBeUndefined();
    expect(getSelectedId()).toBeNull();
  });

  it("exposes a drag handle for reordering", () => {
    const id = addLeaf(null, "text");
    render(
      <CanvasChipShell id={id} parentId={null} icon={Type}>
        <span>content</span>
      </CanvasChipShell>,
    );

    expect(screen.getByLabelText("Drag to move")).toBeInTheDocument();
  });
});
