import { renderHook } from "@testing-library/react";

import { addLeaf, resetBuilderState, updateResponsiveClassNames } from "../state/builderStore";
import { useResponsiveConflict } from "../state/responsiveConflict";

describe("useResponsiveConflict", () => {
  beforeEach(() => resetBuilderState());

  it("returns false for a node with no responsiveClassNames", () => {
    const id = addLeaf(null, "text");
    const { result } = renderHook(() => useResponsiveConflict(id, "padding-top"));
    expect(result.current).toBe(false);
  });

  it("returns true when a responsive class touches the queried property", () => {
    const id = addLeaf(null, "text");
    updateResponsiveClassNames(id, ["pt-24"]);
    const { result } = renderHook(() => useResponsiveConflict(id, "padding-top"));
    expect(result.current).toBe(true);
  });

  it("returns false when the node's responsive classes touch a different property", () => {
    const id = addLeaf(null, "text");
    updateResponsiveClassNames(id, ["sm-hidden"]);
    const { result } = renderHook(() => useResponsiveConflict(id, "padding-top"));
    expect(result.current).toBe(false);
  });

  it("returns false for an id with no node", () => {
    const { result } = renderHook(() => useResponsiveConflict("nonexistent", "padding-top"));
    expect(result.current).toBe(false);
  });
});
