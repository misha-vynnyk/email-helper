#!/usr/bin/env node
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const aiDir = path.resolve(__dirname, "..", "server", "ai");
const venvDir = path.join(aiDir, "venv");

function win() {
  return process.platform === "win32";
}

function pythonCmd() {
  // prefer venv python if exists
  if (fs.existsSync(venvDir)) {
    const py = win() ? path.join(venvDir, "Scripts", "python.exe") : path.join(venvDir, "bin", "python");
    if (fs.existsSync(py)) return py;
  }
  // fallback to system python
  return process.platform === "darwin" || process.platform === "linux" ? "python3" : "python";
}

function run(cmd, args, opts) {
  const r = spawnSync(cmd, args, Object.assign({ stdio: "inherit", cwd: aiDir, shell: false }, opts));
  if (r.error) throw r.error;
  if (r.status !== 0) process.exit(r.status);
}

try {
  console.log("Ensuring Python venv for AI server...");
  run(pythonCmd(), ["-m", "venv", "venv"]);

  const venvPython = pythonCmd();
  console.log("Using python:", venvPython);

  console.log("Installing Python requirements...");
  run(venvPython, ["-m", "pip", "install", "--upgrade", "pip"]);
  run(venvPython, ["-m", "pip", "install", "-r", "requirements.txt"]);

  console.log("Starting AI server...");
  // Run start.py with the venv python and forward logs
  const child = spawnSync(venvPython, ["start.py"], { cwd: aiDir, stdio: "inherit" });
  if (child.error) throw child.error;
  process.exit(child.status);
} catch (e) {
  console.error("Failed to run AI server helper:", e && e.message);
  process.exit(1);
}
