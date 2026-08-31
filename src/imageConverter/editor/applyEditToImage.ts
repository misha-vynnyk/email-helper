/**
 * Bakes a crop rect into a File. Output is always PNG — this is an intermediate
 * source, not the final export, so it stays lossless; the existing conversion queue
 * re-encodes it to the user's target format/quality afterward.
 */

import { rectToPixels } from "./cropMath";
import { CropRect } from "../types";

export async function applyCropToImage(file: File, crop: CropRect): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const px = rectToPixels(crop, bitmap.width, bitmap.height);

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, px.width);
    canvas.height = Math.max(1, px.height);

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");

    ctx.drawImage(bitmap, px.x, px.y, px.width, px.height, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to encode cropped image"))), "image/png");
    });

    return new File([blob], file.name, { type: "image/png" });
  } finally {
    bitmap.close();
  }
}
