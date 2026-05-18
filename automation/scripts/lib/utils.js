"use strict";

const { execSync, execFileSync } = require("child_process");
const http = require("http");
const https = require("https");

function safeExec(command, showError = true) {
  try {
    return execSync(command, { encoding: "utf8" }).trim();
  } catch (err) {
    if (showError) console.error(`Command error: ${err.message}`);
    return null;
  }
}

function playSound(type, config) {
  if (process.platform !== "darwin") return;
  const soundsEnabled = config.notifications.soundsEnabled ?? config.notifications.enabled;
  if (!soundsEnabled) return;
  const sound = config.notifications.sounds[type];
  if (!sound) return;
  try {
    execFileSync("afplay", [sound], { stdio: "ignore" });
  } catch {}
}

// Performs a lightweight HTTP(S) HEAD request to check if the storage server
// is reachable. Returns true if the server responds (any status), false on
// network error or timeout — which typically means VPN is not connected.
async function checkStorageConnectivity(baseUrl) {
  return new Promise((resolve) => {
    let parsed;
    try { parsed = new URL(baseUrl); } catch { resolve(false); return; }

    const mod = parsed.protocol === "https:" ? https : http;
    const req = mod.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
        path: "/",
        method: "HEAD",
        timeout: 5000,
      },
      () => { req.destroy(); resolve(true); }
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => { req.destroy(); resolve(false); });
    req.end();
  });
}

module.exports = { safeExec, playSound, checkStorageConnectivity };
