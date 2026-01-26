# 📊 HTML to Table Converter

Конвертер HTML в table-based MJML та HTML для email розсилок з автоматичним завантаженням зображень на storage.

## 🎯 Основні можливості

### 1. **Конвертація HTML**
- Автоматична конвертація div-based HTML в table-based структуру
- Генерація MJML коду
- Збереження стилів та атрибутів
- Підтримка вкладеної структури

### 2. **Обробка зображень**
- Автоматична екстракція зображень з HTML
- Конвертація форматів (JPEG, WebP)
- Оптимізація розміру та якості
- Нумерація зображень (image-1, image-2, і т.д.)
- Batch завантаження та скачування

### 3. **Storage Upload**
- Автоматичне завантаження на `storage.5th-elementagency.com`
- Категорії: Finance / Health
- Авто-визначення назви папки з імені файлу
- Persistent історія завантажень
- Копіювання URL (повний та короткий шлях)
- Заміна посилань у вихідному коді

### 4. **Історія завантажень**
- Зберігає останні 50 сесій
- Показує: категорію, папку, файли, час
- Можливість копіювання кожного URL
- LocalStorage persistence

## 🚀 Швидкий старт

### Базове використання:

1. **Вставити HTML**
   ```
   Вставте HTML код в Input HTML поле
   Або використайте Ctrl+V для автоматичної вставки
   ```

2. **Налаштувати параметри**
   ```
   - Ім'я файлу (File Name) - для назви папки
   - Rows спейсінг
   - Border width
   - Вирівнювання контенту
   ```

3. **Експортувати**
   ```
   Export HTML → table-based HTML
   Export MJML → MJML код
   ```

### Робота з зображеннями:

1. **Екстракція**
   ```
   Натисніть "Extract Images" або вставте HTML
   → Зображення автоматично екстрагуються
   ```

2. **Обробка**
   ```
   Settings:
   - Format: JPEG / WebP
   - Quality: 1-100
   - Max Width: pixels
   - Auto Process: автоматична обробка
   - Preserve Format: зберегти оригінальний формат
   ```

3. **Завантаження**
   ```
   Upload to Storage →
   - Category: Finance / Health
   - Folder Name: ABCD123 (авто-заповнення)
   → Завантаження всіх зображень
   ```

4. **Заміна URLs**
   ```
   Після завантаження:
   "Замінити в Output (X)" →
   → URLs замінюються в HTML/MJML
   ```

## 📋 Детальна інструкція

### Storage Upload

#### Авто-визначення папки:
```javascript
// З імені файлу "promo-ABCD123"
extractFolderName("promo-ABCD123") // → "ABCD123"

// З "Finance-456"
extractFolderName("Finance-456") // → "Finance456"
```

#### Нумерація зображень:
```
Зображення нумеруються по порядку в HTML:
1-ше зображення → image-1.jpg
2-ге зображення → image-2.jpg
...
```

#### Процес завантаження:
```
1. Prepare → Blob файл завантажується на сервер
2. Storage → Файл завантажується на storage через Playwright
3. Result → URL зберігається в історії
```

#### Обробка помилок:
- ✅ Network timeout (30s prepare, 180s upload)
- ✅ Cancellation (AbortController)
- ✅ Індивідуальні помилки (продовжує з іншими файлами)
- ✅ Відсутність інтернету

### URL Replacement

#### Як працює:
```typescript
// URLs замінюються по позиції в коді:
<img src="old-url-1" /> → <img src="storage-url-1" />
<img src="old-url-2" /> → <img src="storage-url-2" />
```

#### Стани кнопки:
```
Disabled (сірий):
- Немає завантажених зображень
- Output код не експортовано

Active (синій):
- Є завантажені зображення
- Output код експортовано
- URLs не замінені

Success (зелений):
- URLs успішно замінені
```

#### Auto-reset:
```
Кнопка повертається в початковий стан:
- При повторній генерації HTML/MJML
- При очищенні форми
```

### History

#### Структура:
```typescript
UploadSession {
  id: string
  timestamp: number
  category: "finance" | "health"
  folderName: string
  files: [
    {
      filename: string
      url: string // повний URL
      shortPath: string // без префіксу
    }
  ]
}
```

#### Зберігання:
```
LocalStorage: "html-converter-upload-history"
Limit: 50 sessions (останні)
```

## ⚙️ Технічні деталі

### Архітектура

```
HtmlConverterPanel (main)
├── ImageProcessor
│   ├── Image extraction
│   ├── Format conversion
│   └── StorageUploadDialog
│       └── Upload flow
└── UploadHistory
    └── Session list
```

### Utilities

```
utils/
├── clipboard.ts        # Копіювання в буфер
├── errorHandler.ts     # Обробка помилок
├── formatters.ts       # formatSize, extractFolderName, etc.
└── constants.ts        # Всі константи
```

### Constants

