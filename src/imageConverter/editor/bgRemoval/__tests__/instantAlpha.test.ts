import { computeInstantAlphaMask } from "../instantAlpha";

/** Builds a flat width×height RGBA buffer, then overwrites one region with a
 * different color — a minimal "background + foreground" fixture. */
function buildBuffer(width: number, height: number, bg: [number, number, number], fg: { x: number; y: number; w: number; h: number; color: [number, number, number] }): Uint8ClampedArray {
  const buf = new Uint8ClampedArray(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    buf[p * 4] = bg[0];
    buf[p * 4 + 1] = bg[1];
    buf[p * 4 + 2] = bg[2];
    buf[p * 4 + 3] = 255;
  }
  for (let y = fg.y; y < fg.y + fg.h; y++) {
    for (let x = fg.x; x < fg.x + fg.w; x++) {
      const p = y * width + x;
      buf[p * 4] = fg.color[0];
      buf[p * 4 + 1] = fg.color[1];
      buf[p * 4 + 2] = fg.color[2];
      buf[p * 4 + 3] = 255;
    }
  }
  return buf;
}

describe("computeInstantAlphaMask", () => {
  it("removes only the connected same-color region at a low tolerance, keeps a high-contrast subject", () => {
    // 10x10 white background, black 4x4 square in the middle.
    const width = 10;
    const height = 10;
    const buf = buildBuffer(width, height, [255, 255, 255], { x: 3, y: 3, w: 4, h: 4, color: [0, 0, 0] });

    const mask = computeInstantAlphaMask(buf, width, height, 0, 0, 5);

    // Background corner (seed itself) is removed.
    expect(mask[0]).toBe(0);
    // Foreground center stays opaque — far outside a 5% tolerance from white.
    const centerIndex = 5 * width + 5;
    expect(mask[centerIndex]).toBe(255);
  });

  it("does not remove a same-color region that isn't connected to the seed", () => {
    // Two separate white patches split by a black wall — flood fill must not jump across it.
    const width = 10;
    const height = 1;
    const buf = new Uint8ClampedArray(width * 4).fill(255);
    for (let x = 0; x < width; x++) buf[x * 4 + 3] = 255;
    // Wall at x=5.
    buf[5 * 4] = 0;
    buf[5 * 4 + 1] = 0;
    buf[5 * 4 + 2] = 0;

    const mask = computeInstantAlphaMask(buf, width, height, 0, 0, 5);

    expect(mask[0]).toBe(0); // seed side removed
    expect(mask[4]).toBe(0); // still connected, same side
    expect(mask[5]).toBe(255); // the wall pixel itself — far in color, stays
    expect(mask[9]).toBe(255); // other side of the wall — same color, but unreachable
  });

  it("higher tolerance grows the removed region to include a near (not exact) color", () => {
    const width = 10;
    const height = 10;
    // Background is white; a near-white (slightly off) 4x4 patch touching the seed's region.
    const buf = buildBuffer(width, height, [255, 255, 255], { x: 3, y: 3, w: 4, h: 4, color: [235, 235, 235] });

    const low = computeInstantAlphaMask(buf, width, height, 0, 0, 1);
    const high = computeInstantAlphaMask(buf, width, height, 0, 0, 20);

    const centerIndex = 5 * width + 5;
    expect(low[centerIndex]).toBe(255); // too strict to absorb the near-white patch
    expect(high[centerIndex]).toBe(0); // generous enough to include it
  });

  it("produces a feathered (non-binary) value at the boundary just past the hard threshold", () => {
    const width = 10;
    const height = 10;
    const buf = buildBuffer(width, height, [255, 255, 255], { x: 3, y: 3, w: 4, h: 4, color: [0, 0, 0] });

    // Black-on-white is the maximum possible color distance (100% of MAX_DISTANCE).
    // A tolerance a few points under 100 puts the square just past the hard threshold,
    // landing inside the soft band instead of hard-removed or hard-kept.
    const mask = computeInstantAlphaMask(buf, width, height, 0, 0, 97);

    const squareCornerIndex = 3 * width + 3; // the black square's own top-left pixel, bordering removed white
    expect(mask[squareCornerIndex]).toBeGreaterThan(0);
    expect(mask[squareCornerIndex]).toBeLessThan(255);
  });
});
