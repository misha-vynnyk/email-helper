/**
 * AI Proxy Route — replaces the Python FastAPI service.
 * Accepts image uploads and proxies them to a local Ollama instance.
 *
 * Mounted at: /ai-api
 * Endpoints:
 *   GET  /health            — check Ollama connectivity
 *   GET  /api/models        — list models available in Ollama
 *   POST /api/analyze       — analyze image via Ollama
 *   POST /api/test          — test model with a text-only prompt, returns response + latency
 *   DELETE /api/cache       — clear in-memory response cache
 *   GET  /api/settings      — get all current settings
 *   PUT  /api/settings      — update host, model, generation params, prompt
 */

const express = require("express");
const multer = require("multer");
const https = require("https");
const http = require("http");
const fs = require("fs");
const nodePath = require("path");
const { createHash } = require("crypto");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ── Persisted settings ────────────────────────────────────────────────────────
// userData dir is set by electron/main.ts; falls back to cwd in dev/web mode.

function settingsFilePath() {
  const base = process.env.ELECTRON_USER_DATA || process.cwd();
  return nodePath.join(base, "ollama-settings.json");
}

function loadPersistedSettings() {
  try {
    const raw = fs.readFileSync(settingsFilePath(), "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function persistSettings(data) {
  try {
    const filePath = settingsFilePath();
    fs.mkdirSync(nodePath.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch {
    // non-fatal — in-memory state still works
  }
}

// ── In-memory state (initialised from persisted file) ────────────────────────

const _saved = loadPersistedSettings();
let ollamaHost = (_saved.ollama_host || process.env.OLLAMA_HOST || "http://localhost:11434").replace(/\/$/, "");
let ollamaModel = _saved.model || process.env.OLLAMA_MODEL || "gemma3:4b";
let modelTemperature = _saved.temperature ?? 0.1;
let modelNumPredict = _saved.num_predict ?? 64;
let modelNumCtx = _saved.num_ctx ?? 1024;

const DEFAULT_PROMPT =
  'Analyze this image and return a strictly formatted JSON object with these keys:\n' +
  '- "filename": Exactly ONE lowercase word representing the main object (e.g., \'sneaker\', \'logo\', \'fashion\').\n' +
  '- "alt_text": A very short, crisp, and clean description (max 10 words). No "Image of" or "This is".\n' +
  '- "cta": Only the text from a Call-to-Action button if visible. Otherwise empty string.\n\n' +
  'Respond ONLY with valid JSON.';

let modelPrompt = DEFAULT_PROMPT;

const responseCache = new Map();
const CACHE_MAX = 100;

// ── Helpers ────────────────────────────────────────────────────────────────────

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { timeout: 5000 }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode, body }));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

function httpPost(url, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const parsed = new URL(url);
    const lib = parsed.protocol === "https:" ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      timeout: 60000,
    };
    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Ollama request timeout")); });
    req.write(body);
    req.end();
  });
}

/** Model names currently pulled in Ollama (empty array if Ollama is unreachable). */
async function getInstalledModels() {
  try {
    const r = await httpGet(`${ollamaHost}/api/tags`);
    if (r.status !== 200) return [];
    const data = JSON.parse(r.body);
    return (data.models || []).map((m) => m.name);
  } catch {
    return [];
  }
}

