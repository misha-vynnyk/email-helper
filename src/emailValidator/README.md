# 📧 Email HTML Validator v3.1

Потужна система валідації HTML для email-сумісності з підтримкою автоматичних виправлень, категорій та красивим дизайном.

## 🚀 Особливості

- ✅ **Email-safe HTML валідація** - перевірка сумісності з email-клієнтами
- 🔧 **Автоматичні виправлення** - auto-fix для поширених помилок
- ⚙️ **Гнучкі налаштування** - конфігурація правил та severity
- 🎯 **Сумісність з клієнтами** - Outlook, Gmail, Apple Mail, Mobile
- 📱 **Responsive UI** - зручний інтерфейс з детальними звітами
- 🔌 **Розширюваність** - можливість додавання кастомних правил
- 🎯 **Гнучкість виправлення** - поодиноке або групове виправлення помилок
- 📊 **Категорії валідації** - структура, доступність, сумісність, продуктивність
- 🎨 **Красивий дизайн** - сучасний UI з прогресс-барами та картками
- 📈 **Система оцінки** - 0-100 балів за якість HTML
- 🏗️ **Архітектурна розділення** - окремі двигуни для валідації та автоправлення

## 🏗️ Архітектура

### ValidationEngine

Окремий клас, що відповідає за валідацію HTML:

- Перевірка HTML на відповідність email-правилам
- Парсинг AST та кешування
- Запуск валідаційних правил
- Розрахунок оцінки та категорій
- Звіти про сумісність з email-клієнтами

### AutofixEngine

Окремий клас, що відповідає за автоматичні виправлення:

- Застосування правил автоправлення в правильному порядку
- Обробка конкретних помилок
- Групове виправлення за типом або категорією
- Управління кастомними правилами автоправлення

### EmailHTMLValidator

Головний клас, що координує роботу двигунів:

- Ініціалізація та конфігурація двигунів
- Публічний API для валідації та автоправлення
- Управління життєвим циклом

## 🛠️ Використання

### Базове використання

```typescript
import { EmailHTMLValidator, ValidationEngine, AutofixEngine } from '../emailValidator';

// Створення валідатора
const validator = new EmailHTMLValidator({
  strictMode: false,
  targetClients: {
    outlook: true,
    gmail: true,
    mobile: true,
  },
  checkAccessibility: true,
  checkPerformance: true,
  checkBestPractices: true,
  maxFileSize: 102,
  requireAltText: true,
  requireFallbacks: true,
});

// Валідація HTML
const report = validator.validate(htmlString);
console.log('Is valid:', report.isValid);
console.log('Score:', report.score);
console.log('Categories:', report.categories);

// Автоматичне виправлення всіх помилок
const { html: fixedHtml, fixed } = validator.autoFix(htmlString);

// Виправлення конкретної помилки
const { html: singleFixed, fixed } = validator.autoFixSpecificIssue(htmlString, 'forbidden-tags');

// Виправлення всіх помилок конкретного типу
const { html: severityFixed, fixed } = validator.autoFixAllIssues(htmlString, 'error');

// Виправлення всіх помилок конкретної категорії
const { html: categoryFixed, fixed } = validator.autoFixCategory(htmlString, 'accessibility');

// Cleanup при завершенні роботи
validator.dispose();
```

### Пряме використання двигунів

```typescript
import { ValidationEngine, AutofixEngine } from '../emailValidator';

// Окреме використання ValidationEngine
const validationEngine = new ValidationEngine(config);
const report = validationEngine.validate(html);

// Окреме використання AutofixEngine
const autofixEngine = new AutofixEngine(config);
const { html: fixedHtml, fixed } = autofixEngine.autoFix(html);
```

### React компонент

```tsx
import { EmailValidationPanel } from '../emailValidator';

const MyComponent = () => {
  const [html, setHtml] = useState('<div>Test</div>');

  return <EmailValidationPanel html={html} onHtmlChange={setHtml} showCompactView={false} />;
};
```

## 📋 Правила валідації

### 🏗️ **Structure (Структура)**

- `forbidden-tags` - заміна div/p/h1-h6 на table структуру
- `email-safe-tags` - виправлення `<br></br>`, `<img></img>`
- `table-attributes` - додавання cellpadding, cellspacing, border

### ♿ **Accessibility (Доступність)**

- `accessibility` - перевірка alt текстів та fallback'ів
- Обов'язкові атрибути для зображень та посилань
- Підтримка темної теми та fallback кольорів

### 🔄 **Compatibility (Сумісність)**

- `outlook-compatibility` - перевірка сумісності з Outlook
- `font-safety` - безпечні шрифти для email-клієнтів
- Перевірка CSS властивостей та значень

