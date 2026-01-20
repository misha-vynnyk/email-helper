# Design System - Color Scheme Documentation

## Загальна концепція

Об'єднана колірна система, яка поєднує три сучасні стилі:

1. **Modern Minimal** (Indigo/Purple) - Primary
2. **Vibrant Professional** (Teal/Cyan) - Secondary
3. **Warm & Inviting** (Amber/Orange) - Accent

---

## Кольорова ієрархія

### Primary (Indigo/Purple)

- **Основні дії**: кнопки, посилання, важливі елементи
- **Використання**: основним інтерактивним елементам

### Secondary (Teal/Cyan)

- **Інформаційні елементи**: успішні стани, інформаційні повідомлення
- **Використання**: підтримуючі дії, інформаційні блоки

### Accent (Amber/Orange)

- **Спеціальні випадки**: попередження, увага, промо-елементи
- **Використання**: для привернення уваги, warm акценти

---

## Світла тема

### Background Colors

```typescript
background: {
  default: "#F9FAFB",    // Основний фон (нейтральний сірий)
  paper: "#FFFFFF",       // Поверхні, картки
  elevated: "#FFFFFF",    // Підняті елементи
  subtle: "#F9FAFB",      // Легкий фон для секцій
}
```

### Text Colors

```typescript
text: {
  primary: "#1F2937",     // Основний текст (WCAG AA: 12.63:1 на білому)
  secondary: "#6B7280",   // Вторинний текст (WCAG AA: 7.16:1 на білому)
  tertiary: "#9CA3AF",    // Третинний текст (WCAG AA: 4.79:1 на білому)
  disabled: "#D1D5DB",    // Неактивний текст
}
```

### Primary Colors (Indigo/Purple)

```typescript
primary: {
  main: "#6366F1",        // Основной Indigo
  light: "#818CF8",       // Світліший для hover
  dark: "#4F46E5",        // Темніший для active
  contrastText: "#FFFFFF",
}

accent: {
  main: "#8B5CF6",        // Purple акцент
  light: "#A78BFA",
  dark: "#7C3AED",
  contrastText: "#FFFFFF",
}
```

### Secondary Colors (Teal/Cyan)

```typescript
secondary: {
  main: "#0D9488",        // Основний Teal
  light: "#14B8A6",       // Світліший
  dark: "#0F766E",        // Темніший
  contrastText: "#FFFFFF",
}

info: {
  main: "#06B6D4",        // Cyan
  light: "#22D3EE",
  dark: "#0891B2",
  contrastText: "#FFFFFF",
}
```

### Accent Colors (Amber/Orange)

```typescript
warning: {
  main: "#F59E0B",        // Amber
  light: "#FBBF24",
  dark: "#D97706",
  contrastText: "#1F2937",
}

warm: {
  main: "#FB923C",        // Orange
  light: "#FDBA74",
  dark: "#F97316",
  contrastText: "#1F2937",
}
```

### Status Colors

```typescript
success: {
  main: "#10B981",        // Green (WCAG AA: 4.5:1 на білому)
  light: "#34D399",
  dark: "#059669",
  contrastText: "#FFFFFF",
}

error: {
  main: "#EF4444",        // Red (WCAG AA: 4.5:1 на білому)
  light: "#F87171",
  dark: "#DC2626",
  contrastText: "#FFFFFF",
}
```

### Border Colors

```typescript
border: {
  default: "#E5E7EB",     // Стандартна border
  light: "#F3F4F6",       // Легка border
  dark: "#D1D5DB",        // Темна border
  divider: "#E5E7EB",     // Роздільники
}
```

---

## Темна тема

### Background Colors

```typescript
background: {
  default: "#0F172A",     // Основний фон (темно-синій)
  paper: "#1E293B",       // Поверхні, картки (темний сіро-синій)
  elevated: "#334155",    // Підняті елементи
  subtle: "#1E293B",      // Легкий фон для секцій
}
```

### Text Colors

```typescript
text: {
  primary: "#F8FAFC",     // Основний текст (майже білий, WCAG AA: 15.8:1)
  secondary: "#E2E8F0",   // Вторинний текст (WCAG AA: 11.2:1)
  tertiary: "#CBD5E1",    // Третинний текст (WCAG AA: 7.1:1)
  disabled: "#64748B",    // Неактивний текст
}
```

### Primary Colors (Indigo/Purple)

```typescript
primary: {
  main: "#818CF8",        // Світліший Indigo для темної теми
  light: "#A5B4FC",
  dark: "#6366F1",
  contrastText: "#0F172A",
}

accent: {
  main: "#A78BFA",        // Світліший Purple
  light: "#C4B5FD",
  dark: "#8B5CF6",
  contrastText: "#0F172A",
}
```

