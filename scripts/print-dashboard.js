
const os = require('os');
const http = require('http');

function getIP() {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '192.168.0.241';
}

const ip = getIP();
const url = `http://${ip}:5173/email-helper/`;

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
        if (await checkPort(5173) && await checkPort(3001)) break;
        attempts++;
        await new Promise(r => setTimeout(r, 2000));
    }

    // Очищуємо консоль перед фінальним виводом
    process.stdout.write('\x1Bc'); 

    console.log('\n' + '╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(15) + '🚀 EMAIL HELPER - READY' + ' '.repeat(20) + '║');
    console.log('╠' + '═'.repeat(58) + '╣');
    console.log(`║  Frontend: \x1b[36m${url}\x1b[0m` + ' '.repeat(58 - url.length - 12) + '║');
    console.log(`║  Backend:  \x1b[36mhttp://${ip}:3001/api\x1b[0m` + ' '.repeat(20) + '║');
    console.log('╚' + '═'.repeat(58) + '╝');
    console.log(`\x1b[32m✔ Проект готовий до роботи. Адреса також закріплена в назві вкладки.\x1b[0m\n`);
}

startDashboard();
