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

  // Packaging target may differ from the host OS (e.g. building the win32 target
  // from macOS via wine). Plain `npm install` resolves platform-specific optional
  // deps (like sharp's @img/sharp-<os>-<arch>) against the HOST OS, not the target —
  // silently bundling macOS native binaries into a Windows package. `--os`/`--cpu`
  // force npm to resolve for the actual packaging target.
  const targetPlatform = context.electronPlatformName; // 'darwin' | 'win32' | 'linux'
  const isCrossTarget = targetPlatform !== process.platform;
  const npmInstallCmd = isCrossTarget
    ? `npm install --omit=dev --no-workspaces --os=${targetPlatform} --cpu=x64`
    : "npm install --omit=dev --no-workspaces";

  console.log("\n📦 [beforePack] Installing server production dependencies...");
  console.log(`   cwd: ${serverDir}`);
  if (isCrossTarget) console.log(`   cross-target build: host=${process.platform} target=${targetPlatform}`);

  try {
    execSync(npmInstallCmd, {
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

  // After npm install, rebuild native modules for the correct Electron version.
  // Skipped for cross-target builds: @electron/rebuild shells out to node-gyp, which
  // can't compile Windows binaries from a macOS host anyway — and it's unnecessary
  // here, since sharp ships prebuilt N-API binaries (ABI-stable across Node/Electron
  // versions), so the --os/--cpu-targeted npm install above already fetched the
  // correct binary with no compilation step needed.
  const electronVersion = context.packager.config.electronVersion || require("electron/package.json").version;
  const nodeModulesDir = path.join(serverDir, "node_modules");

  if (isCrossTarget) {
    console.log("ℹ️  [beforePack] Cross-target build — skipping electron-rebuild (sharp's prebuilt N-API binary needs no rebuild).\n");
  } else if (fs.existsSync(path.join(nodeModulesDir, "sharp"))) {
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

  // gifsicle's postinstall downloads a binary matching the HOST OS at install time
  // (bin-wrapper reads process.platform directly — npm's --os/--cpu override only
  // affects optionalDependencies resolution, not this custom download script), so a
  // Windows cross-target build still gets a macOS gifsicle binary. Fetch the official
  // Windows build from the same source gifsicle's own installer would use, and place
  // it where gifsicle's runtime path resolution (also process.platform-based, but
  // correctly evaluated as 'win32' once the packaged app actually runs on Windows)
  // expects to find it.
  if (isCrossTarget && targetPlatform === "win32") {
    const gifsicleDir = path.join(nodeModulesDir, "gifsicle");
    if (fs.existsSync(gifsicleDir)) {
      const gifsicleVersion = require(path.join(gifsicleDir, "package.json")).version;
      const vendorDir = path.join(gifsicleDir, "vendor");
      const destPath = path.join(vendorDir, "gifsicle.exe");
      const url = `https://raw.githubusercontent.com/imagemin/gifsicle-bin/v${gifsicleVersion}/vendor/win/x64/gifsicle.exe`;
      console.log(`🔧 [beforePack] Fetching Windows gifsicle binary (v${gifsicleVersion})...`);
      try {
        fs.mkdirSync(vendorDir, { recursive: true });
        execSync(`curl -fsSL "${url}" -o "${destPath}"`, { stdio: "inherit" });
        fs.chmodSync(destPath, 0o755);
        console.log("✅ [beforePack] Windows gifsicle binary installed.\n");
      } catch (err) {
        console.warn(`⚠️  [beforePack] Failed to fetch Windows gifsicle binary: ${err.message}`);
        console.warn("    GIF optimization will not work in this Windows build.");
      }
    }
  }
};
