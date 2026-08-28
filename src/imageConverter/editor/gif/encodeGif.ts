import { applyPalette, GIFEncoder, quantize } from "gifenc";

import { ComposedGifFrame } from "./gifCompositor";

const MAX_PALETTE_COLORS = 256;

export function encodeGif(frames: ComposedGifFrame[], width: number, height: number): Blob {
  const gif = GIFEncoder();

  for (const frame of frames) {
    const palette = quantize(frame.rgba, MAX_PALETTE_COLORS, { format: "rgba4444" });
    const index = applyPalette(frame.rgba, palette, "rgba4444");
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
