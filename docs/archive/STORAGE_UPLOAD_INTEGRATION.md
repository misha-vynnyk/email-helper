# Storage Upload Integration

Інтеграція автоматичного завантаження зображень з HTML на storage в HTML Converter.

## 🎯 Особливості

- **Батчове завантаження**: Завантажити всі оброблені зображення одним кліком
- **Автозаміна URLs**: Після завантаження автоматично заміняє base64 на storage URLs в HTML
- **Інтерактивний діалог**: Вибір категорії (Finance/Health) та назви папки
- **Автозаповнення**: Назва папки автоматично заповнюється з буфера обміну
- **Превью шляху**: Показує куди буде завантажено файл перед завантаженням
- **URL в буфер**: Автоматично копіює URLs всіх завантажених файлів
- **Валідація**: Перевірка формату назви папки (літери + цифри)
- **Error handling**: Детальні повідомлення про помилки

## 📦 Архітектура

### Frontend Components

1. **StorageUploadDialog.tsx** (htmlConverter/)
   - Діалог для вибору категорії та введення назви папки
   - Автозаповнення з clipboard API
   - Preview шляху завантаження
   - Progress indicator під час завантаження

2. **ImageProcessor.tsx** (htmlConverter/)
   - Додано кнопку "Upload to Storage"
   - Показується тільки якщо є оброблені зображення
   - Відкриває StorageUploadDialog
   - Функція `handleUploadToStorage(category, folderName)`
   - Автоматично заміняє images в HTML editor з storage URLs

### Backend Routes

1. **POST /api/storage-upload/prepare**
   - Приймає file через multer
   - Зберігає у temp папку з правильним розширенням
   - Повертає temp path для наступного кроку

2. **POST /api/storage-upload**
   - Викликає automation script `upload-playwright-brave.js`
   - Копіює назву папки в clipboard (для скрипта)
   - Виконує команду з timeout 120s
   - Очищає temp файли після завантаження
   - Повертає filePath та output

## 🚀 Використання

### Workflow

1. **Вставити HTML** з зображеннями в HTML Converter
2. **Витягти зображення** (автоматично або через кнопку "Витягти зображення з HTML")
3. **Обробити зображення** (автоматично якщо увімкнено "Автообробка")
4. **Натиснути "Upload to Storage"** у секції Image Processor
5. **У діалозі:**
   - Вибрати категорію: Finance або Health
   - Ввести назву папки (формат: ABCD123)
   - Переглянути preview шляху
   - Натиснути "Upload"
6. **Результат:**
   - Всі base64 зображення в HTML замінені на storage URLs
   - URLs всіх файлів скопійовані в буфер
   - Success notification
   - Діалог закривається автоматично

### Приклад

```
Input:
- Category: finance
- Folder: ABCD123
- Files: image1.jpg, image2.webp

Output path:
Promo/finance/abcd/lift-123/

URLs copied to clipboard:
files/Promo/finance/abcd/lift-123/image1.jpg
files/Promo/finance/abcd/lift-123/image2.webp
```

## 🔧 Технічні деталі

### API Flow

```
1. Frontend: Оброблені зображення з HTML (Blob)
   ↓
2. POST /api/storage-upload/prepare
   - Multipart form data
   - Зберігає файл у /tmp/email-helper-uploads/
   ↓
3. POST /api/storage-upload
   - JSON: { filePath, category, folderName }
   - Копіює folderName в clipboard
   - Викликає: node automation/scripts/upload-playwright-brave.js
   ↓
4. Automation Script
   - Відкриває Brave browser
   - Логін в storage.epcnetwork.dev
   - Завантажує файл
   - Копіює URL в clipboard
   ↓
5. Frontend
   - Отримує URLs
   - Заміняє src в <img> тегах HTML editor
   - Копіює всі URLs в clipboard
   - Показує success message
```

### Dependencies

**Backend:**
- `multer` - для завантаження файлів
- `express` - HTTP server
- Existing automation script

**Frontend:**
- MUI components (Dialog, TextField, Radio, etc.)
- Clipboard API для автозаповнення
- ImageConverterContext

## 🛠️ Конфігурація

Використовує існуючий `automation/config.json`:

```json
{
  "browser": {
    "autoCloseTab": true,
    "closeDelaySuccess": 0
  },
  "storage": {
    "baseUrl": "https://storage.epcnetwork.dev",
    "publicUrl": "https://storage.5th-elementagency.com",
    "basePath": "Promo"
  },
  "timeouts": {
    "browserStart": 1500,
    "pageLoad": 10000,
    "elementWait": 5000
  }
}
```

## ⚠️ Обмеження

- **macOS only**: Використовує `pbcopy` для clipboard операцій
- **Brave Browser**: Потрібен встановлений Brave з налаштованим CDP
- **Авторизація**: Потрібен активний логін на storage.epcnetwork.dev
- **Мережа**: Локальний development server (localhost:3001)
- **File size**: Max 50MB per file (multer limit)

## 🐛 Troubleshooting

### "Automation script not found"
Перевірте шлях: `automation/scripts/upload-playwright-brave.js`

### "Upload preparation failed"
- Перевірте що server запущений
- Перевірте multer dependencies
- Перевірте доступ до /tmp папки

### "Storage upload failed"
- Перевірте Brave browser запущений
- Перевірте авторизацію на storage
- Перевірте automation/config.json
- Дивіться логи сервера для деталей

### "Invalid folder name format"
Формат має бути: літери + цифри (e.g., ABCD123, Finance456)

## 📝 TODO для покращення

- [ ] Progress bar для кожного файлу окремо
- [ ] Batch upload з чергою (не блокуючий UI)
- [ ] Retry механізм для failed uploads
- [ ] History завантажених файлів
- [ ] Підтримка custom categories
- [ ] Desktop notification після завантаження
- [ ] Drag & drop direct upload (без конвертації)

## 🧪 Тестування

1. **Unit test**: Валідація назви папки
2. **Integration test**: API endpoints
3. **E2E test**: Full workflow від конвертації до upload

### Manual Testing

```bash
# 1. Start server
cd server && npm run dev

# 2. Start client
npm run dev

# 3. Test workflow:
# - Upload images
# - Convert them
# - Click "Upload to Storage"
# - Enter folder name
# - Verify URLs in clipboard
```

## 📚 Related Files

- `src/htmlConverter/StorageUploadDialog.tsx` - UI dialog
- `src/htmlConverter/ImageProcessor.tsx` - Upload button and logic
- `server/routes/storageUpload.js` - API endpoints
- `automation/scripts/upload-playwright-brave.js` - Automation script
- `automation/config.json` - Configuration

## License

ISC - Same as parent project