async function resizeImageToJpeg(buffer) {
  try {
    const sharp = require("sharp");
    return await sharp(buffer)
      .resize(768, 768, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    return buffer;
  }
}

// ── Routes ─────────────────────────────────────────────────────────────────────

// Health check — checks Ollama connectivity
router.get("/health", async (_req, res) => {
  try {
    const r = await httpGet(`${ollamaHost}/api/tags`);
    const ollamaRunning = r.status === 200;
    res.json({ status: "ok", ollama_running: ollamaRunning, ollama_host: ollamaHost });
  } catch {
    res.json({ status: "ok", ollama_running: false, ollama_host: ollamaHost });
  }
});

// List models available in Ollama
router.get("/api/models", async (_req, res) => {
  res.json({ models: await getInstalledModels() });
});

// Analyze image via Ollama
router.post("/api/analyze", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file provided" });

  const cacheKey = createHash("md5").update(req.file.buffer).digest("hex");
  if (responseCache.has(cacheKey)) {
    return res.json({ ...responseCache.get(cacheKey), cached: true });
  }

  try {
    // Each profile persists its own model choice (ollama-settings.json under its own
    // ELECTRON_USER_DATA) — a fresh profile that never touched Settings falls back to
    // a hardcoded default that may not actually be pulled in this machine's Ollama.
    // Rather than fail outright, switch to whatever IS installed and stick with it.
    const installed = await getInstalledModels();
    let modelWarning;
    if (installed.length === 0) {
      return res.status(503).json({
        error: `Ollama has no models installed. Run "ollama pull <model>" (e.g. qwen3.5:4b) first.`,
      });
    }
    if (!installed.includes(ollamaModel)) {
      const fallback = installed[0];
      modelWarning = `Модель "${ollamaModel}" не встановлена в Ollama — використано "${fallback}". Доступні: ${installed.join(", ")}. Змініть модель в Налаштуваннях, щоб прибрати це попередження.`;
      ollamaModel = fallback;
      persistSettings({
        ollama_host: ollamaHost,
        model: ollamaModel,
        temperature: modelTemperature,
        num_predict: modelNumPredict,
        num_ctx: modelNumCtx,
      });
    }

    const optimized = await resizeImageToJpeg(req.file.buffer);
    const base64Image = optimized.toString("base64");

    const payload = {
      model: ollamaModel,
      prompt: modelPrompt,
      images: [base64Image],
      stream: false,
      format: "json",
      // Reasoning models (e.g. qwen3.5) otherwise dump the JSON answer into `thinking`
      // and leave `response` empty — force the final answer into `response`.
      think: false,
      options: { temperature: modelTemperature, num_predict: modelNumPredict, num_ctx: modelNumCtx },
    };

    const r = await httpPost(`${ollamaHost}/api/generate`, payload);
    if (r.status !== 200) {
      return res.status(503).json({ error: `Ollama returned ${r.status}` });
    }

    let parsed = {};
    try {
      const raw = JSON.parse(r.body);
      parsed = JSON.parse(raw.response || "{}");
    } catch {
      parsed = { filename: "image", alt_text: "Image", cta: "" };
    }

    const response = {
      filename: String(parsed.filename || "image"),
      alt_text: String(parsed.alt_text || "Image"),
      cta: String(parsed.cta || ""),
      candidates: {
        filenames: [String(parsed.filename || "image")],
        alt_texts: [String(parsed.alt_text || "Image")],
      },
      raw: { ocr: String(parsed.cta || ""), caption: String(parsed.alt_text || "Image"), tags: [] },
      cached: false,
      ...(modelWarning ? { warning: modelWarning } : {}),
    };

    if (responseCache.size >= CACHE_MAX) responseCache.delete(responseCache.keys().next().value);
    responseCache.set(cacheKey, response);

    res.json(response);
  } catch (err) {
    const msg = err.message || "Unknown error";
    if (msg.includes("ECONNREFUSED") || msg.includes("timeout")) {
      return res.status(503).json({ error: `Cannot connect to Ollama at ${ollamaHost}. Is it running?` });
    }
    res.status(500).json({ error: msg });
  }
});

// Test model with a text-only prompt — returns response + latency
router.post("/api/test", express.json(), async (req, res) => {
  const start = Date.now();
  const testModel = req.body?.model || ollamaModel;
  try {
    const payload = {
      model: testModel,
      prompt: 'Reply with exactly this JSON and nothing else: {"filename":"test","alt_text":"test image","cta":""}',
      stream: false,
      format: "json",
      think: false,
      options: { temperature: modelTemperature, num_predict: modelNumPredict, num_ctx: modelNumCtx },
    };
    const r = await httpPost(`${ollamaHost}/api/generate`, payload);
    const latency_ms = Date.now() - start;
    if (r.status !== 200) {
      return res.json({ success: false, error: `Ollama returned ${r.status}`, latency_ms });
    }
    const raw = JSON.parse(r.body);
    res.json({ success: true, response: raw.response, latency_ms, model: testModel });
  } catch (err) {
    res.json({ success: false, error: err.message, latency_ms: Date.now() - start });
  }
});

// Clear cache
router.delete("/api/cache", (_req, res) => {
  const count = responseCache.size;
  responseCache.clear();
  res.json({ cleared: count });
});

// Get all current settings
router.get("/api/settings", (_req, res) => {
  res.json({
    ollama_host: ollamaHost,
    model: ollamaModel,
    temperature: modelTemperature,
    num_predict: modelNumPredict,
    num_ctx: modelNumCtx,
    prompt: modelPrompt,
    default_prompt: DEFAULT_PROMPT,
  });
});

// Update settings (all fields optional)
router.put("/api/settings", express.json(), (req, res) => {
  const { ollama_host, model, temperature, num_predict, num_ctx, prompt } = req.body || {};
  if (ollama_host && typeof ollama_host === "string") ollamaHost = ollama_host.replace(/\/$/, "");
  if (model && typeof model === "string") ollamaModel = model;
  if (typeof temperature === "number") modelTemperature = temperature;
  if (typeof num_predict === "number") modelNumPredict = num_predict;
  if (typeof num_ctx === "number") modelNumCtx = num_ctx;
  if (typeof prompt === "string") modelPrompt = prompt || DEFAULT_PROMPT;
  responseCache.clear();
  persistSettings({ ollama_host: ollamaHost, model: ollamaModel, temperature: modelTemperature, num_predict: modelNumPredict, num_ctx: modelNumCtx });
  res.json({ ollama_host: ollamaHost, model: ollamaModel, temperature: modelTemperature, num_predict: modelNumPredict, num_ctx: modelNumCtx, prompt: modelPrompt });
});

module.exports = router;
