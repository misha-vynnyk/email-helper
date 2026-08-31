import { decompressFrames, parseGIF, ParsedFrame } from "gifuct-js";

import { composeGifFrames, DisposableFrame, ComposedGifFrame } from "./gifCompositor";

export interface DecodedGif {
  width: number;
  height: number;
  frames: ComposedGifFrame[];
}

function toDisposableFrame(frame: ParsedFrame): DisposableFrame {
  return {
    dims: frame.dims,
    delay: frame.delay,
    disposalType: frame.disposalType,
    patch: frame.patch,
  };
}

export async function decodeGif(file: File): Promise<DecodedGif> {
  const buffer = await file.arrayBuffer();
  const parsed = parseGIF(buffer);
  const parsedFrames = decompressFrames(parsed, true);

  const width = parsed.lsd.width;
  const height = parsed.lsd.height;
  const frames = composeGifFrames(parsedFrames.map(toDisposableFrame), width, height);

  return { width, height, frames };
}
