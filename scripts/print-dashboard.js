
const os = require('os');
const http = require('http');

// Interface names that are never the real LAN address other devices on the
// network could reach — VPN tunnels, AirDrop, Docker/VM bridges, etc. Node's
// os.networkInterfaces() has no guaranteed order, so without this filter a
// VPN tunnel or virtual bridge can silently win over the actual Wi-Fi adapter.
const isVirtualInterface = (name) => /^(utun|awdl|llw|bridge|docker|vboxnet|vmnet|tun|tap|ppp|ipsec)/i.test(name);

function getIP() {
    if (process.env.DASHBOARD_IP) return process.env.DASHBOARD_IP;

    const interfaces = os.networkInterfaces();
    const candidates = [];
    for (const [devName, addrs] of Object.entries(interfaces)) {
        if (isVirtualInterface(devName)) continue;
        for (const alias of addrs || []) {
            if (alias.family === 'IPv4' && !alias.internal) {
                candidates.push({ devName, address: alias.address });
            }
        }
    }
    // en0 is the conventional macOS Wi-Fi adapter name — prefer it when present.
    const preferred = candidates.find((c) => c.devName === 'en0') || candidates[0];
    if (preferred) return preferred.address;

    // Nothing passed the virtual-interface filter (unusual) — fall back to the
    // old "first non-internal IPv4, whatever it is" behavior rather than giving up.
    for (const addrs of Object.values(interfaces)) {
        for (const alias of addrs || []) {
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '192.168.0.241';
}

const ip = getIP();
const vitePort = process.env.VITE_PORT || 5173;
const backendPort = process.env.PORT || 3001; // backend uses PORT env var
const url = `http://${ip}:${vitePort}/email-helper/`;

function checkPort(port) {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}`, (res) => {
            resolve(true);
            res.destroy();
        });
        req.on('error', () => resolve(false));
        req.setTimeout(500, () => {
            req.destroy();
            resolve(false);
        });
    });
}

async function startDashboard() {
    // Встановлюємо назву вікна термінала відразу
    process.stdout.write(`\x1b]2;Email Helper: ${url}\x07`);

    let attempts = 0;
    while (attempts < 30) {
        if (await checkPort(vitePort) && await checkPort(backendPort)) break;
        attempts++;
        await new Promise(r => setTimeout(r, 2000));
    }

    // Очищуємо консоль перед фінальним виводом
    process.stdout.write('\x1Bc'); 

    console.log('\n' + '╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(15) + '🚀 EMAIL HELPER - READY' + ' '.repeat(20) + '║');
    console.log('╠' + '═'.repeat(58) + '╣');
    console.log(`║  Frontend: \x1b[36m${url}\x1b[0m` + ' '.repeat(Math.max(0, 58 - url.length - 12)) + '║');
    console.log(`║  Backend:  \x1b[36mhttp://${ip}:${backendPort}/api\x1b[0m` + ' '.repeat(Math.max(0, 58 - `http://${ip}:${backendPort}/api`.length - 12)) + '║');
    console.log('╚' + '═'.repeat(58) + '╝');
    console.log(`\x1b[32m✔ Проект готовий до роботи. Адреса також закріплена в назві вкладки.\x1b[0m\n`);
}

startDashboard();
