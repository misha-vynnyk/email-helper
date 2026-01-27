# 🤖 Storage Upload Automation

Playwright-автоматизація завантаження зображень на `storage.5th-elementagency.com`. Використовується в HTML Converter і доступна з командного рядка.

## Перед першим запуском

1. **Brave з віддаленим налагодженням.** Скрипт підключається до вже запущеного Brave на порту 9222. Без цього кроку Upload не спрацює.

   **Mac:**
   ```bash
   "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
     --remote-debugging-port=9222 \
     --user-data-dir=/tmp/brave-debug
   ```

   **Windows (cmd):**
   ```cmd
   "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" --remote-debugging-port=9222 --user-data-dir=%TEMP%\brave-debug
   ```

   **Linux:**
   ```bash
   brave-browser --remote-debugging-port=9222 --user-data-dir=/tmp/brave-debug
   ```

2. **Шляхи Brave** на Mac за замовчуванням вже в репо. На Windows/Linux — один раз вказати через змінні або в `automation/config.json`. Детально: [README.md](README.md) (розділ «Що треба змінити на Windows»).

3. **Залежності automation:**
   ```bash
   cd automation
   npm install
   ```

## Використання

### З командного рядка (рекомендовано)

З **кореня репо**:

```bash
npm run automation:upload -- ./image.png finance
npm run automation:upload -- ./image.png health
npm run automation:upload -- ./image.png finance --no-confirm
```

- `filePath` — шлях до файлу (відносно поточної директорії або абсолютний).
- `category` — `finance` або `health` (обовʼязково для `--no-confirm`).
- `--no-confirm` / `-y` — без форми підтвердження (тоді потрібна також назва папки: див. нижче).

У режимі `--no-confirm` можна передати назву папки четвертим аргументом:
```bash
npm run automation:upload -- ./image.png finance --no-confirm ABCD123
```

**Шляхи Brave без змін у config** (Linux/Windows):
```bash
export BRAVE_EXECUTABLE_PATH="/snap/bin/brave"
export BRAVE_USER_DATA_DIR="/tmp/brave-debug"
npm run automation:upload -- ./image.png finance
```

(На Windows — `set BRAVE_...=...` у cmd або `$env:BRAVE_...="..."` у PowerShell, див. README.)

#### З папки automation

```bash
cd automation
node run-upload.js /path/to/image.jpg finance
node run-upload.js /path/to/image.jpg health --no-confirm ABCD123
```

#### Bash-скрипти (опційно)

```bash
./save-in-finance.sh /path/to/image.jpg ABCD123
./save-in-health.sh /path/to/image.jpg HEALTH456
```

#### З додатку (HTML Converter)

Upload to Storage у HTML Converter використовує **тільки основний backend** (npm run dev). Фронт віддає файл на `/api/storage-upload/prepare`, потім викликає `/api/storage-upload` — backend запускає `automation/run-upload.js` з аргументами і повертає URL. Детально робота з зображеннями: [HTML_CONVERTER.md](HTML_CONVERTER.md).

## ⚙️ Конфігурація

Файл `automation/config.json`. Головне для крос-платформи:

- **`browser.executablePath`** — шлях до Brave (на Windows — `C:\...\brave.exe`).
- **`browser.userDataDir`** — папка профілю (напр. `%TEMP%\brave-debug` на Windows, `/tmp/brave-debug` на Mac/Linux).
- **`browser.debugPort`** — 9222 (має збігатися з портом, з яким запущено Brave).

Решту (timeouts, storage, notifications) можна не змінювати. Щоб не редагувати файл — використовуй змінні `BRAVE_EXECUTABLE_PATH` і `BRAVE_USER_DATA_DIR` (див. README).

## 📋 Як працює

1. Скрипт підключається до Brave через CDP (порт 9222).
2. Відкриває storage, форму завантаження або використовує category + folderName у режимі `--no-confirm`.
3. Завантажує файл, отримує URL, виводить шлях у stdout.

**Вимоги:** Brave встановлено і запущено з `--remote-debugging-port=9222`, доступ до storage, Node.js 18+. Запуск Brave — див. розділ «Перед першим запуском» вище.

## 🔧 API

**Backend (для HTML Converter):**

- `POST /api/storage-upload/prepare` — FormData з файлом → `{ tempPath, filename }`.
- `POST /api/storage-upload` — `{ filePath: tempPath, category, folderName, skipConfirmation: true }` → `{ filePath, url }`. Backend викликає `run-upload.js` з цими аргументами.

**Виклик скрипта з коду (Node):**

```javascript
const { execSync } = require("child_process");
const path = require("path");
const runUpload = path.join(__dirname, "automation", "run-upload.js");
execSync(`node "${runUpload}" "${filePath}" ${category} --no-confirm "${folderName}"`, {
  timeout: 300000,
  cwd: path.dirname(runUpload),
});
```

## 🐛 Troubleshooting

- **"Cannot connect to CDP"** — Brave не запущено з `--remote-debugging-port=9222`. Запусти його (див. «Перед першим запуском») і повторіть.
- **"Timeout"** — збільши значення в `config.json` у блоці `timeouts` (напр. `elementWait`, `pageLoad`) або перевір інтернет і доступність storage.
- **"Element not found"** — сторінка storage змінилася або не завантажилась; перевір у браузері вручну, що форма завантаження є.
- **На Windows не знаходить Brave** — вкажи `BRAVE_EXECUTABLE_PATH` і `BRAVE_USER_DATA_DIR` (див. README).

## 📁 Структура

```
automation/
├── run-upload.js                    # Точка входу (npm run automation:upload або node run-upload.js)
├── scripts/
│   ├── upload-playwright-brave.js   # Основний скрипт
│   └── upload-form.html             # Форма підтвердження (інтерактивний режим)
├── config.json                      # Конфігурація (шляхи Brave, timeouts, storage)
├── save-in-finance.sh / save-in-health.sh   # Опційні shortcuts
└── package.json
```

CDP (порт 9222) лише локально; не відкривати назовні. У development — достатньо.

---

## 🙏 Credits

**Automation scripts** - оригінальний код від [Stanislav](https://github.com/stan1slav0).

Playwright скрипти створені [@stan1slav0](https://github.com/stan1slav0). В цьому проекті:
- Інтеграція з Express backend
- API endpoints для виклику з frontend
- Error handling та timeout management
- Документація

---

**Більше деталей:** Див. [HTML_CONVERTER.md](./HTML_CONVERTER.md)
