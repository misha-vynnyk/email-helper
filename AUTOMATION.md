# 🤖 Storage Upload Automation

Playwright-based автоматизація для завантаження зображень на `storage.5th-elementagency.com`.

## 🚀 Швидкий старт

### Встановлення

```bash
cd automation
npm install
```

### Використання

#### З командного рядка:

```bash
# Finance category
node scripts/upload-playwright-brave.js /path/to/image.jpg finance ABCD123

# Health category
node scripts/upload-playwright-brave.js /path/to/image.jpg health HEALTH456
```

#### Bash shortcuts:

```bash
# Finance
./save-in-finance.sh /path/to/image.jpg ABCD123

# Health
./save-in-health.sh /path/to/image.jpg HEALTH456
```

#### З додатку:

```
HTML Converter → Extract Images → Upload to Storage
→ Автоматично викликає Playwright скрипт через сервер
```

## ⚙️ Конфігурація

### config.json

```json
{
  "browser": "brave",
  "headless": false,
  "timeout": 300000,
  "storageUrl": "https://storage.5th-elementagency.com",
  "cdpEndpoint": "http://127.0.0.1:9222",
  "categories": {
    "finance": "Finance",
    "health": "Health"
  }
}
```

### Параметри:

- **browser**: `brave` | `chrome` | `chromium`
- **headless**: `true` (без UI) | `false` (з UI для дебагу)
- **timeout**: максимальний час виконання (мс)
- **cdpEndpoint**: Chrome DevTools Protocol endpoint

## 📋 Як працює

### Процес:

```
1. Отримує файл, category, folderName
2. Запускає Brave через CDP
3. Відкриває форму завантаження
4. Заповнює Category та Folder Name
5. Завантажує файл
6. Чекає підтвердження
7. Витягує URL з результату
8. Повертає filePath
```

### Вимоги:

```
✅ Brave Browser встановлено
✅ Brave запущено з --remote-debugging-port=9222
✅ Доступ до storage.5th-elementagency.com
✅ Node.js >= 18
```

### Запуск Brave з CDP:

#### macOS:
```bash
"/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/brave-debug
```

#### Windows:
```cmd
"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" ^
  --remote-debugging-port=9222 ^
  --user-data-dir=%TEMP%\brave-debug
```

#### Linux:
```bash
brave-browser \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/brave-debug
```

## 🔧 API

### Server Route

```javascript
POST /api/storage-upload/prepare
Body: FormData { file: Blob }
Response: { success: true, tempPath, filename }

POST /api/storage-upload
Body: { tempPath, category, folderName }
Response: { success: true, filePath, url }
```

### Node.js

```javascript
const { exec } = require('child_process');

exec(
  `node scripts/upload-playwright-brave.js "${filePath}" "${category}" "${folderName}"`,
  { timeout: 300000 },
  (error, stdout, stderr) => {
    if (error) {
      // Handle error
    }
    // stdout contains filePath
  }
);
```

## 🐛 Troubleshooting

### Помилка: "Cannot connect to CDP endpoint"

```bash
# Рішення: Запустити Brave з CDP
"/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
  --remote-debugging-port=9222
```

### Помилка: "Timeout"

```bash
# Рішення: Збільшити timeout в config.json
{
  "timeout": 600000  // 10 minutes
}
```

### Помилка: "Element not found"

```bash
# Рішення: Перевірити що storage форма доступна
# Або запустити в non-headless mode для дебагу
{
  "headless": false
}
```

## 📁 Структура

```
automation/
├── scripts/
│   ├── upload-playwright-brave.js   # Основний скрипт
│   └── upload-form.html             # HTML форма (для тестів)
├── old/
│   └── upload-playwright-brave-old.js  # Стара версія
├── config.json                      # Конфігурація
├── save-in-finance.sh              # Shortcut для Finance
├── save-in-health.sh               # Shortcut для Health
└── package.json                     # Dependencies
```

## 🔒 Security

### Важливо:

```
⚠️ CDP endpoint (port 9222) відкритий локально
⚠️ Не експозити назовні
⚠️ Використовувати тільки в development
```

### Production:

```
Для production рекомендовано:
- Використовувати headless: true
- Обмежити доступ до CDP
- Додати authentication
- Використовувати HTTPS
```

## 📊 Performance

```
Typical upload time:
- Prepare: 1-5s
- Upload: 5-15s
- Total: 6-20s per image

Timeouts:
- Prepare: 30s
- Storage: 180s
- Server: 300s
```

## 🎯 Best Practices

1. **Batch uploads**: Краще завантажувати по одному
2. **Error handling**: Продовжувати при помилці одного файлу
3. **Naming**: Використовувати послідовну нумерацію (image-1, image-2)
4. **Monitoring**: Логувати всі операції

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
