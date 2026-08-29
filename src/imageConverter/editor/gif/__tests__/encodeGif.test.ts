import { decompressFrames, parseGIF } from "gifuct-js";

import { encodeGif } from "../encodeGif";
import { ComposedGifFrame } from "../gifCompositor";

/** jsdom's Blob doesn't implement arrayBuffer() — FileReader is the portable path. */
function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

/** Builds a full-canvas RGBA frame: an opaque bright background everywhere, with a
 * foreground rect punched in a different opaque color, then the background region
 * flattened to alpha 0 while KEEPING its original bright RGB — exactly what
 * compositeBackground.ts's "transparent" mode produces for background-removed pixels. */
function buildTransparentBgFrame(
  width: number,
  height: number,
  bg: [number, number, number],
  fg: { x: number; y: number; w: number; h: number; color: [number, number, number] }
): ComposedGifFrame {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    rgba[p * 4] = bg[0];
    rgba[p * 4 + 1] = bg[1];
    rgba[p * 4 + 2] = bg[2];
    rgba[p * 4 + 3] = 0; // background already "removed" — alpha 0, RGB left as-is
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
  return { rgba, delayMs: 100 };
}

describe("encodeGif", () => {
  it("round-trips a bright, fully-transparent background without misclassifying it as opaque foreground color", async () => {
    // Regression test for a live-browser-verified bug: a white background composited
    // to alpha 0 (background removal's "transparent" mode) was, before this fix,
    // matched by gifenc's nearest-neighbor palette lookup to the opaque red
    // foreground color instead of the transparent palette entry — collapsing every
    // background pixel to solid red on encode.
    const width = 20;
    const height = 20;
    const frame = buildTransparentBgFrame(width, height, [255, 255, 255], { x: 5, y: 5, w: 10, h: 10, color: [255, 0, 0] });

    const blob = encodeGif([frame], width, height);
    const buffer = await blobToArrayBuffer(blob);
    const parsed = parseGIF(buffer);
    const decoded = decompressFrames(parsed, true)[0];

    // decoded.patch is sized to the frame's own dims, alpha 0 = transparent per
    // gifuct-js convention (matches gifCompositor.ts's own reading of it).
    const { dims, patch } = decoded;
    const localWidth = dims.width;

    function alphaAt(x: number, y: number): number {
      const px = (y * localWidth + x) * 4;
      return patch[px + 3];
    }

    // A background corner, well outside the foreground rect, must decode back as
    // transparent — NOT as opaque red.
    expect(alphaAt(0 - dims.left, 0 - dims.top)).toBe(0);
    // The foreground rect's center must still decode as opaque.
    const fgCenterX = 10 - dims.left;
    const fgCenterY = 10 - dims.top;
    expect(alphaAt(fgCenterX, fgCenterY)).toBe(255);
  });
});
