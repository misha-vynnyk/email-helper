# Advanced HTML Converter — план

> **Статус реалізації (2026-07-07):** конвеєр реалізований у `src/htmlConverter/advanced/` і покритий тестами (363). Розбіжності зі специфікацією нижче:
> - ComponentKind-и `header`, `divider`, `authorBlock`, `warningLine` **видалені** (залишки специфікації, рішення від 2026-07-06). Реалізовані: `paragraph`, `alertBand`, `buttonBand`, `calloutLeft`, `calloutBox`, `statsGrid`, `recordRow`, `splitRow`, `image`, `spacer`.
> - **`splitRow` додано 2026-07-08**: GDocs-патерн "шапка листа" — 1 рядок, рівно 2 комірки без фону/рамки, друга вирівняна по правому краю (напр. `immersed | MEDIA & INVESTOR RELATIONS`). На відміну від `statsGrid` (рівна ширина, центрування, рамки) права комірка рендериться у вкладеній `<table align="right">`, а не через `text-align`, — це надійно тримає незалежне вирівнювання лівої/правої колонок в Outlook.
> - **`calloutBox` повернуто 2026-07-07** (усупереч рішенню від 2026-07-06, яке його прибрало як "мертвий код"): без нього будь-яка комірка з рамкою, але без фону (наприклад чорна рамка навколо CTA-блоку, риска під шапкою листа) губила рамку повністю при конвертації, а `calloutLeft` завжди рендерив бренд-зелений (`tok.color.button`) замість реального кольору рамки з документа. `BorderSpec`/`BorderSide` (§8) теж повернуто в `ir/types.ts` — `normalize.ts` більше не стрипає `border`/`border-*` (лише `border-collapse`/`border-spacing` і явне `border:none`), `fromDom.ts` парсить колір/наявність рамки per-side для класифікації. `calloutBox` — узагальнений, не буквально зі спеки: рендерить будь-яку комбінацію сторін (не тільки "повна рамка"), рекурсивно класифікує дітей (тому вкладена кнопка всередині рамки не губиться), фон необовʼязковий.
> - Додано підтримку зображень (`image`) і звіт конвертації `convertAdvancedDetailed() → { html, warnings }`.
> - Inline-лінки рендеряться з `href="urlhere"` — свідомий workflow (лінки проставляються вручну); кнопки зберігають реальний href.
> - `<colgroup>` ширини конвертуються в пропорційні відсотки для `statsGrid`/`recordRow`.
> - `statsGrid`/`recordRow` беруть колір рамки з першої комірки документа, що має `border`, з фолбеком на `tok.color.tableBorder`.
> - Актуальний беклог: `fix-advanced.md` (MJML-експорт, golden-файли).

Конвертація **складних Google Docs** (таблиці, кольори, рамки, callout-бокси, кнопки,
мультиспанові посилання) у **email-safe HTML**.

- **Вхід:** вставка з буфера (paste з Google Docs) — інлайн-стилі, без класів і `<style>`.
- **Вихід:** email HTML фрагмент (той самий формат що і Simple: `<table>…</table>`, без DOCTYPE) —
  обгортка `htmlTemplates.fullStructure` з Simple converter **використовується напряму** (не
  дублюється). Конвертер **не відтворює стилі GDocs буквально** — він **мапить семантичні блоки на
  house-шаблони**, переносячи лише: текст, емфазу (bold/italic/underline), **нормалізовані кольори** і
  роль блоку. Метрики (розмір шрифту, padding, ширини рамок, line-height) беруться з `tokens.ts`,
  який імпортує значення з `utils/config.ts` — **одне джерело правди для Simple і Advanced**.
- **Сумісність:** основна ціль — Gmail / Apple Mail / web. House-шаблони містять легкі MSO-хінти
  (`mso-line-height-rule:exactly`) і fluid-hybrid inline-block сітки (`display:inline-block;width:N%;
  min-width:100px;font-size:0`), що дають авто-стек на мобільному і коректну поведінку в Outlook.
  Без важких ghost tables.
- **Режим:** окремий перемикач **Simple / Advanced** у наявному UI. Старий
  [`formatter.ts`](src/htmlConverter/formatter.ts) (regex, «сплющує» структуру) лишається як Simple й
  **не чіпається**.

---

## 1. Архітектура

