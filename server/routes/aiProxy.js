/**
 * AI Proxy Route — proxies image analysis to a local Ollama instance for
 * ALT-text/filename/CTA generation.
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
const fs = require("fs");
const nodePath = require("path");
const { createHash } = require("crypto");

const ollamaProvider = require("../aiProviders/ollamaProvider");
const { DEFAULT_PROMPT, resizeImageToJpeg, extractJsonFromText, normalizeProviderResult } = require("../aiProviders/shared");

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
let modelPrompt = DEFAULT_PROMPT;

function persistAll() {
  persistSettings({
    ollama_host: ollamaHost,
    model: ollamaModel,
    temperature: modelTemperature,
    num_predict: modelNumPredict,
    num_ctx: modelNumCtx,
  });
}

const responseCache = new Map();
const CACHE_MAX = 100;

// ── Routes ─────────────────────────────────────────────────────────────────────

// Health check — checks Ollama connectivity
router.get("/health", async (_req, res) => {
  const ollamaRunning = await ollamaProvider.checkHealth(ollamaHost);
  res.json({ status: "ok", ollama_running: ollamaRunning, ollama_host: ollamaHost });
});

// List models available in Ollama
router.get("/api/models", async (_req, res) => {
  res.json({ models: await ollamaProvider.listModels(ollamaHost) });
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
    const installed = await ollamaProvider.listModels(ollamaHost);
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
      persistAll();
    }

    const optimized = await resizeImageToJpeg(req.file.buffer);
    const base64Image = optimized.toString("base64");

    const text = await ollamaProvider.generate({
      host: ollamaHost,
      model: ollamaModel,
      prompt: modelPrompt,
      images: [base64Image],
      temperature: modelTemperature,
      num_predict: modelNumPredict,
      num_ctx: modelNumCtx,
    });

    const parsed = extractJsonFromText(text);
    const response = normalizeProviderResult(parsed || {}, {
      warning:
        modelWarning ||
        (parsed ? undefined : "Модель повернула текст без валідного JSON — використано значення за замовчуванням."),
    });

    if (responseCache.size >= CACHE_MAX) responseCache.delete(responseCache.keys().next().value);
    responseCache.set(cacheKey, response);

    res.json(response);
  } catch (err) {
    const msg = err.message || "Unknown error";
    if (msg.includes("ECONNREFUSED") || msg.includes("timeout")) {
      return res.status(503).json({ error: `Cannot connect to Ollama at ${ollamaHost}. Is it running?` });
    }
    if (err.ollamaStatus) {
      return res.status(503).json({ error: `Ollama rejected the request (HTTP ${err.ollamaStatus}).` });
    }
    if (err.ollamaEnvelopeError) {
      // Ollama is reachable but returned a garbage HTTP body — still guarantee a usable result.
      const response = normalizeProviderResult(
        {},
        { warning: "Ollama повернув невалідну відповідь — використано значення за замовчуванням." }
      );
      if (responseCache.size >= CACHE_MAX) responseCache.delete(responseCache.keys().next().value);
      responseCache.set(cacheKey, response);
      return res.json(response);
    }
    res.status(500).json({ error: msg });
  }
});

// Test model with a text-only prompt — returns response + latency
router.post("/api/test", express.json(), async (req, res) => {
  const start = Date.now();
  const testModel = req.body?.model || ollamaModel;
  try {
    const text = await ollamaProvider.generate({
      host: ollamaHost,
      model: testModel,
      prompt: 'Reply with exactly this JSON and nothing else: {"filename":"test","alt_text":"test image","cta":""}',
      temperature: modelTemperature,
      num_predict: modelNumPredict,
      num_ctx: modelNumCtx,
    });
    res.json({ success: true, response: text, latency_ms: Date.now() - start, model: testModel });
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
  persistAll();
  res.json({ ollama_host: ollamaHost, model: ollamaModel, temperature: modelTemperature, num_predict: modelNumPredict, num_ctx: modelNumCtx, prompt: modelPrompt });
});

module.exports = router;
