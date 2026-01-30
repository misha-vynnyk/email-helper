# 🔧 План рефакторингу та оптимізації

## 📊 Поточний стан

### Файли для аналізу:
- `src/htmlConverter/ImageProcessor.tsx` (1046 рядків) ⚠️ Великий
- `src/htmlConverter/HtmlConverterPanel.tsx` (749 рядків)
- `src/htmlConverter/StorageUploadDialog.tsx` (606 рядків)
- `src/htmlConverter/UploadHistory.tsx` (295 рядків)
- `server/routes/storageUpload.js` (217 рядків)

---

## 🎯 Знайдені проблеми та рішення

### **1. ImageProcessor.tsx - занадто великий компонент**

**Проблема:**
- 1046 рядків в одному файлі
- Багато різної логіки в одному місці
- Важко підтримувати

**Рішення:**
```
Розбити на окремі файли:
├── ImageProcessor.tsx (головний компонент, ~300 рядків)
├── hooks/
│   ├── useImageExtraction.ts (екстракція з HTML)
│   ├── useImageConversion.ts (конвертація форматів)
│   └── useStorageUpload.ts (upload логіка)
├── components/
│   ├── ImageSettings.tsx (settings panel)
│   ├── ImageList.tsx (список зображень)
│   └── ImageActions.tsx (кнопки дій)
└── utils/
    ├── imageProcessing.ts (pure functions)
    └── constants.ts (SETTINGS_STORAGE_KEY, тощо)
```

**Пріоритет:** 🟡 Medium (покращує читабельність, але не критично)

---

### **2. Дублювання логіки копіювання в буфер**

**Проблема:**
Копіювання в clipboard повторюється 3 рази:
- `ImageProcessor` (handleUploadToStorage)
- `StorageUploadDialog` (handleCopyUrl, handleCopyAllUrls)
- `UploadHistory` (handleCopy)

**Рішення:**
```typescript
// src/htmlConverter/utils/clipboard.ts
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback для старих браузерів
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch {
      return false;
    }
  }
};
```

**Пріоритет:** 🟢 High (DRY principle, легко виправити)

---

### **3. Константи розкидані по коду**

**Проблема:**
```typescript
// В різних місцях:
const SETTINGS_STORAGE_KEY = "html-converter-image-settings";
localStorage.setItem('html-converter-upload-history', ...);
setTimeout(() => setCopiedUrl(null), 2000); // magic number
autoHideDuration={4000} // magic number
```

**Рішення:**
```typescript
// src/htmlConverter/constants.ts
export const STORAGE_KEYS = {
  IMAGE_SETTINGS: "html-converter-image-settings",
  UPLOAD_HISTORY: "html-converter-upload-history",
} as const;

export const UI_TIMINGS = {
  COPIED_FEEDBACK: 2000,
  SNACKBAR_DURATION: 4000,
  SUCCESS_DIALOG_CLOSE: 2000,
} as const;

export const UPLOAD_CONFIG = {
  MAX_HISTORY_SESSIONS: 50,
  PREPARE_TIMEOUT: 30000,
  STORAGE_TIMEOUT: 180000,
  SERVER_TIMEOUT: 300000,
} as const;

export const IMAGE_DEFAULTS = {
  FORMAT: "jpeg" as const,
  QUALITY: 85,
  MAX_WIDTH: 600,
  AUTO_PROCESS: true,
  PRESERVE_FORMAT: true,
};
```

**Пріоритет:** 🟢 High (покращує підтримку)

---

### **4. Невикористані імпорти**

**Знайдено в ImageProcessor.tsx:**
```typescript
import Checkbox from "@mui/material/Checkbox"; // ✅ Використовується
import FormControlLabel from "@mui/material/FormControlLabel"; // ✅ Використовується
```

**Дія:** Перевірити всі імпорти (автоматично через linter)

**Пріоритет:** 🟡 Medium (ESLint вже показує unused imports)

---

### **5. Type definitions можна покращити**

**Поточний стан:**
```typescript
// types.ts - мінімальні типи
interface UploadHistoryEntry { ... }
interface UploadSession { ... }
```

**Рішення - додати більше типів:**
```typescript
// types.ts
export type ImageFormat = "jpeg" | "webp";
export type UploadCategory = "finance" | "health";

export interface ProcessedImage {
  id: string;
  src: string;
  name: string;
  previewUrl: string;
  convertedBlob?: Blob;
  originalSize: number;
  convertedSize?: number;
  status: "pending" | "processing" | "done" | "error";
  error?: string;
}

export interface ImageSettings {
  format: ImageFormat;
  quality: number;
  maxWidth: number;
  autoProcess: boolean;
  preserveFormat: boolean;
}

export interface UploadResult {
  filename: string;
  url: string;
  success: boolean;
}

export interface StorageUploadResponse {
  results: UploadResult[];
  category: UploadCategory;
  folderName: string;
}
```

**Пріоритет:** 🟡 Medium (покращує type safety)

---

### **6. Оптимізація ре-рендерів**

**Проблема:**
Деякі функції в `ImageProcessor` не мемоізовані:
```typescript
const formatSize = (bytes: number): string => { ... }
const extractFolderName = (name: string): string => { ... }
```