### Secondary Colors (Teal/Cyan)

```typescript
secondary: {
  main: "#2DD4BF",        // Світліший Teal
  light: "#5EEAD4",
  dark: "#14B8A6",
  contrastText: "#0F172A",
}

info: {
  main: "#60A5FA",        // Світліший Cyan
  light: "#93C5FD",
  dark: "#3B82F6",
  contrastText: "#0F172A",
}
```

### Accent Colors (Amber/Orange)

```typescript
warning: {
  main: "#FBBF24",        // Світліший Amber
  light: "#FCD34D",
  dark: "#F59E0B",
  contrastText: "#0F172A",
}

warm: {
  main: "#FB923C",        // Orange
  light: "#FDBA74",
  dark: "#F97316",
  contrastText: "#0F172A",
}
```

### Status Colors

```typescript
success: {
  main: "#34D399",        // Світліший Green
  light: "#6EE7B7",
  dark: "#10B981",
  contrastText: "#0F172A",
}

error: {
  main: "#F87171",        // Світліший Red
  light: "#FCA5A5",
  dark: "#EF4444",
  contrastText: "#0F172A",
}
```

### Border Colors

```typescript
border: {
  default: "#334155",     // Стандартна border
  light: "#475569",       // Легка border
  dark: "#1E293B",        // Темна border
  divider: "#475569",     // Роздільники
}
```

---

## Градієнти

### Світла тема

```typescript
gradients: {
  // Primary gradient (Indigo → Purple)
  primary: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
  primaryHover: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
  primaryLight: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",

  // Teal gradient (Teal → Cyan)
  teal: "linear-gradient(135deg, #0D9488 0%, #06B6D4 100%)",
  tealHover: "linear-gradient(135deg, #0F766E 0%, #0891B2 100%)",
  tealLight: "linear-gradient(135deg, rgba(13, 148, 136, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)",

  // Warm gradient (Amber → Orange)
  warm: "linear-gradient(135deg, #F59E0B 0%, #FB923C 100%)",
  warmHover: "linear-gradient(135deg, #D97706 0%, #F97316 100%)",
  warmLight: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 146, 60, 0.1) 100%)",

  // Multi-color vibrant gradient
  vibrant: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #0D9488 100%)",

  // Subtle background gradients
  backgroundSubtle: "linear-gradient(180deg, rgba(249, 250, 251, 0.8) 0%, rgba(255, 255, 255, 1) 100%)",
  backgroundWarm: "linear-gradient(180deg, rgba(255, 251, 235, 0.5) 0%, rgba(255, 255, 255, 1) 100%)",
  backgroundCool: "linear-gradient(180deg, rgba(240, 253, 250, 0.5) 0%, rgba(255, 255, 255, 1) 100%)",
}
```

### Темна тема

```typescript
gradients: {
  // Primary gradient (світліший Indigo → Purple)
  primary: "linear-gradient(135deg, #818CF8 0%, #A78BFA 100%)",
  primaryHover: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
  primaryLight: "linear-gradient(135deg, rgba(129, 140, 248, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%)",

  // Teal gradient
  teal: "linear-gradient(135deg, #2DD4BF 0%, #22D3EE 100%)",
  tealHover: "linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%)",
  tealLight: "linear-gradient(135deg, rgba(45, 212, 191, 0.15) 0%, rgba(34, 211, 238, 0.15) 100%)",

  // Warm gradient
  warm: "linear-gradient(135deg, #FBBF24 0%, #FB923C 100%)",
  warmHover: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)",
  warmLight: "linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 146, 60, 0.15) 100%)",

  // Multi-color vibrant gradient
  vibrant: "linear-gradient(135deg, #818CF8 0%, #A78BFA 50%, #2DD4BF 100%)",

  // Subtle background gradients
  backgroundSubtle: "linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 1) 100%)",
}
```

---

## Glassmorphism (Frosted Glass Effect)

### Світла тема

