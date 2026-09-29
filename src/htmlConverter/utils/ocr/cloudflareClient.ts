import { encodeAtQuality } from "@/imageConverter/utils/jsquashEncode";
import { resizeImageData } from "@/imageConverter/utils/resizeImageData";

/**
 * Client for the email-helper-ai Cloudflare Worker — the single entry point
 * for the Cloudflare provider (see cloudflare-worker/src/worker.js). Direct
 * browser calls to api.cloudflare.com are not possible (it sends no CORS
 * headers at all — confirmed live), so both the zero-config shared mode and
 * the "own token" mode go through this one Worker, which relays server-side.
 *
 * Model is fixed server-side (Moondream 3.1 — fastest + cheapest per-token
 * of the free-tier vision models, confirmed live), not user-selectable.
 *
 * SECURITY: when `credentials` is supplied, the token is sent to the Worker
 * URL below over HTTPS, in the request body — never stored, never logged by
 * this client. See cloudflare-worker/README.md for what the Worker does
 * with it.
 */

const PUBLIC_WORKER_URL = "https://email-helper-ai.vinnikmisha.workers.dev";

const MAX_DIMENSION = 768;
const JPEG_QUALITY = 85;
const TIMEOUT_MS = 60000;

export const DEFAULT_CLOUDFLARE_PROMPT =
  'Analyze this image and return a strictly formatted JSON object with these keys:\n' +
  '- "filename": Exactly ONE lowercase word representing the main object (e.g., \'sneaker\', \'logo\', \'fashion\').\n' +
  '- "alt_text": A very short, crisp, and clean description (max 10 words). No "Image of" or "This is".\n' +
  '- "cta": Only the text from a Call-to-Action button if visible. Otherwise empty string.\n\n' +
  'Respond ONLY with valid JSON.';

export interface CloudflareCredentialsInput {
  accountId: string;
  apiToken: string;
}

export interface CloudflareAnalyzeResult {
  filename: string;
  alt_text: string;
  cta: string;
  candidates: { filenames: string[]; alt_texts: string[] };
  raw: { ocr: string; caption: string; tags: string[] };
  warning?: string;
}

async function blobToImageData(blob: Blob): Promise<ImageData> {
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
}

function scaledDimensions(width: number, height: number, maxDim: number): { width: number; height: number } {
  if (width <= maxDim && height <= maxDim) return { width, height };
  const scale = maxDim / Math.max(width, height);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/** Mirrors the server's resizeImageToJpeg() (768px max, JPEG q85) so Cloudflare gets the same small, fast-to-analyze image the Ollama path already sends. */
async function blobToResizedJpegDataUri(blob: Blob): Promise<string> {
  const imageData = await blobToImageData(blob);
  const { width, height } = scaledDimensions(imageData.width, imageData.height, MAX_DIMENSION);
  const resized = await resizeImageData(imageData, width, height);
  const encoded = await encodeAtQuality(resized, "jpeg", JPEG_QUALITY, "balanced");
  return `data:image/jpeg;base64,${arrayBufferToBase64(encoded)}`;
}

export interface CloudflareAnalyzeOptions {
  blob: Blob;
  prompt?: string;
  credentials?: CloudflareCredentialsInput | null;
}

export async function analyzeImageViaCloudflare({ blob, prompt, credentials }: CloudflareAnalyzeOptions): Promise<CloudflareAnalyzeResult> {
  const image = await blobToResizedJpegDataUri(blob);

  const body: Record<string, unknown> = {
    prompt: prompt || DEFAULT_CLOUDFLARE_PROMPT,
    image,
    max_tokens: 256,
  };
  if (credentials?.accountId && credentials?.apiToken) {
    body.accountId = credentials.accountId;
    body.apiToken = credentials.apiToken;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(PUBLIC_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json) {
      throw new Error(json?.error || `Cloudflare AI сервіс повернув ${res.status}`);
    }
    return json as CloudflareAnalyzeResult;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Connectivity/latency test — mirrors the Ollama path's /api/test. */
export async function testCloudflareConnection(credentials?: CloudflareCredentialsInput | null): Promise<{ success: boolean; response?: string; error?: string; latency_ms: number }> {
  const start = Date.now();
  try {
    // 1x1 white JPEG — Moondream's "query" task needs SOME image even for a smoke test.
    const placeholder = await fetch(
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    ).then((r) => r.blob());
    const result = await analyzeImageViaCloudflare({
      blob: placeholder,
      prompt: 'Reply with exactly this JSON and nothing else: {"filename":"test","alt_text":"test image","cta":""}',
      credentials,
    });
    return { success: true, response: JSON.stringify(result), latency_ms: Date.now() - start };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err), latency_ms: Date.now() - start };
  }
}