```
GDocs paste (raw text/html)
  │ 1. PARSE        DOMParser (нативний)
  │ 2. NORMALIZE    зняти <b font-weight:normal>, div-обгортки, прибрати шум  (juice НЕ потрібен)
  ▼
Структурний IR        ← нейтральне дерево (Table/Cell/Paragraph/Run), кольори вже нормалізовані
  │ 3. CLASSIFY      структурний IR → дерево ComponentNode (house-компоненти)  ← уся house-евристика
  ▼
ComponentNode tree
  │ 4. RENDER        ComponentNode → house-шаблони (config/templates)          ← уся розмітка
  │ 5. (SANITIZE)    DOMPurify, опційно (§9)
  ▼
Повний email-документ
```

**Дві стадії IR — навмисно.** DOM-маппінг «дурний» (стадія 1), уся house-логіка ізольована в
`detect/` + `templates/` (стадії 3-4). Кожен шар тестується окремо; з ComponentNode потім легко
додати MJML-renderer.

### Структура модуля

```
src/htmlConverter/advanced/
├── index.ts                 # convertAdvanced(rawHtml, profile?): string — оркестрація 5 кроків
├── normalize.ts             # зняти <b normal>/div-обгортки, прибрати id/class/meta/шумові стилі
├── ir/
│   ├── types.ts             # StructuralNode + ComponentNode
│   ├── fromDom.ts           # DOM → структурний IR
│   ├── style.ts             # парсинг style, снап pt→house-шкалу (§6), ефективні стилі
│   └── color.ts             # canonicalizeText / canonicalizeBg / isDarkBg + стек фонів (§5)
├── detect/
│   ├── classify.ts          # вхідна точка: блок → ComponentNode (precedence §4)
│   ├── tableBlock.ts        # 1-cell/multi-cell таблиці → button/callout/grid/divider
│   └── flowBlock.ts         # послідовність <p>/<h*> → header/paragraph/warningLine/authorBlock
├── render/
│   └── toEmailHtml.ts       # ComponentNode → templates.* — лише композиція, БЕЗ літерального HTML
├── config/
│   ├── tokens.ts            # УСІ значення; імпортує fontFamily/colors з utils/config.ts (§9)
│   └── templates.ts         # HTML кожного house-компонента; document() = htmlTemplates.fullStructure
├── profiles/                # профільні overrides токенів (§12)
│   ├── default.ts           # {}  (базові токени без змін)
│   ├── ttt.ts               # { color: { button: "…", link: "…" }, … }
│   └── alphaone.ts          # { color: { button: "…" }, … }
├── sanitize.ts              # DOMPurify allowlist (опційно, Phase 5)
└── __tests__/
    ├── fixtures/{raw,expected}/   # golden: сирий paste → еталонний house-вихід
    └── *.test.ts
```

> **У `render/` — жодного захардкодженого тега/атрибута/значення.** Усе або з `config/tokens.ts`
> (значення), або з `config/templates.ts` (розмітка).
>
> **Повторне використання Simple converter:** `templates.document` = `htmlTemplates.fullStructure`;
> блок-хелпери `blockRow()` і `buttonTableHtml()` визначені в `config/templates.ts` і доступні для
> Phase 3–4 реалізацій. Регулярна обробка тексту (bold/italic/underline/links) — через `processStyles`,
> `italicLinks`, `linksStyles` з [`formatter.ts`](src/htmlConverter/formatter.ts) де можливо.

---

## 2. Інтеграція в існуючий UI

### 2.1. Перемикач режиму

Новий стан `converterMode: "simple" | "advanced"` (за аналогією з `exportType`/`storageProfile`):

| Що | Де |
|---|---|
| стан + persist (`STORAGE_KEYS.CONVERTER_MODE`, через `t()`) | [`useHtmlConverterLogic.ts`](src/htmlConverter/hooks/useHtmlConverterLogic.ts) |
| пігулки Simple/Advanced | [`FileNamingBar.tsx`](src/htmlConverter/components/FileNamingBar.tsx) |
| гілка форматера | [`useHtmlExport.ts`](src/htmlConverter/hooks/internal/useHtmlExport.ts) |

```ts
// useHtmlExport.ts — handleExportHTML
const formattedContent = converterMode === "advanced"
  ? convertAdvanced(rawPastedHtmlRef.current ?? editorContent)   // сирий HTML, не editor.innerHTML
  : (storageProfile === "ttt" ? formatHtmlTTT
   : storageProfile === "alphaone" ? formatHtmlAlphaone
   : formatHtml)(editorContent);
```

### 2.2. Захоплення сирого HTML — розширити наявний обробник

