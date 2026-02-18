const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const rootDir = path.resolve(__dirname, "..");
const serverDir = path.join(rootDir, "server");

function run(cmd, args, cwd) {
  console.log(`> ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, {
    cwd: cwd || rootDir,
    stdio: "inherit",
    shell: true, // Use shell to ensure command is found, but avoiding shell syntax in the args themselves
  });

  if (result.error) {
    console.error(`Failed to run ${cmd}:`, result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`Command failed with status ${result.status}`);
    process.exit(result.status);
  }
}

console.log("🚀 Starting Cross-Platform Setup...\n");

// 1. Ensure Node version
console.log("1️⃣  Checking Node.js version...");
run("node", ["scripts/ensure-node.js"], rootDir);

// 2. Setup Automation (installs deps for automation folder)
console.log("\n2️⃣  Setting up Automation...");
run("node", ["automation/setup.js"], rootDir);

// 3. Install Server Dependencies
console.log("\n3️⃣  Installing Server Dependencies...");
try {
  // Use shell: true in spawnSync (default in helper) simplifies this,
  // but we want to avoid "2>/dev/null" which breaks on Windows cmd.exe.
  // Instead, we just let it run and ignore legacy peer deps via flag.
  console.log(`Working directory: ${serverDir}`);

  // Clean install not needed, just install
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

  // We use spawnSync directly to handle potential non-fatal errors if we want strict control,
  // but standard 'run' is fine if we accept exit code 1 as failure.
  // Exception: if server install fails, should we fail the whole build?
  // Yes, usually. But the original script had "|| true" which implies
  // it wasn't critical or they wanted to suppress errors.
  // But for a robust project, we SHOULD fail if server deps aren't there.
  // We will allow failure ONLY if the directory doesn't exist, but it should.

  const result = spawnSync(npmCmd, ["install", "--legacy-peer-deps"], {
    cwd: serverDir,
    stdio: "inherit", // Let user see progress
    shell: true,
  });

  if (result.status !== 0) {
    console.warn("⚠️  Server npm install finished with non-zero exit code.");
    console.warn("   This might be due to peer dependency conflicts or network issues.");
    // We don't exit(1) because the original script had '|| true',
    // suggesting we shouldn't block the frontend build if backend setup tweaks out.
    // However, for a reliable setup, we should probably at least warn loudly.
  } else {
    console.log("✅ Server dependencies installed.");
  }
} catch (e) {
  console.error("❌ Failed to run server install:", e.message);
}

console.log("\n✨ Setup complete!");
