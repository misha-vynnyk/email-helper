#!/usr/bin/env node
const fs = require("fs");
const cp = require("child_process");
#!/usr/bin/env node
const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const os = require('os');
let semver;
try {
  semver = require('semver');
} catch (e) {
  console.warn('semver not available; skipping automatic node check.');
  process.exit(0);
}

const pkgPath = path.resolve(__dirname, '..', 'package.json');
let pkg;
try { pkg = require(pkgPath); } catch (e) { process.exit(0); }

const range = pkg.engines && pkg.engines.node;
if (!range) process.exit(0);

const current = process.version.replace(/^v/, '');
if (semver.satisfies(current, range)) {
  console.log(`Node ${process.version} satisfies engines.node (${range}).`);
  process.exit(0);
}

console.warn(`Detected Node ${process.version} which does not satisfy engines.node (${range}). Attempting automatic fix if possible...`);

const min = semver.minVersion(range);
const target = min ? min.version : range;

function tryVolta() {
  try {
    cp.execSync('volta --version', { stdio: 'ignore' });
    console.log('volta detected — installing requested Node version...');
    cp.execSync(`volta install node@${target}`, { stdio: 'inherit' });
    return true;
  } catch (e) { return false; }
}

function tryNvmPosix() {
  try {
    const nvmDir = process.env.NVM_DIR || path.join(os.homedir(), '.nvm');
    const nvmScript = path.join(nvmDir, 'nvm.sh');
    if (fs.existsSync(nvmScript)) {
      console.log('POSIX nvm detected — installing requested Node version...');
      cp.execSync(`bash -lc "source ${nvmScript} && nvm install ${target} && nvm use ${target}"`, { stdio: 'inherit' });
      return true;
    }
  } catch (e) {}
  return false;
}

function tryNvmWindows() {
  if (process.platform !== 'win32') return false;
  try {
    // nvm for windows exposes 'nvm' in PATH
    cp.execSync('nvm version', { stdio: 'ignore' });
    console.log('nvm-windows detected — installing requested Node version...');
    cp.execSync(`nvm install ${target}`, { stdio: 'inherit' });
    cp.execSync(`nvm use ${target}`, { stdio: 'inherit' });
    return true;
  } catch (e) { return false; }
}

function printManualInstructions() {
  console.warn('Automatic switch not available. To fix, install one of these tools and run the command shown:');
  if (process.platform === 'win32') {
    console.log('\n- Using nvm-windows (recommended on Windows):');
    console.log('  Download and install from: https://github.com/coreybutler/nvm-windows/releases');
    console.log(`  nvm install ${target}`);
    console.log(`  nvm use ${target}`);
    console.log('\n- Or install Volta (cross-platform):');
    console.log('  https://volta.sh');
    console.log(`  volta install node@${target}`);
  } else {
    console.log('\n- Using nvm (recommended):');
    console.log('  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.6/install.sh | bash');
    console.log(`  export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm install ${target} && nvm use ${target}`);
    console.log('\n- Or install Volta (cross-platform):');
    console.log('  curl https://get.volta.sh | bash');
    console.log(`  volta install node@${target}`);
  }
  console.log('\nAfter switching Node, re-run:');
  console.log('  rm -rf node_modules package-lock.json');
  console.log('  npm install');
}

try {
  if (tryVolta()) {
    console.log('Node switched via Volta. Restart your shell to pick up the new Node.');
    process.exit(0);
  }
  if (tryNvmPosix()) {
    console.log('Node switched via nvm (POSIX). Restart your shell to pick up the new Node.');
    process.exit(0);
  }
  if (tryNvmWindows()) {
    console.log('Node switched via nvm-windows. Restart your shell to pick up the new Node.');
    process.exit(0);
  }
  printManualInstructions();
} catch (e) {
  console.warn('Failed to auto-switch Node version:', e && e.message);
  printManualInstructions();
}

process.exit(0);
}

process.exit(0);
