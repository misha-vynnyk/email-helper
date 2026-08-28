/**
 * Pure, no DOM: composites gifuct-js frames into full-canvas RGBA per animation
 * frame, applying GIF disposal-method rules between frames. This is the algorithmic
 * core of GIF-aware crop — see the plan's "Disposal-compositing algorithm" section
 * for the frame-by-frame walkthrough this implements.
 */

export interface DisposableFrameDims {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface DisposableFrame {
  dims: DisposableFrameDims;
  delay: number; // ms
  disposalType: number; // 0-3
  patch: Uint8ClampedArray; // RGBA, alpha 0 = transparent / 255 = opaque, sized to dims (not full canvas)
}

export interface ComposedGifFrame {
  rgba: Uint8ClampedArray; // full canvasWidth*canvasHeight*4
  delayMs: number;
}

function clearRect(canvas: Uint8ClampedArray, canvasWidth: number, rect: DisposableFrameDims): void {
  const stride = canvasWidth * 4;
  for (let row = 0; row < rect.height; row++) {
    const offset = (rect.top + row) * stride + rect.left * 4;
    canvas.fill(0, offset, offset + rect.width * 4);
  }
}

function snapshotRect(canvas: Uint8ClampedArray, canvasWidth: number, rect: DisposableFrameDims): Uint8ClampedArray {
  const stride = canvasWidth * 4;
  const out = new Uint8ClampedArray(rect.width * rect.height * 4);
  for (let row = 0; row < rect.height; row++) {
    const srcOffset = (rect.top + row) * stride + rect.left * 4;
    out.set(canvas.subarray(srcOffset, srcOffset + rect.width * 4), row * rect.width * 4);
  }
  return out;
}

function restoreRect(canvas: Uint8ClampedArray, canvasWidth: number, rect: DisposableFrameDims, snapshot: Uint8ClampedArray): void {
  const stride = canvasWidth * 4;
  for (let row = 0; row < rect.height; row++) {
    const destOffset = (rect.top + row) * stride + rect.left * 4;
    canvas.set(snapshot.subarray(row * rect.width * 4, (row + 1) * rect.width * 4), destOffset);
  }
}

/** Copies `patch` onto `canvas` at `rect`'s position, skipping fully-transparent
 * pixels (binary transparency, not blending — matches gifuct-js's own patch convention). */
function drawPatch(canvas: Uint8ClampedArray, canvasWidth: number, rect: DisposableFrameDims, patch: Uint8ClampedArray): void {
  const stride = canvasWidth * 4;
  for (let row = 0; row < rect.height; row++) {
    const destRowOffset = (rect.top + row) * stride + rect.left * 4;
    const patchRowOffset = row * rect.width * 4;
    for (let col = 0; col < rect.width; col++) {
      const patchOffset = patchRowOffset + col * 4;
      if (patch[patchOffset + 3] === 0) continue;
      const destOffset = destRowOffset + col * 4;
      canvas[destOffset] = patch[patchOffset];
      canvas[destOffset + 1] = patch[patchOffset + 1];
      canvas[destOffset + 2] = patch[patchOffset + 2];
      canvas[destOffset + 3] = patch[patchOffset + 3];
    }
  }
}

export function composeGifFrames(frames: DisposableFrame[], canvasWidth: number, canvasHeight: number): ComposedGifFrame[] {
  const canvas = new Uint8ClampedArray(canvasWidth * canvasHeight * 4);
  const composed: ComposedGifFrame[] = [];
  let previousSnapshot: Uint8ClampedArray | null = null;
  let previousRect: DisposableFrameDims | null = null;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];

    // Step 1: apply frame i-1's disposal, before drawing frame i.
    if (i > 0) {
      const prev = frames[i - 1];
      if (prev.disposalType === 2) {
        clearRect(canvas, canvasWidth, prev.dims);
      } else if (prev.disposalType === 3 && previousSnapshot && previousRect) {
        restoreRect(canvas, canvasWidth, previousRect, previousSnapshot);
      }
      // disposalType 0/1: no-op, leave canvas as-is.
    }

    // Step 2: if this frame will need disposal-3 restore next iteration, snapshot
    // the canvas within its rect BEFORE drawing its own patch.
    if (frame.disposalType === 3) {
      previousSnapshot = snapshotRect(canvas, canvasWidth, frame.dims);
      previousRect = frame.dims;
    } else {
      previousSnapshot = null;
      previousRect = null;
    }

    // Step 3: draw this frame's patch onto the canvas.
    drawPatch(canvas, canvasWidth, frame.dims, frame.patch);

    // Step 4: clone the full canvas as this frame's composed output.
    composed.push({ rgba: canvas.slice(), delayMs: frame.delay });
  }

  return composed;
}
