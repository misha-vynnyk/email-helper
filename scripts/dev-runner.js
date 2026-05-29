const { spawn } = require('child_process');

const argId = process.argv.find(arg => /^\d+$/.test(arg));
const portId = parseInt(argId || process.env.PORT_ID || '0');
const offset = portId * 10;

const vitePort = 5173 + offset;
const backendPort = 3001 + offset;

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
  `\"vite --port ${vitePort} ${hostArg}\"`,
  '\"npm run dev -w @flexibuilder/server\"',
  '\"node scripts/print-dashboard.js\"'
];

const child = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env
});

child.on('exit', (code) => process.exit(code || 0));
