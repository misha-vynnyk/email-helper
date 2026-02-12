#!/usr/bin/env node
/**
 * Cross-platform entry point for storage upload automation.
 * Resolves script path from this file's location, forwards all arguments.
 *
 * Usage: node automation/run-upload.js <filePath> [category] [--no-confirm]
 *   or:  npm run automation:upload -- <filePath> [category] [--no-confirm]
 * Example: npm run automation:upload -- ./image.png finance
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

const scriptPath = path.join(__dirname, "scripts", "upload-playwright-brave.js");
const configPath = path.join(__dirname, "config.json");
const args = process.argv.slice(2);

function ensureAutomationDepsInstalled() {
  const automationDir = __dirname;
  const tryResolve = () => {
    try {
      // Prefer playwright-core (we launch Brave, no bundled browsers needed).
      require.resolve("playwright-core", { paths: [automationDir] });
      return true;
    } catch {
      return false;
    }
  };

  if (tryResolve()) return;

  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  console.error(["", "Upload automation cannot start: Playwright dependency is missing.", "", "Fix (one-time):", `  ${npmCmd} --prefix automation install`, "", "Then re-run:", "  npm run automation:upload -- <filePath> [--provider default|alphaone] ...", ""].join("\n"));
  process.exit(1);
}

function validateConfigPaths() {
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    process.exit(1);
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const platform = process.platform;
    const homeDir = os.homedir();
    const issues = [];

    // Check browser executable path
    const browserPath = config.browser.executablePath;
    if (browserPath && !fs.existsSync(browserPath)) {
      if (platform === "win32") {
        issues.push(`❌ Brave Browser not found at: ${browserPath}`, "   Set environment variable: set BRAVE_EXECUTABLE_PATH=C:\\\\Path\\\\To\\\\brave.exe");
      } else if (platform === "darwin") {
        issues.push(`❌ Brave Browser not found at: ${browserPath}`, "   Install from: https://brave.com/download/", "   Or set: export BRAVE_EXECUTABLE_PATH=/path/to/brave");
      } else if (platform === "linux") {
        issues.push(`❌ Brave Browser not found at: ${browserPath}`, "   Install: sudo apt install brave-browser", "   Or set: export BRAVE_EXECUTABLE_PATH=/usr/bin/brave-browser");
      }
    }

    // Validate debug port is a number
    if (typeof config.browser.debugPort !== "number") {
      issues.push(`❌ Invalid debugPort in config: "${config.browser.debugPort}"`, "   Must be a number (e.g., 9222)");
    }

    if (issues.length > 0) {
      console.error("\n" + issues.join("\n") + "\n");
      console.error("To fix these issues, you can either:");
      console.error("  1. Install the missing software");
      console.error("  2. Set environment variables to point to your installation");
      console.error("  3. Manually update automation/config.json\n");
      process.exit(1);
    }
  } catch (e) {
    console.error(`❌ Error reading configuration: ${e.message}`);
    process.exit(1);
  }
}

ensureAutomationDepsInstalled();
validateConfigPaths();

const child = spawn(process.execPath, [scriptPath, ...args], {
  stdio: "inherit",
  cwd: path.dirname(scriptPath),
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
