import { paintStroke, unionMasks } from "../maskOps";

describe("unionMasks", () => {
  it("takes the pointwise minimum across masks (0 = removed wins)", () => {
    const a = new Uint8ClampedArray([255, 0, 255, 128]);
    const b = new Uint8ClampedArray([0, 255, 255, 200]);

    const result = unionMasks([a, b]);

    expect(Array.from(result)).toEqual([0, 0, 255, 128]);
  });

  it("returns the single mask unchanged when only one is given", () => {
    const a = new Uint8ClampedArray([10, 20, 30]);
    expect(Array.from(unionMasks([a]))).toEqual([10, 20, 30]);
  });
});

describe("paintStroke", () => {
  it("erase mode sets covered pixels to 0, leaves others untouched", () => {
    const width = 10;
    const height = 10;
    const mask = new Uint8ClampedArray(width * height).fill(255);

    const result = paintStroke(mask, width, height, {
      type: "stroke",
      points: [{ x: 0.5, y: 0.5 }], // center pixel (5,5)
      radius: 0.1, // 1px radius at width=10
      mode: "erase",
    });

    const centerIndex = 5 * width + 5;
    expect(result[centerIndex]).toBe(0);
    // A far corner should be untouched.
    expect(result[0]).toBe(255);
  });

  it("restore mode sets covered pixels to 255 even over a removed mask", () => {
    const width = 10;
    const height = 10;
    const mask = new Uint8ClampedArray(width * height).fill(0);

    const result = paintStroke(mask, width, height, {
      type: "stroke",
      points: [{ x: 0.5, y: 0.5 }],
      radius: 0.1,
      mode: "restore",
    });

    const centerIndex = 5 * width + 5;
    expect(result[centerIndex]).toBe(255);
    expect(result[0]).toBe(0);
  });

  it("clamps stamps that overflow the image bounds without throwing", () => {
    const width = 5;
    const height = 5;
    const mask = new Uint8ClampedArray(width * height).fill(255);

    expect(() =>
      paintStroke(mask, width, height, {
        type: "stroke",
        points: [{ x: 0, y: 0 }],
        radius: 0.8, // large radius near the corner
        mode: "erase",
      })
    ).not.toThrow();
  });

  it("does not mutate the input mask", () => {
    const width = 4;
    const height = 4;
    const mask = new Uint8ClampedArray(width * height).fill(255);

    paintStroke(mask, width, height, { type: "stroke", points: [{ x: 0.5, y: 0.5 }], radius: 0.5, mode: "erase" });

    expect(Array.from(mask)).toEqual(new Array(16).fill(255));
  });
});
