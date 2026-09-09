import { snapBadgeClassName, snapToNearest } from "../canvas/snapValue";

describe("snapToNearest", () => {
  it("snaps to the nearest candidate within the threshold", () => {
    expect(snapToNearest(17, [0, 16, 32])).toEqual({ value: 16, snapped: true });
  });

  it("leaves the value untouched when outside the threshold of every candidate", () => {
    expect(snapToNearest(23, [0, 16, 32])).toEqual({ value: 23, snapped: false });
  });

  it("snaps exactly at the threshold boundary", () => {
    expect(snapToNearest(20, [16], 4)).toEqual({ value: 16, snapped: true });
    expect(snapToNearest(21, [16], 4)).toEqual({ value: 21, snapped: false });
  });

  it("picks the closer of two nearby candidates", () => {
    expect(snapToNearest(9, [0, 8, 16])).toEqual({ value: 8, snapped: true });
  });

  it("returns snapped:false with the original value when candidates is empty", () => {
    expect(snapToNearest(42, [])).toEqual({ value: 42, snapped: false });
  });

  it("supports a custom threshold", () => {
    expect(snapToNearest(30, [24], 10)).toEqual({ value: 24, snapped: true });
    expect(snapToNearest(30, [24], 2)).toEqual({ value: 30, snapped: false });
  });
});

describe("snapBadgeClassName", () => {
  it("uses emerald styling when snapped", () => {
    const className = snapBadgeClassName(true);
    expect(className).toContain("emerald");
  });

  it("uses the neutral bg-card styling when not snapped", () => {
    const className = snapBadgeClassName(false);
    expect(className).toContain("bg-card");
    expect(className).not.toContain("emerald");
  });
});
