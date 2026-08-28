/**
 * gifenc ships no "types" field and no .d.ts anywhere in the published package
 * (verified against node_modules/gifenc/package.json and src/*.js) — this is a
 * hand-written ambient declaration covering only the API surface this app uses.
 */
declare module "gifenc" {
  export type GifencPaletteFormat = "rgb565" | "rgb444" | "rgba4444";

  export interface GifencEncoderWriteFrameOptions {
    palette?: number[][] | null;
    delay?: number; // milliseconds
    transparent?: boolean;
    transparentIndex?: number;
    dispose?: number; // -1 = unset, 0 = no action, 2 = restore to background, 3 = restore to previous
    repeat?: number; // -1 = once, 0 = forever, >0 = repeat count
    colorDepth?: number;
    first?: boolean;
  }

  export interface GifencEncoder {
    writeFrame(index: Uint8Array, width: number, height: number, opts?: GifencEncoderWriteFrameOptions): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
    reset(): void;
  }

  export function GIFEncoder(opts?: { initialCapacity?: number; auto?: boolean }): GifencEncoder;

  export interface QuantizeOptions {
    format?: GifencPaletteFormat;
    clearAlpha?: boolean;
    clearAlphaColor?: number;
    clearAlphaThreshold?: number;
    oneBitAlpha?: boolean | number;
    useSqrt?: boolean;
  }

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    opts?: QuantizeOptions
  ): number[][];

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: GifencPaletteFormat
  ): Uint8Array;
}