**Рішення:**
```typescript
// Винести в utils (pure functions)
// utils/formatters.ts
export const formatSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + " " + sizes[i];
};

export const extractFolderName = (name: string): string => {
  const uppercaseMatch = name.match(/([A-Z]+\d+)/);
  if (uppercaseMatch) return uppercaseMatch[1];

  const cleaned = name.replace(/-/g, '');
  const match = cleaned.match(/([a-zA-Z]+\d+)/);
  return match ? match[1] : "";
};
```

**Пріоритет:** 🟡 Medium (micro-optimization)

---

### **7. Покращити error handling**

**Поточний стан:**
```typescript
} catch (error) {
  log(`❌ Помилка: ${error instanceof Error ? error.message : "Unknown"}`);
}
```

**Рішення - єдиний helper:**
```typescript
// utils/errorHandler.ts
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return "Unknown error occurred";
};

export const logError = (log: (msg: string) => void, context: string, error: unknown) => {
  const message = getErrorMessage(error);
  log(`❌ ${context}: ${message}`);
  console.error(`[${context}]`, error);
};

// Використання:
logError(log, "Помилка завантаження", error);
```

**Пріоритет:** 🟢 High (консистентність)

---

### **8. Зайві коментарі**

**Знайдено:**
```typescript
// Replace images in HTML editor with uploaded URLs
// Prepare file (upload blob to server)
// Copy all URLs to clipboard
```

**Дія:**
- ✅ Залишити важливі коментарі
- ❌ Видалити очевидні (`// Copy all URLs to clipboard` перед `copyToClipboard()`)

**Пріоритет:** 🔵 Low (косметика)

---

### **9. Можна додати useMemo для expensive calculations**

**Приклад:**
```typescript
// В ImageProcessor
const totalOriginal = images.reduce((sum, img) => sum + img.originalSize, 0);
const totalConverted = images.reduce((sum, img) => sum + (img.convertedSize || 0), 0);
const doneCount = images.filter((img) => img.status === "done").length;
```

**Рішення:**
```typescript
const stats = useMemo(() => {
  const totalOriginal = images.reduce((sum, img) => sum + img.originalSize, 0);
  const totalConverted = images.reduce((sum, img) => sum + (img.convertedSize || 0), 0);
  const doneCount = images.filter((img) => img.status === "done").length;
  const pendingCount = images.filter((img) => img.status === "pending").length;

  return { totalOriginal, totalConverted, doneCount, pendingCount };
}, [images]);
```

**Пріоритет:** 🟡 Medium (performance, але images не змінюється часто)

---

### **10. Додати JSDoc для складних функцій**

**Приклад:**
```typescript
/**
 * Replaces image URLs in output HTML/MJML by position
 * @param urlMap - Map of old URLs to new storage URLs
 * @remarks URLs are replaced in order of appearance (image-1, image-2, etc.)
 */
const handleReplaceUrls = useCallback((urlMap: Record<string, string>) => {
  // ...
}, [addLog]);

/**
 * Extracts folder name from file name input
 * @param name - Input file name (e.g., "promo-ABCD123")
 * @returns Extracted folder name (e.g., "ABCD123")
 * @example
 * extractFolderName("promo-ABCD123") // "ABCD123"
 * extractFolderName("promo-1") // "promo1"
 */
const extractFolderName = (name: string): string => {
  // ...
};
```

**Пріоритет:** 🟡 Medium (документація)

---

## 📈 Пріоритезація

### 🟢 Високий пріоритет (зробити зараз):
1. ✅ Створити `utils/clipboard.ts` - DRY principle
2. ✅ Створити `constants.ts` - magic numbers
3. ✅ Покращити error handling - консистентність
4. ✅ Додати JSDoc для публічних API

### 🟡 Середній пріоритет (можна пізніше):
1. Розбити ImageProcessor на менші файли
2. Додати useMemo для expensive calculations
3. Розширити types.ts
4. Оптимізувати ре-рендери

### 🔵 Низький пріоритет (опціонально):
1. Видалити очевидні коментарі
2. Alphabetize imports
3. Add more unit tests

---

## 🎯 Рекомендований план дій

### Етап 1: Швидкі wins (30 хв)
```bash
1. Створити utils/clipboard.ts
2. Створити constants.ts
3. Замінити всі magic numbers
4. Додати error handler
```

### Етап 2: Рефакторинг (2-3 год)
```bash
1. Винести hooks з ImageProcessor
2. Створити окремі компоненти
3. Додати JSDoc
4. Оновити types.ts
```

### Етап 3: Оптимізація (1 год)
```bash
1. Додати useMemo/useCallback де потрібно
2. Перевірити bundle size
3. Профілювати performance
```

---

## 📝 Що НЕ треба змінювати

✅ **Залишити як є:**
- Архітектура компонентів (добре розділені)
- State management (чисто і зрозуміло)
- UI/UX flow (відмінний)
- Type safety (вже непогано)
- Error boundaries (працює)

---

## 🤔 Питання до тебе

1. **Чи хочеш розбити ImageProcessor на менші файли?**
   - За: легше підтримувати, тестувати
   - Проти: більше файлів для навігації

2. **Чи потрібна більш детальна типізація?**
   - Strict types vs flexible types

3. **Performance optimization - критична?**
   - Зараз швидко працює, можна не чіпати

4. **Який пріоритет?**
   - Quick wins (30 хв)
   - Full refactor (3-4 год)
   - Залишити як є

Скажи що важливіше і я почну реалізацію! 🚀
