/**
 * Shared resize step — wraps @jsquash/resize (lanczos3 by default) so both the
 * main-thread client converter and the Web Worker use the same high-quality
 * resampling instead of a plain canvas drawImage scale.
 */

import resize from "@jsquash/resize";

/** No-op when the target size already matches the source — avoids a pointless WASM round-trip. */
export async function resizeImageData(imageData: ImageData, width: number, height: number): Promise<ImageData> {
  if (width === imageData.width && height === imageData.height) {
    return imageData;
  }
  return resize(imageData, { width, height });
}
