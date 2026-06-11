/**
 * electron-builder beforePack hook.
 * Installs server production dependencies so they are included in the package.
 * Runs once per build (before files are bundled into the asar).
 */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

exports.default = async function (context) {
  const serverDir = path.resolve(__dirname, "../server");
  const automationDir = path.resolve(__dirname, "../automation");

  console.log("\n📦 [beforePack] Installing server production dependencies...");
  console.log(`   cwd: ${serverDir}`);

  try {
    // --no-workspaces prevents npm from touching root node_modules (which would
    // evict devDependencies like app-builder-lib needed by electron-builder later).
    execSync("npm install --omit=dev --no-workspaces", {
      cwd: serverDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    console.log("✅ [beforePack] Server dependencies installed.\n");
  } catch (err) {
    console.error("❌ [beforePack] Failed to install server deps:", err.message);
    throw err;
  }

  console.log("📦 [beforePack] Installing automation dependencies (playwright-core)...");
  try {
    execSync("npm install --omit=dev --no-workspaces", {
      cwd: automationDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    console.log("✅ [beforePack] Automation dependencies installed.\n");
  } catch (err) {
    console.warn("⚠️  [beforePack] Failed to install automation deps:", err.message);
    // Non-fatal: upload will show a clear error at runtime if playwright-core is missing
  }

  // After npm install, rebuild native modules for the correct Electron version
  const electronVersion = context.packager.config.electronVersion || require("electron/package.json").version;
  const nodeModulesDir = path.join(serverDir, "node_modules");

  if (fs.existsSync(path.join(nodeModulesDir, "sharp"))) {
    console.log(`🔧 [beforePack] Rebuilding sharp for Electron ${electronVersion}...`);
    try {
      // --module-dir must point to the package root (where package.json lives),
      // not to node_modules itself — @electron/rebuild reads package.json from there.
      execSync(
        `npx @electron/rebuild --version ${electronVersion} --module-dir ${serverDir} --which-module sharp`,
        { cwd: serverDir, stdio: "inherit", shell: process.platform === "win32" }
      );
      console.log("✅ [beforePack] sharp rebuilt.\n");
    } catch {
      console.warn("⚠️  [beforePack] sharp rebuild failed — app may not convert images in production.");
    }
  }
};