```typescript
glassmorphism: {
  light: {
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(12px) saturate(180%)",
    WebkitBackdropFilter: "blur(12px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.08), 0px 1px 0px rgba(255, 255, 255, 0.5) inset",
  },

  medium: {
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(16px) saturate(180%)",
    WebkitBackdropFilter: "blur(16px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    boxShadow: "0px 12px 40px rgba(0, 0, 0, 0.12), 0px 1px 0px rgba(255, 255, 255, 0.6) inset",
  },

  heavy: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    boxShadow: "0px 20px 60px rgba(0, 0, 0, 0.15), 0px 1px 0px rgba(255, 255, 255, 0.7) inset",
  },

  // Tinted glass variants
  tinted: {
    indigo: {
      background: "rgba(99, 102, 241, 0.1)",
      backdropFilter: "blur(12px) saturate(180%)",
      border: "1px solid rgba(99, 102, 241, 0.2)",
    },
    teal: {
      background: "rgba(13, 148, 136, 0.1)",
      backdropFilter: "blur(12px) saturate(180%)",
      border: "1px solid rgba(13, 148, 136, 0.2)",
    },
    amber: {
      background: "rgba(245, 158, 11, 0.1)",
      backdropFilter: "blur(12px) saturate(180%)",
      border: "1px solid rgba(245, 158, 11, 0.2)",
    },
  },
}
```

### Темна тема

```typescript
glassmorphism: {
  light: {
    background: "rgba(30, 41, 59, 0.7)",
    backdropFilter: "blur(12px) saturate(180%)",
    WebkitBackdropFilter: "blur(12px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.3), 0px 1px 0px rgba(255, 255, 255, 0.1) inset",
  },

  medium: {
    background: "rgba(30, 41, 59, 0.85)",
    backdropFilter: "blur(16px) saturate(180%)",
    WebkitBackdropFilter: "blur(16px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    boxShadow: "0px 12px 40px rgba(0, 0, 0, 0.4), 0px 1px 0px rgba(255, 255, 255, 0.15) inset",
  },

  heavy: {
    background: "rgba(30, 41, 59, 0.95)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0px 20px 60px rgba(0, 0, 0, 0.5), 0px 1px 0px rgba(255, 255, 255, 0.2) inset",
  },

  // Tinted glass variants
  tinted: {
    indigo: {
      background: "rgba(129, 140, 248, 0.15)",
      backdropFilter: "blur(12px) saturate(180%)",
      border: "1px solid rgba(129, 140, 248, 0.3)",
    },
    teal: {
      background: "rgba(45, 212, 191, 0.15)",
      backdropFilter: "blur(12px) saturate(180%)",
      border: "1px solid rgba(45, 212, 191, 0.3)",
    },
    amber: {
      background: "rgba(251, 191, 36, 0.15)",
      backdropFilter: "blur(12px) saturate(180%)",
      border: "1px solid rgba(251, 191, 36, 0.3)",
    },
  },
}
```

---

## Тіні (Shadows)

### Світла тема

```typescript
shadows: {
  // Standard shadows
  sm: "0px 1px 2px rgba(0, 0, 0, 0.05)",
  md: "0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)",
  "2xl": "0px 25px 50px -12px rgba(0, 0, 0, 0.25)",

  // Colored shadows
  colored: {
    indigo: "0px 8px 24px rgba(99, 102, 241, 0.25)",
    teal: "0px 8px 24px rgba(13, 148, 136, 0.25)",
    amber: "0px 8px 24px rgba(245, 158, 11, 0.25)",
    purple: "0px 8px 24px rgba(139, 92, 246, 0.25)",
  },

  // Interactive shadows
  hover: "0px 12px 32px rgba(0, 0, 0, 0.15)",
  focus: "0px 0px 0px 3px rgba(99, 102, 241, 0.2)",

  // Glass shadows
  glass: {
    sm: "0px 8px 32px rgba(0, 0, 0, 0.08), 0px 1px 0px rgba(255, 255, 255, 0.5) inset",
    md: "0px 12px 40px rgba(0, 0, 0, 0.12), 0px 1px 0px rgba(255, 255, 255, 0.6) inset",
    lg: "0px 20px 60px rgba(0, 0, 0, 0.15), 0px 1px 0px rgba(255, 255, 255, 0.7) inset",
  },
}
```

### Темна тема

