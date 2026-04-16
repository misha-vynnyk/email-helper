# 📊 HTML to Table Converter

Конвертер HTML у table-based MJML/HTML для email з екстракцією зображень і завантаженням на storage.

**Щоб працював Upload to Storage:** потрібен backend (`npm run dev`), Brave з `--remote-debugging-port=9222` і, на Windows, шляхи Brave (див. [README](README.md) і [AUTOMATION.md](AUTOMATION.md)).

---

## Що вміє

- **Конвертація:** div-based HTML → table-based HTML / MJML, збереження стилів.
- **Зображення:** екстракція з HTML, конвертація (JPEG/WebP), нумерація (image-1, image-2 тощо).
- **Storage Upload:** завантаження на різні storage-провайдери:
  - **default** → `storage.5th-elementagency.com` (категорії `finance|health`)
  - **alphaone** → `alphaonest.com` (без категорій)
    Налаштування в `src/htmlConverter/storageProviders.json`.
- **Історія:** останні 50 сесій у LocalStorage, копіювання URL, заміна посилань у вихідному коді.

---

## Як користуватись

1. **Вставити HTML** — у поле Input HTML або Ctrl+V.
2. **Опції** — File Name (для назви папки), rows/border/alignment.
3. **Експорт** — Export HTML або Export MJML.

**Зображення:**

1. **Extract Images** (або вставити HTML) → зображення зʼявляться в списку.
2. **Налаштування** — Format (JPEG/WebP), Quality, Max Width, Auto Process, Preserve Format.
3. **Storage provider** — у верхніх чекбоксах є **AlfaOne**:
   - вимкнено → `default`
   - увімкнено → `alphaone`
4. **Upload to Storage** — в `default` обрати Category (Finance/Health), у `alphaone` категорія схована; Folder Name (авто з імені файлу), запустити завантаження.
5. **Замінити в Output** — після завантаження підставити отримані URLs у згенерований HTML/MJML.

## Деталі

### Storage Upload

- **Папка з імені файлу:** `promo-ABCD123` → ABCD123, `Finance-456` → Finance456.
- **Нумерація:** image-1, image-2 … по порядку зʼявлення в HTML.
- **Процес:** Prepare (файл на backend) → backend викликає automation/run-upload.js → Playwright завантажує на storage → URL в історії. Детально: [AUTOMATION.md](AUTOMATION.md).
- **Помилки:** timeout (30s prepare, 180s upload), скасування, продовження з іншими файлами при помилці одного.
- **Batch UX:** вкладка Brave **не має** закриватися після кожного файлу. За замовчуванням вона закривається **один раз після успішного batch** (`closeTabAfterBatch: true` + `/api/storage-upload/finalize`).

### Заміна URL у Output

URLs підставляються по позиції: перше зображення → перший `src`, друге → другий тощо. Кнопка «Замінити в Output» активна, коли є завантажені зображення і експортований Output; після заміни показує success. При новій генерації HTML/MJML або очищенні — скидається.

Додатковий захист: “Замінити” не застосує **старі** URLs (з попереднього документа або попереднього upload). Після нового Extract/Upload мапа URL-ів прив’язана до поточної сесії.

### Історія

LocalStorage, ключ `html-converter-upload-history`, до 50 останніх сесій. Кожна сесія: category, folderName, список файлів з url і shortPath, timestamp.

## Налаштування й API

**Щоб Upload працював:** backend (`npm run dev`), Brave з CDP (порт 9222), на Windows — шляхи Brave (README, AUTOMATION.md). Залежності automation встановлюються разом із проєктом (`cd automation && npm install`). Тест з CLI: `npm run automation:upload -- ./image.png finance` — див. [AUTOMATION.md](AUTOMATION.md).

**AI Backend (Опис зображень):** Python сервер працює паралельно з Node.js для генерування SEO-назв (`image-1`) та ALT текстів. Потребує запуску `npm run dev:ai`. За замовчуванням інтегровано локальну мультимодальну модель **Gemma 3 4B** через Ollama. Деталі: `server/ai/README.md`.

**API (backend):**

- `POST /api/storage-upload/prepare` — FormData з файлом → `{ tempPath, filename }`.
- `POST /api/storage-upload` — `{ filePath: tempPath, provider?, category?, folderName, skipConfirmation: true }` → `{ filePath, publicUrl? }`.
- `POST /api/storage-upload/finalize` — `{ provider? }` (закриває вкладку Brave після успішного batch).

**API (image converter / cross-origin):**

- `POST /api/image-converter/convert-from-url` — `{ url, format, quality, preset, resizeMode, preserveAspectRatio, compressionMode }` → image blob + header `X-Original-Size`.

**Константи (frontend):** `PREPARE_TIMEOUT` 30s, `STORAGE_TIMEOUT` 180s, `MAX_HISTORY_SESSIONS` 50. Базові URL-и storage беруться з `src/htmlConverter/storageProviders.json`.

## 🐛 Troubleshooting

- **Завантаження не працює** — перевір: запущений `npm run dev` (backend), Brave з `--remote-debugging-port=9222` (див. AUTOMATION.md), на Windows — шляхи Brave (README). Інтернет і доступ до storage.
- **502 на `convert-from-url`** — backend не зміг скачати картинку з URL (часто hotlink/403/UA/Referer). Дивись error текст у відповіді та server log `convert-from-url: fetch failed (...) <url>`.
- **URLs не замінюються** — Output має бути експортований, є завантажені зображення, кнопка «Замінити в Output» активна.
- **Історія не зберігається** — LocalStorage доступний, не приватний режим, квота не перевищена.

## Поради

- **Імена файлів:** `promo-ABCD123` → папка ABCD123, `Finance-456` → Finance456. Уникай назв без літер+цифр.
- **Якість:** JPEG/WebP 85 — баланс якість/розмір; Max Width 600px підходить для email.
- **Швидше:** Ctrl+V → вставка в Input HTML; після Upload — Copy All URLs / Copy All Paths; Clear — очищення всього. Auto Process — обробка після екстракції.

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