### ⚡ **Performance (Продуктивність)**

- `performance` - розмір файлу, зовнішні CSS, вкладеність таблиць
- Рекомендації по оптимізації
- Ліміти по розміру (102KB)

### 🛡️ **Best Practice (Найкращі практики)**

- Правильне форматування HTML
- Email-специфічні атрибути
- Безпечні теги та структура

### 🚫 Заборонені теги

- `div`, `p`, `h1-h6` - замінити на table-структуру
- `section`, `article`, `nav` - не підтримуються email-клієнтами
- `script`, `style`, `link` - заборонені з міркувань безпеки

### ✅ Дозволені теги

- `table`, `tr`, `td`, `th` - основа email-верстки
- `img`, `a`, `span`, `strong`, `b`, `em`, `i`
- `br`, `hr` - відкриті теги: `<br>`, `<hr>`
- `img` - self-closing: `<img />`

### 🔧 Обов'язкові атрибути

```html
<!-- Таблиці -->
<table cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td valign="top">Content</td>
  </tr>
</table>

<!-- Зображення -->
<img src="image.jpg" alt="Description" width="300" height="200" style="display:block;" />

<!-- Посилання -->
<a href="https://example.com" target="_blank">Link</a>
```

### ⚠️ Outlook несумісність

- Flexbox, CSS Grid
- `position: fixed/absolute`
- `transform`, `animation`
- `box-shadow`, `border-radius`
- `opacity`, `rgba()`, `calc()`
- CSS градієнти

## ⚙️ Конфігурація

```typescript
const config: EmailValidatorConfig = {
  rules: {
    'forbidden-tags': {
      enabled: true,
      severity: 'error',
    },
    'email-safe-tags': {
      enabled: true,
      severity: 'error',
    },
    'table-attributes': {
      enabled: true,
      severity: 'error',
    },
    'outlook-compatibility': {
      enabled: true,
      severity: 'warning',
    },
    'font-safety': {
      enabled: true,
      severity: 'warning',
    },
    accessibility: {
      enabled: true,
      severity: 'warning',
    },
    performance: {
      enabled: true,
      severity: 'info',
    },
  },
  targetClients: {
    outlook: true, // Microsoft Outlook
    gmail: true, // Gmail web/mobile
    applemail: true, // Apple Mail
    thunderbird: false,
    mobile: true, // Mobile email clients
  },
  strictMode: false, // Warnings as errors
  allowModernCSS: false,
  maxTableNesting: 5,
  checkAccessibility: true,
  checkPerformance: true,
  checkBestPractices: true,
  maxFileSize: 102, // KB
  maxHtmlSize: 133120, // 130KB in bytes - validation/autofix size limit
  requireAltText: true,
  requireFallbacks: true,
};
```

## 🔧 Автоматичні виправлення

### Заміна тегів

```html
<!-- Було -->
<div class="header">
  <h1>Title</h1>
  <p>Description</p>
  <section>Content</section>
</div>

<!-- Стало -->
<table cellpadding="0" cellspacing="0" border="0" class="header">
  <tr>
    <td>
      <span style="font-weight:bold; font-size:32px;">Title</span>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>Description</td>
        </tr>
      </table>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>Content</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

### Виправлення атрибутів

```html
<!-- Було -->
<table>
  <tr>
    <td>Content</td>
  </tr>
</table>
<img src="image.jpg" />
<a href="#">Link</a>

<!-- Стало -->
<table cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td valign="top">Content</td>
  </tr>
</table>
<img src="image.jpg" alt="" style="display:block;" />
<a href="#" target="_blank">Link</a>
```

### Виправлення шрифтів

```css
/* Було */
font-family: Helvetica, sans-serif;

/* Стало */
font-family: Arial, sans-serif;
```

## 🎨 UI Компоненти

### EmailValidationPanel

```tsx
<EmailValidationPanel
  html={htmlString}
  onHtmlChange={(html) => setHtmlString(html)}
  validator={customValidator}
  showCompactView={false}
