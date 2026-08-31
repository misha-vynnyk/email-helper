import { oklabDistance, rgbToOklab } from "../colorSpace";

describe("rgbToOklab / oklabDistance", () => {
  it("maps white to L≈1, a≈0, b≈0", () => {
    const white = rgbToOklab(255, 255, 255);
    expect(white.L).toBeCloseTo(1, 2);
    expect(white.a).toBeCloseTo(0, 2);
    expect(white.b).toBeCloseTo(0, 2);
  });

  it("maps black to L≈0, a≈0, b≈0", () => {
    const black = rgbToOklab(0, 0, 0);
    expect(black.L).toBeCloseTo(0, 2);
    expect(black.a).toBeCloseTo(0, 2);
    expect(black.b).toBeCloseTo(0, 2);
  });

  it("black-vs-white distance is close to the documented ~1.0 anchor", () => {
    const distance = oklabDistance(rgbToOklab(0, 0, 0), rgbToOklab(255, 255, 255));
    expect(distance).toBeGreaterThan(0.9);
    expect(distance).toBeLessThan(1.1);
  });

  it("identical colors have zero distance", () => {
    const a = rgbToOklab(120, 200, 50);
    const b = rgbToOklab(120, 200, 50);
    expect(oklabDistance(a, b)).toBe(0);
  });

  it("distance grows monotonically along a gray gradient (perceptual uniformity sanity check)", () => {
    const white = rgbToOklab(255, 255, 255);
    const near = rgbToOklab(235, 235, 235);
    const mid = rgbToOklab(180, 180, 180);
    const far = rgbToOklab(60, 60, 60);

    const dNear = oklabDistance(white, near);
    const dMid = oklabDistance(white, mid);
    const dFar = oklabDistance(white, far);

    expect(dNear).toBeLessThan(dMid);
    expect(dMid).toBeLessThan(dFar);
  });
});
