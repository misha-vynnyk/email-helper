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

const child = spawn(process.execPath, [scriptPath, ...args], {
  stdio: "inherit",
  cwd: path.dirname(scriptPath),
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
