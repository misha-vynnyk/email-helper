# Advanced HTML Converter — план

Конвертація **складних Google Docs** (таблиці, кольори, рамки, callout-бокси, кнопки,
мультиспанові посилання) у **email-safe HTML**.

- **Вхід:** вставка з буфера (paste з Google Docs) — інлайн-стилі, без класів і `<style>`.
- **Вихід:** повний email-документ із **фіксованого набору house-компонентів** (§7, еталон у
  `__tests__/fixtures/expected/`). Конвертер **не відтворює стилі GDocs буквально** — він **мапить
  семантичні блоки на house-шаблони**, переносячи лише: текст, емфазу (bold/italic/underline),
  **нормалізовані кольори** і роль блоку. Метрики (розмір шрифту, padding, ширини рамок, line-height)
  беруться з house-токенів.
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
├── index.ts                 # convertAdvanced(rawHtml): string — лише оркестрація 5 кроків
├── normalize.ts             # зняти <b normal>/div-обгортки, прибрати id/class/meta/шумові стилі
├── ir/
│   ├── types.ts             # StructuralNode + ComponentNode
│   ├── fromDom.ts           # DOM → структурний IR
│   ├── style.ts             # парсинг style, снап pt→house-шкалу (§6), ефективні стилі
│   └── color.ts             # canonicalizeText / canonicalizeBg + стек фонів (§5)
├── detect/
│   ├── classify.ts          # вхідна точка: блок → ComponentNode (precedence §4)
│   ├── tableBlock.ts        # 1-cell/multi-cell таблиці → button/callout/grid/divider
│   └── flowBlock.ts         # послідовність <p>/<h*> → header/paragraph/warningLine/authorBlock
├── render/
│   └── toEmailHtml.ts       # ComponentNode → templates.* — лише композиція, БЕЗ літерального HTML
├── config/
│   ├── tokens.ts            # УСІ значення (кольори, шкала, padding, класи, пороги…)
│   └── templates.ts         # HTML кожного house-компонента — шаблон-функції (пишеш ТИ)
├── sanitize.ts              # DOMPurify allowlist (опційно)
└── __tests__/
    ├── fixtures/{raw,expected}/   # golden: сирий paste → еталонний house-вихід
    └── *.test.ts
```

> **У `render/` — жодного захардкодженого тега/атрибута/значення.** Усе або з `config/tokens.ts`
> (значення), або з `config/templates.ts` (розмітка).

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
- **Повний документ:** `convertAdvanced` повертає **повний email** через `templates.document()` (§7),
  бо `downloadFile` пише вихід у файл як є. Прев'ю ([`EmailPreviewPane`](src/htmlConverter/components/EmailPreviewPane.tsx))
  обгортає в `<iframe srcDoc>` — подвійний шел толерується (як уже в Simple).
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

```
<table 100% role=presentation> › <td align=center>
  › <table .primary-table-limit.content-table bgcolor=#fff max-width:600px>
     › <td .content-vertical-space padding:0 20px>
        › <table .content-inner-table 100%>
           ├ spacer(16) ─ верхній
           ├ …ComponentNode-блоки (кожен = <tr><td>)…
           └ spacer(16) ─ нижній
