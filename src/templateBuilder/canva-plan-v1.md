План: пряма маніпуляція на Canvas для Template Builder (Section milestone) — v2

> **Що змінилось проти v1 і чому.** v1 був перевірений проти реального коду `src/templateBuilder/`. Знайдено: (а) фактичну помилку — "10 місць `setState`" мало бути 7; (б) неточне формулювання "canvas і render — без жодного спільного коду" (обидва імпортують спільний `types.ts`); (в) головне — **план пропонував дві нові залежності (`react-resizable-panels`, `interact.js`), хоча в репозиторії вже є готовий, перевірений в бою патерн для рівно цієї задачі** — `src/blockLibrary/ResizablePreview.tsx` / `src/templateLibrary/components/ResizablePreview.tsx` (hand-rolled `pointerdown`/`pointermove`/`pointerup`, курсор + `userSelect:none` на тілі документа під час драгу, коміт лише на `pointerup`). Це той самий підхід, який v1 сам собі пропонував для gap-ручки (Stage 2) як "не варте бібліотеки" — v2 узагальнює цей підхід на всі ручки (колонки, gap, padding, corner-radius) і **не додає жодної нової залежності**. Деталі й компроміс — розділ "Рішення щодо залежностей" нижче.
> Також v2 уточнює Stage 3 (`computeBoxStyle` як один файл, не два — Row поки не має тих самих полів, тож другий консьюмер не існує), виправляє `responsiveUtilityCatalog.ts` (`properties: string[]`, не `property: string` — багато записів чіпають кілька CSS-властивостей одразу), і додає explicit коалесинг для undo-історії, щоб текстові інпути в Inspector (onChange на кожен keystroke) не засмічували history.

## Контекст

Зараз редагування стилів блоків (padding, corner radius, border, shadow, gap, ширина колонок) відбувається виключно через числові інпути в бічній панелі Inspector ([SectionInspectorForm.tsx](src/templateBuilder/components/SectionInspectorForm.tsx), [RowInspectorForm.tsx](src/templateBuilder/components/RowInspectorForm.tsx)) — користувач хоче натомість керувати цим переважно мишкою прямо на canvas, у стилі Figma/Canva: тягнути край блока щоб змінити padding, тягнути кутову точку щоб змінити border-radius, тягнути розділювач між колонками щоб змінити їх ширину, бачити floating-тулбар над виділеним блоком тощо.

