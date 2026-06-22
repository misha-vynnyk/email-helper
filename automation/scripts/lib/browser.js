"use strict";

const http = require("http");
const { spawn: spawnChild, execFile } = require("child_process");
const { chromium } = require("playwright-core");

const PORT_CLEAR_RETRIES   = 12;
const PORT_CLEAR_INTERVAL  = 500;   // ms between checks when waiting for port to free
const BRAVE_START_RETRIES  = 30;
const BRAVE_START_INTERVAL = 1000;  // ms between CDP availability checks
const STARTUP_SETTLE_MS    = 1500;  // ms to wait for startup tabs to appear

// Returns the WebSocket debugger URL if Brave is listening on the given CDP port,
// or null if the port is not yet available.
async function isCdpAvailable(port) {
  return new Promise((resolve) => {
    const req = http.get(
      `http://127.0.0.1:${port}/json/version`,
      { timeout: 2000 },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const info = JSON.parse(data);
            resolve(info.webSocketDebuggerUrl || null);
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
  });
}

// Spawns Brave as a detached process so it outlives this script.
function launchBraveDetached(executablePath, userDataDir, debugPort) {
  const args = [
    `--user-data-dir=${userDataDir}`,
    `--remote-debugging-port=${debugPort}`,
    "--remote-allow-origins=*",
    "--disable-features=DownloadBubble,DownloadBubbleV2",
    "--disable-component-update",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-component-extensions-with-background-pages",
  ];
  const child = spawnChild(executablePath, args, { detached: true, stdio: "ignore" });
  child.unref();
  return child;
}

// On macOS, bring the Brave window to the front so it's visible above other apps.
// Uses `open -a` (no Automation permission required) as primary method.
// Falls back to osascript for cases where open -a doesn't steal focus in time.
function activateBraveOnMac() {
  if (process.platform !== "darwin") return;
  // `open -a` activates any running instance of the app without AppleScript permissions.
  // This is important when the caller is an Electron app that has not been granted
  // Automation access to Brave Browser.
  execFile("open", ["-a", "Brave Browser"], { timeout: 5000 }, () => {
    // Fallback: AppleScript works when Terminal/shell is the caller, may silently
    // fail from within Electron (no-op in that case, which is acceptable).
    execFile("osascript", ["-e", 'tell application "Brave Browser" to activate'], { timeout: 2000 }, () => {});
  });
}

// Tries to connect to an already-running Brave (STEP 1).
// If that fails, launches a new Brave instance and connects (STEP 2).
// storageBaseUrl — used to detect an existing storage tab for the active provider.
// Returns { browser, context, page }.
async function connectOrLaunch(executablePath, debugPort, userDataDir, storageBaseUrl) {
  const cdpUrl = `http://127.0.0.1:${debugPort}`;

  let storageHost = "";
  try { storageHost = new URL(storageBaseUrl).hostname; } catch {}
  const isStorageTab = (p) => storageHost && p.url().includes(storageHost);

  // STEP 1: connect to existing Brave
  console.log(`🔍 Checking if Brave is already running (CDP port ${debugPort})...`);
  let wsUrl = await isCdpAvailable(debugPort);
  let browser, context, page;

  if (wsUrl) {
    console.log("✅ Brave is already running — connecting via CDP...");
    try {
      browser = await chromium.connectOverCDP(cdpUrl);
      const contexts = browser.contexts();
      context = contexts.length > 0 ? contexts[0] : null;
      if (!context) throw new Error("No browser context available");

      const pages = context.pages();
      page = pages.find(isStorageTab) || (await context.newPage());
      await page.bringToFront();
      activateBraveOnMac();
      console.log(`📂 USER DATA DIR: ${userDataDir} (CDP reuse)`);
    } catch (cdpErr) {
      console.warn(`⚠️ CDP connect failed: ${cdpErr.message}`);
      if (browser) {
        try { await browser.disconnect(); } catch {}
        browser = null;
        context = null;
      }
      wsUrl = null;
    }
  }

  // STEP 2: launch a fresh Brave and connect
  if (!wsUrl || !browser) {
    // Wait for the dying Brave to release the CDP port before launching a new one.
    for (let i = 0; i < PORT_CLEAR_RETRIES; i++) {
      if (!(await isCdpAvailable(debugPort))) break;
      await new Promise((r) => setTimeout(r, PORT_CLEAR_INTERVAL));
    }

    console.log("🚀 Launching new Brave instance...");

    try {
      launchBraveDetached(executablePath, userDataDir, debugPort);
      console.log(`📂 USER DATA DIR: ${userDataDir}`);

      let cdpReady = false;
      for (let attempt = 0; attempt < BRAVE_START_RETRIES; attempt++) {
        await new Promise((r) => setTimeout(r, BRAVE_START_INTERVAL));
        wsUrl = await isCdpAvailable(debugPort);
        if (wsUrl) { cdpReady = true; break; }
        if (attempt % 5 === 4) console.log(`⏳ Waiting for Brave... (${attempt + 1}s)`);
      }

      if (!cdpReady) throw new Error("Brave startup timeout");

      console.log("✅ Brave launched — connecting via CDP...");
      browser = await chromium.connectOverCDP(cdpUrl);
      const contexts = browser.contexts();
      context = contexts.length > 0 ? contexts[0] : null;
      if (!context) throw new Error("No browser context available after launch");

      await new Promise((resolve) => setTimeout(resolve, STARTUP_SETTLE_MS));

      const startupPages = context.pages();
      page = startupPages.find(isStorageTab) || (await context.newPage());
      for (const p of startupPages) {
        if (p !== page) await p.close().catch(() => {});
      }
      await page.bringToFront();
      activateBraveOnMac();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("user data directory is already in use")) {
        console.error("❌ Error: This Brave profile is already in use by another window.");
        console.error("💡 Please close all Brave windows (Playwright profile) and try again.");
      } else {
        console.error(`❌ Failed to launch Brave: ${msg}`);
      }
      throw err;
    }
  }

  return { browser, context, page };
}

module.exports = { isCdpAvailable, launchBraveDetached, connectOrLaunch };
