import { fireEvent, render, screen } from "@testing-library/react";

import { CanvasWysiwygShell } from "../canvas/CanvasWysiwygShell";

function renderShell(overrides: Partial<Parameters<typeof CanvasWysiwygShell>[0]> = {}) {
  const onSelect = jest.fn();
  const onRemove = jest.fn();
  const onPointerDown = jest.fn();
  const onPaddingChange = jest.fn();
  const onCornerRadiusChange = jest.fn();

  render(
    <CanvasWysiwygShell
      id='s1'
      label='SECTION'
      computedStyle={{ paddingTop: 32, paddingRight: 20, paddingBottom: 24, paddingLeft: 20, backgroundColor: "#fff9e9", border: "1px solid #365373", borderRadius: 8, boxShadow: "0px 2px 4px rgba(0,0,0,0.1)", width: 552 }}
      isSelected={false}
      isDragging={false}
      isOver={false}
      setNodeRef={() => {}}
      attributes={{} as never}
      listeners={{ onPointerDown }}
      onSelect={onSelect}
      onRemove={onRemove}
      removeAriaLabel='Remove section'
      positionStyle={{}}
      padding={{ top: 32, right: 20, bottom: 24, left: 20 }}
      cornerRadius={8}
      onPaddingChange={onPaddingChange}
      onCornerRadiusChange={onCornerRadiusChange}
      {...overrides}>
      <div data-testid='children'>content</div>
    </CanvasWysiwygShell>,
  );

  return { onSelect, onRemove, onPointerDown, onPaddingChange, onCornerRadiusChange };
}

describe("CanvasWysiwygShell", () => {
  it("applies computedStyle's padding/fill/border/radius/shadow/width to the box element", () => {
    renderShell();
    const box = screen.getByTestId("wysiwyg-box");
    expect(box).toHaveStyle({
      paddingTop: "32px",
      paddingRight: "20px",
      paddingBottom: "24px",
      paddingLeft: "20px",
      backgroundColor: "#fff9e9",
      border: "1px solid #365373",
      borderRadius: "8px",
      boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
      width: "552px",
    });
  });

  it("always reserves an inline marginTop for the chrome strip, immune to a parent's space-y-* class winning the cascade", () => {
    renderShell();
    expect(screen.getByTestId("wysiwyg-box")).toHaveStyle({ marginTop: "24px" });
  });

  it("renders children inside the box element", () => {
    renderShell();
    expect(screen.getByTestId("wysiwyg-box")).toContainElement(screen.getByTestId("children"));
  });

  it("calls onSelect when the box is clicked", () => {
    const { onSelect } = renderShell();
    fireEvent.click(screen.getByTestId("wysiwyg-box"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("calls onRemove (and not onSelect) when the remove button is clicked", () => {
    const { onSelect, onRemove } = renderShell();
    fireEvent.click(screen.getByLabelText("Remove section"));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("spreads dnd-kit listeners onto the grip button", () => {
    const { onPointerDown } = renderShell();
    fireEvent.pointerDown(screen.getByLabelText("Drag to reorder"));
    expect(onPointerDown).toHaveBeenCalledTimes(1);
  });

  it("uses the passed removeAriaLabel on the remove button", () => {
    renderShell({ removeAriaLabel: "Remove row" });
    expect(screen.getByLabelText("Remove row")).toBeInTheDocument();
  });

  it("marks the selection ring idle when neither selected nor a drop target", () => {
    renderShell({ isSelected: false, isOver: false });
    expect(screen.getByTestId("wysiwyg-ring")).toHaveAttribute("data-state", "idle");
  });

  it("marks the selection ring selected when isSelected is true", () => {
    renderShell({ isSelected: true });
    expect(screen.getByTestId("wysiwyg-ring")).toHaveAttribute("data-state", "selected");
  });

  it("marks the selection ring over when isOver is true and not selected", () => {
    renderShell({ isSelected: false, isOver: true });
    expect(screen.getByTestId("wysiwyg-ring")).toHaveAttribute("data-state", "over");
  });

  it("does not render padding/corner-radius drag handles when not selected", () => {
    renderShell({ isSelected: false });
    expect(screen.queryByLabelText("Resize top padding")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Resize corner radius")).not.toBeInTheDocument();
  });

  it("renders all 4 padding-edge handles and exactly 1 corner-radius handle when selected and locked", () => {
    renderShell({ isSelected: true, cornerRadius: 8, cornerRadii: undefined });
    expect(screen.getByLabelText("Resize top padding")).toBeInTheDocument();
    expect(screen.getByLabelText("Resize right padding")).toBeInTheDocument();
    expect(screen.getByLabelText("Resize bottom padding")).toBeInTheDocument();
    expect(screen.getByLabelText("Resize left padding")).toBeInTheDocument();
    expect(screen.getByLabelText("Resize corner radius")).toBeInTheDocument();
    expect(screen.queryByLabelText("Resize topLeft corner radius")).not.toBeInTheDocument();
  });

  it("renders 4 independent corner handles when selected and unlocked (cornerRadii set)", () => {
    renderShell({ isSelected: true, cornerRadii: { topLeft: 4, topRight: 8, bottomRight: 12, bottomLeft: 16 } });
    expect(screen.getByLabelText("Resize topLeft corner radius")).toBeInTheDocument();
    expect(screen.getByLabelText("Resize topRight corner radius")).toBeInTheDocument();
    expect(screen.getByLabelText("Resize bottomRight corner radius")).toBeInTheDocument();
    expect(screen.getByLabelText("Resize bottomLeft corner radius")).toBeInTheDocument();
    expect(screen.queryByLabelText("Resize corner radius")).not.toBeInTheDocument();
  });

  it("shows a locked padlock icon by default and unlocks on click, seeding cornerRadii from the scalar", () => {
    const { onCornerRadiusChange } = renderShell({ isSelected: false, cornerRadius: 8, cornerRadii: undefined });
    fireEvent.click(screen.getByLabelText("Unlock corner radius (edit each corner independently)"));
    expect(onCornerRadiusChange).toHaveBeenCalledWith({ cornerRadius: 8, cornerRadii: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 } });
  });

  it("re-locks corner radius to the top-left corner's value on click when unlocked", () => {
    const { onCornerRadiusChange } = renderShell({ isSelected: false, cornerRadii: { topLeft: 4, topRight: 8, bottomRight: 12, bottomLeft: 16 } });
    fireEvent.click(screen.getByLabelText("Lock corner radius (all corners follow one value)"));
    expect(onCornerRadiusChange).toHaveBeenCalledWith({ cornerRadius: 4, cornerRadii: undefined });
  });

  it("clicking the lock toggle does not also trigger onSelect", () => {
    const { onSelect } = renderShell({ isSelected: false, cornerRadius: 8 });
    fireEvent.click(screen.getByLabelText("Unlock corner radius (edit each corner independently)"));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
