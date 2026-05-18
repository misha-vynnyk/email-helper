"use strict";

const os = require("os");

// Max concurrent automation instances allowed per macOS user.
// Defines the port range each user owns: userSlot * MAX_PORTS_PER_USER + portId.
// Increase this if a single user needs more than 10 parallel instances.
const MAX_PORTS_PER_USER = 10;

function calcPortOffsets() {
  let userSlot = 0; // 0 = root/admin (uid ≤ 501), 1 = first normal user, etc.
  try {
    const uid = os.userInfo().uid;
    if (typeof uid === "number" && uid > 501) {
      userSlot = uid - 501;
    }
  } catch (e) {}

  const portId = parseInt(process.env.PORT_ID || "0");
  return { userSlot, portId };
}

// Resolves storage provider + browser profile settings from config.
// Returns computed values — does NOT mutate the config object.
function resolveProvider(config, provider) {
  const storageProviders = config.storageProviders || {
    default: {
      bucket: "files",
      usesCategory: true,
      consoleRootPrefix: config.storage?.basePath || "Promo",
      publicBaseUrl: config.storage?.publicUrl || "",
      publicPathPrefix: "files",
      publicRootPrefix: config.storage?.basePath || "Promo",
      bootstrapWaitMs: 60000,
    },
  };

  const selectedStorage = storageProviders[provider] || storageProviders.default;
  const loginWaitMs = Number(selectedStorage.loginWaitMs ?? 600000);
  const bootstrapWaitMs = Number(selectedStorage.bootstrapWaitMs ?? 120000);

  let validCategories = ["finance", "health"];
  if (Array.isArray(selectedStorage.categories)) {
    validCategories = selectedStorage.categories;
  }

  const browserProfiles = config.browserProfiles || {
    default: {
      debugPort: config.browser?.debugPort,
      userDataDir: config.browser?.userDataDir,
    },
  };
  const selectedBrowserProfile = browserProfiles[provider] || browserProfiles.default;

  const consoleBaseUrl = config.storage?.baseUrl || "https://storage.epcnetwork.dev";

  let storageHostname = "";
  try { storageHostname = new URL(consoleBaseUrl).hostname; } catch {}

  // Compute debug port: each user owns a dedicated range of MAX_PORTS_PER_USER ports.
  // Formula: basePort + userSlot * MAX_PORTS_PER_USER + portId
  // This prevents cross-user port collisions even when portId > 0.
  const { userSlot, portId } = calcPortOffsets();
  const basePort = selectedBrowserProfile?.debugPort ?? config.browser.debugPort;
  let debugPort = basePort + userSlot * MAX_PORTS_PER_USER + portId;
  if (debugPort < 1024 || debugPort > 49151) {
    console.warn(
      `⚠️ Debug port ${debugPort} out of safe range (1024–49151), resetting to base port.`
    );
    debugPort = basePort;
  }
  if (portId >= MAX_PORTS_PER_USER) {
    console.warn(
      `⚠️ PORT_ID=${portId} exceeds MAX_PORTS_PER_USER=${MAX_PORTS_PER_USER}. ` +
      `Increase MAX_PORTS_PER_USER in provider.js if you need more concurrent instances.`
    );
  }

  // Compute user data dir with profile override + portId suffix (no mutation)
  // Both paths already resolved by loadConfig() — no need to re-resolve.
  let userDataDir = selectedBrowserProfile?.userDataDir || config.browser.userDataDir;
  if (portId > 0) userDataDir = `${userDataDir}-${portId}`;

  const autoCloseTab =
    typeof selectedBrowserProfile?.autoCloseTab === "boolean"
      ? selectedBrowserProfile.autoCloseTab
      : config.browser.autoCloseTab;

  return {
    selectedStorage,
    consoleBaseUrl,
    storageHostname,
    loginWaitMs,
    bootstrapWaitMs,
    validCategories,
    browser: {
      executablePath: config.browser.executablePath,
      debugPort,
      userDataDir,
      autoCloseTab,
      closeDelaySuccess: config.browser.closeDelaySuccess,
    },
  };
}

module.exports = { resolveProvider };
