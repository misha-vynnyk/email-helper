# Аналіз Hardcoded Стилів

## Загальна статистика

**Знайдено hardcoded значень:**

- Кольори: ~150+ випадків
- BorderRadius: ~50+ випадків
- Spacing/Padding/Margin: ~200+ випадків
- Shadows: ~30+ випадків
- Font sizes: ~20+ випадків

---

## 1. Кольори в `theme.ts`

### Hardcoded brand colors

```typescript
// src/theme/theme.ts
const BRAND_NAVY = "#212443";
const BRAND_BLUE = "#0079CC";
const BRAND_GREEN = "#1F8466";
const BRAND_RED = "#E81212";
const BRAND_YELLOW = "#F6DC9F";
const BRAND_PURPLE = "#6C0E7C";
const BRAND_BROWN = "#CC996C";
```

**Проблема:** Ці кольори дублюються в `tokens.ts` і `theme.ts`

**Рішення:** Використовувати кольори з `tokens.ts`

### Hardcoded palette colors

```typescript
// src/theme/theme.ts
background: {
  default: "#f2f5f7",  // ← hardcoded
},
text: {
  primary: "#1F1F21",   // ← hardcoded
  secondary: "#4F4F4F", // ← hardcoded
},
cadet: {
  100: "#F9FAFB",  // ← hardcoded
  200: "#F2F5F7",  // ← hardcoded
  // ...
}
```

---

## 2. Компоненти з Hardcoded Кольорами

### `SplashLoader.tsx`

```typescript
// Hardcoded colors
const BRAND_BLUE = "#0079CC";
const BRAND_NAVY = "#212443";
const BG_COLOR = "#f2f5f7";

// Hardcoded rgba
background: `radial-gradient(circle at 20% 30%, rgba(0, 121, 204, 0.08) 0%, transparent 50%)`;
boxShadow: `0 12px 40px rgba(0, 121, 204, 0.25)`;
backgroundColor: "rgba(0, 121, 204, 0.15)";
color: "#6A8BA4";
```

### `FileUploadZone.tsx`

```typescript
// Hardcoded colors
border: "3px dashed #1976d2"; // ← MUI blue
boxShadow: "0 0 10px 0 rgba(25, 118, 210, 0.5)";
backgroundColor: "#e3f2fd"; // ← light blue
backgroundColor: "#fafafa"; // ← light gray
borderColor: "#ccc"; // ← gray
color: "#1976d2"; // ← MUI blue
color: "#bbb"; // ← gray
```

### `ImageGridItem.tsx`

```typescript
// Hardcoded rgba
backgroundColor: "rgba(0,0,0,0.5)";
backgroundColor: "rgba(0,0,0,0.7)";
backgroundColor: "rgba(255,255,255,0.9)";
boxShadow: "0 8px 24px rgba(0,0,0,0.15)";
backgroundColor: "#dedede"; // ← gray
color: "#ccc"; // ← gray
backgroundColor: "#1976d2"; // ← MUI blue
color: "#4caf50"; // ← green
```

### `ResizablePreview.tsx` (blockLibrary & templateLibrary)

```typescript
// Hardcoded colors
backgroundColor: "#e3f2fd"; // ← light blue
border: "1px solid #1976d2"; // ← MUI blue
color: "#1976d2"; // ← MUI blue
backgroundColor: "#1976d2"; // ← MUI blue
backgroundColor: "#fff"; // ← white (можна використати theme)
rgba(25, 118, 210, 0.5); // ← MUI blue rgba
boxShadow: "0 4px 12px rgba(0,0,0,0.3)";
```

### `EmailValidationPanel.tsx`

```typescript
// Hardcoded colors
border: "1px solid #ccc"
background: "#f9f9f9"
color: "#333"
border: `1px solid ${severityColor === "error" ? "#ffcdd2" : ...}`
backgroundColor: "#ffebee"  // ← light red
backgroundColor: "#fff8e1"  // ← light yellow
backgroundColor: "#f3e5f5"  // ← light purple
```

### `EstimatedSizeIndicator.tsx`

```typescript
// Hardcoded gradients
background: "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)";
background: "linear-gradient(135deg, #10b981 0%, #059669 100%)";
background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
backgroundColor: "rgba(255, 255, 255, 0.25)";
backgroundColor: "rgba(255, 255, 255, 0.2)";
```

### `EmailHtmlEditor.tsx`

```typescript
// Hardcoded shadows
boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)";
boxShadow: "0px -2px 8px rgba(0, 0, 0, 0.1)";
boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)";
```

---

## 3. Hardcoded BorderRadius

### Часто використовувані значення:

- `borderRadius: 1` (4px) - чипи, маленькі елементи
- `borderRadius: 2` (8px) - кнопки, картки
- `borderRadius: 5` (20px) - великі картки (ImageConverterPanel, FileUploadZone)
- `borderRadius: 3` (12px) - середні елементи

**Проблема:** Використовуються MUI spacing units (1 = 8px), але не винесені в токени

**Файли:**

- `ImageConverterPanel.tsx`: `borderRadius: 5`
- `FileUploadZone.tsx`: `borderRadius: 5`
- `ImageGridItem.tsx`: `borderRadius: 5`
- `BatchProcessor.tsx`, `BulkActions.tsx`: різні значення

---

## 4. Hardcoded Spacing/Padding/Margin

### Часто використовувані значення:

- `padding: 3` (24px)
- `padding: 2` (16px)
- `p: 1` (8px)
- `gap: 3` (24px)
- `mb: 2` (16px)
- `top: 10`, `left: 10` (px values)

**Проблема:** Використовуються MUI spacing, але немає централізованої системи

---

## 5. Hardcoded Shadows

### Знайдені shadow значення:

