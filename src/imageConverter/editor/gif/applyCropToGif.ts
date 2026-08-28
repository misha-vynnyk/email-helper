/**
 * GIF-aware crop entry point — mirrors applyEditToImage.ts's shape, but crops a
 * flat RGBA buffer per composited frame instead of going through an ImageBitmap
 * (routing through the bitmap-based helper would force a pointless
 * putImageData/getImageData round-trip per frame).
 *
 * Must keep image/gif type/name (unlike applyEditToImage.ts's PNG output) —
 * useConversionQueue.ts detects format from file.name/file.type and force-routes
 * GIF↔GIF through server-side gifsicle; losing the gif type/extension would
 * silently break that routing.
 */

import { CropRect } from "../../types";
import { rectToPixels } from "../cropMath";
import { cropRgba } from "../cropRgba";
import { decodeGif } from "./decodeGif";
import { encodeGif } from "./encodeGif";

export async function applyCropToGif(file: File, crop: CropRect): Promise<File> {
  const { width, height, frames } = await decodeGif(file);
  const px = rectToPixels(crop, width, height);
  const cropWidth = Math.max(1, px.width);
  const cropHeight = Math.max(1, px.height);

  const croppedFrames = frames.map((frame) => ({
    rgba: cropRgba(frame.rgba, width, height, { ...px, width: cropWidth, height: cropHeight }),
    delayMs: frame.delayMs,
  }));

  const blob = encodeGif(croppedFrames, cropWidth, cropHeight);
  return new File([blob], file.name, { type: "image/gif" });
}