```

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
| `statsGrid` | fluid-hybrid inline-block: зовн. таблиця `font-size:0;mso-line-height-rule:exactly`, картки `.inline-block-element width=N% style="display:inline-block;width:N%;min-width:100px"`; рамки — зовн.(верх+ліво)+картка(право+низ) проти подвоєння |
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

### `config/tokens.ts` — усі значення (під майбутній UI)

```ts
export const tokens = {
  color: {
    rootBackground: "#ffffff", warning: "#cc0000",
    blackSnap: 48, whiteSnap: 48, neutralTol: 24, bgRedundant: 12, darkLuma: 0.5,
    link: "#1155cc", placeholderHref: "urlhere",
  },
  font: {
    stack: "'Roboto', Arial, Helvetica, sans-serif", lineHeight: 1.5,
    bodyPx: 18, smallPx: 14, smallMaxPt: 9,     // pt ≤ smallMaxPt → small, інакше body (§6)
  },
  layout: {
    containerMaxWidth: 600, sidePadding: 20, blockPadY: 14, spacerPx: 16,
    gridMinWidth: 100, calloutAccentPx: 10, gridBorder: "1px solid #E4E4E4",
  },
  button: { radius: 10, height: 42, padding: "4px 15px", target: "_blank" },
  accentBullet: "&#9656; ",                  // декор house-заголовків (§4)
  classes: {
    primaryTable: "primary-table-limit content-table", verticalSpace: "content-vertical-space",
    innerTable: "content-inner-table", spacer: "md-horizontal-space",
    btnWrap: "btn-edit-p", inlineCell: "inline-block-element",
  },
} as const;
```

### `config/templates.ts` — розмітку пишеш ТИ

**Гібрид:** старт — типізовані шаблон-функції (макс. контроль: умовні рамки, цикли). Пізніше винесемо
UI-редаговану підмножину окремо. Один шаблон на компонент (§7) + `document`. `render/` лише викликає їх:

```ts
export const templates = {
  document:    (blocks: string) => string,            // scaffold §7
  alertBand:   (o: AlertBandOpts) => string,
  header:      (o: HeaderOpts) => string,
  divider:     (o: DividerOpts) => string,
  paragraph:   (o: ParagraphOpts) => string,          // size:"body"|"small", lines, align
  buttonBand:  (o: ButtonBandOpts) => string,
  calloutLeft: (children: string, o: CalloutOpts) => string,
  calloutBox:  (children: string, o: CalloutOpts) => string,
  statsGrid:   (cells: string[], o: GridOpts) => string,
  recordRow:   (o: RecordRowOpts) => string,
  authorBlock: (o: AuthorOpts) => string,
  warningLine: (o: RunOpts) => string,
  spacer:      (heightPx: number) => string,
};
```

> Збігається з конвенцією репо: [`templates.ts`](src/htmlConverter/templates.ts) +
> [`utils/config.ts`](src/htmlConverter/utils/config.ts). **Розподіл:** я роблю каркас, типи,
> color-логіку, classify і склейку; **тіла шаблонів пишеш ти** (або співавторимо блок за блоком).

### Залежності

Нових — **нуль**. `DOMParser` нативний. `juice` **не беремо** (вхід — інлайн-стилі без класів; до того
ж тягне node-built-ins → ризик у Vite-бандлі). `DOMPurify` (вже є `^3.2.7`) — **опційний**: вихід
будуємо з контрольованого IR, `<script>` ніколи не копіюємо. Якщо вмикати — allowlist для
`table/td/colspan/style/bgcolor/width/align/valign/height`, інакше зніме інлайн-стилі.

---

## 10. Фази

**Фаза 0 — інтеграція без логіки (де-ризикувати першим).**
`rawPastedHtmlRef` у `useHtmlConverterLogic`; розширити наявний `handlePaste` (§2.2); стан
`converterMode` + перемикач; гілка `convertAdvanced(raw)`; в Advanced `exportType="html"` + дизейбл
MJML; **емпірично звірити R-4**. `convertAdvanced` поки = `templates.document(escape(raw))` — перевірка
scaffold + прев'ю + download end-to-end.

**Фаза 1 — каркас.** `config/{tokens,templates}`, `ir/types`; `templates.document` + чорнові тіла
решти; зберегти еталон у `fixtures/expected/`.

**Фаза 2 — normalize + кольори.** `normalize.ts`; `ir/style.ts` (снап pt→шкала); `ir/color.ts`
(`canonicalizeText/Bg` + стек фонів) + юніт-тести з §5.

**Фаза 3 — структурний IR + табличний детект (ядро).** `fromDom.ts`; `detect/tableBlock.ts` +
`detect/classify.ts` з precedence; `render/toEmailHtml.ts` для button/callout/grid/divider.

**Фаза 4 — потоковий детект + текст.** `detect/flowBlock.ts` (header/paragraph/warningLine/authorBlock/
recordRow); ранги, мультиспанові посилання, line-break; `alertBand`.

**Фаза 5 — прев'ю, тести, доки.** Прев'ю через `EmailPreviewPane`; golden-тести; розділ у `HTML_CONVERTER.md`.

---

## 11. Тести і відкриті питання

**Тести:**
- **Golden:** `fixtures/raw/*.html` → `fixtures/expected/*.html`. Порівняння — **через парсинг у DOM**
  (структура + атрибути), не діф рядків (стабільніше до пробілів/порядку атрибутів).
- **Юніт по шарах:** `color` (снапи/стек на §5), `normalize`, `fromDom` (IR), `classify` (правильний
  `kind` + precedence), `render` (HTML).
- **Регресія Simple:** старий `formatHtml` не зачеплено.

**Відкриті / майбутнє:**
- **R-4** — збіг `src` editor↔raw: перевірити на реальних GDocs із зображеннями (Фаза 0).
- **Editable Advanced + мульти-paste** — зараз one-shot (§2.3); пізніше — акумуляція/re-derive.
- **MJML-вихід** — той самий ComponentNode → `render/toMjml.ts`.
- **Детект-неоднозначності** (`alertBand`↔`buttonBand`, `statsGrid`↔`recordRow`) — калібрувати пороги
  на наборі фікстур; `paragraph` як safe fallback.
- **Калібрування кольорових порогів** — на межах (`#fff7ed` близько до `BG_REDUNDANT`) уточнити на даних.
