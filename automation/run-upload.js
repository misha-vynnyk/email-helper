#!/usr/bin/env node
/**
 * Entry point for the modular upload automation (v2).
 * Points to automation/scripts/main.js — original run-upload.js is unchanged.
 *
 * Usage: node automation/run-upload-v2.js <filePath> [category] [--provider default|alphaone|ttt]
 *   or:  npm run automation:upload-v2 -- <filePath> [category]
 */
"use strict";

const fs   = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const scriptPath = path.join(__dirname, "scripts", "main.js");
const configPath = path.join(__dirname, "config.json");
const args = process.argv.slice(2);

// Resolve first positional arg (file path) to absolute path
if (args.length > 0 && !args[0].startsWith("-")) {
  try {
    const abs = path.resolve(process.cwd(), args[0]);
    if (fs.existsSync(abs)) args[0] = abs;
  } catch {}
}

function ensureAutomationDepsInstalled() {
  try {
    require.resolve("playwright-core", { paths: [__dirname] });
  } catch {
    const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
    console.error([
      "",
      "Upload automation cannot start: Playwright dependency is missing.",
      "",
      "Fix (one-time):",
      `  ${npmCmd} --prefix automation install`,
      "",
      "Then re-run your upload command.",
      "",
    ].join("\n"));
    process.exit(1);
  }
}

function validateConfigPaths() {
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    process.exit(1);
  }
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const platform = process.platform;
    const issues = [];

    let browserPath = config.browser.executablePath;
    if (browserPath && !fs.existsSync(browserPath)) {
      if (platform === "darwin") {
        const mac = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
        if (fs.existsSync(mac)) browserPath = mac;
      } else if (platform === "win32") {
        for (const base of [process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"], process.env.LOCALAPPDATA]) {
          const wp = base && path.join(base, "BraveSoftware\\Brave-Browser\\Application\\brave.exe");
          if (wp && fs.existsSync(wp)) { browserPath = wp; break; }
        }
      }
    }

    if (!browserPath || !fs.existsSync(browserPath)) {
      const hints = {
        win32:  ["   Set: set BRAVE_EXECUTABLE_PATH=C:\\\\Path\\\\To\\\\brave.exe"],
        darwin: ["   Install: https://brave.com/download/", "   Or set: export BRAVE_EXECUTABLE_PATH=/path/to/brave"],
        linux:  ["   Install: sudo apt install brave-browser", "   Or set: export BRAVE_EXECUTABLE_PATH=/usr/bin/brave-browser"],
      };
      issues.push(`❌ Brave Browser not found at: ${config.browser.executablePath}`, ...(hints[platform] || []));
    }

    if (typeof config.browser.debugPort !== "number") {
      issues.push(`❌ Invalid debugPort in config: "${config.browser.debugPort}"`, "   Must be a number (e.g., 9222)");
    }

    if (issues.length > 0) {
      console.error("\n" + issues.join("\n") + "\n");
      console.error("To fix: install the missing software, set environment variables,");
      console.error("or manually update automation/config.json\n");
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

child.on("exit", (code) => process.exit(code ?? 0));