**Підтверджено читанням коду:** canvas зараз не WYSIWYG. [CanvasBlockShell.tsx:48](src/templateBuilder/canvas/CanvasBlockShell.tsx#L48) рендерить фіксовану схематичну плашку (`rounded-lg border-2 p-3` + текстовий лейбл "SECTION"/"ROW"); жодне з реальних значень `padding`/`fill`/`border`/`cornerRadius`/`shadow`/`gapPx` не потрапляє в `style` — єдине, що там є, це `{ transform: CSS.Transform.toString(transform), transition }`, суто dnd-kit позиціювання під час драгу. Єдиний виняток — [CanvasColumnBox.tsx:22](src/templateBuilder/canvas/CanvasColumnBox.tsx#L22) вже застосовує реальний `column.widthPercent` як `style={{ width }}`.

`canvas/*.tsx` (прев'ю) і `render/*.ts` (експорт у фінальний email HTML) не мають спільної логіки обчислення CSS/layout — жодних крос-імпортів між ними (перевірено). Вони імпортують спільний `types.ts` (модель даних), але жодної спільної функції рендеру/стилю немає — це і є ключовий ризик, який виправдовує Stage 3: додати WYSIWYG "в лоба" означало б написати другу, незалежну реалізацію тих самих обчислень padding/fill/border/radius/shadow, з ризиком розбіжності canvas ⇄ export з першого дня.

## Дослідження

Пошук готових бібліотек (react-moveable, craft.js, GrapesJS, tldraw, usewaypoint/email-builder-js та інші) показав: жодна не підходить "з коробки" — усі або вимагають повного володіння canvas (несумісно з існуючим Zustand+dnd-kit деревом), або застарілі, або license-заблоковані для продакшену.

**Додаткова перевірка, якої v1 не зробив:** у проєкті вже є `framer-motion` (^12.34.3) в залежностях, і — важливіше — вже є **готовий, працюючий в проді патерн ручного resize-хендла**: [src/blockLibrary/ResizablePreview.tsx](src/blockLibrary/ResizablePreview.tsx) (і його близнюк у `templateLibrary/`). Це Chrome-DevTools-style resize handle: `onMouseDown` на маленькому `<div>`-хендлі → `document.addEventListener('mousemove'/'mouseup')` → комп'ютить нову ширину на кожен рух, стейт `isDragging` дає live-фідбек, комітить назовні (`onWidthChange`) лише на `mouseup`, і during-drag вішає `cursor: ew-resize` + `userSelect: none` на `document.body`. framer-motion тут використаний лише для fade-in тултипа з поточним значенням, не для самої drag-механіки.

Це прямий, вже перевірений в бою прецедент для рівно того, що потрібно в Stage 1/2/4 (розділювач колонок, gap-ручка, padding/corner-radius ручки) — без жодної нової залежності. Двох кандидатів з v1 розглянуто предметно:

- **`react-resizable-panels`** розв'язав би розділювач колонок, але приніс би власний внутрішній стан розкладки (`PanelGroup`), який довелось би синхронізувати з `widthPercent` у Zustand-сторі — це друге джерело правди для тієї самої величини, плюс власні `minSize`/`collapsible`/id-персистенція, які тут не потрібні. Наявний `column.widthPercent` вже й так single source of truth і вже рендериться як реальний CSS — треба лише drag-хендл, що пише в нього, не новий шар стану.
- **`interact.js`** розв'язав би padding/corner-radius ручки, але дублює те, що `ResizablePreview.tsx` вже робить руками в 15 рядках, і додає ще одну pointer-event систему поряд із dnd-kit у тому самому дереві — зайва поверхня для конфліктів (детальніше нижче).

## Рішення щодо залежностей

**Нових залежностей не додаємо.** Увесь план реалізується через один спільний хук `canvas/usePointerDrag.ts`, що узагальнює ідіому з `ResizablePreview.tsx` (Pointer Events + `setPointerCapture` замість `document`-рівня mousemove/mouseup — надійніше, не губить події, коли курсор виходить за межі елемента чи навіть вікна під час швидкого руху; той самий commit-лише-на-відпускання принцип):

```ts
// canvas/usePointerDrag.ts
interface PointerDragOptions {
  cursor: string; // "col-resize" | "ns-resize" | "nwse-resize" | ...
  onDragStart?: () => void;
  onDrag: (delta: { dx: number; dy: number }) => void;   // накопичений зсув від pointerdown, на кожен pointermove
  onDragEnd: (delta: { dx: number; dy: number }) => void; // фінальний зсув — єдине місце, де стадії 1/2/4 комітять у стор
}

function usePointerDrag(options: PointerDragOptions): {
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
}
```

Реалізація: `onPointerDown` викликає `e.currentTarget.setPointerCapture(e.pointerId)` і `e.stopPropagation()` (щоб клік не спливав до `CanvasBlockShell`-обгортки й не тригерив `onSelect`/dnd-kit — детальніше в розділі про dnd-kit нижче), запам'ятовує стартові координати, вішає `onPointerMove`/`onPointerUp`/`onPointerCancel` на сам елемент (не на `document` — pointer capture гарантує доставку навіть за межами елемента), рахує `{dx, dy}` відносно старту, на `onPointerUp` викликає `onDragEnd` один раз і знімає capture. Курсор і `userSelect: none` виставляються на `document.body` на час драгу — той самий прийом, що вже є в `ResizablePreview.tsx:66-73`.

Один хук, чотири споживачі (Stage 1 розділювач колонок, Stage 2 gap-ручка, Stage 4 × 5 ручок padding+radius) — це усунення дублювання, яке вже намітилось у самому v1 (Stage 2 explicitly визнавав "не виправдовує бібліотеки, ~10 рядків" — v2 просто не пише ці ~10 рядків чотири рази).

**Компроміс, який варто озвучити користувачу явно:** якщо в майбутньому знадобляться складніші жести (інерція, snap-to-grid з анімацією, multi-touch), `interact.js`/`framer-motion drag` дадуть це "з коробки" дешевше, ніж нарощувати власний хук. На масштабі цього плану (лінійний однoвісний рух, коміт на відпускання) власний хук простіший і не вимагає нової залежності — але це свідомий вибір "мінімальна поверхня зараз" ціною можливого рефакторингу пізніше, якщо вимоги зростуть.

### dnd-kit конфлікт — переоцінено вниз проти v1

v1-фактчек підняв сумнів, що ручки з interact.js фізично конфліктуватимуть з dnd-kit через bubbling. Перечитавши [CanvasBlockShell.tsx:51](src/templateBuilder/canvas/CanvasBlockShell.tsx#L51): dnd-kit'івські `{...attributes} {...listeners}` навішені **лише на сам grip-хендл** (`<button aria-label='Drag to reorder'>`), не на кореневий `<div ref={setNodeRef}>`. Тобто dnd-kit drag ініціюється тільки з grip-кнопки — нові ручки Stage 4 (padding-краї, corner-radius), розташовані деінде всередині shell, фізично не можуть тригернути dnd-kit `PointerSensor` навіть без жодного guard'а. Єдине, що реально потрібне — `e.stopPropagation()` в `onPointerDown` ручки, щоб не спливав `onClick` кореневого div'а (`onSelect`) під час драгу; `usePointerDrag` робить це за замовчуванням (див. вище). Ризик з v1-фактчеку був обґрунтованим побоюванням "у принципі", але код показує, що реальної загрози тут нема — вартий згадки, але не блокер.

## Підхід

7 послідовних стадій. **Важливе уточнення проти v1:** "незалежно мерджабельні" — правда лише в сенсі "кожна не ламає попередні й проходить власний PR-review окремо". Це **не** незалежність у сенсі порядку: Stage 4 буквально редагує файл, створений у Stage 3 (`CanvasWysiwygShell.tsx`), і Stage 0 (`commit()` choke-point) — **фундамент, яким зобов'язана дисципліновано користуватись кожна наступна стадія**: якщо Stage 2 чи Stage 4 напише мутатор в обхід `commit()`, undo/redo мовчки не покриє цю зміну. Кожен наступний Stage explicitly перевіряє це в чеклисті.

`CanvasRowBox.tsx` (окрім заміни `<div className='flex gap-2'>` на drag-хендл між колонками в Stage 1) та всі leaf-компоненти (`CanvasLeafChip.tsx`, `CanvasChipShell.tsx`, `CanvasReadyMadeChip.tsx`) залишаються без змін протягом усього цього плану — переведення Row/leaves на WYSIWYG свідомо винесено за межі цього milestone.

---

## Stage 0 — Undo/redo + multi-select store (фундамент, ~1-2 дні)

### Дизайн

**Choke-point.** [builderStore.ts](src/templateBuilder/state/builderStore.ts) реально має **7** прямих викликів `builderStore.setState(...)`: `updateShellConfig` (L57), `updateNodeFields` (L219), `updateResponsiveClassNames` (L233), `updateSectionStyle` (L241), `updateRowStyle` (L249), `resetBuilderState` (L273), і сам `mutateTree` (L45, обгортає `addLeaf`/`addReadyMade`/`addContainer`/`addColumn`/`removeColumn`/`removeNode`/`moveNode`). Усі переводяться через один `commit`:

```ts
// state/historyStore.ts
interface BuilderSnapshot { rootIds: string[]; nodes: Record<string, BuilderNode> }
interface HistoryState { past: BuilderSnapshot[]; future: BuilderSnapshot[]; lastCommitAt: number | null }

const MAX_HISTORY = 100;
const COALESCE_WINDOW_MS = 500; // швидкі послідовні коміти (typing у Inspector, drag-move) зливаються в один крок

export function pushHistorySnapshot(snapshot: BuilderSnapshot, now: number): void
export function undo(): BuilderSnapshot | null
export function redo(): BuilderSnapshot | null
export function useCanUndo(): boolean
export function useCanRedo(): boolean
export function resetHistory(): void // викликає resetBuilderState
```

```ts
// builderStore.ts
function commit(updater: (tree: CanvasTree) => CanvasTree, now: number = Date.now()) {
  const before = getTree();
  pushHistorySnapshot({ rootIds: before.rootIds, nodes: before.nodes }, now);
  mutateTree(updater);
}
```

**Коалесинг, не "не комітити кожен keystroke".** v1 пропонував уникати спаму в history лише для canvas-драгу ("коміт на pointerup"), але Inspector-інпути ([SectionInspectorForm.tsx:56-103](src/templateBuilder/components/SectionInspectorForm.tsx#L56)) вже сьогодні викликають `updateSectionStyle` на кожен `onChange` — тобто на кожен keystroke. Заборонити це на рівні виклику означало б переписати всі Inspector-форми на `onBlur`, що змінює наявний UX (live-прев'ю під час набору). Замість цього — часове злиття на рівні `historyStore`: якщо `pushHistorySnapshot` викликається повторно в межах `COALESCE_WINDOW_MS` від попереднього коміту, новий "перед"-знімок **не** додається (попередній вже є правильним "до" для об'єднаного кроку) — весь burst введення "552" в поле стає одним undo-кроком, а не трьома. `now` передається явно (не `Date.now()` всередині) — сумісно з обмеженням workflow/тестів на недетерміновані виклики й дозволяє детерміновано тестувати коалесинг, підставляючи фіксовані таймстемпи.

**`selectedIds`:**

```ts
// state/selectionStore.ts — додається до існуючого selectedId
interface SelectionState {
  selectedId: string | null;
  selectedIds: Set<string>;
}
export function useSelectedIds(): Set<string>
export function useIsMultiSelected(id: string): boolean
export function toggleBlockSelection(id: string): void
```

`removeNode`/`removeColumn` (builderStore.ts:181-198) вже чистять `selectedId` при видаленні через `getSelectedId()`/`selectBlock(null)` — розширити тим самим патерном для `selectedIds`.

**Keyboard-шорткати:** у [BuilderCanvas.tsx](src/templateBuilder/canvas/BuilderCanvas.tsx) — `useEffect` з `window.addEventListener('keydown', ...)`, `Cmd/Ctrl+Z` → `undo()` і застосувати повернутий snapshot через `builderStore.setState(snapshot)` напряму (без проходу через `commit`, інакше undo сам напише в history), `Shift+Cmd/Ctrl+Z` → `redo()`. Guard: ігнорувати, коли фокус у text input/contenteditable (інакше ламає Cmd+Z у CodeMirror-подібних полях, якщо такі з'являться, і в звичайних `<input>` Inspector'а).

### Файли

- `state/historyStore.ts` (новий)
- `state/builderStore.ts` — `commit()`, усі 7 `setState`-викликів переведені через нього
- `state/selectionStore.ts` — `selectedIds`
- `canvas/BuilderCanvas.tsx` — keyboard-шорткати

### Тести

`__tests__/historyStore.test.ts` (новий):
- `undo() повертає null, коли past порожній`
- `commit → undo повертає стан ДО мутації`
- `commit → undo → redo повертає стан ПІСЛЯ мутації`
- `новий commit після undo очищає future (redo-стек)`
- `два commit в межах COALESCE_WINDOW_MS зливаються в один undo-крок`
- `два commit з розривом > COALESCE_WINDOW_MS лишаються двома окремими кроками`
- `past обрізається на MAX_HISTORY (101-й коміт скидає найстаріший знімок)`
- `useCanUndo/useCanRedo відображають реальний стан past/future`

`__tests__/selectionStore.test.ts` (новий — досі не існує):
- `toggleBlockSelection додає/прибирає id з selectedIds`
- `useIsMultiSelected повертає true лише для id в selectedIds`
- `selectBlock(null) не чистить selectedIds (незалежні поля)`

`__tests__/builderStore.test.ts` — розширити наявні тести на "removeNode/removeColumn чистять selectedIds" (аналогічно наявним тестам для `selectedId`, builderStore.test.ts:210-291).

### Ризики / чеклист на майбутнє

- Кожен новий мутатор у Stage 1/2/4 **мусить** йти через `commit()`, не напряму через `mutateTree`/`builderStore.setState` — інакше мовчки випадає з undo. Явний пункт у чеклисті кожної наступної стадії нижче.
- `undo()`/`redo()` застосовують snapshot напряму в `builderStore.setState`, обходячи `commit` — свідомо, щоб сам undo не плодив нові history-записи.

---

## Stage 1 — Видимі перемоги без WYSIWYG (~2-3 дні)

Усе нижче працює на поточній схематичній плашці — жодних змін рендеру не потребує.

### Дизайн

**`duplicateNode(id): string`** — глибоке клонування піддерева:

```ts
export function duplicateNode(id: string): string {
  const node = getNode(id);
  if (!node) return "";
  let newId = "";
  commit((tree) => {
    const clone = cloneSubtree(tree, id); // canvasTree.ts: рекурсивно нові id (crypto.randomUUID()), ремап parentId/childIds, зберігає порядок
    newId = clone.rootId;
    return insertNode(tree, clone.node, node.parentId, childIdsOf(tree, node.parentId).indexOf(id) + 1); // одразу після оригіналу
  });
  selectBlock(newId);
  return newId;
}
```

`cloneSubtree` — нова чиста функція в `canvasTree.ts` (поруч з `insertNode`/`removeNodeFromTree`, той самий шар, незалежно тестований без стору), не в `builderStore.ts`.

**`nodeRectRegistry.ts`:**

```ts
// canvas/nodeRectRegistry.ts
const registry = new Map<string, HTMLElement>();
export function registerNodeRef(id: string, el: HTMLElement | null): void
export function getNodeRect(id: string): DOMRect | null
```

Наповнюється тим самим `el`, який уже йде в dnd-kit `setNodeRef` у `CanvasBlockShell.tsx`/`CanvasChipShell.tsx` — не новий ref, композиція існуючого:

```ts
// CanvasBlockShell.tsx — приклад композиції, id передається як новий проп
ref={(el) => { setNodeRef(el); registerNodeRef(id, el); }}
```

**`SelectionToolbar.tsx`** — портал (`createPortal` в `document.body`), підписується на `useSelectedId()`, на зміну — читає `getNodeRect(selectedId)`, позиціонується `position: fixed` над блоком. Перерахунок на: зміну `selectedId`, `window resize`, `scroll` на canvas-контейнері (`addEventListener('scroll', ..., { capture: true })`, бо scroll canvas-панелі не спливає до window за замовчуванням тільки якщо вона сама скролиться — перевірити фактичний scroll-контейнер під час імплементації, це `CanvasRootDropZone`'s `overflow-y-auto` div, [BuilderCanvas.tsx:49](src/templateBuilder/canvas/BuilderCanvas.tsx#L49)).

**Alt-drag дублювання:** `BuilderCanvas.tsx` — `altPressedRef = useRef(false)`, `window keydown/keyup` на `Alt`. У `handleDragEnd`, гілка `activeData.kind === "node"`: якщо `altPressedRef.current`, спершу `duplicateNode(activeId)` (лишає копію на місці оригіналу, бо `duplicateNode` вставляє одразу після), потім штатний `moveNode(activeId, ...)` рухає **оригінал** — копія лишається позаду. Без підміни active-draggable dnd-kit посеред жесту.

**`updateColumnWidths(rowId, percents)`** — узагальнення `redistributeColumnWidths` (builderStore.ts:156-165, приватна, хардкодить `evenWidthPercents`):

```ts
export function updateColumnWidths(rowId: string, percents: number[]): void {
  commit((tree) => {
    const columnIds = childIdsOf(tree, rowId);
    if (columnIds.length !== percents.length) return tree; // захист від розсинхрону виклику з реальною кількістю колонок
    const nodes = { ...tree.nodes };
    columnIds.forEach((columnId, i) => { nodes[columnId] = { ...(nodes[columnId] as RowColumnBlock), widthPercent: percents[i] }; });
    return { ...tree, nodes };
  });
}
```

**Розділювач колонок — БЕЗ react-resizable-panels** (рішення вище), через `usePointerDrag`. Чиста функція для математики (тестована окремо від DOM):

```ts
// canvas/resizeMath.ts
/** Переносить `deltaPercent` між колонкою `i` та `i+1`, інші не чіпає. Клемпить обидві до
 * мінімуму `minPercent`, щоб жодна колонка не могла зникнути під драгом. */
export function columnWidthsAfterDividerDrag(widths: number[], dividerIndex: number, deltaPercent: number, minPercent = 8): number[]
```

`CanvasRowBox.tsx`: між сусідніми `CanvasColumnBox`-ами — `<div>`-розділювач (~6px, `cursor-col-resize`), `usePointerDrag({ cursor: "col-resize", onDrag: ({dx}) => { /* live-прев'ю: локальний useState з тимчасовими ширинами */ }, onDragEnd: ({dx}) => { const deltaPercent = (dx / rowRef.current.clientWidth) * 100; updateColumnWidths(rowId, columnWidthsAfterDividerDrag(currentWidths, i, deltaPercent)); } })`. `rowRef` — локальний ref на flex-контейнер `CanvasRowBox.tsx:54`, не залежить від `nodeRectRegistry` (той — для `SelectionToolbar`, інша задача).

### Файли

- `state/builderStore.ts` — `duplicateNode`, `updateColumnWidths` (замінює приватний `redistributeColumnWidths` на публічний узагальнений виклик; `addColumn`/`removeColumn` далі можуть викликати `updateColumnWidths(rowId, evenWidthPercents(...))` замість власної приватної функції — усунення дублювання)
- `state/canvasTree.ts` — `cloneSubtree`
- `canvas/nodeRectRegistry.ts` (новий)
- `canvas/resizeMath.ts` (новий) — `columnWidthsAfterDividerDrag`
- `canvas/usePointerDrag.ts` (новий)
- `canvas/SelectionToolbar.tsx` (новий)
- `canvas/CanvasBlockShell.tsx`, `canvas/CanvasChipShell.tsx` — `registerNodeRef`
- `canvas/CanvasRowBox.tsx` — розділювач колонок
- `canvas/BuilderCanvas.tsx` — Alt-drag, монтування `<SelectionToolbar />`

### Тести

`__tests__/canvasTree.test.ts` — додати до наявного файлу:
- `cloneSubtree дає нові id для кожного вузла піддерева (жоден не збігається з оригіналом)`
- `cloneSubtree зберігає структуру (childIds ремапнуті на нові id, порядок незмінний)`
- `cloneSubtree на листі повертає клон без childIds-специфіки`

`__tests__/resizeMath.test.ts` (новий):
- `переносить deltaPercent між сусідніми колонками, інші лишає незмінними`
- `клемпить обидві колонки до minPercent, коли drag намагається звести одну в 0 чи від'ємне`
- `сума percents після операції завжди дорівнює сумі до операції (жодна ширина не губиться і не з'являється з нізвідки)`

`__tests__/builderStore.test.ts` — додати:
- `duplicateNode клонує піддерево і вставляє одразу після оригіналу в тому самому батьку`
- `duplicateNode на вузлі з дітьми клонує весь піддерево (перевірити getNode на клонованих дітях)`
- `duplicateNode на неіснуючому id повертає "" і нічого не міняє`
- `updateColumnWidths оновлює widthPercent усіх колонок рядка в переданому порядку`
- `updateColumnWidths — no-op, якщо довжина percents не збігається з кількістю колонок`
- `addColumn/removeColumn і далі рівномірно розподіляють ширини (регресія на існуючу поведінку після рефакторингу redistributeColumnWidths)`

### Чеклист Stage 0-дисципліни

- [ ] `duplicateNode`, `updateColumnWidths` викликають `commit()`, не `mutateTree`/`builderStore.setState` напряму.

---

## Stage 2 — Gap для Section (~1 день)

### Дизайн

`NodeDropZone.tsx:20` — хардкод `space-y-1.5` замінюється на inline `style`, **лише коли контейнер — Section** (Row-колонки далі мають фіксований gap через Tailwind-клас, WYSIWYG для Row — поза цим planом):

```tsx
// NodeDropZone.tsx — новий проп containerKind: "section" | "column"
const style = containerKind === "section" ? { display: "flex", flexDirection: "column" as const, gap: `${gapPx}px` } : undefined;
const className = containerKind === "section" ? `min-h-12 rounded-md p-1.5 transition-colors ...` : `space-y-1.5 min-h-12 rounded-md p-1.5 transition-colors ...`; // Row-колонки зберігають старий space-y-1.5
```

Важливе уточнення дизайну, якого v1 не проговорював: email-експорт реалізує gap **інакше**, ніж CSS `gap` — `renderNodeList` ([renderNode.ts:47-49](src/templateBuilder/render/renderNode.ts#L47)) додає `gapPx` як `padding-bottom` кожній дитині, крім останньої (email-сумісний прийом, бо `gap` на table-based layout ненадійний у поштових клієнтах). CSS `gap` на canvas — **візуальне наближення**, не структурна відповідність; це прийнятно (Stage 2 не претендує на byte-parity, на відміну від Stage 3), але варто зафіксувати як свідоме рішення, а не проґавлений нюанс.

`SpacingOverlay.tsx` — hover-оверлей: на `mouseenter` контейнера з `containerKind === "section"`, для кожної пари сусідніх дітей читає `getNodeRect` обох (з `nodeRectRegistry`, Stage 1) і рендерить невелику мітку з числом px між їхніми нижнім/верхнім краєм — суто інформативний, нічого не комітить.

**Gap-ручка** — `usePointerDrag({ cursor: "ns-resize", ... })`, чиста математика:

```ts
// canvas/resizeMath.ts — додається
export function gapAfterDrag(startGapPx: number, deltaPx: number, min = 0, max = 200): number {
  return Math.max(min, Math.min(max, startGapPx + deltaPx));
}
```

Коміт через `updateSectionStyle(id, { gapPx })` — лише на `onDragEnd`, той самий принцип, що вже усталений у Stage 1.

### Файли

- `canvas/NodeDropZone.tsx` — `containerKind` проп, умовний `style`/`className`
- `canvas/SpacingOverlay.tsx` (новий)
- `canvas/resizeMath.ts` — `gapAfterDrag`
- `canvas/CanvasSectionBox.tsx` — передає `containerKind="section"` в `NodeDropZone`, монтує gap-ручку + `<SpacingOverlay />`

### Тести

`__tests__/resizeMath.test.ts` — додати:
- `gapAfterDrag клемпить до [0, 200]`
- `gapAfterDrag від'ємний deltaPx (тягнуть угору) зменшує gap, не йде нижче 0`

`__tests__/canvasTree.test.ts` чи новий `__tests__/nodeDropZone.test.tsx` (React Testing Library, якщо в проєкті вже є такий патерн для canvas-компонентів — перевірити перед додаванням, чи є RTL-тести на canvas/* взагалі; якщо ні, це перший такий тест і варто уточнити з користувачем формат):
- `NodeDropZone з containerKind="section" рендерить inline gap-style, що відповідає block.gapPx`
- `NodeDropZone з containerKind="column" зберігає space-y-1.5 (без регресії Row)`

### Чеклист Stage 0-дисципліни

- [ ] Gap-ручка комітить `updateSectionStyle` лише на `onDragEnd`, не на кожен `onDrag`.

---

## Stage 3 — Спільний шар обчислення стилів + Section WYSIWYG (~2-3 дні)

Єдина стадія, що вводить реальний WYSIWYG-рендер.

### Дизайн

**Один файл, не два.** v1 пропонував `styling/computeBoxStyle.ts` + `styling/toCssProperties.ts` як окремі модулі — переглянуто: на цьому етапі шар обслуговує рівно один тип блока (`SectionBlock`, бо `RowBlock` не має `fill`/`border`/`cornerRadius`/`shadow`/`gapPx` — [types.ts:138-144](src/templateBuilder/types.ts#L138)) і рівно двох консьюмерів. Розбиття на два файли для одного типу й двох викликачів — передчасна структура; об'єднано в один:

```ts
// styling/sectionBoxStyle.ts — свідомо не під render/ і не під canvas/, обидва імпортують, жоден не залежить від іншого
export interface ComputedSectionBox {
  paddingTop: number; paddingRight: number; paddingBottom: number; paddingLeft: number;
  fill?: string;
  border?: { widthPx: number; color: string };
  cornerRadius?: number;
  shadow?: { xPx: number; yPx: number; blurPx: number; color: string };
  ownWidthPx: number;
  childrenAvailableWidthPx: number;
}

/** Чисте обчислення — жодного форматування в CSS/HTML-рядок тут немає, обидва боки (email-рядок,
 * canvas React.CSSProperties) форматують ці самі числа/об'єкти по-своєму. */
export function computeSectionBox(block: SectionBlock, availableWidthPx: number): ComputedSectionBox {
  const ownWidthPx = block.widthPx ?? availableWidthPx;
  return {
    paddingTop: block.padding.top, paddingRight: block.padding.right,
    paddingBottom: block.padding.bottom, paddingLeft: block.padding.left,
    fill: block.fill, border: block.border, cornerRadius: block.cornerRadius, shadow: block.shadow,
    ownWidthPx,
    childrenAvailableWidthPx: Math.max(0, ownWidthPx - block.padding.left - block.padding.right),
  };
}

/** canvas-only форматування — React.CSSProperties, jsdom/браузер сам упорядковує CSSOM, тому
 * порядок ключів тут довільний (на відміну від renderSection.ts, де порядок — частина тесту). */
export function toReactStyle(computed: ComputedSectionBox): React.CSSProperties {
  return {
    paddingTop: computed.paddingTop, paddingRight: computed.paddingRight,
    paddingBottom: computed.paddingBottom, paddingLeft: computed.paddingLeft,
    backgroundColor: computed.fill,
    border: computed.border ? `${computed.border.widthPx}px solid ${computed.border.color}` : undefined,
    borderRadius: computed.cornerRadius,
    boxShadow: computed.shadow ? `${computed.shadow.xPx}px ${computed.shadow.yPx}px ${computed.shadow.blurPx}px ${computed.shadow.color}` : undefined,
    width: computed.ownWidthPx,
  };
}
```

**Критичний дизайн-момент, якого v1 недооцінив:** [renderSection.test.ts](src/templateBuilder/__tests__/renderSection.test.ts) прив'язаний до **точного текстового формату й ПОРЯДКУ** CSS-рядка — зокрема padding йде в незвичному порядку `right, left, top, bottom` ([renderSection.ts:16](src/templateBuilder/render/renderSection.ts#L16), [renderSection.test.ts:12](src/templateBuilder/__tests__/renderSection.test.ts#L12)), і `extraStyleParts` збираються в порядку fill→border→cornerRadius→shadow→border-collapse ([renderSection.test.ts:30-34](src/templateBuilder/__tests__/renderSection.test.ts#L30)). Тому `renderSection.ts` **не переходить на `toReactStyle`** (вона суто canvas-only) — він продовжує сам збирати той самий рядок у тому самому порядку, **лише читаючи числа з `computeSectionBox()` замість напряму з `block.*`**:

```ts
// renderSection.ts, рефакторинг — рядки 15-38 замінюються на:
export function renderSection(block: SectionBlock, nodes: Record<string, BuilderNode>, shell: ShellConfig, availableWidthPx: number): string {
  const c = computeSectionBox(block, availableWidthPx);
  const paddingStyle = `padding-right: ${c.paddingRight}px; padding-left: ${c.paddingLeft}px; padding-top: ${c.paddingTop}px; padding-bottom: ${c.paddingBottom}px;`;
  const extraStyleParts: string[] = [];
  if (c.fill) extraStyleParts.push(`background-color: ${escapeHtml(c.fill)}`);
  if (c.border) extraStyleParts.push(`border: ${c.border.widthPx}px solid ${escapeHtml(c.border.color)}`);
  if (c.cornerRadius) extraStyleParts.push(`border-radius: ${c.cornerRadius}px`);
  if (c.shadow) extraStyleParts.push(`box-shadow: ${c.shadow.xPx}px ${c.shadow.yPx}px ${c.shadow.blurPx}px ${escapeHtml(c.shadow.color)}`);
  if (c.border || c.cornerRadius) extraStyleParts.push("border-collapse: separate", "border-spacing: 0");
  // ...решта тексту функції (widthAttr, bgcolorAttr, childrenHtml) незмінна, читає block.widthPx і c.childrenAvailableWidthPx
}
```

Це буквально той самий рядковий код, що й сьогодні — тільки джерело чисел інше. `__tests__/renderSection.test.ts` проходить без жодної зміни в самому тесті (гарантія, не сподівання, бо форматування рядка не рухається взагалі).

**`CanvasWysiwygShell.tsx`** — рамка виділення/grip-хендл/кнопка видалення як абсолютно позиційований оверлей-сиблінг **поза** боксом блока (не всередині його `padding`/`border`-класів), щоб реальний padding/border/radius могли жити прямо на самому боксі:

```tsx
interface CanvasWysiwygShellProps {
  id: string;
  computedStyle: React.CSSProperties; // toReactStyle(computeSectionBox(...))
  isSelected: boolean; isDragging: boolean; isOver: boolean;
  setNodeRef: (el: HTMLElement | null) => void;
  attributes: DraggableAttributes; listeners: DraggableSyntheticListeners;
  onSelect: () => void; onRemove: () => void;
  children: ReactNode; // NodeDropZone
}
```

`useSortable`/`attributes`/`listeners`/`setNodeRef` — той самий підхід, що вже в `CanvasBlockShell.tsx`, без змін dnd-kit-логіки. Grip-хендл і кнопка видалення — в оверлеї `position: absolute; top: -24px` над боксом (не всередині нього, інакше вони самі стали б частиною padded-контенту).

`CanvasSectionBox.tsx` перемикається на `CanvasWysiwygShell`, стилі боксу — `toReactStyle(computeSectionBox(section, availableWidth))`. **Проблема, яку v1 не розглянув:** `availableWidth` для canvas-рендеру сьогодні ніде не обчислюється (dnd-kit-дерево не знає про ширини предків так, як email-рендер, що явно передає `availableWidthPx` рекурсивно). Найпростіший робочий варіант у межах цього milestone: `CanvasSectionBox` для top-level (`parentId === null`) використовує `shell.contentWidthPx`; для вкладеного instance (усередині Row-колонки чи іншої Section) — `100%` рядкового contexts (`width: "100%"` замість числового px, `computeSectionBox` з `availableWidthPx = Infinity`-подібним flag або окремий `variant: "nested"` прапорець у `toReactStyle`, що emits `width: "100%"` замість `${ownWidthPx}px`). Це не byte-parity з email (там реальні px), а той самий компроміс, що вже існує сьогодні для `CanvasColumnBox` (`width: ${percent}%`, не px) — прийнятно для canvas-прев'ю, варто явно задокументувати як обмеження, не мовчазний пропуск.

`CanvasRowBox.tsx`/`CanvasNode.tsx` не змінюються — диспетчер уже делегує по `node.type` ([CanvasNode.tsx:18](src/templateBuilder/canvas/CanvasNode.tsx#L18)), нових розгалужень не потрібно.

### Файли

- `styling/sectionBoxStyle.ts` (новий, один файл) — `computeSectionBox`, `toReactStyle`
- `render/renderSection.ts` — рефакторинг на `computeSectionBox`, рядкова збірка залишається на місці
- `canvas/CanvasWysiwygShell.tsx` (новий)
- `canvas/CanvasSectionBox.tsx` — перемикається на WYSIWYG-shell

### Тести

`__tests__/sectionBoxStyle.test.ts` (новий):
- `computeSectionBox: ownWidthPx = block.widthPx, коли заданий`
- `computeSectionBox: ownWidthPx = availableWidthPx, коли block.widthPx undefined (вкладений instance)`
- `computeSectionBox: childrenAvailableWidthPx клемпиться до 0, коли padding перевищує ownWidthPx (та сама регресія, що вже покрита в renderSection.test.ts:66-78, — тепер юніт-тестована на чистій функції окремо від HTML-рядка)`
- `toReactStyle: fill/border/cornerRadius/shadow — undefined у ComputedSectionBox дають undefined у CSSProperties (не порожній рядок, не 0)`
- `toReactStyle: border форматується як CSS border shorthand`
- `toReactStyle: shadow форматується як CSS boxShadow shorthand`

`__tests__/renderSection.test.ts` — **без модифікацій**, увесь наявний набір (6 тестів) має пройти як є одразу після рефакторингу; це і є доказ відсутності регресії експорту.

### Чеклист Stage 0-дисципліни

- [ ] Жодних нових мутаторів у цій стадії (лише читання стану через `computeSectionBox`) — `commit()` не зачіпається.

---

## Stage 4 — Padding-edge та corner-radius ручки на Section (~2 дні)

### Дизайн

П'ять маленьких (~8px) абсолютно позиційованих `<div>`-ручок усередині `CanvasWysiwygShell.tsx` — 4 на краях (padding), 1 у куті (corner radius) — кожна через `usePointerDrag` (Stage 1). Чиста математика:

```ts
// canvas/resizeMath.ts — додається
export function paddingAfterEdgeDrag(padding: ContainerPadding, edge: "top" | "right" | "bottom" | "left", deltaPx: number, min = 0, max = 200): ContainerPadding {
  const sign = edge === "right" || edge === "bottom" ? 1 : -1; // тягнути край всередину зменшує padding для top/left, збільшує для right/bottom — залежить від напрямку хендла; уточнити знак під час імплементації разом з реальним UX-напрямком
  return { ...padding, [edge]: Math.max(min, Math.min(max, padding[edge] + sign * deltaPx)) };
}

/** Хендл сидить в одному куті боксу (напр. top-right); dxFromCorner/dyFromCorner — зсув поінтера
 * від точки кута вздовж кожної осі, ВСЕРЕДИНУ боксу (додатний = ближче до центру). Скалярний
 * radius (не per-corner — SectionBlock.cornerRadius: number, types.ts:124) береться як менший з
 * двох офсетів, щоб радіус не перевищував жодного з вимірів боксу біля цього кута. */
export function cornerRadiusFromPointerOffset(dxFromCorner: number, dyFromCorner: number, maxRadius: number): number {
  return Math.max(0, Math.min(maxRadius, Math.min(dxFromCorner, dyFromCorner)));
}
```

Коміт: `updateSectionStyle(id, { padding: paddingAfterEdgeDrag(...) })` / `updateSectionStyle(id, { cornerRadius })` — лише на `onDragEnd` (`usePointerDrag` вже дає це безкоштовно).

**`responsiveUtilityCatalog.ts` — виправлено проти v1.** v1 пропонував `property: string` (однина) на кожен запис `UTILITY_CLASS_CATALOG`. Прочитавши каталог: багато записів чіпають **кілька** CSS-властивостей одночасно — `px-*`/`py-*` ([responsiveUtilityCatalog.ts:113-114](src/templateBuilder/responsiveUtilityCatalog.ts#L113)) чіпають `padding-left`+`padding-right` чи `padding-top`+`padding-bottom`, `w-full` ([:125](src/templateBuilder/responsiveUtilityCatalog.ts#L125)) чіпає `width`+`max-width`+`min-width`. `property: string` не мапиться на ці записи без втрати інформації. Правильне поле — `properties: string[]`, і що важливіше — **не типізувати вручну поверх готового рядка `declaration`** (ризик розходження, як конкретно й трапляється типова помилка транскрипції, про яку вже застерігає коментар на [responsiveUtilityCatalog.ts:25-28](src/templateBuilder/responsiveUtilityCatalog.ts#L25)): `spacingScale()` вже приймає `cssProps: string[]` як параметр ([:29](src/templateBuilder/responsiveUtilityCatalog.ts#L29)) — досить прокинути його в кожен згенерований запис замість повторного набору руками:

```ts
// responsiveUtilityCatalog.ts
export interface UtilityClassEntry {
  className: string; tier: ResponsiveTier; group: string; declaration: string;
  properties: string[]; // нове — джерело правди для useResponsiveConflict, не парситься з declaration
}
function cls(tier, group, suffix, declaration, properties: string[]): UtilityClassEntry { return { ...(as before), properties }; }
function spacingScale(tier, group, prefix, cssProps: string[], steps): UtilityClassEntry[] {
  return steps.map((px) => cls(tier, group, `${prefix}-${px}`, ..., cssProps)); // properties = cssProps напряму, без дублювання
}
```

Кожен інший виклик `cls(...)` (display/width/height/font-size/line-height/text-align/vertical-align/misc групи) отримує явний `properties`-аргумент на місці виклику (компілятор примусить заповнити всі, бо параметр не опціональний) — напр. `w-full` отримує `["width", "max-width", "min-width"]`, `no-border` отримує `["border"]`.

**`useResponsiveConflict(nodeId, cssProperty)`:**

```ts
export function useResponsiveConflict(nodeId: string, cssProperty: string): boolean {
  const node = useBuilderNode(nodeId);
  return (node?.responsiveClassNames ?? []).some((cn) => {
    const entry = UTILITY_CLASS_CATALOG.find((e) => e.className === cn);
    return entry?.properties.includes(cssProperty) ?? false;
  });
}
```

Кожна ручка (напр. top-padding перевіряє `"padding-top"`) показує попереджувальний бейдж через наявний `@radix-ui/react-popover` (вже в `package.json` — не нова залежність), коли конфлікт є. Суто інформативно — драг усе одно пише desktop-значення.

`SpacingOverlay.tsx` (Stage 2) розширюється на padding — тепер чесно показує реальні числа, бо padding уже реальний CSS з Stage 3.

### Файли

- `canvas/resizeMath.ts` — `paddingAfterEdgeDrag`, `cornerRadiusFromPointerOffset`
- `canvas/CanvasWysiwygShell.tsx` — 5 ручок
- `responsiveUtilityCatalog.ts` — `properties: string[]` на кожному записі
- `state/builderStore.ts` чи новий `state/responsiveConflict.ts` — `useResponsiveConflict`
- `canvas/SpacingOverlay.tsx` — розширення на padding

### Тести

`__tests__/resizeMath.test.ts` — додати:
- `paddingAfterEdgeDrag клемпить кожен edge незалежно до [0, 200]`
- `paddingAfterEdgeDrag змінює лише вказаний edge, інші три лишає незмінними`
- `cornerRadiusFromPointerOffset бере менший з двох офсетів`
- `cornerRadiusFromPointerOffset клемпить до [0, maxRadius]`
- `cornerRadiusFromPointerOffset з від'ємним офсетом (курсор за межами боксу) повертає 0, не негативне число`

`__tests__/responsiveUtilityCatalog.test.ts` — розширити наявний файл (перевірити його зміст перед написанням — можливо вже покриває структуру каталогу):
- `кожен запис UTILITY_CLASS_CATALOG має непорожній properties`
- `spacingScale-згенеровані записи (padding-групи) мають properties, що точно збігаються з переданими cssProps`
- `px-*/py-* мають по 2 елементи в properties, не 1`
- `w-full має 3 елементи в properties (width, max-width, min-width)`

`__tests__/useResponsiveConflict.test.ts` (новий, чи inline в `builderStore.test.ts`/окремий файл — залежно від того, де живе хук):
- `повертає true, коли responsiveClassNames містить клас з properties, що включає перевірювану властивість`
- `повертає false, коли клас чіпає іншу властивість`
- `повертає false для вузла без responsiveClassNames`

### Чеклист Stage 0-дисципліни

- [ ] Усі 5 ручок комітять `updateSectionStyle` лише на `onDragEnd` (через `usePointerDrag`, не напряму).

---

## Загальний висновок по обсягу

Після Stage 4 користувач отримує: дублювання блока (кнопка + Alt-drag), drag розділювача між колонками, drag gap між дочірніми елементами Section, реальний WYSIWYG-рендер Section (padding/fill/border/radius/shadow видно наживо), drag-ручки padding і corner-radius на Section, попередження про конфлікт з responsive-класами, повноцінний undo/redo з коалесингом, і стор уже готовий до multi-select UI — **усе без жодної нової npm-залежності**.

Явно поза цим планом (наступний milestone): Row отримує ті самі можливості (потребує спершу розширити `RowBlock` типами `gapPx`/`fill`/`border`/`cornerRadius`/`shadow`, яких сьогодні нема — і тоді `sectionBoxStyle.ts` справді варто узагальнити на другий тип, коли з'явиться другий реальний консьюмер), WYSIWYG для leaf-блоків (Text/Image/Button/Divider/Spacer), UI для marquee-виділення (стор-шар з Stage 0 вже готовий), alignment/snap-guides.

## Ключові файли

| Файл | Роль |
|---|---|
| `src/templateBuilder/state/builderStore.ts` | choke-point `commit()`, `duplicateNode`, `updateColumnWidths` |
| `src/templateBuilder/state/historyStore.ts` | новий — undo/redo з коалесингом |
| `src/templateBuilder/state/selectionStore.ts` | `selectedIds` |
| `src/templateBuilder/state/canvasTree.ts` | `cloneSubtree` |
| `src/templateBuilder/styling/sectionBoxStyle.ts` | новий, один файл — `computeSectionBox`, `toReactStyle` |
| `src/templateBuilder/render/renderSection.ts` | рефакторинг на `computeSectionBox`, рядкова збірка без змін |
| `src/templateBuilder/canvas/CanvasWysiwygShell.tsx` | новий — оверлей-shell + 5 ручок Stage 4 |
| `src/templateBuilder/canvas/CanvasSectionBox.tsx` | переходить на WYSIWYG |
| `src/templateBuilder/canvas/CanvasRowBox.tsx` | drag-розділювач колонок (Stage 1) |
| `src/templateBuilder/canvas/resizeMath.ts` | новий — уся чиста математика ручок (колонки/gap/padding/radius) |
| `src/templateBuilder/canvas/usePointerDrag.ts` | новий — один хук для всіх ручок, замінює обидві v1-залежності |
| `src/templateBuilder/canvas/SelectionToolbar.tsx`, `nodeRectRegistry.ts`, `SpacingOverlay.tsx` | нові |
| `src/templateBuilder/canvas/BuilderCanvas.tsx` | Alt-drag, keyboard-шорткати |
| `src/templateBuilder/responsiveUtilityCatalog.ts` | `properties: string[]` для конфлікт-перевірки |
| ~~`package.json`~~ | **без змін — нових залежностей нема** |

## Перевірка

- `npm run test` — увесь наявний набір `templateBuilder/__tests__/*` має проходити без змін після кожної стадії; **`renderSection.test.ts` — доказ відсутності регресії експорту після Stage 3, буквально жодного рядка тесту не чіпаємо.**
- Нові тести (перелічені в кожній стадії вище) додаються разом з кожною стадією, не постфактум.
- Ручна перевірка в браузері (`npm run dev`, вкладка converter/templateBuilder) після кожної стадії — конкретний демо-сценарій: Stage 0 — Cmd+Z/Cmd+Shift+Z, набрати число в Inspector-полі і переконатись, що це один undo-крок, не N; Stage 1 — дублювання (кнопка + Alt-drag), drag розділювача колонок; Stage 2 — drag gap, hover-оверлей; Stage 3 — візуальний padding/fill/border/radius/shadow на Section відповідає Inspector-значенням; Stage 4 — drag-ручки, конфлікт-бейдж при активному responsive-класі на тій самій властивості.
- Порівняти експортований HTML (Export/Preview) до і після Stage 3 на тестовому шаблоні з непорожніми `fill`/`border`/`cornerRadius`/`shadow` на Section — байт-в-байт та сама розмітка (не лише `npm run test`, а й реальний diff у браузері — тести перевіряють `toContain`, не повний рядок, тож ручний byte-diff — додаткова, не надлишкова перевірка).

## Відкриті питання до користувача

Судження, які має ухвалити людина, не код:

1. **`COALESCE_WINDOW_MS = 500`** (Stage 0) — довільне число. Занадто малий вікно → typing "552" все одно дає 2-3 undo-кроки; занадто великий → швидкі осмислені окремі правки (зміни двох різних полів поспіль) зливаються в один крок і undo відкочує більше, ніж користувач очікував. 500ms — стартова гіпотеза, варта ручної перевірки під час Stage 0, не остаточне рішення.
2. **`minPercent = 8`** для ширини колонки при drag розділювача (Stage 1) і **`min/max = 0/200`** для padding/gap (Stage 2/4) — так само довільні дефолти, зручні для першої ітерації, не звірені з реальними UX-вимогами.
3. **Напрямок хендла для corner-radius** (Stage 4) — обрано один хендл в одному куті (бо `cornerRadius` — скаляр на всю секцію, не per-corner), за аналогією з Figma-single-corner-radius UX. Якщо очікування користувача — чотири незалежні corner-ручки з одним значенням, що синхронізується, це той самий скаляр з іншим UI-story, варто підтвердити перед Stage 4.
