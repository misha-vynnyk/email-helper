import { getNodeRect, registerNodeRef } from "../canvas/nodeRectRegistry";

function stubElement(rect: Partial<DOMRect>): HTMLElement {
  const el = document.createElement("div");
  el.getBoundingClientRect = () => rect as DOMRect;
  return el;
}

describe("nodeRectRegistry", () => {
  it("registerNodeRef then getNodeRect returns the element's getBoundingClientRect()", () => {
    const el = stubElement({ top: 10, left: 20, width: 100, height: 50 });

    registerNodeRef("a", el);

    expect(getNodeRect("a")).toEqual({ top: 10, left: 20, width: 100, height: 50 });
  });

  it("registerNodeRef(id, null) removes a previously registered id", () => {
    registerNodeRef("b", stubElement({ top: 0, left: 0, width: 0, height: 0 }));

    registerNodeRef("b", null);

    expect(getNodeRect("b")).toBeNull();
  });

  it("getNodeRect returns null for an id that was never registered", () => {
    expect(getNodeRect("never-registered")).toBeNull();
  });
});
