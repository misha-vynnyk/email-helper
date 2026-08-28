import { cropRgba } from "../cropRgba";

describe("cropRgba", () => {
  it("crops an inner region not starting at (0,0), preserving row-stride", () => {
    // 4x4 buffer, each pixel numbered 0-15 in its red channel for identification.
    const width = 4;
    const height = 4;
    const src = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      src[i * 4] = i; // R channel = pixel index
      src[i * 4 + 3] = 255;
    }

    // Crop the inner 2x2 region: pixels at (1,1), (2,1), (1,2), (2,2) = indices 5, 6, 9, 10.
    const result = cropRgba(src, width, height, { x: 1, y: 1, width: 2, height: 2 });

    expect(result.length).toBe(2 * 2 * 4);
    const reds = [result[0], result[4], result[8], result[12]];
    expect(reds).toEqual([5, 6, 9, 10]);
  });

  it("clamps a rect that overflows the source bounds", () => {
    const width = 2;
    const height = 2;
    const src = new Uint8ClampedArray(width * height * 4).fill(255);

    const result = cropRgba(src, width, height, { x: 1, y: 1, width: 10, height: 10 });

    expect(result.length).toBe(1 * 1 * 4);
  });
});
