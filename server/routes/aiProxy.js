/**
 * AI Proxy Route — replaces the Python FastAPI service.
 * Accepts image uploads and proxies them to a local Ollama instance.
 *
 * Mounted at: /ai-api
 * Endpoints:
 *   GET  /health            — check Ollama connectivity
 *   POST /api/analyze       — analyze image via Gemma 3 / Ollama
 *   DELETE /api/cache       — clear in-memory response cache
 *   GET  /api/settings      — get current Ollama host
 *   PUT  /api/settings      — update Ollama host
 */

const express = require("express");
const multer = require("multer");
const https = require("https");
const http = require("http");
const { createHash } = require("crypto");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ── In-memory state ────────────────────────────────────────────────────────────

let ollamaHost = (process.env.OLLAMA_HOST || "http://localhost:11434").replace(/\/$/, "");
const MODEL_NAME = process.env.OLLAMA_MODEL || "gemma3:4b";
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

// Analyze image via Ollama
router.post("/api/analyze", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file provided" });

  const cacheKey = createHash("md5").update(req.file.buffer).digest("hex");
  if (responseCache.has(cacheKey)) {
    return res.json({ ...responseCache.get(cacheKey), cached: true });
  }

  try {
    const optimized = await resizeImageToJpeg(req.file.buffer);
    const base64Image = optimized.toString("base64");

    const prompt =
      'Analyze this image and return a strictly formatted JSON object with these keys:\n' +
      '- "filename": Exactly ONE lowercase word representing the main object (e.g., \'sneaker\', \'logo\', \'fashion\').\n' +
      '- "alt_text": A very short, crisp, and clean description (max 10 words). No "Image of" or "This is".\n' +
      '- "cta": Only the text from a Call-to-Action button if visible. Otherwise empty string.\n\n' +
      'Respond ONLY with valid JSON.';

    const payload = {
      model: MODEL_NAME,
      prompt,
      images: [base64Image],
      stream: false,
      format: "json",
      options: { temperature: 0.1, num_predict: 64, num_ctx: 1024 },
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

// Clear cache
router.delete("/api/cache", (_req, res) => {
  const count = responseCache.size;
  responseCache.clear();
  res.json({ cleared: count });
});

// Get Ollama settings
router.get("/api/settings", (_req, res) => {
  res.json({ ollama_host: ollamaHost, model: MODEL_NAME });
});

// Update Ollama host
router.put("/api/settings", express.json(), (req, res) => {
  const { ollama_host } = req.body || {};
  if (!ollama_host || typeof ollama_host !== "string") {
    return res.status(400).json({ error: "ollama_host is required" });
  }
  ollamaHost = ollama_host.replace(/\/$/, "");
  responseCache.clear();
  res.json({ ollama_host: ollamaHost, model: MODEL_NAME });
});

module.exports = router;
