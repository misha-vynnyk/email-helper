/**
 * Cloudflare Worker for the email-helper "AI аналіз зображень" feature —
 * the ONLY entry point the frontend calls for the Cloudflare provider, in
 * both web/GitHub Pages and Electron builds. See
 * src/htmlConverter/utils/ocr/cloudflareClient.ts for the caller.
 *
 * Two auth modes, same endpoint:
 * - No `accountId`/`apiToken` in the request body → uses this Worker's own
 *   native Workers AI binding (env.AI.run()), authenticated inside
 *   Cloudflare's platform, no token anywhere. Subject to the shared
 *   per-IP rate limit below, since the URL is public (shipped in the JS
 *   bundle) and the daily free quota is shared across every caller.
 * - `accountId`/`apiToken` present → this Worker does a server-to-server
 *   REST call to api.cloudflare.com using the CALLER's own credentials
 *   (their own quota, not rate-limited by this Worker). This indirection
 *   exists because api.cloudflare.com sends no CORS headers at all — a
 *   browser cannot call it directly, only a server (or a Worker) can. The
 *   token transits through this Worker's request handling for the
 *   duration of one request only; it is never logged, persisted, or
 *   forwarded anywhere except that one api.cloudflare.com call.
 */

const ALLOWED_ORIGIN_PATTERNS = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
  /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
  /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:\d+$/,
  /^https:\/\/misha-vynnyk\.github\.io$/,
];

const RATE_LIMIT = { requests: 20, windowSeconds: 60 };

// Single fixed model, not user-selectable — Moondream 3.1 is the fastest and
// cheapest (lowest per-token cost) vision model in Cloudflare's free-tier
// catalog, confirmed working live (query task, reasoning/stream disabled).
const MODEL = { id: "@cf/moondream/moondream3.1-9B-A2B", kind: "moondream" };

function corsHeaders(origin) {
  // The packaged Electron build loads the renderer via `win.loadFile()` (a
  // `file://` URL), which Chromium treats as an opaque origin — fetch() sends
  // it as the literal string "null" (sometimes omitted entirely), never as a
  // real scheme+host. Confirmed live: dev-mode Electron (loadURL against the
  // Vite dev server, a real http://localhost origin) worked fine; the built
  // app got a 403 here. Allow that case alongside the regular http(s) origins.
  //
  // NOTE: this check (and the allowlist below) is browser cooperation, not an
  // abuse boundary — CORS is enforced by browsers, not by this server, so any
  // non-browser caller (curl, a script) can already send whatever Origin value
  // it wants, including one from ALLOWED_ORIGIN_PATTERNS, and pass regardless
  // of this opaque-origin case. Don't "tighten" this to guard against scripted
  // abuse (e.g. restricting isOpaqueOrigin to the literal "null" string) — it
  // would just break the real, already-fixed Electron case above for no actual
  // security gain. The real gate against abuse is the per-IP rate limit below
  // (checkRateLimit) — it applies to every non-own-token request regardless of
  // Origin and isn't affected by anything here.
  const isOpaqueOrigin = !origin || origin === "null";
  const allowed = isOpaqueOrigin || ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin));
  if (!allowed) return null;
  return {
    "Access-Control-Allow-Origin": isOpaqueOrigin ? "null" : origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/** Same defensive parsing as the Node backend's extractJsonFromText() — no
 * Workers AI vision model guarantees JSON-mode, so we ask for JSON in the
 * prompt text and parse the free-text response defensively. */
function extractJsonFromText(text) {
  if (typeof text !== "string" || !text.trim()) return null;
  const attempts = [text.trim()];
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) attempts.push(fenced[1].trim());
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) attempts.push(text.slice(firstBrace, lastBrace + 1));
  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // try next candidate
    }
  }
  return null;
}

/** Same output shape as server/aiProviders/shared.js's normalizeProviderResult() — the Worker
 * can't require() that file (separate deploy target), so keep this in sync by hand. */
function normalizeResult(parsed, { warning } = {}) {
  const filename = String(parsed?.filename || "image");
  const altText = String(parsed?.alt_text || "Image");
  const cta = String(parsed?.cta || "");
  return {
    filename,
    alt_text: altText,
    cta,
    candidates: { filenames: [filename], alt_texts: [altText] },
    raw: { ocr: cta, caption: altText, tags: [] },
    cached: false,
    ...(warning ? { warning } : {}),
  };
}

