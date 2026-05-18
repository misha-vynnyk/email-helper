#!/usr/bin/env node
"use strict";

const fs = require("fs");
const pathModule = require("path");

const { loadConfig } = require("./lib/config");
const { resolveProvider } = require("./lib/provider");
const { safeExec, playSound, checkStorageConnectivity } = require("./lib/utils");
const { connectOrLaunch } = require("./lib/browser");
const { buildStoragePaths, waitForStorageReady, checkFileExists, uploadWithRetry } = require("./lib/storage");

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  const val = process.argv[idx + 1];
  if (!val || val.startsWith("-")) return null;
  return val;
}

function parseArgs() {
  const isFinalize = process.argv.includes("--finalize") || process.argv.includes("--close-tab");

  const filePath = process.argv[2];

  if (!isFinalize) {
    if (!filePath) throw new Error("File path not provided");
    if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  }

  const rest = process.argv
    .slice(3)
    .filter((x) => !["--no-confirm", "-y"].includes(x))
    .filter((x, i, arr) => !(x === "--provider" || arr[i - 1] === "--provider"));

  const provider = String(getArgValue("--provider") || process.env.STORAGE_PROVIDER || "default").toLowerCase();

  return {
    isFinalize,
    filePath,
    categoryArg: rest[0] || null,
    folderNameArg: rest[1] || null,
    fileName: isFinalize ? null : pathModule.basename(filePath),
    provider,
  };
}

// ---------------------------------------------------------------------------
// Timeout constants
// ---------------------------------------------------------------------------

const STARTUP_TIMEOUT_MS = 30000; // phase-1: covers init before provider is known
const BRAVE_LAUNCH_BUFFER_MS = 40000; // max Brave startup time
const NAVIGATION_BUFFER_MS = 60000; // matches page.goto timeout
const UPLOAD_BUFFER_MS = 60000; // upload attempts + retries + tab close

// ---------------------------------------------------------------------------
// Main flow
// ---------------------------------------------------------------------------

