#!/usr/bin/env node
/**
 * Builds mac + win Electron packages and publishes them to a GitHub Release
 * tagged after the current package.json version.
 *
 * - If a release for that version already exists, its assets are replaced
 *   in place (rebuild-with-fixes flow — no version bump needed).
 * - If it doesn't exist yet, a new release is created (bump the version
 *   first with `npm version patch|minor|major`, then run this).
 */
"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const version = pkg.version;
const tag = `v${version}`;
const releaseDir = path.join(rootDir, "release");

function run(cmd) {
  execSync(cmd, { stdio: "inherit", cwd: rootDir });
}

console.log(`\n📦 Building FlexiBuilder Pro ${tag} (mac + win)...\n`);
run("npm run dist:mac");
run("npm run dist:win");

const assets = {
  macArm: `FlexiBuilder Pro-${version}-arm64-mac.zip`,
  macIntel: `FlexiBuilder Pro-${version}-mac.zip`,
  winSetup: `FlexiBuilder Pro Setup ${version}.exe`,
  winPortable: `FlexiBuilder Pro ${version}.exe`,
};

const assetPaths = Object.values(assets).map((f) => path.join(releaseDir, f));
for (const f of assetPaths) {
  if (!fs.existsSync(f)) {
    console.error(`❌ Очікуваний файл білду відсутній: ${f}`);
    console.error("   dist:mac / dist:win мали його створити — перевір лог білду вище.");
    process.exit(1);
  }
}

let releaseExists = true;
try {
  execSync(`gh release view ${tag}`, { stdio: "ignore", cwd: rootDir });
} catch {
  releaseExists = false;
}

const quotedAssets = assetPaths.map((f) => `"${f}"`).join(" ");

if (releaseExists) {
  console.log(`\n🔄 Реліз ${tag} вже існує — замінюю файли...\n`);
  run(`gh release upload ${tag} ${quotedAssets} --clobber`);
} else {
  console.log(`\n🚀 Реліз ${tag} не знайдено — створюю новий...\n`);
  const notes = `## FlexiBuilder Pro ${tag}

### Завантаження
| Платформа | Файл |
|---|---|
| macOS (Apple Silicon) | \`${assets.macArm}\` |
| macOS (Intel) | \`${assets.macIntel}\` |
| Windows (інсталятор) | \`${assets.winSetup}\` |
| Windows (portable, без інсталяції) | \`${assets.winPortable}\` |

### ⚠️ Білди не підписані
Ні macOS, ні Windows білди не мають сертифіката підпису — ОС попередить про невідомого розробника.

- **macOS**: якщо Gatekeeper блокує запуск — правий клік на \`.app\` → «Відкрити» → підтвердити. Або: System Settings → Privacy & Security → «Open Anyway».
- **Windows**: SmartScreen покаже «Unrecognized app» — натиснути «More info» → «Run anyway».

Це очікувано для внутрішньої збірки без Apple Developer / Windows code-signing сертифікатів.
`;
  const notesPath = path.join(os.tmpdir(), `release-notes-${tag}.md`);
  fs.writeFileSync(notesPath, notes, "utf8");
  try {
    run(`gh release create ${tag} ${quotedAssets} --title "FlexiBuilder Pro ${tag}" --notes-file "${notesPath}"`);
  } finally {
    fs.unlinkSync(notesPath);
  }
}

console.log(`\n✅ Готово: https://github.com/misha-vynnyk/email-helper/releases/tag/${tag}\n`);
