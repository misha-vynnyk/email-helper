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

  console.log("\n📦 [beforePack] Installing server production dependencies...");
  console.log(`   cwd: ${serverDir}`);

  try {
    execSync("npm install --omit=dev", {
      cwd: serverDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    console.log("✅ [beforePack] Server dependencies installed.\n");
  } catch (err) {
    console.error("❌ [beforePack] Failed to install server deps:", err.message);
    throw err;
  }

  // After npm install, rebuild native modules for the correct Electron version
  const electronVersion = context.packager.config.electronVersion || require("electron/package.json").version;
  const nodeModulesDir = path.join(serverDir, "node_modules");

  if (fs.existsSync(path.join(nodeModulesDir, "sharp"))) {
    console.log(`🔧 [beforePack] Rebuilding sharp for Electron ${electronVersion}...`);
    try {
      execSync(
        `npx @electron/rebuild --version ${electronVersion} --module-dir ${nodeModulesDir} --which-module sharp`,
        { cwd: serverDir, stdio: "inherit", shell: process.platform === "win32" }
      );
      console.log("✅ [beforePack] sharp rebuilt.\n");
    } catch {
      console.warn("⚠️  [beforePack] sharp rebuild failed — app may not convert images in production.");
    }
  }
};
