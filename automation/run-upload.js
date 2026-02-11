#!/usr/bin/env node
/**
 * Cross-platform entry point for storage upload automation.
 * Resolves script path from this file's location, forwards all arguments.
 *
 * Usage: node automation/run-upload.js <filePath> [category] [--no-confirm]
 *   or:  npm run automation:upload -- <filePath> [category] [--no-confirm]
 * Example: npm run automation:upload -- ./image.png finance
 */
const path = require("path");
const { spawn } = require("child_process");

const scriptPath = path.join(__dirname, "scripts", "upload-playwright-brave.js");
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
  console.error(
    [
      "",
      "Upload automation cannot start: Playwright dependency is missing.",
      "",
      "Fix (one-time):",
      `  ${npmCmd} --prefix automation install`,
      "",
      "Then re-run:",
      "  npm run automation:upload -- <filePath> [--provider default|alphaone] ...",
      "",
    ].join("\n")
  );
  process.exit(1);
}

ensureAutomationDepsInstalled();

const child = spawn(process.execPath, [scriptPath, ...args], {
  stdio: "inherit",
  cwd: path.dirname(scriptPath),
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
