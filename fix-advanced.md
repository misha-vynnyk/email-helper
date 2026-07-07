# Статус фіксів: src/htmlConverter/advanced/

Оновлено: 2026-07-07. Оригінальне рев'ю — нижче, тут актуальний статус.

## ✅ Зроблено

### Ітерація 1 (зображення, чистка, sanitize)
- **Зображення підтримуються** аналогічно простому конвертеру: `fromDom` → `ImageNode` → kind `image` → шаблон `image` (обгортка `<a href="urlhere">`, клітинка `img-bg-block`, ширина = containerMaxWidth − 2×sidePadding). Оригінальний `src` зберігається — заміна по `uploadedUrlMap`, позиційна заміна та ALT-заміна в useHtmlExport працюють.
- **Видалені мертві ComponentKind**: `header`, `divider`, `calloutBox`, `authorBlock`, `warningLine` (+ їх шаблони й токени `dividerPx`, `calloutBoxBorderPx`).
- **sanitize.ts перевірений і виправлений**: автовизначення фрагмент/документ (раніше `WHOLE_DOCUMENT: true` загортав фрагмент у `<html><body>`), стійкий до Jest CJS-інтеропу імпорт DOMPurify, повне тестове покриття (`sanitize.test.ts`).

### Ітерація 2 (tok, warnings, вкладені таблиці, ширини)
- **`tok` прокинутий у весь конвеєр**: `fromDom`, `ir/color.ts`, `ir/style.ts (ptToSizeRole)` приймають токени параметром — профільні overrides (пороги кольорів, `smallMaxPt`, `placeholderHref`, `darkLuma`) тепер діють і на етапі побудови IR.
- **Звіт конвертації**: `convertAdvancedDetailed()` повертає `{ html, warnings }`; `convertAdvanced()` лишився string-сумісним. useHtmlExport логує warnings через `addLog` (⚠️).
- **Вкладені таблиці не губляться**: `flattenRuns`/`flattenLines` у tableBlock рекурсивно збирають текст вкладених таблиць + видають warning «Вкладену таблицю сплющено до тексту».
- **Пропорційні ширини колонок**: `<colgroup><col width>` з GDocs конвертуються у відсотки (сума = 100) для `statsGrid` і `recordRow`; fallback — рівномірний поділ.
- **Чистка IR**: видалені `BorderSpec`, `CellNode.border`, `colWidthPct`; `TableNode.colWidths` тепер використовується.
- **Дрібне**: `placeholderHref` перенесений з `tokens.color` на верхній рівень токенів; спільний `escapeHtml` (`advanced/escape.ts`) замість дубльованих `esc`/`escHref`; `pushMerged` нормалізує `align` (undefined ≡ "left") і порівнює `variant` (h4-цитати не мерджаться з абзацами); `Math.trunc` замість `| 0`; коментар про ролі heading-маркерів у `classifyFlow`.

### Закрито як «by design» (рішення користувача)
- Inline-лінки → `href="urlhere"` — бажаний workflow (лінки проставляються вручну). Кнопки зберігають реальний href.
- `mergeSimilarBlockTags` — залишена як є (експортована, не викликається).

### Ітерація 3 (рамки — 2026-07-07)

Баг-репорт: рамки з документа або зникали повністю, або рендерилися брендовим зеленим
(`#28b628`) замість кольору з документа. Причина — `normalize.ts` стрипав `border`/`border-*`
з усіх елементів ще до побудови IR (від самого початку конвеєра, не лише через чистку 2026-07-06),
тож жоден подальший шар ніколи не бачив реального кольору/наявності рамки. `calloutLeft` завжди
підставляв `tok.color.button`, а комірки з рамкою, але без фону — просто повертали `null` і губилися.

- **`BorderSpec`/`BorderSide` повернуто** в `ir/types.ts` (рядок 9 вище це прибирала як «мертвий код» —
  насправді воно ніколи не було підключене, тому й здавалося мертвим).
- **`normalize.ts` більше не стрипає `border`/`border-top/right/bottom/left`** — лишає `border-collapse`/
  `border-spacing` (шум для рендеру) і явне `border:none`.
- **`fromDom.ts`** парсить per-side колір/ширину (`parseBorderSide`/`parseBorderSpec`), нормалізує колір
  через `canonicalizeBg`.
- **`calloutLeft`** тепер бере акцентний колір з `border.left.color` документа, коли рамка лише зліва;
  фолбек на `tok.color.button` лишається тільки коли в документі взагалі немає інформації про рамку.
- **`calloutBox` повернуто** (рядок 9 вище його теж прибирала) — але **узагальнений** відносно оригінальної
  специфікації (§4/§7 у `ADVANCED_HTML_CONVERTER.md`): рендерить будь-яку комбінацію сторін рамки (не
  тільки «повна рамка»), фон необов'язковий, рекурсивно класифікує дітей через `classify.ts` (тому
  вкладена кнопка/текст всередині рамки не сплющується в текст). `divider`/`header`/`authorBlock`/
  `warningLine` лишаються видаленими — не знадобилися.
- **`statsGrid`/`recordRow`** беруть колір рамки з першої комірки документа, що має `border`; фолбек —
  `tok.color.tableBorder`.
- Нові тести в `e2e.test.ts` (tickr-promo fixture) фіксують обидва випадки: акцентний колір з документа
  замість зеленого, і рамку навколо CTA-блоку, яка раніше зникала.

## ❌ Залишилось (backlog)

- **MJML-експорт для advanced-режиму** — зараз поле MJML очищається; з ComponentNode IR генерувати MJML просто. Найбільший пункт.
- **Golden-файли** у `__tests__/fixtures/expected/` замість тільки jest-снапшотів — зручніше рев'юїти дифи.
- Warning'и для інших випадків мовчазної втрати (наприклад, `<img>` у клітинках statsGrid губиться — зараз без попередження).

## Довідка: тести

`npx jest src/htmlConverter/advanced` — 363 тести (11 сьютів). Повний набір: 460.
