# Email Helper

Email template builder: блоки, превʼю, HTML Converter, конвертер зображень, валідація, відправка листів.

**Демо (лише інтерфейс):** https://misha-vynnyk.github.io/email-helper/
Повний функціонал (бекенд, automation/upload, робота з файлами на диску) — тільки локально або в десктоп-збірці.

Потрібно: Node.js 18+, npm. Ollama для AI-аналізу зображень (бажано, але не обовʼязково). Браузер Brave для automation/upload (локально). 

---

## Встановлення й запуск

```bash
git clone <repo>
cd email-helper
npm install     # ставить залежності root + server/ + automation/, налаштовує шляхи під твою ОС
npm run dev     # http://localhost:5173
```

Зупинити: `Ctrl+C`.

**AI-аналіз зображень** (ALT-тексти, розумні назви — потребує Ollama з моделлю яка підтримує vision):

```bash
npm run dev:ai
```

## Windows

`npm install` налаштовує все автоматично. Якщо Brave не знайдено — встанови з https://brave.com/download/ або вкажи шлях:

```batch
set BRAVE_EXECUTABLE_PATH=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe
```

Деталі: [AUTOMATION_SETUP_WINDOWS.md](AUTOMATION_SETUP_WINDOWS.md), [automation/README.md](automation/README.md).

## Storage Upload (default / alphaone / ttt)

Конфіг провайдерів: `src/htmlConverter/storageProviders.json` (використовує і фронт, і automation). Там же — окремі CDP-профілі Brave для кожного провайдера і UI-таймінги (`loginWaitMs`, `bootstrapWaitMs`, `closeTabAfterBatch`).

```bash
npm run automation:upload -- ./image.png [category] [--provider default|alphaone|ttt]
```

## Template Library

Шаблони підтягуються з папок на диску, які ти вказуєш сам:

1. Template Library → **Storage** → **Add location**
2. Задай назву і **абсолютний шлях** до папки з шаблонами
3. Mac: `/Users/логін/Documents/templates` · Windows: `/C:/Users/логін/Documents/templates`

Можна додати кілька папок — шаблони з усіх з'являться в списку.

## Інше

- **Відправка листів:** Gmail App Password (Google Account → Security → App Passwords), не основний пароль.
- **Збірка веб:** `npm run build` · **Деплой на GitHub Pages:** `npm run deploy`
- **Десктоп (Electron):** `npm run dist:mac` / `npm run dist:win`
- **Тести:** `npm test`

## Credits

- **HTML to Table Converter** — [@katerynakey](https://github.com/katerynakey)
- **Storage Automation** — [@stan1slav0](https://github.com/stan1slav0)

---

MIT · Mykhailo Vynnyk