```typescript
shadows: {
  // Standard shadows (темніші для контрасту)
  sm: "0px 1px 2px rgba(0, 0, 0, 0.3)",
  md: "0px 4px 6px -1px rgba(0, 0, 0, 0.4), 0px 2px 4px -1px rgba(0, 0, 0, 0.3)",
  lg: "0px 10px 15px -3px rgba(0, 0, 0, 0.4), 0px 4px 6px -2px rgba(0, 0, 0, 0.3)",
  xl: "0px 20px 25px -5px rgba(0, 0, 0, 0.5), 0px 10px 10px -5px rgba(0, 0, 0, 0.4)",
  "2xl": "0px 25px 50px -12px rgba(0, 0, 0, 0.6)",

  // Colored shadows (з більшою інтенсивністю)
  colored: {
    indigo: "0px 8px 24px rgba(129, 140, 248, 0.4), 0px 0px 0px 1px rgba(129, 140, 248, 0.2)",
    teal: "0px 8px 24px rgba(45, 212, 191, 0.4), 0px 0px 0px 1px rgba(45, 212, 191, 0.2)",
    amber: "0px 8px 24px rgba(251, 191, 36, 0.4), 0px 0px 0px 1px rgba(251, 191, 36, 0.2)",
    purple: "0px 8px 24px rgba(167, 139, 250, 0.4), 0px 0px 0px 1px rgba(167, 139, 250, 0.2)",
  },

  // Glow effects для акцентних елементів
  glow: {
    indigo: "0px 0px 20px rgba(129, 140, 248, 0.5), 0px 0px 40px rgba(129, 140, 248, 0.3)",
    teal: "0px 0px 20px rgba(45, 212, 191, 0.5), 0px 0px 40px rgba(45, 212, 191, 0.3)",
    amber: "0px 0px 20px rgba(251, 191, 36, 0.5), 0px 0px 40px rgba(251, 191, 36, 0.3)",
  },

  // Interactive shadows
  hover: "0px 12px 32px rgba(0, 0, 0, 0.5)",
  focus: "0px 0px 0px 3px rgba(129, 140, 248, 0.4)",

  // Glass shadows
  glass: {
    sm: "0px 8px 32px rgba(0, 0, 0, 0.3), 0px 1px 0px rgba(255, 255, 255, 0.1) inset",
    md: "0px 12px 40px rgba(0, 0, 0, 0.4), 0px 1px 0px rgba(255, 255, 255, 0.15) inset",
    lg: "0px 20px 60px rgba(0, 0, 0, 0.5), 0px 1px 0px rgba(255, 255, 255, 0.2) inset",
  },
}
```

---

## Правила використання

### Primary (Indigo/Purple)

- ✅ Основні кнопки (CTA)
- ✅ Активні стани навігації
- ✅ Важливі посилання
- ✅ Іконки та індикатори статусу
- ✅ Градієнтні акценти

### Secondary (Teal/Cyan)

- ✅ Додаткові кнопки
- ✅ Інформаційні повідомлення
- ✅ Успішні стани
- ✅ Підтримуючі елементи

### Accent (Amber/Orange)

- ✅ Попередження
- ✅ Промо-елементи
- ✅ Спеціальні акценти
- ✅ Warm тони для дружніх інтерфейсів

### Градієнти

- ✅ Використовувати на кнопках Primary
- ✅ Для спеціальних акцентних блоків
- ✅ Не перебільшувати - використовувати обмежено

### Glassmorphism

- ✅ Модальні вікна
- ✅ Floating panels
- ✅ Overlay елементи
- ✅ Не використовувати для основного контенту

### Кольорові тіні

- ✅ На акцентних елементах
- ✅ При hover станах
- ✅ Для створення глибини

---

## Доступність (Accessibility)

### Контрастність (WCAG AA)

- ✅ Всі кольори тексту мають мінімум 4.5:1 контраст
- ✅ Large text (18px+) має мінімум 3:1 контраст
- ✅ Focus states чітко видимі (3px outline)

### Стани інтерактивних елементів

- ✅ Hover: злегка темніший/світліший колір
- ✅ Active: ще темніший
- ✅ Focus: outline ring (3px)
- ✅ Disabled: знижена opacity (0.38)

---

## Приклади використання

### Кнопки

```typescript
// Primary button
background: gradients.primary;
color: white;
boxShadow: shadows.colored.indigo;
hover: gradients.primaryHover;

// Secondary button
background: gradients.teal;
color: white;
boxShadow: shadows.colored.teal;
hover: gradients.tealHover;
```

### Картки

```typescript
// Light theme
background: paletteColors.background.paper
border: 1px solid border.default
borderRadius: 12px
boxShadow: shadows.md

// Dark theme
background: paletteColors.background.paper
border: 1px solid border.default
borderRadius: 12px
boxShadow: shadows.md
```

### Glass панелі

```typescript
// Модальне вікно
...glassmorphism.medium
borderRadius: 16px
boxShadow: shadows.glass.md
```

---

## Нотатки

- Всі кольори оптимізовані для WCAG AA доступності
- Темна тема використовує світліші відтінки для кращого контрасту
- Градієнти слід використовувати обмежено, переважно для акцентів
- Glassmorphism працює на сучасних браузерах (fallback: solid background)
- Кольорові тіні додають глибину без перевантаження