/>
```

**Props:**

- `html: string` - HTML для валідації
- `onHtmlChange?: (html: string) => void` - callback для auto-fix
- `validator?: EmailHTMLValidator` - кастомний валідатор
- `showCompactView?: boolean` - компактний вигляд

### Функціональність UI

- 📊 **Real-time валідація** з debounce
- 🔧 **Auto-fix кнопки** для швидких виправлень
- 🎯 **Поодиноке виправлення** - кнопка біля кожної помилки
- 📋 **Групове виправлення** - виправлення всіх помилок конкретного типу
- 🏷️ **Категорійне виправлення** - виправлення всіх помилок категорії
- ⚙️ **Налаштування правил** через діалог
- 📱 **Звіт сумісності** для різних клієнтів
- 🎯 **Детальні повідомлення** з suggestions
- 📈 **Прогрес-бар** з оцінкою 0-100
- 🎨 **Красиві картки** для кожної категорії

## 🔌 Розширення

### Кастомні правила

```typescript
const customRule: ValidationRule = {
  name: 'custom-branding',
  displayName: 'Brand Guidelines',
  description: 'Checks brand-specific requirements',
  severity: 'warning',
  enabled: true,
  configurable: true,
  category: 'best-practice',
  check: (html, config) => {
    const results: ValidationResult[] = [];

    if (!html.includes('company-logo')) {
      results.push({
        rule: 'custom-branding',
        severity: 'warning',
        message: 'Missing company logo',
        suggestion: 'Add <img class="company-logo"> element',
        category: 'best-practice',
      });
    }

    return results;
  },
  autofix: (html, config) => {
    return html.replace('<table', '<img class="company-logo" src="logo.png" alt="Logo" /><table');
  },
};

validator.addRule(customRule);
```

## 📊 Email Client Compatibility

| Feature       | Outlook | Gmail | Apple Mail | Mobile |
| ------------- | ------- | ----- | ---------- | ------ |
| Table Layout  | ✅      | ✅    | ✅         | ✅     |
| Inline Styles | ✅      | ✅    | ✅         | ✅     |
| Flexbox       | ❌      | ⚠️    | ✅         | ⚠️     |
| CSS Grid      | ❌      | ❌    | ✅         | ❌     |
| Border Radius | ❌      | ✅    | ✅         | ✅     |
| Box Shadow    | ❌      | ✅    | ✅         | ✅     |
| Transforms    | ❌      | ❌    | ✅         | ❌     |
| CSS Gradients | ❌      | ✅    | ✅         | ✅     |

## 🎯 Рекомендації

### ✅ Кращі практики

- Використовуйте table-based лейаут
- Всі стилі inline
- Додавайте `alt` до зображень
- Використовуйте `target="_blank"` для посилань
- Тестуйте в різних клієнтах
- Додавайте fallback кольори (bgcolor)
- Використовуйте безпечні шрифти
- Обмежуйте розмір файлу до 102KB

### ❌ Уникайте

- Modern CSS (flexbox, grid)
- External stylesheets
- JavaScript
- Complex positioning
- Heavy animations
- Небезпечні шрифти
- Відсутність fallback'ів

## 🔍 Приклади помилок

### Типові помилки та виправлення:

```html
❌ <div style="display: flex;">
✅ <table cellpadding="0" cellspacing="0" border="0">

❌ <br></br>
⚠️ <br/> (auto-converted to <br> by formatter)
✅ <br>

⚠️ <hr/> (auto-converted to <hr> by formatter)
✅ <hr>

❌ <img src="logo.jpg">
✅ <img src="logo.jpg" alt="Logo" width="300" height="100" style="display:block;" />

❌ <h1>Title</h1>
✅ <span style="font-weight:bold; font-size:32px;">Title</span>

❌ font-family: Helvetica, sans-serif;
✅ font-family: Arial, sans-serif;
```

## 🚀 Інтеграція

Валідатор автоматично інтегрований в EmailHtmlEditor і відображається під полем subject. Підтримує:

- Real-time валідацію під час набору
- Автоматичні виправлення одним кліком
- Поодиноке виправлення конкретних помилок
- Групове виправлення помилок за типом
- Категорійне виправлення помилок
- Збереження налаштувань в localStorage
- Сумісність з існуючою системою форматування
- Красивий дизайн з прогресс-барами та картками

## 🏗️ Архітектурні переваги

### Розділення відповідальності

- **ValidationEngine** - тільки валідація
- **AutofixEngine** - тільки автоправлення
- **EmailHTMLValidator** - координація та публічний API

### Легкість тестування

- Кожен двигун можна тестувати окремо
- Можна створювати моки для ізольованого тестування
- Простіше писати unit тести

### Розширюваність

- Можна додавати нові двигуни без зміни основного класу
- Легше додавати нові типи валідації або автоправлення
- Модульна архітектура

### Обслуговування

- Чіткі межі відповідальності
- Легше знаходити та виправляти помилки
- Простіше додавати нові функції

---

**Email HTML Validator v3.1** - ваш надійний помічник для створення email-сумісного HTML з архітектурою, що розділяє відповідальність! 📧✨

**Останнє оновлення:** Розділено валідацію та автоправлення на окремі двигуни для кращої архітектури та обслуговування.