(async () => {
  let timeoutId;
  let browser;
  let config;

  const safeExit = async (code) => {
    if (timeoutId) clearTimeout(timeoutId);
    try {
      if (browser) await browser.disconnect();
    } catch {}
    process.exit(code);
  };

  const resetTimeout = (ms) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
      console.error("⏱️ Global timeout exceeded!");
      await safeExit(1);
    }, ms);
  };

  resetTimeout(STARTUP_TIMEOUT_MS);

  try {
    config = loadConfig();
    const { isFinalize, filePath, categoryArg, folderNameArg, fileName, provider } = parseArgs();

    const { selectedStorage, consoleBaseUrl, storageHostname, loginWaitMs, bootstrapWaitMs, validCategories, browser: resolvedBrowser } = resolveProvider(config, provider);

    // Phase-2: reset timeout using real provider values
    const fullTimeoutMs = BRAVE_LAUNCH_BUFFER_MS + NAVIGATION_BUFFER_MS + bootstrapWaitMs + loginWaitMs + UPLOAD_BUFFER_MS;
    resetTimeout(fullTimeoutMs);
    console.log(`⏱️  Effective timeout: ${Math.round(fullTimeoutMs / 1000)}s (login window: ${Math.round(loginWaitMs / 1000)}s)`);

    const { userDataDir, debugPort } = resolvedBrowser;

    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
      console.log(`📁 Created profile directory: ${userDataDir}`);
    }

    let context, page;
    ({ browser, context, page } = await connectOrLaunch(resolvedBrowser.executablePath, debugPort, userDataDir, consoleBaseUrl));

    // === Finalize: close storage tab and exit ===
    if (isFinalize) {
      for (const p of context.pages()) {
        const url = p.url();
        if ((storageHostname && url.includes(storageHostname)) || url.includes("minio")) {
          await p.close().catch(() => {});
        }
      }
      await safeExit(0);
    }

    page.on("dialog", async (dialog) => {
      console.log(`📢 Dialog [${dialog.type()}]: ${dialog.message()}`);
      if (dialog.type() === "alert") await dialog.accept().catch(() => {});
      else await dialog.dismiss().catch(() => {});
    });

    // === Validate category & folder name ===
    let serverCategory;
    if (selectedStorage.usesCategory) {
      if (!categoryArg || !validCategories.includes(categoryArg.toLowerCase())) {
        throw new Error(`Category required: (${validCategories.join("|")})`);
      }
      serverCategory = categoryArg.toLowerCase();
    } else {
      serverCategory = categoryArg ? categoryArg.toLowerCase() : null;
    }

    let clipboardContent = folderNameArg;
    if (!clipboardContent && process.platform === "darwin") {
      clipboardContent = safeExec("pbpaste", false);
    }
    if (!clipboardContent) {
      throw new Error("Folder name required (4th argument or macOS clipboard)");
    }

    const letters = clipboardContent.replace(/[^a-zA-Z]/g, "").toLowerCase();
    const digits = clipboardContent.replace(/[^0-9]/g, "");
    if (!letters || !digits || letters.length > 20 || digits.length > 20) {
      throw new Error(`Invalid folder name: "${clipboardContent}"\n` + `Expected "ABCD123" or "Finance-456". Letters: "${letters || "(none)"}", Digits: "${digits || "(none)"}"`);
    }

    if (selectedStorage.usesCategory) console.log(`📂 Category: ${serverCategory}`);
    console.log(`📋 Folder: "${clipboardContent}"`);

    const folderPrefix = selectedStorage.folderPrefix || "lift-";
    const formattedName = `${letters}/${folderPrefix}${digits}`;
    console.log(`📁 Path: ${selectedStorage.usesCategory ? `${serverCategory}/` : ""}${formattedName}`);

    const { targetURL, serverFilePath } = buildStoragePaths({
      selectedStorage,
      serverCategory,
      formattedName,
      fileName,
      consoleBaseUrl,
    });

    // === VPN pre-flight ===
    if (!(await checkStorageConnectivity(consoleBaseUrl))) {
      console.warn(`⚠️ Storage server unreachable: ${storageHostname}`);
      console.warn("💡 If you need VPN — connect it now. Attempting navigation anyway...");
    }

    // === Navigate ===
    console.log(`🌐 Loading page: ${targetURL}`);
    try {
      const response = await page.goto(targetURL, { waitUntil: "load", timeout: 60000 });
      if (response && !response.ok()) {
        console.warn(`⚠️ Page returned status ${response.status()}. Check VPN/server access.`);
      }
    } catch (err) {
      console.error("💡 Tip: Check VPN and storage server availability.");
      throw err;
    }

    // === Wait for UI / handle login / check readiness ===
    await waitForStorageReady(page, { bootstrapWaitMs, loginWaitMs, config });

    // === File existence check ===
    console.log(`🔍 Checking if "${fileName}" already exists...`);
    if (await checkFileExists(page, fileName)) {
      console.log(`⚠️ File "${fileName}" already exists — upload skipped.`);
      playSound("warning", config);
      await safeExit(1);
    }

    // === Upload ===
    const success = await uploadWithRetry({
      page,
      filePath,
      fileName,
      config,
      selectedStorage,
      provider,
      serverFilePath,
    });

    clearTimeout(timeoutId);

    if (success) {
      console.log("🎉 Upload completed successfully!");
      if (resolvedBrowser.closeDelaySuccess > 0) {
        console.log(`⏳ Closing tab in ${Math.round(resolvedBrowser.closeDelaySuccess / 1000)}s...`);
        await new Promise((r) => setTimeout(r, resolvedBrowser.closeDelaySuccess));
      }
      if (resolvedBrowser.autoCloseTab) {
        try {
          await page.close();
          console.log("✓ Tab closed");
        } catch {}
      }
      await safeExit(0);
    } else {
      await safeExit(1);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Target page, context or browser has been closed") || msg.toLowerCase().includes("browser has been closed") || msg.includes("ERROR:BROWSER_CLOSED")) {
      console.error("ERROR:BROWSER_CLOSED (user closed Brave before completing flow)");
    }
    console.error("❌ Fatal error:", msg);
    if (config) playSound("error", config);
    await safeExit(1);
  }
})();