function buildPayload({ prompt, imageDataUri, maxTokens }) {
  // reasoning defaults to true in Moondream's schema — extra chain-of-thought
  // tokens/latency we don't need for a one-shot filename/alt-text/cta answer.
  return { task: "query", image: imageDataUri, question: prompt, max_tokens: maxTokens, reasoning: false, stream: false };
}

// env.AI.run()'s resolved value wraps the documented output shape one level
// deeper than `wrangler ai models schema` shows: {result: {answer, ...}, usage: {...}},
// not the flat {answer, ...} the schema command implies — confirmed live via wrangler tail.
function unwrapResult(x) {
  return x?.result ?? x;
}

function extractText(result) {
  return String(unwrapResult(result)?.answer || "");
}

/** Moondream's env.AI.run() binding hands back a ReadableStream of SSE `data:
 * {...}` chunks for the `query` task regardless of the `stream` param (a
 * binding-vs-REST-API inconsistency — the REST endpoint's `stream:false`
 * buffers server-side, the raw binding here does not) — confirmed live via
 * `wrangler tail`, not documented. Consume it and reconstruct the full text. */
async function readStreamText(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const obj = unwrapResult(JSON.parse(data));
        if (typeof obj.answer === "string") full += obj.answer;
      } catch {
        // partial/non-JSON chunk — skip
      }
    }
  }
  return full;
}

/** KV-backed fixed-window counter — guaranteed-free-plan rate limit. See
 * wrangler.toml for the commented-out native `[[ratelimits]]` alternative. */
async function checkRateLimit(env, ip) {
  const bucket = Math.floor(Date.now() / (RATE_LIMIT.windowSeconds * 1000));
  const key = `rl:${ip}:${bucket}`;
  const current = parseInt((await env.RATE_LIMIT_KV.get(key)) || "0", 10);
  if (current >= RATE_LIMIT.requests) return false;
  await env.RATE_LIMIT_KV.put(key, String(current + 1), { expirationTtl: RATE_LIMIT.windowSeconds * 2 });
  return true;
}

/** Server-to-server call using the CALLER's own Cloudflare credentials — no
 * CORS restriction here (this runs inside the Worker, not a browser). The
 * token is used for this one fetch only, never stored or logged. */
async function runViaOwnToken(payload, { accountId, apiToken }) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL.id}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.success === false) {
    if (res.status === 401 || res.status === 403) throw new Error("Невірний Cloudflare Account ID або API Token.");
    if (res.status === 429) throw new Error("Вичерпано денний ліміт вашого Cloudflare-акаунту.");
    throw new Error(json?.errors?.[0]?.message || `Cloudflare API повернув ${res.status}`);
  }
  return json.result;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: cors ? 204 : 403, headers: cors || {} });
    }
    if (!cors) {
      return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers: { "Content-Type": "application/json" } });
    }
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { prompt, image, max_tokens: maxTokens, accountId, apiToken } = body || {};
    if (!prompt || !image) {
      return new Response(JSON.stringify({ error: "Missing prompt or image" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const usingOwnToken = Boolean(accountId && apiToken);

    // The shared free pool is rate-limited by IP; a caller supplying their
    // own Cloudflare credentials draws on their own account's quota instead.
    if (!usingOwnToken) {
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      const withinLimit = await checkRateLimit(env, ip);
      if (!withinLimit) {
        return new Response(
          JSON.stringify({ error: `Rate limit exceeded (${RATE_LIMIT.requests} req/${RATE_LIMIT.windowSeconds}s). Спробуйте пізніше або задайте власний Cloudflare-токен у Налаштуваннях.` }),
          { status: 429, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }
    }

    const payload = buildPayload({ prompt, imageDataUri: image, maxTokens: maxTokens || 256 });

    try {
      const result = usingOwnToken ? await runViaOwnToken(payload, { accountId, apiToken }) : await env.AI.run(MODEL.id, payload);
      const text = result instanceof ReadableStream ? await readStreamText(result) : extractText(result);
      const parsed = extractJsonFromText(text);
      const response = normalizeResult(parsed || {}, {
        warning: parsed ? undefined : "Модель повернула текст без валідного JSON — використано значення за замовчуванням.",
      });
      return new Response(JSON.stringify(response), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || "Workers AI request failed" }), { status: 502, headers: { ...cors, "Content-Type": "application/json" } });
    }
  },
};