```typescript
boxShadow: "0 8px 24px rgba(0,0,0,0.15)";
boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)";
boxShadow: "0px -2px 8px rgba(0, 0, 0, 0.1)";
boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)";
boxShadow: "0 0 10px 0 rgba(25, 118, 210, 0.5)";
boxShadow: "0 4px 12px rgba(0,0,0,0.3)";
```

**Проблема:** Не використовуються токени з `shadows`

---

## 6. Hardcoded Typography

### Знайдені значення:

- `fontSize: 64` (px)
- `fontSize: 14` (px в SCSS)
- `fontSize: 12` (px)
- `fontWeight: 500`, `600`, `700`
- `letterSpacing: "-0.02em"`

**Проблема:** Деякі значення не використовують typography tokens

---

## 7. SCSS Файли

### ~~`src/themes/modern/styles/_variables.scss`~~ (ВИДАЛЕНО)

> **Примітка:** Папка `src/themes` була видалена як невикористовуваний legacy код.
> Всі стилі тепер керуються через `src/theme/tokens.ts` та MUI theme system.

Раніше мала власні змінні, які не були синхронізовані з `tokens.ts`:
- `$purple-primary`, `$purple-dark`, `$purple-light`
- `$spacing-1`, `$spacing-2`, etc.
- `$radius-sm`, `$radius-md`, etc.
- `$shadow-sm`, `$shadow-md`, etc.

**Вирішено:** Папка видалена, всі стилі тепер централізовані в `tokens.ts`

---

## 8. Специфічні проблеми

### MUI Blue (#1976d2) використовується замість theme primary

**Файли:**

- `FileUploadZone.tsx`
- `ResizablePreview.tsx` (blockLibrary)
- `ResizablePreview.tsx` (templateLibrary)
- `ImageGridItem.tsx`

**Проблема:** Використовується стандартний MUI blue замість theme primary color

### Старі brand colors

**Файли:**

- `SplashLoader.tsx`: `BRAND_BLUE = "#0079CC"`, `BRAND_NAVY = "#212443"`
- `App/SamplesDrawer/index.tsx`: `BRAND_BLUE = "#0079CC"`, `BRAND_NAVY = "#212443"`

**Проблема:** Дублювання констант замість імпорту з tokens

---

## Рекомендації

### Пріоритет 1 (Критичні)

1. ✅ Винести всі кольори з `theme.ts` в `tokens.ts`
2. ✅ Замінити `#1976d2` (MUI blue) на theme primary
3. ✅ Винести всі brand colors константи в tokens
4. ✅ Створити систему градієнтів в tokens

### Пріоритет 2 (Важливі)

5. ✅ Винести часто використовувані borderRadius значення
6. ✅ Централізувати shadow значення
7. ✅ Синхронізувати SCSS змінні з tokens.ts
8. ✅ Винести rgba overlay кольори

### Пріоритет 3 (Бажані)

9. ✅ Стандартизувати spacing використання
10. ✅ Винести typography значення
11. ✅ Створити helper функції для часто використовуваних комбінацій

---

## План дій

### Етап 1: Оновити tokens.ts

- Додати всі необхідні кольори з нової схеми
- Додати градієнти
- Додати glassmorphism
- Додати розширені тіні

### Етап 2: Оновити theme.ts

- Використовувати кольори з tokens.ts
- Прибрати дублювання

### Етап 3: Оновити компоненти

- Замінити hardcoded кольори на tokens
- Замінити hardcoded borderRadius на tokens
- Замінити hardcoded shadows на tokens

### Етап 4: Синхронізувати SCSS

- Оновити SCSS змінні для відповідності tokens.ts
- Або використовувати CSS змінні з tokens

---

## Категоризація значень

### Кольори, що часто використовуються:

- `#1976d2` (MUI Blue) - 15+ випадків → замінити на `primary.main`
- `#e3f2fd` (Light Blue) - 5+ випадків → додати в tokens як `primary.50` або подібне
- `#fafafa`, `#f5f5f5`, `#f9f9f9` (Light Grays) - 10+ випадків → використати `background.subtle`
- `#ccc`, `#bbb`, `#dedede` (Medium Grays) - 10+ випадків → використати `border.default` або `text.tertiary`
- `rgba(0,0,0,0.5)`, `rgba(0,0,0,0.7)` (Black overlays) - 10+ випадків → додати в opacity tokens
- `rgba(255,255,255,0.9)` (White overlays) - 5+ випадків → додати в opacity tokens

### BorderRadius, що часто використовуються:

- `borderRadius: 1` (4px) → `borderRadius.sm`
- `borderRadius: 2` (8px) → `borderRadius.md` або `borderRadius.button`
- `borderRadius: 3` (12px) → `borderRadius.base`
- `borderRadius: 5` (20px) → `borderRadius.card` або `borderRadius.xl`

### Shadows, що часто використовуються:

- `0 8px 24px rgba(0,0,0,0.15)` → `shadows.hover`
- `0 2px 8px rgba(0, 0, 0, 0.1)` → `shadows.sm`
- `0 4px 12px rgba(0, 0, 0, 0.15)` → `shadows.md`
- `0 0 10px 0 rgba(25, 118, 210, 0.5)` → `shadows.colored.primary` (потрібно додати)

---

## Висновки

1. **Дублювання кольорів** між `theme.ts` і `tokens.ts`
2. **Відсутність централізації** - кольори розкидані по компонентах
3. **Використання MUI стандартних кольорів** замість theme кольорів
4. **SCSS змінні не синхронізовані** з TypeScript tokens
5. **Відсутність системи градієнтів** - hardcoded в компонентах
6. **Відсутність системи glassmorphism** - hardcoded в компонентах

**Наступні кроки:** Оновити `tokens.ts` з новою схемою, потім поетапно замінювати hardcoded значення.
