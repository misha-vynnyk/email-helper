import { BackgroundEditState } from "../../../types";
import { compositeBackground } from "../compositeBackground";

function bg(overrides: Partial<BackgroundEditState>): BackgroundEditState {
  return { removed: true, operations: [], replaceMode: "transparent", ...overrides };
}

describe("compositeBackground", () => {
  it("transparent mode: keeps RGB, sets alpha from the mask", () => {
    const src = new Uint8ClampedArray([10, 20, 30, 255, 40, 50, 60, 255]); // 2 pixels, opaque
    const mask = new Uint8ClampedArray([255, 0]); // pixel 0 = foreground, pixel 1 = background

    const out = compositeBackground(src, mask, 2, 1, bg({ replaceMode: "transparent" }), null);

    expect(Array.from(out.subarray(0, 4))).toEqual([10, 20, 30, 255]);
    expect(Array.from(out.subarray(4, 8))).toEqual([40, 50, 60, 0]);
  });

  it("color mode: fully-background pixels become the solid replace color, opaque", () => {
    const src = new Uint8ClampedArray([10, 20, 30, 255]);
    const mask = new Uint8ClampedArray([0]); // fully background

    const out = compositeBackground(src, mask, 1, 1, bg({ replaceMode: "color", replaceColor: "#ff0000" }), null);

    expect(Array.from(out)).toEqual([255, 0, 0, 255]);
  });

  it("color mode: fully-foreground pixels keep the source color, opaque", () => {
    const src = new Uint8ClampedArray([10, 20, 30, 255]);
    const mask = new Uint8ClampedArray([255]); // fully foreground

    const out = compositeBackground(src, mask, 1, 1, bg({ replaceMode: "color", replaceColor: "#ff0000" }), null);

    expect(Array.from(out)).toEqual([10, 20, 30, 255]);
  });

  it("image mode: blends toward the background image by mask weight", () => {
    const src = new Uint8ClampedArray([200, 200, 200, 255]);
    const mask = new Uint8ClampedArray([0]); // fully background
    const backgroundRgba = new Uint8ClampedArray([0, 0, 0, 255]);

    const out = compositeBackground(src, mask, 1, 1, bg({ replaceMode: "image" }), backgroundRgba);

    expect(Array.from(out)).toEqual([0, 0, 0, 255]);
  });
});
