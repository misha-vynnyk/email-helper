import { applyPalette, GIFEncoder, quantize } from "gifenc";

import { ComposedGifFrame } from "./gifCompositor";

const MAX_PALETTE_COLORS = 256;

/**
 * gifenc's quantize() defaults to clearAlpha:true, which zeroes RGB on fully-
 * transparent pixels ONLY while building the palette — so the transparent palette
 * entry itself always collapses to (0,0,0,0). But applyPalette()'s per-pixel
 * nearest-neighbor match runs against the ORIGINAL rgba buffer, unaffected by that
 * option: a fully-transparent pixel that still carries its pre-removal RGB (e.g. a
 * bright white background composited to alpha 0) can end up closer, in equal-
 * weighted RGBA Euclidean distance, to an unrelated opaque palette color than to the
 * black transparent entry — misclassifying background pixels as solid foreground
 * color. Clearing RGB on alpha-0 pixels here, before quantize/applyPalette both see
 * it, keeps the actual per-pixel data consistent with what the palette already
 * assumes.
 */
function clearAlphaRgb(rgba: Uint8ClampedArray): Uint8ClampedArray {
  const out = new Uint8ClampedArray(rgba);
  for (let i = 0; i < out.length; i += 4) {
    if (out[i + 3] === 0) {
      out[i] = 0;
      out[i + 1] = 0;
      out[i + 2] = 0;
    }
  }
  return out;
}

export function encodeGif(frames: ComposedGifFrame[], width: number, height: number): Blob {
  const gif = GIFEncoder();

  for (const frame of frames) {
    const rgba = clearAlphaRgb(frame.rgba);
    const palette = quantize(rgba, MAX_PALETTE_COLORS, { format: "rgba4444" });
    const index = applyPalette(rgba, palette, "rgba4444");
    const transparentIndex = palette.findIndex((color) => color[3] === 0);

    gif.writeFrame(index, width, height, {
      palette,
      delay: frame.delayMs,
      // Explicit even though gifenc's own encodeGraphicControlExt already treats a
      // negative transparentIndex as "no transparency" — documents the intent here
      // instead of relying on that internal.
      ...(transparentIndex >= 0 ? { transparent: true, transparentIndex } : { transparent: false }),
      // Every frame we hand in is already a fully-resolved complete composite (the
      // compositor already applied the GIF disposal rules) — telling the *playback*
      // decoder to clear-to-background between frames stops it from re-compositing
      // on top of our already-final pixels, which would double-apply disposal logic
      // and reintroduce ghosting.
      dispose: 2,
      repeat: 0,
    });
  }

  gif.finish();
  return new Blob([new Uint8Array(gif.bytes())], { type: "image/gif" });
}
