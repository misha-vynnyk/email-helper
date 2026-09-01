import { columnWidthsAfterDividerDrag, gapAfterDrag } from "../canvas/resizeMath";

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
