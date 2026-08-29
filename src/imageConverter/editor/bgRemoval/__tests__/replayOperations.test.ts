import { precomputeOklab } from "../instantAlpha";
import { computeMaskFromOperations } from "../replayOperations";

function buildBuffer(width: number, height: number, bg: [number, number, number]): Uint8ClampedArray {
  const buf = new Uint8ClampedArray(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    buf[p * 4] = bg[0];
    buf[p * 4 + 1] = bg[1];
    buf[p * 4 + 2] = bg[2];
    buf[p * 4 + 3] = 255;
  }
  return buf;
}

describe("computeMaskFromOperations", () => {
  it("no operations leaves everything opaque", () => {
    const width = 5;
    const height = 5;
    const buf = buildBuffer(width, height, [255, 255, 255]);
    const oklab = precomputeOklab(buf, width * height);
    const mask = computeMaskFromOperations(oklab, width, height, []);
    expect(Array.from(mask)).toEqual(new Array(width * height).fill(255));
  });

  it("unions multiple picks", () => {
    const width = 10;
    const height = 1;
    const buf = buildBuffer(width, height, [255, 255, 255]);
    const oklab = precomputeOklab(buf, width * height);
    // Two picks anywhere on this flat-color row both flood the whole row.
    const mask = computeMaskFromOperations(oklab, width, height, [
      { type: "pick", seed: { x: 0, y: 0 }, tolerance: 5 },
      { type: "pick", seed: { x: 0.9, y: 0 }, tolerance: 5 },
    ]);
    expect(Array.from(mask)).toEqual(new Array(width).fill(0));
  });

  it("a stroke after a pick overrides it at that pixel", () => {
    const width = 10;
    const height = 1;
    const buf = buildBuffer(width, height, [255, 255, 255]);
    const oklab = precomputeOklab(buf, width * height);
    const mask = computeMaskFromOperations(oklab, width, height, [
      { type: "pick", seed: { x: 0, y: 0 }, tolerance: 5 }, // removes the whole flat-color row
      { type: "stroke", points: [{ x: 0.5, y: 0 }], radius: 0.15, mode: "restore" },
    ]);
    const restoredIndex = 5; // x=5,y=0 — under the restore stamp
    const stillRemovedIndex = 0;
    expect(mask[restoredIndex]).toBe(255);
    expect(mask[stillRemovedIndex]).toBe(0);
  });

  it("a pick after a restore stroke can re-remove the same pixel (chronological order matters)", () => {
    const width = 10;
    const height = 1;
    const buf = buildBuffer(width, height, [255, 255, 255]);
    const oklab = precomputeOklab(buf, width * height);
    const mask = computeMaskFromOperations(oklab, width, height, [
      { type: "pick", seed: { x: 0, y: 0 }, tolerance: 5 }, // removes everything
      { type: "stroke", points: [{ x: 0.5, y: 0 }], radius: 0.15, mode: "restore" }, // restores around x=5
      { type: "pick", seed: { x: 0.9, y: 0 }, tolerance: 5 }, // floods the whole row again, including x=5
    ]);
    // The later pick re-removes what the earlier restore brought back — this is what
    // batching "all picks first, then all strokes" would get wrong.
    expect(mask[5]).toBe(0);
  });

  it("reusing the same precomputed OklabBuffers across two calls yields identical masks (buffers aren't mutated)", () => {
    const width = 10;
    const height = 1;
    const buf = buildBuffer(width, height, [255, 255, 255]);
    const oklab = precomputeOklab(buf, width * height);
    const operations = [
      { type: "pick" as const, seed: { x: 0, y: 0 }, tolerance: 5 },
      { type: "stroke" as const, points: [{ x: 0.5, y: 0 }], radius: 0.15, mode: "restore" as const },
    ];
    const first = computeMaskFromOperations(oklab, width, height, operations);
    const second = computeMaskFromOperations(oklab, width, height, operations);
    expect(Array.from(second)).toEqual(Array.from(first));
  });
});