> ⚠️ У [`useEditorSync.ts:47-106`](src/htmlConverter/hooks/internal/useEditorSync.ts#L47-L106) **вже є**
> `handlePaste`, що робить `getData("text/html")`. **Не додавати** другий — буде гонка за вставку.

Браузер при вставці в `contentEditable` чистить розмітку, а `inputHtml` ще й замінює base64 на
`[IMAGE:…]` ([`:51-57`](src/htmlConverter/hooks/internal/useEditorSync.ts#L51-L57)) — псує `<img>`.
Тому в наявному `handlePaste`, на початку, зберігаємо **неспотворений** сирий HTML:

```ts
if (html) {
  rawPastedHtmlRef.current = html;   // НЕ чищений — для convertAdvanced
  setInputHtml(cleanHtml);           // як зараз — для діагностики
  ...
}
```

`rawPastedHtmlRef` піднімаємо в `useHtmlConverterLogic`, віддаємо в `useEditorSync` (запис) і
`useHtmlExport` (читання).

### 2.3. Модель редагування (v1)

**Advanced = «paste-and-convert»:** конвертується **остання вставка** цілком. Користувач копіює весь
документ із Google Docs (GDocs копіює всю виділену структуру одним фрагментом) і вставляє. Редактор
у Advanced — для прев'ю, **ручне редагування тексту в ньому не впливає на вихід** (ref тримає
оригінал). Щоб змінити — редагуй у Google Docs і встав знову. У UI — підказка про це.
*(Editable-режим і мульти-paste — у §11 «майбутнє».)*

### 2.4. Решта правок

- **MJML:** рендера MJML поки нема → у Advanced примусово `exportType="html"` і дизейбл перемикача,
  щоб `handleExportMJML`/`handleAutoExportAll` не пускали `formatMjml` на сирому GDocs.
- **Формат виходу:** `convertAdvanced` повертає **HTML фрагмент** (без DOCTYPE) — такий самий формат
  як Simple converter. `templates.document` = `htmlTemplates.fullStructure` з Simple, тому scaffold
  ніколи не розходиться між режимами. Прев'ю в [`EmailPreviewPane`](src/htmlConverter/components/EmailPreviewPane.tsx)
  вже обгортає в `<iframe srcDoc>` — це достатньо для рендеру без DOCTYPE.
- **R-4 (зображення):** `src` у виході мусять збігатися з ключами `uploadedUrlMap`. ImageProcessor
  читає **editor DOM** ([`:36`](src/htmlConverter/hooks/internal/useEditorSync.ts#L36)), а
  `convertAdvanced` — сирий ref. Для GDocs це `googleusercontent`-URL (не base64), тож зазвичай
  збігаються — **перевірити емпірично** (Фаза 0).

---

## 3. Форма входу (GDocs paste) і нормалізація

GDocs дає інлайн-стилі без класів. Кроки `normalize.ts`:

| Конструкція | Дія |
|---|---|
| `<b style="font-weight:normal" id="docs-internal-guid-…">` | unwrap, лишити дітей (інакше все bold) |
| `<div dir align style="margin-left">` навколо таблиць | unwrap |
| `<meta>`, `id`, `class`, `dir`, `lang` | видалити |
| `<colgroup><col>` | зчитати **кількість і відносні ширини** колонок (потрібні для `statsGrid`↔`recordRow`, §4), занести в IR, тег прибрати. *Рендер* бере house-% — але класифікація без ширин не працює |
| `vertical-align:baseline`, `white-space`, `font-variant:normal`, `text-decoration:none`, `-webkit-text-decoration-skip`, `background-color:transparent` | прибрати як шум |
| `&nbsp;`, `·`, `&quot;`, `&rsquo;`, `—` | зберегти; non-ASCII гліфи → HTML-entity, числові або named (`&#9656;`, `&rarr;`) |

**Політика пробілів:** трим рангів по краях, колапс незначущих пробілів між блоками, `&nbsp;` лишаємо.

**Малформат-вхід** (paste не з GDocs): невпізнані структури → `paragraph` (fallback §4). Якщо парс
порожній — повертаємо текст у `templates.paragraph`.

---

## 4. Класифікація (структурний IR → ComponentNode)

Найскладніша частина. Кожен top-level блок GDocs класифікується; контейнери — **рекурсивно** (бокс із
кнопкою всередині → рендер боксу + класифікація дітей). Усі евристики — пороги в `tokens`, калібрування
на фікстурах, безпечний fallback — `paragraph`.

### Диспетч: спершу за типом вузла, потім precedence всередині

Блок-`<table>` і блок-`<p>` приходять з різних форм входу і **не конкурують** в одному списку
(`<p>` не може бути кнопкою). Тому:

```
якщо вузол = <table>  → detect/tableBlock  (precedence: buttonBand → alertBand → calloutLeft
                                             → calloutBox → divider → statsGrid → recordRow)
якщо вузол = <p>/<h*> → detect/flowBlock   (precedence: header → authorBlock → warningLine
                                             → paragraph; серії <br> → spacer)
```

Перший збіг виграє; невпізнане → `paragraph`. Контейнери (`calloutBox`) класифікують дітей рекурсивно.

### Табличні блоки (`detect/tableBlock.ts`)

**1 колонка (single-cell контейнер)** — за стилем комірки:

| Умова | Компонент | Тай-брейк |
|---|---|---|
| темний bg + єдиний короткий центр. bold-ранг | `buttonBand` | має вкладену таблицю-кнопку **або** не перший блок |
| темний bg + центр. bold, **перший блок**, на всю ширину, без вкладеної кнопки | `alertBand` | інакше → buttonBand |
| `border-left` акцент (+ світлий bg) | `calloutLeft` | |
| повна рамка (+ bg) | `calloutBox` | рекурсія в дітей (може містити кнопку) |
| лише `border-bottom` / тонка лінія, без тексту | `divider` | |
| без рамки/фону | unwrap (прозорий контейнер) → класифікувати дітей | |

**≥2 колонки (multi-cell)** — дискримінатор = **рівність ширин** (обидва бувають в 1 рядок):

| Умова | Компонент |
|---|---|
| **рівні** ширини колонок, кожна = картка (вертикальний стек label/value) | `statsGrid` (ширина картки = `100/N %`) |
| **різні** ширини, остання комірка right-aligned (тікер · ціна · → · результат) | `recordRow` (house `22/22/22/34%`) |

### Потокові блоки (`detect/flowBlock.ts`) — послідовність `<p>`/`<h*>`

| Умова | Компонент |
|---|---|
| перші 1-2 рядки: бренд (bold accent) + автор (muted), **на початку документа** | `header` |
| `<p>` з провідним інлайн `<img>` + текст поряд | `authorBlock` |
| короткий центр. bold рядок warning-кольору (червона родина) | `warningLine` |
| `<h3>/<h4>` з `font-size ≤ small` + italic | `paragraph` (дрібний, **не** заголовок) |
| послідовні `<br>` / порожні `<p>` | `spacer` (колапс серії в один) |
| решта | `paragraph` |

> **Заголовків як окремого типу немає.** Акцентні «заголовки» (напр. `▸ THE NUMBERS`) — це
> `paragraph` з `accent:true` (єдиний короткий рядок, bold, accent-колір). Префікс `▸` додає
> house-шаблон за цим прапорцем (токен `tokens.accentBullet`); з GDocs він **не** виводиться.

---

## 5. Нормалізація кольорів («швейцарський годинник»)

Три незалежні операції. Усі пороги — токени (`tokens.color.*`).
«Нейтральний» = `max(r,g,b) − min(r,g,b) ≤ NEUTRAL_TOL` (24).
«Темний фон» = `luminance(bg) < DARK_LUMA` (0.5), `luminance = (0.299r+0.587g+0.114b)/255`.

### A. Канонізація — різні правила для тексту і фону

**`canonicalizeText(c, currentBg)`:**
1. `transparent`/невалідний → `null` (успадкування).
2. near-black → `#000000`: `√(r²+g²+b²) ≤ BLACK_SNAP` (48) **і** нейтральний; *guard:* пропустити, якщо `currentBg` темний.
3. near-white → `#ffffff`: `√((255−r)²+…) ≤ WHITE_SNAP` (48) **і** нейтральний; *guard:* пропустити, якщо `currentBg` світлий.
4. інакше → нормалізований hex lowercase.

**`canonicalizeBg(c)`:** як вище, але **БЕЗ near-white снапу** (світлі фони `#fff7ed`/`#f1ede6`
зберігаються; редундантні білі відсіє стек фонів). Border-кольори → через `canonicalizeBg`.

> White-snap лише для тексту, бо `#e2e8f0` (текст) і `#f1ede6` (bg) обидва нейтрально-світлі —
> їх не розрізнити за відстанню, **лише за роллю**.

### B. Фон — контекстний стек

Стек ведеться **під час обходу в `fromDom`** (бо залежить від предків); `color.ts` дає лише чисті
функції `canonicalizeText/Bg`, які `fromDom` кличе з поточним фоном. Тому в структурному IR кольори
вже нормалізовані. Корінь стеку = `tokens.color.rootBackground` (`#ffffff`). Для bg елемента `c`:
1. `canonicalizeBg(c)`; якщо `null` → успадкувати, стек не чіпати.
2. редундантний (`distance(c, currentBg) ≤ BG_REDUNDANT`, 12) → відкинути.
3. інакше → емітити + покласти в стек для нащадків.

### C. Текст

`canonicalizeText`. Сірий/кольоровий — зберігаються; near-black → `#000`; near-white на темному → `#fff`.

### Валідація на прикладі

| Колір | Роль | Рішення |
|---|---|---|
| `#111111` | текст / bg кнопки | → `#000000` (near-black, нейтр.) |
| `#666666` | текст muted | сірий, лишається |
| `#0a2463` | bg/текст | navy (dist 106 > 48), лишається |
| `#e2e8f0` | текст на navy | → `#ffffff` (white-snap, bg темний) |
| `#fff7ed` / `#f1ede6` | bg | лишається (canonicalizeBg без white-snap) |
| `transparent` / білий на білому корені | bg | відкидаємо |

> Пороги (`BLACK_SNAP=WHITE_SNAP=48`, `NEUTRAL_TOL=24`, `BG_REDUNDANT=12`, `DARK_LUMA=0.5`) —
> стартові, калібруються на фікстурах.

---

## 6. Розміри, емфаза, посилання

- **Шрифт:** `style.ts` мапить GDocs `pt` у **роль** за порогом (`pt ≤ smallMaxPt` (9) → `small`,
  інакше `body`); роль → px у шаблоні (`tokens.font.bodyPx`/`smallPx`). IR несе роль, не px —
  одне джерело правди.
- **Padding / ширини рамок / line-height:** з house-токенів; GDocs-значення (6pt, 1.75pt…) ігноруються.
  Структурний IR ловить bg/border/колір — вони потрібні **для класифікації** (§4) і кольорів, але
  метрики при рендері беруться з house.
- **Емфаза:** `font-weight ≥ 600` → `<b>`; `font-style:italic` → `<em>`; `underline` → `<u>`;
  колір рангу → `<b style="color:…">`/`<span style="color:…">`; скидання курсиву → `<b style="font-style:normal">`.
- **Посилання:** `<a href>` → `href` на всіх внутрішніх рангах (мультиспанові злипання зникають —
  кожен ранг незалежний). Плейсхолдер кнопки — `tokens.color.placeholderHref` (`"urlhere"`).

---

## 7. House-компоненти та scaffold

Еталон (`fixtures/expected/`) — золотий зразок розмітки. Рендер — лише композиція через `templates.*`.

### Scaffold (`templates.document`)

`templates.document` **є** `htmlTemplates.fullStructure` з Simple converter — **не копіює** розмітку:

```ts
// config/templates.ts
import { htmlTemplates } from "../../templates";
export const templates = {
  document: htmlTemplates.fullStructure,   // reuse — zero duplication
  ...
};
```

Структура (для довідки — міняти тільки в `src/htmlConverter/templates.ts`):

```
<table 100% role=presentation> › <td align=center>
  › <table .primary-table-limit.content-table bgcolor=#fff max-width:600px>
     › <td .content-vertical-space padding:0 20px>
        › <table .content-inner-table 100%>
           ├ spacer(16) ─ верхній  ← вбудований у fullStructure
           ├ …ComponentNode-блоки (кожен = <tr><td> через blockRow())…
           └ spacer(16) ─ нижній   ← вбудований у fullStructure
```

### Базові хелпери (визначені в `config/templates.ts`, доступні Phase 3–4)

| Хелпер | Що робить |
|--------|-----------|
| `blockRow(html, opts)` | Обгортає inline HTML у `<tr><td style="…padding…"><span>…</span></td></tr>` — той самий ритм що `createHtmlBlock` Simple |
| `buttonTableHtml(label, href, bg)` | Внутрішня таблиця кнопки — дзеркало Simple converter |
| `baseStyle(opts)` | Будує `font-family/size/weight/color/line-height` рядок з токенів |

### Каталог

| Компонент | Ключові риси house-розмітки |
|---|---|
| `alertBand` | `bgcolor=<dark>`, текст акцент-колір, `padding 4px`, центр |
| `header` | text-cell, `<br>` між рядками (бренд + автор) |
| `divider` | вкладена таблиця з `border-bottom:1px solid <c>` |
| `paragraph` | text-cell, `<span>`-обгортка + `<b>/<em>/<u>` + `<br>` між рядками |
| `buttonBand` | `bgcolor=<dark>` band → `.btn-edit-p` → вкладена `<td height bgcolor border-radius:10px><a display:block href>` + опц. підпис |
| `calloutLeft` | таблиця `border-left:10px solid <c>; bgcolor=<tint>` |
| `calloutBox` | `border:1px solid <c>; bgcolor=<tint>`, рекурсія в дітей |
| `statsGrid` | fluid-hybrid inline-block: зовн. таблиця `font-size:0;mso-line-height-rule:exactly`, картки `.d-i-b width=N% style="display:inline-block;width:N%;min-width:100px"`; рамки — зовн.(верх+ліво)+картка(право+низ) проти подвоєння |
| `recordRow` | 4-cell `22/22/22/34%`, остання right-aligned, `border-bottom` |
| `authorBlock` | `<a><img float:left width:10%></a>` + text-cell |
| `warningLine` | text-cell `color:<warning>; text-align:center; bold` |
| `spacer` | `<tr><td height=16 .md-horizontal-space>` |

---

## 8. IR — типи (чернетка)

```ts
// ── Стадія 1: структурний IR (з DOM, «дурний») ──────────────────────────────
export type StructuralNode = TableNode | RowNode | CellNode | Paragraph | ImageNode;

export interface Run {                       // інлайн-ранг тексту
  text: string;
  bold?: boolean; italic?: boolean; underline?: boolean;
  color?: string;                            // вже нормалізований (§5)
  href?: string;
}
export interface Paragraph {
  type: "p";
  align?: "left" | "center" | "right";
  size: "body" | "small";                    // роль, не px (§6)
  accent?: boolean;                          // bold accent-рядок → шаблон додає ▸ (tokens.accentBullet)
  lines: Run[][];                            // кожна лінія — масив рангів; лінії з'єднуються <br>
}
export interface CellNode {
  type: "cell";
  colspan?: number;
  bg?: string; border?: BorderSpec;          // для КЛАСИФІКАЦІЇ (§4), не для метрик
  align?: "left" | "center" | "right"; valign?: "top" | "middle" | "bottom";
  children: StructuralNode[];
}
export interface BorderSide { width: number; color: string; }  // side present? + колір
export interface BorderSpec { top?: BorderSide; right?: BorderSide; bottom?: BorderSide; left?: BorderSide; }
export interface ImageNode { type: "img"; src: string; alt?: string; }
// TableNode / RowNode — аналогічно

// ── Стадія 2: семантичний IR (з classify, рендериться) ──────────────────────
export type ComponentKind =
  | "alertBand" | "header" | "divider" | "paragraph" | "buttonBand"
  | "calloutLeft" | "calloutBox" | "statsGrid" | "recordRow"
  | "authorBlock" | "warningLine" | "spacer";

export interface ComponentNode {
  kind: ComponentKind;
  props: Record<string, unknown>;            // нормалізовані дані для house-шаблону
  children?: ComponentNode[];                // для контейнерів (calloutBox, statsGrid…)
}
export type RenderNode = ComponentNode;       // саме це рендериться
```

Без мертвих типів: окремого `Heading`/`ButtonNode` немає (заголовки → `paragraph`, кнопка → `buttonBand`).

---

## 9. Кастомізація: токени + шаблони

### `config/tokens.ts` — єдине джерело правди

`tokens.ts` **імпортує** `config.fontFamily` і `config.colors` з [`utils/config.ts`](src/htmlConverter/utils/config.ts)
щоб Simple і Advanced завжди використовували однакові значення. Змінити шрифт чи колір кнопки — тільки
в `config.ts`, обидва конвертери підхоплять автоматично.

```ts
import { config } from "../../utils/config";

export const tokens = {
  color: {
    rootBackground: "#ffffff", warning: "#cc0000",
    // Пороги класифікації (тільки для ir/color.ts, не рендеряться):
    blackSnap: 48, whiteSnap: 48, neutralTol: 24, bgRedundant: 12, darkLuma: 0.5,
    // Бренд-кольори з shared config:
    link:   config.colors.link,    // "#0000EE"
    button: config.colors.button,  // "#28b628"
    white:  config.colors.white,
    black:  config.colors.black,
    placeholderHref: "urlhere",
  },
  font: {
    stack:      config.fontFamily, // "'Roboto', Arial, Helvetica, sans-serif"
    lineHeight: 1.5,
    bodyPx:     18,   // = Simple converter default
    headlinePx: 22,   // = Simple converter h1/centerHeadline
    smallPx:    12,   // = Simple converter h6/smallText
    smallMaxPt: 9,    // pt ≤ this → "small" role (§6)
  },
  layout: {
    containerMaxWidth: 600, sidePadding: 20,
    blockPadY: 14,   // = Simple converter padding-top/bottom per block
    spacerPx: 16,    // spacer між секціями (між блоками всередині fullStructure)
    gridMinWidth: 100, calloutAccentPx: 10, gridBorder: "1px solid #E4E4E4",
  },
  button: { radius: 10, height: 51, padding: "3px 5px", innerPadding: "9px 15px", target: "_blank" },
  accentBullet: "&#9656; ",
  classes: {
    // CSS-класи спільні з Simple converter — НЕ перейменовувати
    primaryTable: "primary-table-limit content-table", verticalSpace: "content-vertical-space",
    innerTable: "content-inner-table", spacer: "md-horizontal-space",
    btnWrap: "btn-edit-p", imgBg: "img-bg-block", inlineCell: "d-i-b",
  },
} as const;

export type Tokens = typeof tokens;
```

### `config/templates.ts` — розмітку пишеш ТИ

Один шаблон на компонент (§7). `render/toEmailHtml.ts` лише викликає їх — жодного HTML там.
`document` делегує до Simple, решта — типізовані функції:

```ts
import { htmlTemplates } from "../../templates";
export const templates = {
  document: htmlTemplates.fullStructure,   // ← НЕ дублюємо scaffold
  spacer:      (heightPx: number) => string,
  paragraph:   (o: ParagraphOpts) => string,
  alertBand:   (o: AlertBandOpts) => string,
  header:      (o: HeaderOpts) => string,
  divider:     (o: DividerOpts) => string,
  buttonBand:  (o: ButtonBandOpts) => string,
  calloutLeft: (children: string, o: CalloutOpts) => string,
  calloutBox:  (children: string, o: CalloutOpts) => string,
  statsGrid:   (cells: string[], o: GridOpts) => string,
  recordRow:   (o: RecordRowOpts) => string,
  authorBlock: (o: AuthorOpts) => string,
  warningLine: (o: WarningOpts) => string,
};
// Хелпери доступні для Phase 3-4:
export { blockRow, buttonTableHtml, baseStyle };
```

### Залежності

Нових — **нуль**. `DOMParser` нативний. `juice` **не беремо**. `DOMPurify` (вже є `^3.2.7`) —
**опційний** (Phase 5): вихід будуємо з контрольованого IR. Якщо вмикати — allowlist
`table/td/colspan/style/bgcolor/width/align/valign/height`, інакше зніме інлайн-стилі.

---

## 12. Мульти-профільна система (Default / TTT / Alfa / …)

**Принцип:** Advanced конвертер не дублює код для кожного профілю — він отримує **токен-override**.
Лише значення (кольори, розміри) відрізняються; pipeline, classify, render — спільні.

### Структура профілів

```
advanced/profiles/
├── default.ts    # export const profile = {} satisfies Partial<Tokens>
├── ttt.ts        # export const profile = { color: { button: "#c00", link: "#c00" } }
└── alphaone.ts   # export const profile = { color: { button: "#004aad" } }
```

### API

```ts
// index.ts
export function convertAdvanced(rawHtml: string, override: Partial<Tokens> = {}): string {
  const tok = deepMerge(tokens, override);
  // ... pipeline з tok замість tokens
}

// useHtmlExport.ts — вибір профілю
import { profile as tttProfile }      from "../../advanced/profiles/ttt";
import { profile as alphaoneProfile } from "../../advanced/profiles/alphaone";

const profileOverride =
  storageProfile === "ttt"      ? tttProfile :
  storageProfile === "alphaone" ? alphaoneProfile : {};

convertAdvanced(rawHtml, profileOverride);
```

### Що йде в профіль

| Поле токена | Default | TTT | Alfa |
|-------------|---------|-----|------|
| `color.button` | `#28b628` | TBD | TBD |
| `color.link` | `#0000EE` | TBD | TBD |
| `font.stack` | Roboto/Arial/Helvetica | — | — |
| `layout.blockPadY` | 14 | — | — |

Профілі **не містять HTML** — тільки `Partial<Tokens>`. Якщо профілю недостатньо токенів (наприклад,
TTT потребує іншого scaffold) — тоді і тільки тоді профіль може override-нути окремий шаблон у
`templates`, але це виняток, не правило.

---

## 10. Фази

**Фаза 0 — інтеграція без логіки (де-ризикувати першим). ✅ ЗРОБЛЕНО.**
`rawPastedHtmlRef`, `converterMode`, перемикач Simple/Advanced у UI, гілка в `useHtmlExport`.
`convertAdvanced` = `templates.document(blockRow(raw))` — перевірка scaffold + прев'ю + download.
`templates.document` = `htmlTemplates.fullStructure`; токени імпортують з `utils/config.ts`.

**Фаза 1 — каркас профілів.** `advanced/profiles/{default,ttt,alphaone}.ts`; `convertAdvanced`
приймає `Partial<Tokens>` override; `useHtmlExport` передає профіль; зберегти еталонні фікстури
в `fixtures/expected/`.

**Фаза 2 — normalize + кольори.** `normalize.ts`; `ir/style.ts` (снап pt→шкала); `ir/color.ts`
(`canonicalizeText/Bg` + стек фонів) + юніт-тести з §5.

**Фаза 3 — структурний IR + табличний детект (ядро).** `fromDom.ts`; `detect/tableBlock.ts` +
`detect/classify.ts` з precedence; `render/toEmailHtml.ts` для button/callout/grid/divider.

**Фаза 4 — потоковий детект + текст.** `detect/flowBlock.ts` (header/paragraph/warningLine/authorBlock/
recordRow); ранги, мультиспанові посилання, line-break; `alertBand`.

**Фаза 5 — тести, golden fixtures, доки.** ✅ Виконано (129 тестів, 7 файлів).

---

## 11. Тести

### Покриття по шарах (Phase 5)

| Файл | Шар | Тестів |
|------|-----|--------|
| [`__tests__/color.test.ts`](src/htmlConverter/advanced/__tests__/color.test.ts) | `ir/color.ts` | 25 |
| [`__tests__/normalize.test.ts`](src/htmlConverter/advanced/__tests__/normalize.test.ts) | `normalize.ts` | 18 |
| [`__tests__/tableBlock.test.ts`](src/htmlConverter/advanced/__tests__/tableBlock.test.ts) | `detect/tableBlock.ts` | 12 |
| [`__tests__/classify.test.ts`](src/htmlConverter/advanced/__tests__/classify.test.ts) | `detect/classify.ts` | 11 |
| [`__tests__/toEmailHtml.test.ts`](src/htmlConverter/advanced/__tests__/toEmailHtml.test.ts) | `render/toEmailHtml.ts` | 24 |
| [`__tests__/templates.test.ts`](src/htmlConverter/advanced/__tests__/templates.test.ts) | `config/templates.ts` | 16 |
| [`__tests__/e2e.test.ts`](src/htmlConverter/advanced/__tests__/e2e.test.ts) | `index.ts` (E2E + профілі) | 23 |

**Всього: 129 тестів, 3 Jest-snapshots.**

### Golden fixtures

Сирий GDocs HTML → `convertAdvanced` → snapshot:

| Файл | Що моделює |
|------|-----------|
| [`fixtures/raw/plain-text.html`](src/htmlConverter/advanced/__tests__/fixtures/raw/plain-text.html) | Параграфи з bold, italic, кольором, посиланнями |
| [`fixtures/raw/tables.html`](src/htmlConverter/advanced/__tests__/fixtures/raw/tables.html) | alertBand, calloutLeft, statsGrid (3 cols), recordRow |
| [`fixtures/raw/button-dark.html`](src/htmlConverter/advanced/__tests__/fixtures/raw/button-dark.html) | buttonBand з посиланням |

### Запуск тестів

```bash
# Тільки Advanced converter
npx jest src/htmlConverter/advanced --no-coverage

# Оновити Jest-snapshots після навмисних змін
npx jest src/htmlConverter/advanced/__tests__/e2e.test.ts --updateSnapshot
```

### Важливі поведінкові замітки

- `<p>` завжди отримує `size="body"` у `fromDom.ts` (рядок 137). `font-size` на span всередині
  впливає тільки на контекст span-ів, не на розмір параграфу. Щоб отримати `"small"` або `"headline"` —
  треба `<h5>`/`<h6>` або `<h1>`/`<h2>` на рівні параграфу.
- Bare `<span>` без style/class видаляється `normalize.ts`, тому після стрипінгу стилю span теж зникає.

### Відкриті / майбутнє

### Відкриті / майбутнє
- **R-4** — збіг `src` editor↔raw: перевірити на реальних GDocs із зображеннями (Фаза 0).
- **Editable Advanced + мульти-paste** — зараз one-shot (§2.3); пізніше — акумуляція/re-derive.
- **MJML-вихід** — той самий ComponentNode → `render/toMjml.ts`.
- **Детект-неоднозначності** (`alertBand`↔`buttonBand`, `statsGrid`↔`recordRow`) — калібрувати пороги
  на наборі фікстур; `paragraph` як safe fallback.
- **Калібрування кольорових порогів** — на межах (`#fff7ed` близько до `BG_REDUNDANT`) уточнити на даних.
