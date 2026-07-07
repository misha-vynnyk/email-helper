const { spawn } = require('child_process');
const net = require('net');

const argId = process.argv.find(arg => /^\d+$/.test(arg));
const portId = parseInt(argId || process.env.PORT_ID || '0');
const offset = portId * 10;

const defaultVitePort = 5173 + offset;
const defaultBackendPort = 3001 + offset;

/**
 * Probes ports starting at `startPort`, skipping anything in `taken`, and
 * returns the first one that's actually free. Multiple users/instances on the
 * same machine (including the packaged Electron app, which does its own
 * 3001-3010 scan) can otherwise collide on the same default port and crash
 * instead of just shifting to the next one.
 */
function findFreePort(startPort, taken, maxTries = 20) {
  return new Promise((resolve, reject) => {
    let port = startPort;
    let attempts = 0;
    const tryPort = () => {
      if (taken.has(port)) {
        port++;
        tryPort();
        return;
      }
      const tester = net.createServer();
      tester.once('error', (err) => {
        if (err.code === 'EADDRINUSE' && attempts < maxTries) {
          attempts++;
          port++;
          tryPort();
        } else {
          reject(err);
        }
      });
      tester.once('listening', () => {
        tester.close(() => resolve(port));
      });
      tester.listen(port, '127.0.0.1');
    };
    tryPort();
  });
}

async function main() {
  const backendPort = await findFreePort(defaultBackendPort, new Set());
  const vitePort = await findFreePort(defaultVitePort, new Set([backendPort]));

  if (backendPort !== defaultBackendPort) {
    console.log(`⚠️  Backend port ${defaultBackendPort} in use (likely another user/instance) — using ${backendPort} instead`);
  }
  if (vitePort !== defaultVitePort) {
    console.log(`⚠️  Frontend port ${defaultVitePort} in use — using ${vitePort} instead`);
  }

  process.env.VITE_PORT = vitePort.toString();
  process.env.VITE_BACKEND_PORT = backendPort.toString();
  process.env.VITE_API_URL = '';
  process.env.PORT = backendPort.toString();
  process.env.PORT_ID = portId.toString();

  console.log(`\n🚀 Starting Instance ID: ${portId}`);
  console.log(`📡 Ports: Frontend:${vitePort}, Backend:${backendPort}\n`);

  const host = process.argv.includes('--host') ? '0.0.0.0' : 'localhost';
  const hostArg = host === '0.0.0.0' ? '--host 0.0.0.0' : '';

  if (host === '0.0.0.0') {
    process.env.ALLOW_ALL_CORS_DEV = '1';
  }

  const cmd = 'npx';
  const args = [
    'concurrently',
    '-n', 'VITE,SRV,INFO',
    '-c', 'blue,green,cyan',
    `\"vite --port ${vitePort} --strictPort ${hostArg}\"`,
    '\"npm run dev -w @flexibuilder/server\"',
    '\"node scripts/print-dashboard.js\"'
  ];

  const child = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env
  });

  child.on('exit', (code) => process.exit(code || 0));
}

main();
