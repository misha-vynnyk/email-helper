#!/usr/bin/env node

/**
 * Automation setup script — validates and fixes config paths.
 * Called by root postinstall; npm workspaces handles dependency installation.
 */

const fs = require("fs");
const path = require("path");

const automationDir = __dirname;
const configPath = path.join(automationDir, "config.json");

console.log("📦 Setting up automation module...\n");

// Validate and fix config paths
console.log("⚙️  Validating configuration paths...");

if (!fs.existsSync(configPath)) {
  console.error(`❌ Config file not found: ${configPath}`);
  process.exit(1);
}

try {
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const platform = process.platform;

  let configUpdated = false;

  // Fix browser paths for macOS
  if (platform === "darwin") {
    const bravePath = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
    const braveEnvPath = process.env.BRAVE_EXECUTABLE_PATH;
    const resolvedBravePath = (braveEnvPath && fs.existsSync(braveEnvPath)) ? braveEnvPath : (fs.existsSync(bravePath) ? bravePath : null);

    if (!resolvedBravePath) {
      console.warn(`⚠️  Brave Browser not found at default location: ${bravePath}`);
      console.warn("   Set BRAVE_EXECUTABLE_PATH env variable if Brave is installed elsewhere.\n");
    } else if (config.browser.executablePath !== resolvedBravePath) {
      config.browser.executablePath = resolvedBravePath;
      configUpdated = true;
    }

    // Store userDataDirs as {{HOME}} templates so config.json stays portable
    // across different macOS users. loadConfig() resolves {{HOME}} at runtime.
    const defaultBraveDir = "{{HOME}}/Library/Application Support/BravePlaywright";
    const alphaBraveDir   = "{{HOME}}/Library/Application Support/BravePlaywright-AlfaOne";
    const tttBraveDir     = "{{HOME}}/Library/Application Support/BravePlaywright-TerraTrans";

    if (config.browser.userDataDir !== defaultBraveDir) {
      config.browser.userDataDir = defaultBraveDir;
      configUpdated = true;
    }
    if (config.browserProfiles.default.userDataDir !== defaultBraveDir) {
      config.browserProfiles.default.userDataDir = defaultBraveDir;
      configUpdated = true;
    }
    if (config.browserProfiles.alphaone.userDataDir !== alphaBraveDir) {
      config.browserProfiles.alphaone.userDataDir = alphaBraveDir;
      configUpdated = true;
    }
    if (config.browserProfiles.ttt.userDataDir !== tttBraveDir) {
      config.browserProfiles.ttt.userDataDir = tttBraveDir;
      configUpdated = true;
    }
  } else if (platform === "win32") {
    // Windows paths
    const bravePathWin = path.join(process.env.ProgramFiles || "C:\\Program Files", "BraveSoftware\\Brave-Browser\\Application\\brave.exe");

    if (!fs.existsSync(bravePathWin) && !process.env.BRAVE_EXECUTABLE_PATH) {
      console.warn(`⚠️  Brave Browser executable not found at: ${bravePathWin}`);
      console.warn("   Set BRAVE_EXECUTABLE_PATH environment variable if Brave is installed elsewhere");
      console.warn("   Example: set BRAVE_EXECUTABLE_PATH=C:\\\\Path\\\\To\\\\brave.exe\n");
    }

    // Store as {{APP_DATA}} templates — loadConfig() resolves at runtime per user.
    const defaultBraveDirWin = "{{APP_DATA}}/BravePlaywright";
    const alphaBraveDirWin   = "{{APP_DATA}}/BravePlaywright-AlfaOne";
    const tttBraveDirWin     = "{{APP_DATA}}/BravePlaywright-TerraTrans";

    if (config.browser.userDataDir !== defaultBraveDirWin) {
      config.browser.userDataDir = defaultBraveDirWin;
      configUpdated = true;
    }
    if (config.browserProfiles.default.userDataDir !== defaultBraveDirWin) {
      config.browserProfiles.default.userDataDir = defaultBraveDirWin;
      configUpdated = true;
    }
    if (config.browserProfiles.alphaone.userDataDir !== alphaBraveDirWin) {
      config.browserProfiles.alphaone.userDataDir = alphaBraveDirWin;
      configUpdated = true;
    }
    if (config.browserProfiles.ttt.userDataDir !== tttBraveDirWin) {
      config.browserProfiles.ttt.userDataDir = tttBraveDirWin;
      configUpdated = true;
    }

    config.browser.executablePath = bravePathWin;
  } else if (platform === "linux") {
    // Linux paths
    const bravePath = "/usr/bin/brave-browser";

    if (!fs.existsSync(bravePath) && !process.env.BRAVE_EXECUTABLE_PATH) {
      console.warn(`⚠️  Brave Browser not found at: ${bravePath}`);
      console.warn("   Install Brave: sudo apt install brave-browser (Debian/Ubuntu)");
      console.warn("   Or set BRAVE_EXECUTABLE_PATH environment variable\n");
    }

    // Store as {{HOME}} templates — loadConfig() resolves at runtime per user.
    const defaultBraveDirLinux = "{{HOME}}/.config/BravePlaywright";
    const alphaBraveDirLinux   = "{{HOME}}/.config/BravePlaywright-AlfaOne";
    const tttBraveDirLinux     = "{{HOME}}/.config/BravePlaywright-TerraTrans";

    if (config.browser.userDataDir !== defaultBraveDirLinux) {
      config.browser.userDataDir = defaultBraveDirLinux;
      configUpdated = true;
    }
    if (config.browserProfiles.default.userDataDir !== defaultBraveDirLinux) {
      config.browserProfiles.default.userDataDir = defaultBraveDirLinux;
      configUpdated = true;
    }
    if (config.browserProfiles.alphaone.userDataDir !== alphaBraveDirLinux) {
      config.browserProfiles.alphaone.userDataDir = alphaBraveDirLinux;
      configUpdated = true;
    }
    if (config.browserProfiles.ttt.userDataDir !== tttBraveDirLinux) {
      config.browserProfiles.ttt.userDataDir = tttBraveDirLinux;
      configUpdated = true;
    }

    config.browser.executablePath = bravePath;
  }

  // Save updated config if any changes were made
  if (configUpdated) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
    console.log(`✅ Configuration updated for ${platform} platform\n`);
  } else {
    console.log("✅ Configuration is valid\n");
  }
} catch (e) {
  console.error(`❌ Error validating configuration: ${e.message}`);
  process.exit(1);
}

console.log("✨ Automation setup complete!\n");
