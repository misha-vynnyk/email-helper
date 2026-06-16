/**
 * electron-builder afterPack hook.
 *
 * Problem: electron-builder with identity=null skips signing, which leaves the
 * Electron Framework with its own Team ID while the main binary has none —
 * macOS 15+ rejects the library load with "different Team IDs".
 *
 * Fix: sign everything ad-hoc after packing.
 *
 * Why entitlements matter:
 *   Electron (V8) requires com.apple.security.cs.allow-jit to run JIT-compiled
 *   JavaScript. Without this entitlement in the code signature, Electron silently
 *   exits on Apple Silicon (arm64) because it cannot map executable memory.
 *   We apply the project entitlements to the outer .app so the main binary
 *   carries them; inner Frameworks are re-signed without (they don't need JIT).
 */
"use strict";

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

exports.default = async function (context) {
  if (context.electronPlatformName !== "darwin") return;

  const appOutDir = context.appOutDir;
  const productName = context.packager.appInfo.productName;
  const appPath = path.join(appOutDir, `${productName}.app`);

  // Resolve entitlements relative to the project root (two levels up from scripts/)
  const projectRoot = path.resolve(__dirname, "..");
  const entitlementsPath = path.join(projectRoot, "build", "entitlements.mac.plist");

  console.log(`\n🔏 [afterPack] Ad-hoc signing: ${appPath}`);
  try {
    // Step 1: sign all nested components (Frameworks, Helpers) without entitlements
    execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: "inherit", shell: false });

    // Step 2: re-sign the outer .app WITH entitlements so the main binary gets
    //         com.apple.security.cs.allow-jit (required for V8 JIT on Apple Silicon)
    if (fs.existsSync(entitlementsPath)) {
      execSync(
        `codesign --force --sign - --entitlements "${entitlementsPath}" "${appPath}"`,
        { stdio: "inherit", shell: false }
      );
      console.log("✅ [afterPack] Ad-hoc signing with entitlements complete.\n");
    } else {
      console.log("✅ [afterPack] Ad-hoc signing complete (no entitlements file found).\n");
    }
  } catch (err) {
    console.warn(`⚠️  [afterPack] codesign failed: ${err.message}`);
  }
};
