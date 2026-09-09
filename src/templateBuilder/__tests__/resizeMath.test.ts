import { columnWidthsAfterDividerDrag, cornerRadiusFromPointerOffset, gapAfterDrag, paddingAfterEdgeDrag, snapColumnWidths } from "../canvas/resizeMath";
import type { ContainerPadding } from "../types";

describe("columnWidthsAfterDividerDrag", () => {
  it("transfers deltaPercent between adjacent columns, leaves all other columns unchanged", () => {
    const next = columnWidthsAfterDividerDrag([25, 25, 25, 25], 1, 10);

    expect(next).toEqual([25, 35, 15, 25]);
  });

  it("clamps both adjacent columns to minPercent when the drag tries to zero one out", () => {
    const next = columnWidthsAfterDividerDrag([50, 50], 0, -1000, 8);

    expect(next).toEqual([8, 92]);
  });

  it("clamps the other side too when the drag overshoots in the opposite direction", () => {
    const next = columnWidthsAfterDividerDrag([50, 50], 0, 1000, 8);

    expect(next).toEqual([92, 8]);
  });

  it("the sum of widths before and after is always equal — width is transferred, never created or destroyed", () => {
    const before = [20, 30, 50];
    const sumBefore = before.reduce((a, b) => a + b, 0);

    const after = columnWidthsAfterDividerDrag(before, 1, 12);

    expect(after.reduce((a, b) => a + b, 0)).toBe(sumBefore);
  });

  it("a 2-column row clamps symmetrically — dividerIndex 0 is the only divider", () => {
    const next = columnWidthsAfterDividerDrag([60, 40], 0, 5);

    expect(next).toEqual([65, 35]);
  });

  it("a negative deltaPercent moves width in the opposite direction", () => {
    const next = columnWidthsAfterDividerDrag([50, 50], 0, -10);

    expect(next).toEqual([40, 60]);
  });

  it("does not throw on a degenerate pairSum < 2*minPercent input", () => {
    expect(() => columnWidthsAfterDividerDrag([5, 5], 0, 3, 8)).not.toThrow();
    const next = columnWidthsAfterDividerDrag([5, 5], 0, 3, 8);
    expect(next[0] + next[1]).toBe(10); // sum invariant still holds even when the floor guarantee can't
  });
});

describe("snapColumnWidths", () => {
  it("snaps the divider's left column to a round percent within the threshold", () => {
    expect(snapColumnWidths([48, 52], 0)).toEqual([50, 50]);
  });

  it("leaves widths untouched when the left column is far from every candidate", () => {
    expect(snapColumnWidths([40, 60], 0)).toEqual([40, 60]);
  });

  it("includes the even split for the current column count among the snap candidates", () => {
    // 3 columns -> evenWidthPercents(3) = [33, 33, 34], so the even-split target for column 0 is
    // 33 — same as the round-percent list's own 33, so this also covers "both sources agree."
    expect(snapColumnWidths([32, 33, 35], 0)).toEqual([33, 32, 35]);
  });

  it("re-derives the right column as pairSum - snappedLeft, preserving the pair's total", () => {
    const result = snapColumnWidths([49, 31, 20], 0);
    expect(result[0] + result[1]).toBe(49 + 31);
    expect(result[2]).toBe(20);
  });

  it("only touches the dividerIndex pair, leaving other columns untouched", () => {
    expect(snapColumnWidths([26, 24, 50], 0)).toEqual([25, 25, 50]);
  });
});

describe("gapAfterDrag", () => {
  it("adds deltaPx to startGapPx", () => {
    expect(gapAfterDrag(20, 10)).toBe(30);
  });

  it("a negative deltaPx (dragging up) decreases the gap", () => {
    expect(gapAfterDrag(20, -10)).toBe(10);
  });

  it("clamps to 0 by default, never goes negative", () => {
    expect(gapAfterDrag(20, -1000)).toBe(0);
  });

  it("clamps to 200 by default", () => {
    expect(gapAfterDrag(20, 1000)).toBe(200);
  });

  it("honors custom min/max bounds", () => {
    expect(gapAfterDrag(20, -1000, 5, 50)).toBe(5);
    expect(gapAfterDrag(20, 1000, 5, 50)).toBe(50);
  });
});

describe("paddingAfterEdgeDrag", () => {
  const padding: ContainerPadding = { top: 32, right: 20, bottom: 24, left: 20 };

  it("dragging the right edge outward (positive deltaPx) increases right padding only", () => {
    expect(paddingAfterEdgeDrag(padding, "right", 10)).toEqual({ ...padding, right: 30 });
  });

  it("dragging the bottom edge outward (positive deltaPx) increases bottom padding only", () => {
    expect(paddingAfterEdgeDrag(padding, "bottom", 10)).toEqual({ ...padding, bottom: 34 });
  });

  it("dragging the top edge outward (negative deltaPx, since up is away from center) increases top padding only", () => {
    expect(paddingAfterEdgeDrag(padding, "top", -10)).toEqual({ ...padding, top: 42 });
  });

  it("dragging the left edge outward (negative deltaPx, since left is away from center) increases left padding only", () => {
    expect(paddingAfterEdgeDrag(padding, "left", -10)).toEqual({ ...padding, left: 30 });
  });

  it("clamps each edge independently to [0, 200] by default", () => {
    expect(paddingAfterEdgeDrag(padding, "right", -1000).right).toBe(0);
    expect(paddingAfterEdgeDrag(padding, "right", 1000).right).toBe(200);
  });

  it("honors custom min/max bounds", () => {
    expect(paddingAfterEdgeDrag(padding, "right", -1000, 5, 50).right).toBe(5);
    expect(paddingAfterEdgeDrag(padding, "right", 1000, 5, 50).right).toBe(50);
  });

  it("rounds a fractional deltaPx (sub-pixel pointer coordinates) to a whole pixel", () => {
    expect(paddingAfterEdgeDrag(padding, "right", 10.6).right).toBe(31);
    expect(paddingAfterEdgeDrag(padding, "right", 10.4).right).toBe(30);
  });
});

describe("cornerRadiusFromPointerOffset", () => {
  it("takes the smaller of the two axis offsets", () => {
    expect(cornerRadiusFromPointerOffset(30, 12, 200)).toBe(12);
    expect(cornerRadiusFromPointerOffset(12, 30, 200)).toBe(12);
  });

  it("clamps to maxRadius", () => {
    expect(cornerRadiusFromPointerOffset(500, 500, 200)).toBe(200);
  });

  it("floors at 0 — an offset that points away from the box (negative) never yields a negative radius", () => {
    expect(cornerRadiusFromPointerOffset(-20, 30, 200)).toBe(0);
    expect(cornerRadiusFromPointerOffset(30, -20, 200)).toBe(0);
  });

  it("defaults maxRadius to 200 when omitted", () => {
    expect(cornerRadiusFromPointerOffset(500, 500)).toBe(200);
  });

  it("rounds a fractional offset (sub-pixel pointer coordinates) to a whole pixel", () => {
    expect(cornerRadiusFromPointerOffset(12.6, 30, 200)).toBe(13);
    expect(cornerRadiusFromPointerOffset(12.4, 30, 200)).toBe(12);
  });
});
