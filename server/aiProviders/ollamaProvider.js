/**
 * Ollama provider — talks to a local (or LAN) Ollama instance's /api/generate
 * and /api/tags. Extracted from aiProxy.js with no behavior change; settings
 * state (host/model/params) stays owned by the router, this module is stateless.
 */

const https = require("https");
const http = require("http");

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

async function checkHealth(host) {
  try {
    const r = await httpGet(`${host}/api/tags`);
    return r.status === 200;
  } catch {
    return false;
  }
}

/** Model names currently pulled in Ollama (empty array if Ollama is unreachable). */
async function listModels(host) {
  try {
    const r = await httpGet(`${host}/api/tags`);
    if (r.status !== 200) return [];
    const data = JSON.parse(r.body);
    return (data.models || []).map((m) => m.name);
  } catch {
    return [];
  }
}

/** Runs /api/generate and returns the raw `response` text (caller parses JSON out of it). */
async function generate({ host, model, prompt, images, temperature, num_predict, num_ctx }) {
  const payload = {
    model,
    prompt,
    ...(images ? { images } : {}),
    stream: false,
    format: "json",
    // Reasoning models (e.g. qwen3.5) otherwise dump the JSON answer into `thinking`
    // and leave `response` empty — force the final answer into `response`.
    think: false,
    options: { temperature, num_predict, num_ctx },
  };
  const r = await httpPost(`${host}/api/generate`, payload);
  if (r.status !== 200) {
    const err = new Error(`Ollama returned ${r.status}`);
    err.ollamaStatus = r.status;
    throw err;
  }
  let raw;
  try {
    raw = JSON.parse(r.body);
  } catch {
    const err = new Error("Ollama returned a non-JSON response body");
    err.ollamaEnvelopeError = true;
    throw err;
  }
  return raw.response || "";
}

module.exports = { checkHealth, listModels, generate };
