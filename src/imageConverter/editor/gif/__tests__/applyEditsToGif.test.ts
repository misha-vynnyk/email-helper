import { buildEditedFrames } from "../applyEditsToGif";
import { ComposedGifFrame } from "../gifCompositor";

/** Builds a flat width×height RGBA frame, then overwrites one region with a
 * different color — mirrors instantAlpha.test.ts's "background + foreground" fixture. */
function buildFrame(
  width: number,
  height: number,
  bg: [number, number, number],
  fg: { x: number; y: number; w: number; h: number; color: [number, number, number] },
  delayMs: number
): ComposedGifFrame {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    rgba[p * 4] = bg[0];
    rgba[p * 4 + 1] = bg[1];
    rgba[p * 4 + 2] = bg[2];
    rgba[p * 4 + 3] = 255;
  }
  for (let y = fg.y; y < fg.y + fg.h; y++) {
    for (let x = fg.x; x < fg.x + fg.w; x++) {
      const p = y * width + x;
      rgba[p * 4] = fg.color[0];
      rgba[p * 4 + 1] = fg.color[1];
      rgba[p * 4 + 2] = fg.color[2];
      rgba[p * 4 + 3] = 255;
    }
  }
  return { rgba, delayMs };
}

function pixelAt(rgba: Uint8ClampedArray, canvasWidth: number, x: number, y: number) {
  const offset = (y * canvasWidth + x) * 4;
  return [rgba[offset], rgba[offset + 1], rgba[offset + 2], rgba[offset + 3]];
}

describe("buildEditedFrames", () => {
  it("passes frames through unchanged when there is no background edit and no crop", async () => {
    const width = 4;
    const height = 4;
    const frames = [
      buildFrame(width, height, [255, 255, 255], { x: 0, y: 0, w: 0, h: 0, color: [0, 0, 0] }, 100),
      buildFrame(width, height, [200, 100, 50], { x: 0, y: 0, w: 0, h: 0, color: [0, 0, 0] }, 150),
    ];

    const result = await buildEditedFrames({ width, height, frames }, {});

    expect(result.width).toBe(width);
    expect(result.height).toBe(height);
    expect(Array.from(result.frames[0].rgba)).toEqual(Array.from(frames[0].rgba));
    expect(Array.from(result.frames[1].rgba)).toEqual(Array.from(frames[1].rgba));
    expect(result.frames[0].delayMs).toBe(100);
    expect(result.frames[1].delayMs).toBe(150);
  });

  it("removes a background pick from every frame, even when each frame's foreground patch differs", async () => {
    const width = 10;
    const height = 10;
    const frames = [
      buildFrame(width, height, [255, 255, 255], { x: 3, y: 3, w: 4, h: 4, color: [0, 0, 0] }, 100),
      buildFrame(width, height, [255, 255, 255], { x: 5, y: 5, w: 4, h: 4, color: [0, 0, 0] }, 100),
    ];

    const result = await buildEditedFrames(
      { width, height, frames },
      { background: { operations: [{ type: "pick", seed: { x: 0, y: 0 }, tolerance: 5 }], replaceMode: "transparent" } }
    );

    // Background corner removed in both frames.
    expect(pixelAt(result.frames[0].rgba, width, 0, 0)[3]).toBe(0);
    expect(pixelAt(result.frames[1].rgba, width, 0, 0)[3]).toBe(0);
    // Each frame's own foreground square (at its own, differing position) stays opaque.
    expect(pixelAt(result.frames[0].rgba, width, 5, 5)[3]).toBe(255);
    expect(pixelAt(result.frames[1].rgba, width, 7, 7)[3]).toBe(255);
  });

  it("applies background removal before crop, using full-canvas coordinates for the pick", async () => {
    const width = 10;
    const height = 10;
    // White background, black 4x4 square at (3,3)-(6,6).
    const frames = [buildFrame(width, height, [255, 255, 255], { x: 3, y: 3, w: 4, h: 4, color: [0, 0, 0] }, 100)];

    const result = await buildEditedFrames(
      { width, height, frames },
      {
        background: { operations: [{ type: "pick", seed: { x: 0, y: 0 }, tolerance: 5 }], replaceMode: "transparent" },
        // Normalized rect exactly matching the square's pixel bounding box in the
        // original 10x10 canvas — rectToPixels rounds 0.3*10=3, 0.4*10=4.
        crop: { x: 0.3, y: 0.3, width: 0.4, height: 0.4 },
      }
    );

    expect(result.width).toBe(4);
    expect(result.height).toBe(4);
    // The pick's seed (0,0) referred to the pre-crop canvas's white corner, nowhere
    // near this cropped region — so nothing here should have been removed, and the
    // whole cropped output should still be the opaque black square.
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        expect(pixelAt(result.frames[0].rgba, 4, x, y)).toEqual([0, 0, 0, 255]);
      }
    }
  });

  it("reports progress once per frame, ending at current === total", async () => {
    const width = 2;
    const height = 2;
    const frames = [
      buildFrame(width, height, [0, 0, 0], { x: 0, y: 0, w: 0, h: 0, color: [0, 0, 0] }, 50),
      buildFrame(width, height, [0, 0, 0], { x: 0, y: 0, w: 0, h: 0, color: [0, 0, 0] }, 50),
      buildFrame(width, height, [0, 0, 0], { x: 0, y: 0, w: 0, h: 0, color: [0, 0, 0] }, 50),
    ];
    const onProgress = jest.fn();

    await buildEditedFrames({ width, height, frames }, {}, onProgress);

    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress.mock.calls.map((c) => c[0].current)).toEqual([1, 2, 3]);
    expect(onProgress).toHaveBeenLastCalledWith({ current: 3, total: 3 });
  });

  it("composites replaceMode 'color' per frame", async () => {
    const width = 10;
    const height = 10;
    const frames = [buildFrame(width, height, [255, 255, 255], { x: 3, y: 3, w: 4, h: 4, color: [0, 0, 0] }, 100)];

    const result = await buildEditedFrames(
      { width, height, frames },
      {
        background: {
          operations: [{ type: "pick", seed: { x: 0, y: 0 }, tolerance: 5 }],
          replaceMode: "color",
          replaceColor: "#00ff00",
        },
      }
    );

    // Removed background pixel is fully replaced by the solid color, fully opaque.
    expect(pixelAt(result.frames[0].rgba, width, 0, 0)).toEqual([0, 255, 0, 255]);
    // Kept foreground pixel is untouched (mask=255 -> a=1 -> output is 100% src).
    expect(pixelAt(result.frames[0].rgba, width, 5, 5)).toEqual([0, 0, 0, 255]);
  });
});
