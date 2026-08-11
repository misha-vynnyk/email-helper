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

  const targetURL = `${consoleBaseUrl}/bucket/${selectedStorage.bucket}/${consolePath}`;

  const publicParts = [selectedStorage.publicPathPrefix, selectedStorage.publicRootPrefix];
  if (selectedStorage.usesCategory) publicParts.push(serverCategory);
  publicParts.push(formattedName, fileName);
  const serverFilePath = pathModule.posix.join(...publicParts.filter(Boolean));

  return { targetURL, serverFilePath };
}

// ---------------------------------------------------------------------------
// UI detection & readiness
// ---------------------------------------------------------------------------

// Upload button is identified by its lucide "cloud-upload" icon rather than an id —
// the new UI renders it both in the toolbar and (when the folder is empty) again
// inside the empty-state panel, so `.first()` is used wherever it's queried.
const UPLOAD_BUTTON_SELECTOR = "button:has(svg.lucide-cloud-upload)";

// Waits for the storage UI to become ready, or for the user to finish a manual
// login (the app full-navigates to /login?callbackUrl=... when unauthenticated —
// there is no in-page login button to click, so the user always logs in by hand).
// Throws on timeout or browser close so the caller's catch handles exit.
async function waitForStorageReady(page, { bootstrapWaitMs, loginWaitMs, config }) {
  const readyP = page
    .waitForSelector(UPLOAD_BUTTON_SELECTOR, { timeout: bootstrapWaitMs })
    .then(() => "ready").catch(() => null);
  const loginP = page
    .waitForURL((url) => url.pathname.startsWith("/login"), { timeout: bootstrapWaitMs })
    .then(() => "login").catch(() => null);

  const state = await new Promise((resolve) => {
    readyP.then((v) => v && resolve(v));
    loginP.then((v) => v && resolve(v));
    Promise.all([readyP, loginP]).then(([r, l]) => resolve(r || l || null));
  });

  if (state === "login") {
    playSound("error", config);
    console.log(`🔒 Login required — please sign in manually in the browser window (waiting up to ${Math.round(loginWaitMs / 1000)}s)...`);
    try {
      await page.waitForSelector(UPLOAD_BUTTON_SELECTOR, { timeout: loginWaitMs });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("Target page, context or browser has been closed")) {
        throw new Error("ERROR:BROWSER_CLOSED (user closed Brave before completing login)");
      }
      throw new Error("ERROR:LOGIN_TIMEOUT (user did not login in time)");
    }
  } else if (state !== "ready") {
    throw new Error("UI detection failed: expected elements not found within timeout.");
  }

  await Promise.race([
    page.waitForSelector('tr[data-slot="table-row"]', { timeout: 3000 }).catch(() => {}),
    page.waitForSelector('[data-slot="empty-title"]', { timeout: 3000 }).catch(() => {}),
  ]);

  console.log("✅ Interface ready.");
}

// Returns true if a file with the given name is visible in the folder listing.
async function checkFileExists(page, fileName) {
  return page.evaluate((name) => {
    const els = document.querySelectorAll('tr[data-slot="table-row"] span.truncate');
    return Array.from(els).some((el) => el.textContent.trim() === name);
  }, fileName);
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

async function uploadFile({ page, filePath, fileName, config, selectedStorage, provider, serverFilePath, retry = false }) {
  try {
    console.log(retry ? "🔁 Retrying upload..." : "📦 Opening upload dialog...");

    await page.locator(UPLOAD_BUTTON_SELECTOR).first().click({ timeout: config.timeouts.elementWait });

    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible", timeout: config.timeouts.elementWait + 2000 });

    console.log("🖱 Clicking dropzone and waiting for file chooser...");
    const [fileChooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      dialog.getByText("Drag & Drop files here or click to select").click(),
    ]);

    await fileChooser.setFiles(filePath);

    const confirmButton = dialog.getByRole("button", { name: "Upload", exact: true });
    await confirmButton.click({ timeout: config.timeouts.elementWait });

    console.log("⏳ Uploading...");
    await dialog.waitFor({ state: "hidden", timeout: config.timeouts.uploadDialogClose });

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

    const fileAppearedAlready = await checkFileExists(page, fileName);

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
