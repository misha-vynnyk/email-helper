/**
 * Background-removal entry point — bakes an Instant-Alpha selection (see
 * instantAlpha.ts) plus the pure compositeBackground math into a new File. Runs
 * BEFORE crop in ImageEditorModal's handleApply (see applyEditToImage.ts's own
 * comment): background removal never changes the image's dimensions, so the crop
 * rect's coordinate space is unaffected by doing this step first.
 *
 * Output is always PNG, same convention as applyEditToImage.ts — an intermediate
 * source the existing conversion queue re-encodes afterward.
 */

import { BackgroundEditState } from "../../types";
import { compositeBackground } from "./compositeBackground";
import { precomputeOklab } from "./instantAlpha";
import { computeMaskFromOperations } from "./replayOperations";

/** Draws `imageUrl` to fill a width×height canvas (object-fit: cover), returning raw RGBA.
 * Exported so applyEditsToGif.ts can reuse it for the "replace with image" mode instead
 * of reimplementing the same DOM/canvas image-load. */
export async function loadBackgroundImageRgba(imageUrl: string, width: number, height: number): Promise<Uint8ClampedArray> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);

  try {
    const scale = Math.max(width / bitmap.width, height / bitmap.height);
    const drawWidth = bitmap.width * scale;
    const drawHeight = bitmap.height * scale;
    const dx = (width - drawWidth) / 2;
    const dy = (height - drawHeight) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");

    ctx.drawImage(bitmap, dx, dy, drawWidth, drawHeight);
    return ctx.getImageData(0, 0, width, height).data;
  } finally {
    bitmap.close();
  }
}

export async function applyBackgroundRemoval(file: File, background: BackgroundEditState): Promise<File> {
  if (background.operations.length === 0) return file; // nothing picked/painted yet — no-op

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const original = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const oklab = precomputeOklab(original.data, canvas.width * canvas.height);
  const mask = computeMaskFromOperations(oklab, canvas.width, canvas.height, background.operations);

  const backgroundRgba =
    background.replaceMode === "image" && background.replaceImageUrl
      ? await loadBackgroundImageRgba(background.replaceImageUrl, canvas.width, canvas.height)
      : null;

  const composited = compositeBackground(original.data, mask, canvas.width, canvas.height, background, backgroundRgba);
  ctx.putImageData(new ImageData(composited, canvas.width, canvas.height), 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to encode image"))), "image/png");
  });

  return new File([blob], file.name, { type: "image/png" });
}