```typescript
STORAGE_KEYS = {
  IMAGE_SETTINGS: "html-converter-image-settings"
  UPLOAD_HISTORY: "html-converter-upload-history"
}

UI_TIMINGS = {
  COPIED_FEEDBACK: 2000    // 2s
  SNACKBAR_DURATION: 4000  // 4s
}

UPLOAD_CONFIG = {
  MAX_HISTORY_SESSIONS: 50
  PREPARE_TIMEOUT: 30000   // 30s
  STORAGE_TIMEOUT: 180000  // 3min
}
```

### API Endpoints

```
POST /api/storage-upload/prepare
Body: FormData with file blob
Response: { tempPath, filename }

POST /api/storage-upload
Body: { tempPath, category, folderName }
Response: { filePath }
```

### Server-side

```javascript
// Playwright automation
- Відкриває браузер (Brave)
- Завантажує форму
- Заповнює поля
- Завантажує файл
- Чекає підтвердження
```

## 🔧 Налаштування

### Environment

```bash
# Не потрібно, всі шляхи hardcoded в automation скрипті
```

### Automation

```bash
# Встановити залежності
cd automation
npm install

# Тестовий запуск
node scripts/upload-playwright-brave.js /path/to/image.jpg finance ABCD123
```

### Storage URL

```typescript
const STORAGE_URL_PREFIX = "https://storage.5th-elementagency.com/";
```

## 🐛 Troubleshooting

### Проблема: Завантаження не працює

```
Перевірити:
1. Сервер запущено (npm run dev-backend)
2. Automation scripts встановлені (cd automation && npm install)
3. Brave браузер встановлено
4. Інтернет з'єднання
```

### Проблема: URLs не замінюються

```
Перевірити:
1. Output HTML/MJML експортовано
2. Кнопка "Замінити в Output" активна
3. Є завантажені зображення (lastUploadedUrls)
```

### Проблема: Історія не зберігається

```
Перевірити:
1. LocalStorage доступний
2. Квота не перевищена
3. Browser не в приватному режимі
```

## 📊 Метрики

### Performance

```
Image extraction: ~100ms для 10 зображень
Conversion: ~500ms для 10 зображень
Upload prepare: <30s timeout
Storage upload: <180s timeout
```

### Limits

```
Max file size: Немає обмеження (controlled by server)
Max images: Немає обмеження
History sessions: 50
```

## 🔄 Changelog

### v1.0.0 - Storage Upload Integration
- ✅ Automated storage upload via Playwright
- ✅ Persistent upload history
- ✅ URL replacement in output code
- ✅ Error handling and cancellation
- ✅ Code refactoring and optimization

## 📝 Best Practices

### File Naming
```
✅ GOOD: "promo-ABCD123" → папка "ABCD123"
✅ GOOD: "Finance-456" → папка "Finance456"
❌ BAD: "image123" → папка "" (empty)
```

### Category Selection
```
Finance: Фінансові проекти
Health: Медичні проекти
```

### Image Quality
```
JPEG Quality 85: Баланс якість/розмір
WebP Quality 85: Менший розмір, краща якість
Max Width 600px: Оптимально для email
```

### History Management
```
- Історія автоматично обмежена до 50 сесій
- Clear All при необхідності
- Backup не потрібен (LocalStorage)
```

## 🎯 Tips & Tricks

1. **Швидка вставка HTML**
   ```
   Ctrl+V в будь-якому місці → автоматично в Input HTML
   ```

2. **Копіювання всіх URLs**
   ```
   В діалозі після завантаження:
   "Copy All URLs" → всі повні URLs
   "Copy All Paths" → всі короткі шляхи
   ```

3. **Швидке очищення**
   ```
   Clear button → очищає все (HTML, output, images, logs)
   ```

4. **Авто-обробка**
   ```
   Settings → Auto Process = ON
   → Зображення обробляються автоматично після екстракції
   ```

## 🚀 Future Improvements

### Planned:
- [ ] Drag & drop для завантаження зображень
- [ ] Bulk operations (multiple HTML files)
- [ ] Custom storage URL configuration
- [ ] Export history to CSV/JSON
- [ ] Image preview before upload

### Under consideration:
- [ ] Cloud storage alternatives (AWS S3, Cloudinary)
- [ ] Advanced image editing (crop, resize, filters)
- [ ] Template presets для різних email clients
- [ ] A/B testing support

---

## 🙏 Credits

**HTML to Table Converter** - адаптація та інтеграція коду від [Kateryna](https://github.com/katerynakey).

Основний код конвертації створений [@katerynakey](https://github.com/katerynakey). В цьому проекті:
- Інтеграція в React application
- UI/UX адаптація під загальний дизайн
- Додаткові features (history, URL replacement, error handling)
- Рефакторинг та оптимізація

---

**Питання або проблеми?** Перевір [Troubleshooting](#-troubleshooting) або створи issue.
