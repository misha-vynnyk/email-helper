import { composeGifFrames, DisposableFrame } from "../gifCompositor";

const CANVAS_W = 2;
const CANVAS_H = 2;

/** Builds an opaque RGBA patch of a single color, sized width*height. */
function solidPatch(r: number, g: number, b: number, width: number, height: number): Uint8ClampedArray {
  const patch = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    patch[i * 4] = r;
    patch[i * 4 + 1] = g;
    patch[i * 4 + 2] = b;
    patch[i * 4 + 3] = 255;
  }
  return patch;
}

function transparentPatch(width: number, height: number): Uint8ClampedArray {
  return new Uint8ClampedArray(width * height * 4); // all zeros = fully transparent
}

function pixelAt(rgba: Uint8ClampedArray, canvasWidth: number, x: number, y: number) {
  const offset = (y * canvasWidth + x) * 4;
  return [rgba[offset], rgba[offset + 1], rgba[offset + 2], rgba[offset + 3]];
}

describe("composeGifFrames", () => {
  it("clears a disposalType-2 frame's rect before the next frame draws", () => {
    const frames: DisposableFrame[] = [
      {
        dims: { top: 0, left: 0, width: 2, height: 2 },
        delay: 100,
        disposalType: 2,
        patch: solidPatch(255, 0, 0, 2, 2), // full-canvas opaque red
      },
      {
        dims: { top: 0, left: 0, width: 1, height: 1 }, // only the top-left pixel
        delay: 100,
        disposalType: 0,
        patch: solidPatch(0, 0, 255, 1, 1), // opaque blue
      },
    ];

    const composed = composeGifFrames(frames, CANVAS_W, CANVAS_H);

    // Frame 0's disposal (type 2) must clear its own rect (the whole canvas here)
    // before frame 1 draws, so only the pixel frame 1 actually redraws is opaque —
    // everywhere else must be transparent, not leftover red.
    expect(pixelAt(composed[1].rgba, CANVAS_W, 0, 0)).toEqual([0, 0, 255, 255]);
    expect(pixelAt(composed[1].rgba, CANVAS_W, 1, 0)).toEqual([0, 0, 0, 0]);
    expect(pixelAt(composed[1].rgba, CANVAS_W, 0, 1)).toEqual([0, 0, 0, 0]);
    expect(pixelAt(composed[1].rgba, CANVAS_W, 1, 1)).toEqual([0, 0, 0, 0]);
  });

  it("leaves the canvas untouched when a disposalType-1 frame's patch is fully transparent", () => {
    const frames: DisposableFrame[] = [
      {
        dims: { top: 0, left: 0, width: 2, height: 2 },
        delay: 100,
        disposalType: 1,
        patch: solidPatch(10, 20, 30, 2, 2),
      },
      {
        dims: { top: 0, left: 0, width: 2, height: 2 },
        delay: 100,
        disposalType: 1,
        patch: transparentPatch(2, 2), // must never stomp existing canvas content
      },
    ];

    const composed = composeGifFrames(frames, CANVAS_W, CANVAS_H);

    expect(composed[1].rgba).toEqual(composed[0].rgba);
  });

  it("restores a disposalType-3 frame's own pre-draw snapshot, not the next frame's leftovers", () => {
    const frames: DisposableFrame[] = [
      {
        // Frame 0: fills the whole canvas with color A.
        dims: { top: 0, left: 0, width: 2, height: 2 },
        delay: 100,
        disposalType: 0,
        patch: solidPatch(10, 10, 10, 2, 2), // color A
      },
      {
        // Frame 1: disposalType 3 — draws color B over just the top-left pixel.
        // Its pre-draw snapshot of that pixel (color A) must be what gets restored
        // afterward, not whatever frame 2 draws there next.
        dims: { top: 0, left: 0, width: 1, height: 1 },
        delay: 100,
        disposalType: 3,
        patch: solidPatch(20, 20, 20, 1, 1), // color B
      },
      {
        // Frame 2: draws color C over the bottom-right pixel only. Frame 1's
        // disposal must fire first, restoring the top-left pixel to color A.
        dims: { top: 1, left: 1, width: 1, height: 1 },
        delay: 100,
        disposalType: 0,
        patch: solidPatch(30, 30, 30, 1, 1), // color C
      },
    ];

    const composed = composeGifFrames(frames, CANVAS_W, CANVAS_H);

    expect(pixelAt(composed[1].rgba, CANVAS_W, 0, 0)).toEqual([20, 20, 20, 255]); // color B, drawn
    expect(pixelAt(composed[2].rgba, CANVAS_W, 0, 0)).toEqual([10, 10, 10, 255]); // restored to color A, not B
    expect(pixelAt(composed[2].rgba, CANVAS_W, 1, 1)).toEqual([30, 30, 30, 255]); // color C, drawn
  });
});
