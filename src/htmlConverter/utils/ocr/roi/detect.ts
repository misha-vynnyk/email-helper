/**
 * Region of Interest (ROI) detection for targeted OCR
 */

/**
 * Convert a Blob to HTMLCanvasElement with size constraints
 */
export async function blobToCanvasFit(
  blob: Blob,
  opts: { minWidth: number; maxWidth: number }
): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(blob);
  const w = bmp.width;
  const h = bmp.height;

  const minW = Math.max(0, Math.round(opts.minWidth));
  const maxW = Math.max(1, Math.round(opts.maxWidth));

  let targetW = w;
  if (minW > 0 && w < minW) targetW = minW;
  if (w > maxW) targetW = maxW;

  const scale = targetW / w;
  const outW = Math.max(1, Math.round(w * scale));
  const outH = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = true;
  (ctx as any).imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, outW, outH);
  return canvas;
}

/**
 * Convert a Blob to HTMLCanvasElement with max width
 */
export async function blobToCanvas(blob: Blob, maxWidth: number): Promise<HTMLCanvasElement> {
  return await blobToCanvasFit(blob, { minWidth: 0, maxWidth });
}

/**
 * Crop a canvas by fractional coordinates [0,1]
 */
export function cropCanvasByFrac(
  src: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number
): HTMLCanvasElement {
  const fx = Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
  const fy = Math.max(0, Math.min(1, Number.isFinite(y) ? y : 0));
  const fw = Math.max(0.05, Math.min(1, Number.isFinite(w) ? w : 1));
  const fh = Math.max(0.05, Math.min(1, Number.isFinite(h) ? h : 1));

  const sx = Math.round(src.width * fx);
  const sy = Math.round(src.height * fy);
  const sw = Math.max(1, Math.round(src.width * fw));
  const sh = Math.max(1, Math.round(src.height * fh));

  const out = document.createElement("canvas");
  out.width = Math.min(sw, src.width - sx);
  out.height = Math.min(sh, src.height - sy);
  const ctx = out.getContext("2d");
  if (!ctx) return out;

  ctx.imageSmoothingEnabled = true;
  (ctx as any).imageSmoothingQuality = "high";
  ctx.drawImage(src, sx, sy, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

/**
 * Estimate text likelihood based on edge density
 */
export function estimateTextLikelihood(canvas: HTMLCanvasElement, edgeThreshold: number): number {
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0;
  const w = canvas.width;
  const h = canvas.height;
  if (w < 10 || h < 10) return 0;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const thr = Math.max(5, Math.min(255, Math.round(edgeThreshold)));

  let edges = 0;
  let total = 0;
  const step = 2;
  for (let y = 0; y < h - step; y += step) {
    for (let x = 0; x < w - step; x += step) {
      const i = (y * w + x) * 4;
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const lum = (r * 3 + g * 6 + b) / 10;

      const ir = (y * w + (x + step)) * 4;
      const lumR = (d[ir] * 3 + d[ir + 1] * 6 + d[ir + 2]) / 10;

      const idn = ((y + step) * w + x) * 4;
      const lumD = (d[idn] * 3 + d[idn + 1] * 6 + d[idn + 2]) / 10;

      const grad = Math.abs(lum - lumR) + Math.abs(lum - lumD);
      if (grad >= thr) edges++;
      total++;
    }
  }

  return total > 0 ? edges / total : 0;
}

/**
 * Auto-detect text regions using edge-based clustering
 * @returns Array of fractional bounding boxes {x, y, w, h} in range [0, 1]
 */
export function autoDetectRoiFracs(
  canvas: HTMLCanvasElement,
  edgeThreshold: number,
  maxRegions: number
): Array<{ x: number; y: number; w: number; h: number }> {
  // Downscale should already be small-ish (e.g. 256-400px width).
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  const w = canvas.width;
  const h = canvas.height;
  if (w < 32 || h < 32) return [];

  const img = ctx.getImageData(0, 0, w, h);
  const data32 = new Uint32Array(img.data.buffer);
  const thr = Math.max(5, Math.min(255, Math.round(edgeThreshold)));

  const gridX = 8;
  const gridY = 8;
  const cellW = Math.max(1, Math.floor(w / gridX));
  const cellH = Math.max(1, Math.floor(h / gridY));
  const acc = new Float64Array(gridX * gridY);
  const cnt = new Uint32Array(gridX * gridY);

  const step = 2;
  // Use a local stride to avoid repeated specific multiplications
  const wStep = w * step;

  for (let y = 0; y < h - step; y += step) {
    const gy = Math.min(gridY - 1, Math.floor(y / cellH));
    const rowOffset = y * w;
    const nextRowOffset = rowOffset + wStep; // (y + step) * w

    for (let x = 0; x < w - step; x += step) {
      const gx = Math.min(gridX - 1, Math.floor(x / cellW));
      const cell = gy * gridX + gx;

      // Current pixel
      const p = data32[rowOffset + x];
      const r = p & 0xff;
      const g = (p >> 8) & 0xff;
      const b = (p >> 16) & 0xff;
      const lum = (r * 3 + g * 6 + b) / 10;

      // Right neighbor (x + step)
      const pr = data32[rowOffset + x + step];
      const rr = pr & 0xff;
      const gr = (pr >> 8) & 0xff;
      const br = (pr >> 16) & 0xff;
      const lumR = (rr * 3 + gr * 6 + br) / 10;

      // Bottom neighbor (y + step)
      const pd = data32[nextRowOffset + x];
      const rd = pd & 0xff;
      const gd = (pd >> 8) & 0xff;
      const bd = (pd >> 16) & 0xff;
      const lumD = (rd * 3 + gd * 6 + bd) / 10;

      const grad = Math.abs(lum - lumR) + Math.abs(lum - lumD);
      if (grad >= thr) acc[cell] += 1;
      cnt[cell] += 1;
    }
  }

  // Find cells above relative threshold (top percentile-ish).
  const densities: number[] = [];
  for (let i = 0; i < acc.length; i++) {
    const v = cnt[i] > 0 ? acc[i] / cnt[i] : 0;
    densities.push(v);
  }
  const sorted = [...densities].sort((a, b) => b - a);
  const pivot = sorted[Math.min(5, sorted.length - 1)] ?? 0; // top ~6 cells
  const cut = Math.max(pivot * 0.6, 0.03);

  const active = new Uint8Array(densities.length);
  for (let i = 0; i < densities.length; i++) active[i] = densities[i] >= cut ? 1 : 0;

  const seen = new Uint8Array(densities.length);
  const regions: Array<{ minX: number; minY: number; maxX: number; maxY: number; weight: number }> = [];
  const idx = (x: number, y: number) => y * gridX + x;

  for (let gy = 0; gy < gridY; gy++) {
    for (let gx = 0; gx < gridX; gx++) {
      const i0 = idx(gx, gy);
      if (!active[i0] || seen[i0]) continue;
      // BFS cluster on grid
      let qx: number[] = [gx];
      let qy: number[] = [gy];
      seen[i0] = 1;
      let minX = gx, maxX = gx, minY = gy, maxY = gy;
      let weight = densities[i0];

      for (let qi = 0; qi < qx.length; qi++) {
        const x = qx[qi];
        const y = qy[qi];
        const neigh = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ];
        for (const [nx, ny] of neigh) {
          if (nx < 0 || ny < 0 || nx >= gridX || ny >= gridY) continue;
          const ii = idx(nx, ny);
          if (!active[ii] || seen[ii]) continue;
          seen[ii] = 1;
          qx.push(nx);
          qy.push(ny);
          minX = Math.min(minX, nx);
          maxX = Math.max(maxX, nx);
          minY = Math.min(minY, ny);
          maxY = Math.max(maxY, ny);
          weight += densities[ii];
        }
      }

      // Ignore tiny 1-cell specks
      const bw = maxX - minX + 1;
      const bh = maxY - minY + 1;
      if (bw * bh < 2) continue;
      regions.push({ minX, minY, maxX, maxY, weight });
    }
  }

  regions.sort((a, b) => b.weight - a.weight);

  const out: Array<{ x: number; y: number; w: number; h: number }> = [];
  const iou = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => {
    const ax2 = a.x + a.w;
    const ay2 = a.y + a.h;
    const bx2 = b.x + b.w;
    const by2 = b.y + b.h;
    const ix = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x));
    const iy = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y));
    const inter = ix * iy;
    const ua = a.w * a.h + b.w * b.h - inter;
    return ua <= 0 ? 0 : inter / ua;
  };

  const padX = 1;
  const padY = 1;

  for (const r of regions) {
    if (out.length >= Math.max(1, maxRegions)) break;
    let minX = Math.max(0, r.minX - padX);
    let minY = Math.max(0, r.minY - padY);
    let maxX = Math.min(gridX - 1, r.maxX + padX);
    let maxY = Math.min(gridY - 1, r.maxY + padY);

    // Ensure minimum 2x2 cells for stability
    if (maxX - minX + 1 < 2) {
      minX = Math.max(0, minX - 1);
      maxX = Math.min(gridX - 1, maxX + 1);
    }
    if (maxY - minY + 1 < 2) {
      minY = Math.max(0, minY - 1);
      maxY = Math.min(gridY - 1, maxY + 1);
    }

    const px = (minX * cellW) / w;
    const py = (minY * cellH) / h;
    const pw = ((maxX - minX + 1) * cellW) / w;
    const ph = ((maxY - minY + 1) * cellH) / h;
    const cand = { x: px, y: py, w: Math.min(1, px + pw) - px, h: Math.min(1, py + ph) - py };
    if (cand.w <= 0.02 || cand.h <= 0.02) continue;
    if (out.some((p) => iou(p, cand) > 0.7)) continue;
    out.push(cand);
  }

  // If nothing detected, return empty (caller can fallback to full image).
  return out;
}
