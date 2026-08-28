import { clampRect, defaultCropRect, isFullRect, MIN_CROP_SIZE, moveRect, rectToPixels, resizeRectByHandle } from "../cropMath";

describe("clampRect", () => {
  it("leaves an in-bounds rect unchanged", () => {
    expect(clampRect({ x: 0.2, y: 0.3, width: 0.4, height: 0.5 })).toEqual({ x: 0.2, y: 0.3, width: 0.4, height: 0.5 });
  });

  it("floors width/height at MIN_CROP_SIZE", () => {
    const result = clampRect({ x: 0.5, y: 0.5, width: 0.001, height: -0.2 });
    expect(result.width).toBe(MIN_CROP_SIZE);
    expect(result.height).toBe(MIN_CROP_SIZE);
  });

  it("caps width/height at 1", () => {
    const result = clampRect({ x: 0, y: 0, width: 5, height: 5 });
    expect(result.width).toBe(1);
    expect(result.height).toBe(1);
  });

  it("pulls x/y back so the rect stays inside the unit square", () => {
    const result = clampRect({ x: 0.9, y: 0.9, width: 0.5, height: 0.5 });
    expect(result.x).toBe(0.5);
    expect(result.y).toBe(0.5);
  });

  it("clamps negative x/y to 0", () => {
    const result = clampRect({ x: -0.3, y: -0.3, width: 0.4, height: 0.4 });
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });
});

describe("moveRect", () => {
  it("shifts by the given delta", () => {
    const result = moveRect({ x: 0.2, y: 0.2, width: 0.3, height: 0.3 }, 0.1, 0.1);
    expect(result.x).toBeCloseTo(0.3);
    expect(result.y).toBeCloseTo(0.3);
    expect(result.width).toBe(0.3);
    expect(result.height).toBe(0.3);
  });

  it("stops at the right/bottom edge instead of pushing the rect out of bounds", () => {
    const result = moveRect({ x: 0.8, y: 0.8, width: 0.3, height: 0.3 }, 0.5, 0.5);
    expect(result.x).toBe(0.7);
    expect(result.y).toBe(0.7);
  });

  it("stops at the left/top edge", () => {
    const result = moveRect({ x: 0.1, y: 0.1, width: 0.3, height: 0.3 }, -0.5, -0.5);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });
});

describe("resizeRectByHandle", () => {
  const base = { x: 0.2, y: 0.2, width: 0.4, height: 0.4 };

  it("grows from the se handle without moving the origin", () => {
    const result = resizeRectByHandle(base, "se", 0.1, 0.1);
    expect(result).toEqual({ x: 0.2, y: 0.2, width: 0.5, height: 0.5 });
  });

  it("grows from the nw handle by moving the origin and expanding", () => {
    const result = resizeRectByHandle(base, "nw", -0.1, -0.1);
    expect(result).toEqual({ x: 0.1, y: 0.1, width: 0.5, height: 0.5 });
  });

  it("shrinks from the e handle without changing x", () => {
    const result = resizeRectByHandle(base, "e", -0.1, 0);
    expect(result.x).toBe(0.2);
    expect(result.y).toBe(0.2);
    expect(result.width).toBeCloseTo(0.3);
    expect(result.height).toBe(0.4);
  });

  it("only touches height for the n/s edge handles", () => {
    const result = resizeRectByHandle(base, "s", 0, 0.1);
    expect(result.x).toBe(base.x);
    expect(result.y).toBe(base.y);
    expect(result.width).toBe(base.width);
    expect(result.height).toBeCloseTo(0.5);
  });

  it("never shrinks below MIN_CROP_SIZE", () => {
    const result = resizeRectByHandle(base, "e", -10, 0);
    expect(result.width).toBe(MIN_CROP_SIZE);
  });
});

describe("rectToPixels", () => {
  it("scales a normalized rect to image pixel dimensions", () => {
    expect(rectToPixels({ x: 0.25, y: 0.5, width: 0.5, height: 0.25 }, 400, 200)).toEqual({ x: 100, y: 100, width: 200, height: 50 });
  });

  it("rounds fractional pixel results", () => {
    expect(rectToPixels({ x: 0.1, y: 0.1, width: 0.3, height: 0.3 }, 101, 101)).toEqual({ x: 10, y: 10, width: 30, height: 30 });
  });
});

describe("isFullRect", () => {
  it("is true for the default full-image rect", () => {
    expect(isFullRect(defaultCropRect())).toBe(true);
  });

  it("is false once the rect is cropped", () => {
    expect(isFullRect({ x: 0.1, y: 0, width: 0.9, height: 1 })).toBe(false);
  });
});
