# Статус фіксів: src/htmlConverter/advanced/

Оновлено: 2026-07-06. Оригінальне рев'ю — нижче, тут актуальний статус.

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

## ❌ Залишилось (backlog)

- **MJML-експорт для advanced-режиму** — зараз поле MJML очищається; з ComponentNode IR генерувати MJML просто. Найбільший пункт.
- **Golden-файли** у `__tests__/fixtures/expected/` замість тільки jest-снапшотів — зручніше рев'юїти дифи.
- Warning'и для інших випадків мовчазної втрати (наприклад, `<img>` у клітинках statsGrid губиться — зараз без попередження).

## Довідка: тести

`npx jest src/htmlConverter/advanced` — 338 тестів (11 сьютів). Повний набір: 435.
