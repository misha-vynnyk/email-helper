/**
 * GIF-aware background removal + crop entry point (Phase 4). Decodes once, runs
 * background-removal-then-crop per composited frame directly on the in-memory RGBA
 * buffer, encodes once — deliberately NOT a two-pass chain of applyBackgroundRemoval
 * (which outputs a real intermediate GIF) followed by applyCropToGif, since that
 * would decode/quantize/encode the GIF twice, compounding palette-quantization loss
 * for no benefit (background removal only ever needs an RGBA buffer, not a real
 * intermediate file).
 *
 * Background removal runs before crop — same rationale as the static-image path
 * (applyBackgroundRemoval.ts): it never changes dimensions, so the crop rect's
 * normalized coordinate space is unaffected by doing it first.
 *
 * The same BackgroundOperation log used for a static image is replayed identically
 * against every GIF frame — operations are normalized 0-1 coordinates (see
 * types/index.ts), so no per-frame coordinate transform is needed. This is a
 * deliberate scope call: the user picks/erases against frame 0 only (EditorStage has
 * no per-frame preview), and that single edit is applied the same way to every frame.
 * Holds up well for the tool's actual target case (flat/gradient marketing
 * backgrounds, per instantAlpha.ts's own rationale) where the background color at the
 * seed pixel is the same across frames; degrades for palette-cycling/panning
 * backgrounds or content a disposal-3 restore reveals differently than frame 0.
 */

import { BackgroundEditState, CropRect } from "../../types";
import { loadBackgroundImageRgba } from "../bgRemoval/applyBackgroundRemoval";
import { compositeBackground } from "../bgRemoval/compositeBackground";
import { precomputeOklab } from "../bgRemoval/instantAlpha";
import { computeMaskFromOperations } from "../bgRemoval/replayOperations";
import { isFullRect, rectToPixels } from "../cropMath";
import { cropRgba } from "../cropRgba";
import { DecodedGif,decodeGif } from "./decodeGif";
import { encodeGif } from "./encodeGif";
import { ComposedGifFrame } from "./gifCompositor";

export interface GifEditProgress {
  current: number;
  total: number;
}

export interface GifEditOptions {
  background?: BackgroundEditState;
  crop?: CropRect;
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Pure per-frame transform, exported separately from applyEditsToGif so tests can
 * assert on RGBA directly without going through encodeGif's lossy palette
 * quantization.
 */
export async function buildEditedFrames(
  decoded: DecodedGif,
  options: GifEditOptions,
  onProgress?: (progress: GifEditProgress) => void
): Promise<{ frames: ComposedGifFrame[]; width: number; height: number }> {
  const { width, height, frames } = decoded;
  const hasBackgroundEdit = !!options.background && options.background.operations.length > 0;
  const hasCrop = !!options.crop && !isFullRect(options.crop);
  const px = hasCrop ? rectToPixels(options.crop!, width, height) : null;
  const outWidth = px ? Math.max(1, px.width) : width;
  const outHeight = px ? Math.max(1, px.height) : height;

  // Resolved once, at pre-crop size, outside the per-frame loop — the replacement
  // background image doesn't change per frame, matching applyBackgroundRemoval.ts's
  // convention.
  const backgroundRgba =
    hasBackgroundEdit && options.background!.replaceMode === "image" && options.background!.replaceImageUrl
      ? await loadBackgroundImageRgba(options.background!.replaceImageUrl, width, height)
      : null;

  const outFrames: ComposedGifFrame[] = [];
  for (let i = 0; i < frames.length; i++) {
    let rgba = frames[i].rgba;

    if (hasBackgroundEdit) {
      const oklab = precomputeOklab(rgba, width * height);
      const mask = computeMaskFromOperations(oklab, width, height, options.background!.operations);
      rgba = compositeBackground(rgba, mask, width, height, options.background!, backgroundRgba);
    }

    if (px) {
      rgba = cropRgba(rgba, width, height, { ...px, width: outWidth, height: outHeight });
    }

    outFrames.push({ rgba, delayMs: frames[i].delayMs });
    onProgress?.({ current: i + 1, total: frames.length });

    // Nothing else in this loop awaits, so without an explicit yield the browser
    // never paints a statusText update until the whole bake finishes — a progress
    // counter that updates state but never repaints looks like a frozen tab.
    if (i % 4 === 3) await yieldToMain();
  }

  return { frames: outFrames, width: outWidth, height: outHeight };
}

export async function applyEditsToGif(file: File, options: GifEditOptions, onProgress?: (progress: GifEditProgress) => void): Promise<File> {
  const decoded = await decodeGif(file);
  const { frames, width, height } = await buildEditedFrames(decoded, options, onProgress);
  const blob = encodeGif(frames, width, height);
  // Preserves name/type — required for useConversionQueue.ts's format detection to
  // keep routing GIF↔GIF through server-side gifsicle instead of client PNG routing.
  return new File([blob], file.name, { type: "image/gif" });
}
