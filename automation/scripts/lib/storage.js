"use strict";

const pathModule = require("path");
const { execFileSync } = require("child_process");
const { playSound } = require("./utils");

// ---------------------------------------------------------------------------
// Path building
// ---------------------------------------------------------------------------

function buildStoragePaths({ selectedStorage, serverCategory, formattedName, fileName, consoleBaseUrl }) {
  const consoleParts = [selectedStorage.consoleRootPrefix];
  if (selectedStorage.usesCategory) consoleParts.push(serverCategory);
  consoleParts.push(formattedName);
  const consolePath = consoleParts.filter(Boolean).join("/");

  const targetURL =
    `${consoleBaseUrl}/browser/${selectedStorage.bucket}/` +
    `${encodeURIComponent(consolePath)}%2F`;

  const publicParts = [selectedStorage.publicPathPrefix, selectedStorage.publicRootPrefix];
  if (selectedStorage.usesCategory) publicParts.push(serverCategory);
  publicParts.push(formattedName, fileName);
  const serverFilePath = pathModule.posix.join(...publicParts.filter(Boolean));

  return { targetURL, serverFilePath };
}

// ---------------------------------------------------------------------------
// UI detection & readiness
// ---------------------------------------------------------------------------

// Waits for MinIO upload UI or login prompt, handles login if needed,
// then polls until the upload button is visually interactive.
// Throws on timeout or browser close so the caller's catch handles exit.
async function waitForStorageReady(page, { bootstrapWaitMs, loginWaitMs, config }) {
  const uploadP = page
    .waitForSelector("#upload-main", { timeout: bootstrapWaitMs })
    .then(() => "upload").catch(() => null);
  const loginP = page
    .waitForSelector("button#go-to-login", { timeout: bootstrapWaitMs })
    .then(() => "login").catch(() => null);

  const state = await new Promise((resolve) => {
    uploadP.then((v) => v && resolve(v));
    loginP.then((v) => v && resolve(v));
    Promise.all([uploadP, loginP]).then(([u, l]) => resolve(u || l || null));
  });

  if (state === "login") {
    playSound("error", config);
    try { await page.click("button#go-to-login", { timeout: 1000 }); } catch {}
    console.log(`🔒 Login required — waiting for #upload-main (${Math.round(loginWaitMs / 1000)}s)...`);
    try {
      await page.waitForSelector("#upload-main", { timeout: loginWaitMs });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("Target page, context or browser has been closed")) {
        throw new Error("ERROR:BROWSER_CLOSED (user closed Brave before completing login)");
      }
      throw new Error("ERROR:LOGIN_TIMEOUT (user did not login in time)");
    }
  } else if (state !== "upload") {
    throw new Error("UI detection failed: expected elements not found within timeout.");
  }

  console.log("⏳ Checking interface readiness...");
  let ready = false;
  for (let i = 0; i < config.timeouts.interfaceMaxChecks; i++) {
    ready = await page.evaluate(() => {
      const btn = document.querySelector("#upload-main");
      if (!btn) return false;
      const rect = btn.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && window.getComputedStyle(btn).opacity > 0.7;
    });
    if (ready) break;
    await new Promise((r) => setTimeout(r, config.timeouts.interfaceCheck));
  }

  if (!ready) console.warn("⚠️ Upload button may not be fully visible — proceeding anyway.");

  await Promise.race([
    page.waitForSelector(".fileNameText", { timeout: 3000 }).catch(() => {}),
    page.waitForSelector('text="Empty folder"', { timeout: 3000 }).catch(() => {}),
  ]);

  console.log("✅ Interface ready.");
}

// Returns true if a file with the given name is visible in the folder listing.
async function checkFileExists(page, fileName) {
  return page.evaluate((name) => {
    const els = document.querySelectorAll(".fileNameText");
    return Array.from(els).some((el) => el.textContent.trim() === name);
  }, fileName);
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

async function uploadFile({ page, filePath, fileName, config, selectedStorage, provider, serverFilePath, retry = false }) {
  try {
    console.log(retry ? "🔁 Retrying upload..." : "📦 Opening upload menu...");

    await page.click("#upload-main", { timeout: config.timeouts.elementWait });
    const uploadButton = await page.waitForSelector('div[label="Upload File"]', {
      timeout: config.timeouts.elementWait + 2000,
    });
    console.log('🖱 Clicking "Upload File" and waiting for file chooser...');

    const [fileChooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      uploadButton.click(),
    ]);

    await fileChooser.setFiles(filePath);
    console.log(`✅ File ${fileName} uploaded successfully!`);

    const publicUrl = `${(selectedStorage.publicBaseUrl || "").replace(/\/+$/, "")}/${serverFilePath}`;

    if (process.platform === "darwin") {
      try {
        execFileSync("pbcopy", [], { input: serverFilePath, encoding: "utf8", stdio: ["pipe", "ignore", "ignore"] });
      } catch {}
    }

    playSound("success", config);
    console.log(`📋 Copied to clipboard: ${serverFilePath}`);
    console.log(`RESULT_JSON=${JSON.stringify({ provider, filePath: serverFilePath, publicUrl })}`);
    return true;
  } catch (err) {
    console.warn("⚠️ Upload error:", err.message);
    return false;
  }
}

// Runs uploadFile with automatic retry.
// Waits uploadRetry ms, checks if the file appeared anyway before retrying.
async function uploadWithRetry({ page, filePath, fileName, config, selectedStorage, provider, serverFilePath }) {
  let success = await uploadFile({ page, filePath, fileName, config, selectedStorage, provider, serverFilePath, retry: false });

  if (!success && config.retries.uploadAttempts > 1) {
    console.log("⏱ Waiting before retry...");
    await new Promise((r) => setTimeout(r, config.timeouts.uploadRetry));

    const fileAppearedAlready = await page.evaluate((name) => {
      const els = document.querySelectorAll(".fileNameText");
      return Array.from(els).some((el) => el.textContent.trim() === name);
    }, fileName);

    if (fileAppearedAlready) {
      console.log(`🟡 File ${fileName} appeared after delay — retry not needed.`);
      const publicUrl = `${(selectedStorage.publicBaseUrl || "").replace(/\/+$/, "")}/${serverFilePath}`;
      playSound("success", config);
      console.log(`📋 Copied to clipboard: ${serverFilePath}`);
      console.log(`RESULT_JSON=${JSON.stringify({ provider, filePath: serverFilePath, publicUrl })}`);
      success = true;
    } else {
      success = await uploadFile({ page, filePath, fileName, config, selectedStorage, provider, serverFilePath, retry: true });
      if (!success) console.error("🚫 Upload failed after two attempts.");
    }
  }

  return success;
}

module.exports = { buildStoragePaths, waitForStorageReady, checkFileExists, uploadFile, uploadWithRetry };
