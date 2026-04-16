# Email Helper

Email template builder: блоки, превʼю, HTML Converter, конвертер зображень, валідація, відправка листів.

**Демо:** https://misha-vynnyk.github.io/email-helper/ (лише інтерфейс; повний функціонал — локально).

> ⚠️ GitHub Pages показує лише інтерфейс. Повний функціонал (бекенд, automation/upload, робота з папками на диску) — локально.

Потрібно: Node.js 18+, npm.

---

## 👵 Як запустити після клонування (простими словами)

### Що зробити один раз після клонування

1. Відкрий термінал (на Mac — «Термінал», на Windows — «Командний рядок» або PowerShell).
2. Перейди в папку проєкту: `cd email-helper` (або як у тебе називається папка).
3. Встанови залежності:

   ```bash
   npm install
   ```

   **Це автоматично встановить все:**
   - Залежності основного проекту
   - Залежності серверу (`server/`)
   - Залежності automation модуля (`automation/`)
   - Валідує та налаштує всі шляхи для твоєї системи (Windows, Mac, Linux)

4. Готово! Це треба зробити лише один раз після клонування.

### Як запускати щодня

У терміналі в папці проєкту напиши:

```bash
npm run dev
```

Відкрий у браузері: **http://localhost:5173** — це твій додаток.

Зупинити: у тому ж терміналі натисни `Ctrl+C`.

**AI Аналіз зображень (Gemma 3 & PaddleOCR)**
Якщо потрібна генерація ALT текстів та розумних назв для картинок:
В іншому (новому) вікні терміналу виконай:
```bash
npm run dev:ai
```
*Для Gemma 3 4B також має бути ввімкнений та встановлений Ollama.*

---

### ⚙️ Автоматичне налаштування залежностей

При `npm install` **автоматично**:

- ✅ Встановлює залежності серверу й automation модуля
- ✅ Валідує шляхи до Brave браузера
- ✅ Налаштовує шляхи для твоєї ОС (Windows, macOS, Linux)
- ✅ Показує помилку й способи виправлення, якщо щось не те

Більше деталей: [automation/README.md](automation/README.md)

---

### Що робити на **Windows**

Все налаштовується автоматично при `npm install`!

Якщо Brave не знайдено:

1. Встанови Brave: https://brave.com/download/
2. Або задай шлях через змінну та перезапусти:

```batch
set BRAVE_EXECUTABLE_PATH=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe
npm run dev
```

Детальнее: [AUTOMATION_SETUP_WINDOWS.md](AUTOMATION_SETUP_WINDOWS.md)

---

### Що робити на **Mac / Linux**

Все налаштовується автоматично! Якщо Brave в іншому місці:

```bash
export BRAVE_EXECUTABLE_PATH="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
npm run dev
```

---

**Варіант 1 — через змінні середовища (зручно, не чіпаєш файли):**

Перед `npm run dev` у тому ж терміналі виконай (встав свої шляхи):

У **cmd** (Командний рядок):

```cmd
set BRAVE_EXECUTABLE_PATH=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe
set BRAVE_USER_DATA_DIR=%TEMP%\brave-debug
```

У **PowerShell**:

```powershell
$env:BRAVE_EXECUTABLE_PATH = "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
$env:BRAVE_USER_DATA_DIR = "$env:TEMP\brave-debug"
```

Потім запускай `npm run dev` у цьому ж вікні терміналу.

**Варіант 2 — через файл:**

Відкрий `automation/config.json`. Знайди блок `"browser"`. Зміни два рядки:

- `"executablePath"` — повний шлях до `brave.exe` (зазвичай `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe`).
- `"userDataDir"` — будь-яка папка для тимчасового профілю, наприклад `C:\Users\ТВІЙ_ЛОГІН\AppData\Local\Temp\brave-debug`.

Збережи файл. Далі просто запускай `npm run dev`.

> Примітка: для нового “multi-provider” Upload (default/alphaone) основні налаштування вже винесені в `src/htmlConverter/storageProviders.json`. Якщо ти хочеш **різні профілі** Brave для різних storage — редагуй саме `storageProviders.json` → `browserProfiles.default` / `browserProfiles.alphaone`.

---

**Коротко:** на Mac нічого міняти не треба. На Windows один раз вказати шлях до Brave (файлом або змінними), далі скрізь однаково: `npm install` у корені, server і automation — потім `npm run dev`.

---

## Додатково

- **Відправка листів:** Gmail App Password (Google Account → Security → App Passwords). У додатку вводити цей пароль, не основний.
- **GIF:** див. [GIF_OPTIMIZATION.md](src/imageConverter/GIF_OPTIMIZATION.md).
- **Збірка:** `npm run build`, деплой — `npm run deploy`.

### Storage Upload (default / alphaone) — де налаштовувати

Головний конфіг тепер тут: `src/htmlConverter/storageProviders.json` (використовується і фронтом, і automation).

- **providers.default**: класичний storage (`storage.5th-elementagency.com`) з категоріями `finance|health`
- **providers.alphaone**: AlfaOne (`alphaonest.com`), без категорій (категорія в UI ховається)
- **browserProfiles.default / browserProfiles.alphaone**: окремі CDP порти та профілі Brave, щоб сесії логіну не змішувались
- **systemNotifications**:
  - `enabled`: показувати macOS нотифікації
  - `soundsEnabled`: лишити звук без нотифікацій

Корисні параметри (там же):

- **`loginWaitMs`**: скільки чекати ручний логін (якщо storage просить залогінитись)
- **`bootstrapWaitMs`**: скільки чекати появи UI (login або upload) після відкриття сторінки
- **`closeTabAfterBatch`**: закрити вкладку Brave **після** успішного upload всього batch’у

### Template Library — шляхи до папок з шаблонами

Щоб додаток бачив твої шаблони, потрібно один раз прописати папку, де вони лежать:

1. Відкрий **Template Library** (розділ з шаблонами в додатку).
2. Натисни кнопку **Storage** (біля Sync New).
3. У вікні натисни **Add location** (або «Додати»).
4. Заповни:
   - **Name** — будь-яка назва (наприклад «Мої шаблони»);
   - **Path** — **абсолютний шлях** до папки на диску, де зберігаються шаблони.
5. Збережи. Список локацій зберігається в браузері (localStorage).

**Приклади шляхів:**

- **Mac:** `/Users/твій_логін/Documents/templates`
- **Windows:** шлях має починатися з `/`; можна спробувати формат на кшталт `/C:/Users/твій_логін/Documents/templates` (корінь диска C — як `/C:/`).

Якщо папок кілька — додай їх усі окремими локаціями. Потім у Template Library зʼявляться шаблони з усіх цих папок.

---

MIT · Mykhailo Vynnyk
