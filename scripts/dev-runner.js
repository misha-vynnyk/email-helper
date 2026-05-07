const { spawn } = require('child_process');

// Шукаємо ID в аргументах (наприклад, npm run dev 1) або в змінній оточення
const argId = process.argv.find(arg => /^\d+$/.test(arg));
const portId = parseInt(argId || process.env.PORT_ID || '0');
const offset = portId * 10;

const vitePort = 5173 + offset;
const backendPort = 3001 + offset;
const aiPort = 8000 + offset;

// Set environment variables for all sub-processes
process.env.VITE_PORT = vitePort.toString();
process.env.VITE_BACKEND_PORT = backendPort.toString();
process.env.VITE_AI_BACKEND_URL = `http://127.0.0.1:${aiPort}`;
process.env.VITE_API_URL = '/api'; // Use proxy in dev
process.env.PORT = backendPort.toString();
process.env.AI_PORT = aiPort.toString();
process.env.PORT_ID = portId.toString();

console.log(`\n🚀 Starting Instance ID: ${portId}`);
console.log(`📡 Ports: Frontend:${vitePort}, Backend:${backendPort}, AI:${aiPort}\n`);

const host = process.argv.includes('--host') ? '0.0.0.0' : 'localhost';
const hostArg = host === '0.0.0.0' ? '--host 0.0.0.0' : '';

if (host === '0.0.0.0') {
    process.env.ALLOW_ALL_CORS_DEV = '1';
}

const cmd = 'npx';
const args = [
  'concurrently',
  '-n', 'VITE,SRV,AI,INFO',
  '-c', 'blue,green,magenta,cyan',
  `\"vite --port ${vitePort} ${hostArg}\"`,
  '\"cd server && npm run dev\"',
  '\"npm run dev:ai\"',
  '\"node scripts/print-dashboard.js\"'
];

const child = spawn(cmd, args, { 
    stdio: 'inherit', 
    shell: true, 
    env: process.env 
});

child.on('exit', (code) => process.exit(code || 0));
