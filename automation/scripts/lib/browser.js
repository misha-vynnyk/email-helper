"use strict";

const http = require("http");
const { spawn: spawnChild, execFile } = require("child_process");
const { chromium } = require("playwright-core");

const PORT_CLEAR_RETRIES   = 12;
const PORT_CLEAR_INTERVAL  = 500;   // ms between checks when waiting for port to free
const BRAVE_START_RETRIES  = 30;
const BRAVE_START_INTERVAL = 1000;  // ms between CDP availability checks
const STARTUP_SETTLE_MS    = 3000;  // ms to wait for startup tabs to appear (increased for session restore)
const LATE_PAGE_GUARD_MS   = 5000;  // ms to intercept late-arriving session restore pages

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
    "--no-restore-session-state", // skip session restore — prevents phantom windows
  ];
  const child = spawnChild(executablePath, args, { detached: true, stdio: "ignore" });
  child.unref();
  return child;
}

// Brings Brave to the OS foreground on macOS.
// Uses osascript `activate` (no new windows) instead of `open -a` which can
// create a new Brave window when no window is currently visible.
function activateBraveOnMac() {
  if (process.platform !== "darwin") return;
  execFile(
    "osascript",
    ["-e", 'tell application "Brave Browser" to activate'],
    { timeout: 2000 },
    () => {}
  );
}

// Closes any page that appears in `context` for the next `durationMs` ms,
// as long as it isn't `keepPage`. This catches session-restore pages that
// arrive asynchronously after the initial startup cleanup.
function guardAgainstLatePages(context, keepPage, durationMs) {
  const handler = (newPage) => {
    if (newPage !== keepPage) {
      newPage.close().catch(() => {});
    }
  };
  context.on("page", handler);
  setTimeout(() => context.off("page", handler), durationMs);
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
      browser = await chromium.connectOverCDP(cdpUrl, { timeout: 10000 });
      const contexts = browser.contexts();
      context = contexts.length > 0 ? contexts[0] : null;
      if (!context) throw new Error("No browser context available");

      // Find existing storage tab or create a fresh one.
      // Create/find our page FIRST so the context stays alive when we close others.
      const pages = context.pages();
      page = pages.find(isStorageTab) || (await context.newPage());

      // Close all other tabs (stale tabs, session restore leftovers, etc.)
      for (const p of context.pages()) {
        if (p !== page) await p.close().catch(() => {});
      }

      // Intercept any tabs that Brave opens in the next few seconds (late restore).
      guardAgainstLatePages(context, page, LATE_PAGE_GUARD_MS);

      await page.bringToFront();
      activateBraveOnMac();
      console.log(`📂 USER DATA DIR: ${userDataDir} (CDP reuse)`);
    } catch (cdpErr) {
      const cdpMsg = cdpErr instanceof Error ? cdpErr.message : String(cdpErr);
      // If the user closed the tab/window, don't fall through to STEP 2 (which would
      // launch a new Brave window). Propagate the error so main.js handles it cleanly.
      if (
        cdpMsg.includes("Target page, context or browser has been closed") ||
        cdpMsg.includes("Target closed") ||
        cdpMsg.toLowerCase().includes("browser has been closed")
      ) {
        throw new Error("ERROR:BROWSER_CLOSED (user closed Brave during setup)");
      }
      console.warn(`⚠️ CDP connect failed: ${cdpMsg}`);
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

    // If the port is still occupied after waiting, it is held by another session
    // (different macOS user via Fast User Switching, or a second converter instance).
    // Find a free alternate port so we don't launch Brave without remote-debugging.
    // Use basePort + 1000 as starting point to avoid colliding with other providers'
    // fixed ports (e.g. 9223 for alphaone, 9224 for ttt).
    let actualPort = debugPort;
    if (await isCdpAvailable(debugPort)) {
      console.log(`⚠️ Port ${debugPort} is held by another session — scanning for a free port...`);
      const altBase = debugPort + 1000;
      for (let offset = 0; offset <= 50; offset++) {
        if (!(await isCdpAvailable(altBase + offset))) {
          actualPort = altBase + offset;
          break;
        }
      }
      console.log(`🔀 Using alternate CDP port: ${actualPort}`);
    }

    const actualCdpUrl = `http://127.0.0.1:${actualPort}`;
    console.log("🚀 Launching new Brave instance...");

    try {
      launchBraveDetached(executablePath, userDataDir, actualPort);
      console.log(`📂 USER DATA DIR: ${userDataDir}`);

      let cdpReady = false;
      for (let attempt = 0; attempt < BRAVE_START_RETRIES; attempt++) {
        await new Promise((r) => setTimeout(r, BRAVE_START_INTERVAL));
        wsUrl = await isCdpAvailable(actualPort);
        if (wsUrl) { cdpReady = true; break; }
        if (attempt % 5 === 4) console.log(`⏳ Waiting for Brave... (${attempt + 1}s)`);
      }

      if (!cdpReady) throw new Error("Brave startup timeout");

      console.log("✅ Brave launched — connecting via CDP...");
      browser = await chromium.connectOverCDP(actualCdpUrl);
      const contexts = browser.contexts();
      context = contexts.length > 0 ? contexts[0] : null;
      if (!context) throw new Error("No browser context available after launch");

      // Wait for Brave to finish opening startup / session-restore windows.
      await new Promise((resolve) => setTimeout(resolve, STARTUP_SETTLE_MS));

      // Create our page FIRST so the context doesn't die when we close others.
      const startupPages = context.pages();
      page = startupPages.find(isStorageTab) || (await context.newPage());

      // Close all startup pages (session restore, new-tab, etc.)
      for (const p of startupPages) {
        if (p !== page) await p.close().catch(() => {});
      }

      // Intercept any pages Brave creates after our initial cleanup (async restore).
      guardAgainstLatePages(context, page, LATE_PAGE_GUARD_MS);

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
