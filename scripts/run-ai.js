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
  const pyCmd = pythonCmd();
  console.log(`Checking Python version for ${pyCmd}...`);

  // Check version
  const verOut = spawnSync(pyCmd, ["-c", "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"], { encoding: "utf8" });
  if (verOut.error || verOut.status !== 0) {
    console.error("❌ Failed to check Python version. Ensure python is in PATH.");
    process.exit(1);
  }

  const version = verOut.stdout.trim();
  const [major, minor] = version.split(".").map(Number);

  console.log(`Python version: ${version}`);

  // PaddlePaddle supports 3.8 - 3.12 (as of early 2026, 3.13/3.14 might be too new)
  if (major !== 3 || minor < 8 || minor > 12) {
    console.error(`\n❌ Incompatible Python version: ${version}`);
    console.error("   The AI module (PaddlePaddle) requires Python 3.8 - 3.12.");
    console.error("   Python 3.13+ (and 3.14) are NOT yet supported.");
    console.error("\n   Please install Python 3.10, 3.11, or 3.12 and try again.");
    console.error("   (Ensure it's in your PATH or set PYTHON_EXECUTABLE env var)\n");
    process.exit(1);
  }

  console.log("Ensuring Python venv for AI server...");
  run(pyCmd, ["-m", "venv", "venv"]);

  const venvPython = pythonCmd();
  console.log("Using python:", venvPython);

  // Intel Mac Check
  if (process.platform === "darwin" && process.arch === "x64") {
    console.warn("⚠️  Intel Mac detected (x64).");
    console.warn("   PaddleOCR might require OpenMP or have binary issues.");
    console.warn("   If it fails, try installing 'paddlepaddle' manually in the venv.");
  }

  console.log("Installing Python requirements...");
  // Use --no-warn-script-location to avoid path warnings on Windows
  run(venvPython, ["-m", "pip", "install", "--upgrade", "pip", "--no-warn-script-location"]);

  // Install requirements - Fail hard if this errors
  run(venvPython, ["-m", "pip", "install", "-r", "requirements.txt", "--no-warn-script-location"]);

  // Verify Critical Dependencies
  console.log("Verifying Torch installation...");
  try {
    const check = spawnSync(venvPython, ["-c", "import torch; print(f'Torch {torch.__version__} verified')"], { encoding: "utf8" });
    if (check.status !== 0) {
      console.error("❌ Torch check failed even after install.");
      console.error(check.stderr || check.stdout);
      throw new Error("Torch verification failed");
    }
    console.log("✅ " + check.stdout.trim());
  } catch (verifyError) {
    console.error("❌ Critical dependency verification failed.");
    console.error("   Please try running: 'pip install torch' manually in the venv.");
    process.exit(1);
  }

  console.log("Starting AI server...");
  // Run start.py with the venv python and forward logs
  const child = spawnSync(venvPython, ["start.py"], { cwd: aiDir, stdio: "inherit" });
  if (child.error) throw child.error;

  // If user kills via Ctrl+C, exit gracefully
  if (child.signal === "SIGINT") process.exit(0);

  process.exit(child.status);
} catch (e) {
  console.error("Failed to run AI server helper:", e && e.message);
  process.exit(1);
}
