"use strict";

const fs = require("fs");
const pathModule = require("path");
const os = require("os");

function resolveDynamicPath(p) {
  if (typeof p !== "string") return p;
  const home = os.homedir();
  const appData =
    process.platform === "win32"
      ? process.env.LOCALAPPDATA
      : pathModule.join(home, "Library/Application Support");

  let resolved = p
    .replace(/\{\{HOME\}\}/g, home)
    .replace(/\{\{APP_DATA\}\}/g, appData);

  if (resolved.startsWith("~/")) {
    resolved = pathModule.join(home, resolved.slice(2));
  }
  return resolved;
}

function findBraveExecutable(config) {
  const platform = process.platform;
  const envPath = process.env.BRAVE_EXECUTABLE_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;

  const cfgPath = config.browser.executablePath;
  if (cfgPath && fs.existsSync(cfgPath)) return cfgPath;

  if (platform === "darwin") {
    const macPath =
      "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
    if (fs.existsSync(macPath)) return macPath;
  } else if (platform === "win32") {
    const winPaths = [
      pathModule.join(
        process.env.PROGRAMFILES || "C:\\Program Files",
        "BraveSoftware\\Brave-Browser\\Application\\brave.exe"
      ),
      pathModule.join(
        process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)",
        "BraveSoftware\\Brave-Browser\\Application\\brave.exe"
      ),
      pathModule.join(
        process.env.LOCALAPPDATA || "",
        "BraveSoftware\\Brave-Browser\\Application\\brave.exe"
      ),
    ];
    for (const wp of winPaths) {
      if (wp && fs.existsSync(wp)) return wp;
    }
  } else if (platform === "linux") {
    const linuxPaths = ["/usr/bin/brave-browser", "/usr/bin/brave"];
    for (const lp of linuxPaths) {
      if (fs.existsSync(lp)) return lp;
    }
  }
  return cfgPath;
}

function validateConfig(config) {
  const required = ["browser", "timeouts", "retries", "notifications"];
  for (const key of required) {
    if (!config[key])
      throw new Error(`config.json: відсутній обов'язковий блок "${key}"`);
  }
}

function loadConfig() {
  const configPath = pathModule.join(__dirname, "..", "..", "config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  validateConfig(config);

  config.browser.userDataDir = resolveDynamicPath(config.browser.userDataDir);
  config.browser.executablePath = findBraveExecutable(config);

  if (config.browserProfiles) {
    Object.values(config.browserProfiles).forEach((profile) => {
      if (profile.userDataDir)
        profile.userDataDir = resolveDynamicPath(profile.userDataDir);
    });
  }

  if (process.env.BRAVE_EXECUTABLE_PATH)
    config.browser.executablePath = process.env.BRAVE_EXECUTABLE_PATH;
  if (process.env.BRAVE_USER_DATA_DIR)
    config.browser.userDataDir = process.env.BRAVE_USER_DATA_DIR;

  return config;
}

module.exports = { resolveDynamicPath, findBraveExecutable, loadConfig };
