План: WYSIWYG-паритет для Row/leaf-блоків, RichText-розширення, marquee-виділення, snap-значення, косметичний фікс хрому Section — v2

## Контекст

`canva-plan-v1.md` (Section WYSIWYG milestone, Stage 0-4) повністю пройдений і закомічений (`002a826`, 2026-09-08, гілка `feature/template-builder-stage1`). Той план прямо перелічив, що лишається поза його межами: Row не отримав того самого WYSIWYG, що й Section; leaf-блоки (Text/Image/Button/Divider/Spacer) рендеряться на canvas лише як "іконка + один рядок тексту"; косметична вада (grip/remove-хром першої Section клипується `overflow-y-auto`, chrome-strips сусідніх Section перекриваються при default gap) задокументована, але не виправлена; marquee-виділення й snap-guides — на "наступний milestone". Користувач попросив докладний план саме по цих пунктах.

Мета цього плану — довести canvas templateBuilder до того самого рівня "реального" WYSIWYG, що вже має Section, для Row і для leaf-блоків, плюс закрити відому косметичну ваду, розширити rich-text-редактор і додати дві нові можливості (marquee-виділення, snap-значення на вже наявних drag-ручках).

**Уточнено з користувачем перед фіналізацією (усі — рекомендовані варіанти):**
- Leaf-WYSIWYG — лише реальне візуальне прев'ю (контент і стилі редагуються через Inspector, як і сьогодні для Section: padding/fill/border там теж не редагуються "прямо в тексті"). Inline-редагування прямо на canvas — НЕ будується в цьому плані.
- "Snap-guides" у цьому білдері означає розумний snap ЗНАЧЕНЬ на вже наявних drag-ручках (padding/gap/ширина колонки/corner-radius) — прив'язка до круглих чисел і до значення сусіда/батька, з візуальною напрямною лінією. НЕ вільне позиціювання (тут його взагалі нема — усе стек/вкладеність).
- Marquee-виділення в цій версії — лише масове видалення/дублювання виділених блоків. Групове перетягування (пересування всіх виділених разом) — НЕ будується; перевпорядкування лишається по одному блоку.

**Порядок стадій.** Незалежно мерджабельні (кожна проходить власний PR-review), але порядок відображає зростання розміру/ризику: спершу малий косметичний фікс і природне продовження вже готового Section-патерну на Row, потім snap (розширює вже наявні ручки, нуль нової структури дерева), потім невеликий RichText-додаток, і насамкінець дві найбільші/найновіші фічі — leaf WYSIWYG (найбільша, нова інфраструктура стилів+ширини) і marquee (нова взаємодія на canvas).

---

## Stage 1 — Косметичний фікс: хром Section у `overflow-y-auto` (~0.5 дня)

### Проблема (підтверджено читанням коду)

`CanvasWysiwygShell.tsx:184` застосовує `marginTop: 24` (inline, не Tailwind-клас — навмисно, бо `CanvasRootDropZone`'s `space-y-3` [`BuilderCanvas.tsx:50`] переважає голий `.mt-6`-клас за специфічністю) **однаково до кожної Section**, включно з першою. Хром (grip/label/lock/remove) сидить при `-top-6` (`-24px`) відносно боксу — рівно на межі зарезервованого `marginTop`, без жодного запасу. Це дає два симптоми:
1. Для ПЕРШОЇ top-level Section — хром сидить впритул до верхньої межі контейнера (`CanvasRootDropZone`, `p-3 overflow-y-auto`, `BuilderCanvas.tsx:50`), без запасу — частково клипується скролбоксом.
2. Для СТЕКУ Section-ів — хром другої Section (той самий `-24px`-офсет від її власного боксу) сидить впритул до нижньої межі першої Section, без видимого проміжку — візуально "заходить" на неї.

Обидва симптоми — одна й та сама причина: `marginTop`-константа (24px) точно дорівнює офсету хрому (24px), тобто нуль реального запасу.

### Дизайн

Замінити магічне число на дві іменовані константи в `CanvasWysiwygShell.tsx`:
```ts
const CHROME_OFFSET_PX = 24;   // відповідає -top-6 на хром-рядку
const CHROME_CLEARANCE_PX = 8; // бажаний видимий проміжок над хромом
const SECTION_TOP_RESERVE_PX = CHROME_OFFSET_PX + CHROME_CLEARANCE_PX; // 32 — нове значення marginTop
```
Це одразу дає ≥8px чистого проміжку і для стеку Section-ів (маржа замінює `space-y-3`-маржу цілком, тому: `32 - 24(офсет хрому) = 8px` видимого проміжку над хромом другої Section, відносно нижньої межі першої).

Для ПЕРШОЇ Section запасу від самого `marginTop` вже достатньо (`p-3` контейнера (12px) + 32px marginTop - 24px офсет хрому = 20px до scrollport-межі) — окремого фіксу для `CanvasRootDropZone` не потрібно, якщо збільшити саме цю константу (перевірка — обов'язково жива, headless Chrome, див. нижче, не покладатись на цю арифметику "на папері").

**Побічний ефект, який варто задокументувати, не фіксити окремо:** Section, вкладена БЕЗПОСЕРЕДНЬО в іншу Section (через `NodeDropZone`'s `containerKind="section"`, flex+`gap`), отримає `gapPx + 32px` замість `gapPx + 24px` між вкладеними Section-дітьми — на 8px більше, ніж сьогодні (бо тут `marginTop` не ЗАМІНЮЄ проміжок, як у `space-y-3`, а ДОДАЄТЬСЯ до flex `gap`, який не має тієї самої "margin override" семантики). Це прийнятний, задокументований компроміс єдиної константи для всіх контекстів (top-level і вкладений) — не вартий per-parent-типу розгалуження заради 8px у рідкісному сценарії Section-в-Section.

### Файли

- `src/templateBuilder/canvas/CanvasWysiwygShell.tsx` — іменовані константи, `marginTop: SECTION_TOP_RESERVE_PX` замість `24`.

### Верифікація

Headless Chrome (playwright-core + системний Chrome-бінарник, той самий метод, що усталений у цьому модулі): 1) одна top-level Section — `chrome.getBoundingClientRect().top` ≥ `canvasRoot scrollport top` + 8px (не клипується); 2) дві Section у стеку — `secondChrome.bottom` ≤ `firstBox.bottom` мінус 0 (нуль перетину, з певним видимим проміжком, не впритул); 3) регресія: вкладена Section-в-Section і далі рендериться коректно (лише завідомо трохи більший проміжок, не крашиться/не з'їжджає). Позитивний+негативний контроль (git stash на pre-fix коді відтворює стару поведінку) — той самий прийом, що вже застосований для SelectionToolbar-бага в Stage 4.

### Реалізовано (2026-09-08)

Точно за планом — `CHROME_OFFSET_PX(24) + CHROME_CLEARANCE_PX(8) = SECTION_TOP_RESERVE_PX(32)`. Верифіковано headless Chrome з позитивним+негативним контролем: gap між стеком Section 0px→8px, clearance першої Section 13px→21px, 0 console errors. Один existing-тест (`CanvasWysiwygShell.test.tsx`) оновлено з `24px` на `32px` — очікувана зміна поведінки. 249/249 тестів, `tsc`/`eslint` чисто.

---

## Stage 2 — Row WYSIWYG (~2 дні)

### Дизайн

**Розширення типу.** `RowBlock` (`types.ts:149-155`) сьогодні має лише `padding`/`widthPx` — на відміну від `SectionBlock` бракує `fill`/`border`/`cornerRadius`/`cornerRadii`/`shadow`. Додати ці поля 1:1 з `SectionBlock` (опційні, той самий тип кожного поля). **Свідомо НЕ додавати `gapPx`** — Section's `gapPx` керує вертикальним проміжком між СТЕКОВАНИМИ дітьми; діти Row — це колонки, розташовані side-by-side, а не стеком, тож пряма аналогія не застосовна. Гутер між колонками (якщо колись знадобиться) — окрема, більш інвазивна фіча (зміна inline-block-техніки експорту), явно поза цим stage.

**Генералізація спільного шару стилів.** `styling/sectionBoxStyle.ts`'s `computeSectionBox`/`toReactStyle` типізовані конкретно під `SectionBlock` — але жодне з полів, які вони читають (`padding`/`widthPx`/`fill`/`border`/`cornerRadius`/`cornerRadii`/`shadow`), не є Section-специфічним після розширення RowBlock, і `gapPx` серед цих полів НІКОЛИ не читався (перевірено — `computeSectionBox` його не використовує). Оригінальний план Stage 3 (`canva-plan-v1.md:309`) свідомо тримав це в одному Section-типізованому файлі "доки не з'явиться другий реальний консьюмер" — він з'явився. Перейменувати файл `styling/sectionBoxStyle.ts` → `styling/boxStyle.ts`, `computeSectionBox` → `computeBoxStyle(block: BoxStyleSource, availableWidthPx)`, де `BoxStyleSource` — новий структурний тип (`Pick`-перетин полів, які реально читаються). Оновити всі імпорти (`renderSection.ts`, `CanvasSectionBox.tsx`, тест-файл перейменувати на `boxStyle.test.ts`) — чистий рефакторинг-перейменування, без бек-компат шимів/ре-експортів.

**Дедуплікація рядкової збірки CSS.** І `render/renderSection.ts`, і майбутній Row-рендер потребують ІДЕНТИЧНОЇ логіки збірки `extraStyleParts` (fill→border→cornerRadius→shadow→border-collapse, у тому самому порядку — байт-парність із `renderSection.test.ts` критична, не чіпати). Той самий принцип дедуплікації, що вже застосований для `render/paddingStyle.ts`'s `buildPaddingStyle()` (спільна для `renderSection.ts`/`renderRow.ts`): новий `render/containerStyleParts.ts`'s `buildContainerExtraStyleParts(computed: ComputedBoxStyle): string[]` — переносить існуючу логіку з `renderSection.ts` один в один (`renderSection.test.ts` не змінюється — доказ відсутності регресії, як і при кожному попередньому рефакторингу цього шару), і одразу використовується в `renderRow.ts`.

**`render/renderRow.ts`.** Сьогодні збирає лише `padding`/`widthPx` для зовнішнього wrapper'а. Додати виклик `computeBoxStyle(row, availableWidthPx)` + `buildContainerExtraStyleParts(computed)`, вставити результат у той самий `<table>`-wrapper, за яким уже йде існуюча inline-block/1-колонкова гілка (та частина коду не змінюється).

**`canvas/CanvasRowBox.tsx`.** Перейти з `CanvasBlockShell` на `CanvasWysiwygShell` — той самий перехід, що вже зробив `CanvasSectionBox.tsx` у Stage 3/4. Існуюча "Add column"-кнопка (сьогодні — in-flow дитина всередині `CanvasBlockShell`) переїжджає в `children`-слот `CanvasWysiwygShell` (той самий composition-патерн, `{children}` рендериться останнім). Padding-edge і corner-radius drag-ручки `CanvasWysiwygShell` вже параметризовані через generic callback-пропси (не через `SectionBlock` напряму) — підключити до нового `updateRowStyle` (`builderStore.ts:331-337`, розширити patch-тип на нові поля).

**`toggleCornerRadiusLock()` (`types.ts`).** Перевірити на місці, чи ця функція вже типізована структурно (generic over будь-який блок із `cornerRadius`/`cornerRadii`) чи прив'язана конкретно до `SectionBlock` — якщо друге, узагальнити той самий спосіб, що й `computeBoxStyle` (звузити до `BoxStyleSource`-подібного перетину), щоб Row міг використовувати той самий lock/unlock-тумблер, а не дублікат.

**`components/RowInspectorForm.tsx`.** Прочитати поточний `SectionInspectorForm.tsx` перед реалізацією — якщо Fill/Border/Corner-radius(+lock)/Shadow контроли там написані вручну (не в спільному під-компоненті), винести їх у новий спільний `components/ContainerStyleFields.tsx` (параметризований get/set-колбеками, не типом блока), і підключити в ОБИДВА `SectionInspectorForm`/`RowInspectorForm` — уникає дублювання нетривіальної форми, а не копіювання її вдруге.

### Файли

- `types.ts` — нові поля `RowBlock`, `createDefaultRowBlock` дефолти
- `styling/sectionBoxStyle.ts` → `styling/boxStyle.ts` (перейменування + узагальнення типу)
- `render/containerStyleParts.ts` (новий) — `buildContainerExtraStyleParts`
- `render/renderSection.ts` — читає через спільний `buildContainerExtraStyleParts` (рядкова збірка й порядок незмінні)
- `render/renderRow.ts` — fill/border/radius/shadow на зовнішній wrapper
- `canvas/CanvasRowBox.tsx` — перехід на `CanvasWysiwygShell`
- `state/builderStore.ts` — `updateRowStyle` patch-тип розширено
- `components/ContainerStyleFields.tsx` (новий, якщо підтвердиться дублювання) + `RowInspectorForm.tsx`/`SectionInspectorForm.tsx`

### Тести

- `boxStyle.test.ts` (перейменований `sectionBoxStyle.test.ts`) — існуючі кейси без змін + нові для Row-джерела
- `containerStyleParts.test.ts` (новий) — порядок/умовність частин
- `renderSection.test.ts` — **без модифікацій** (доказ відсутності регресії)
- `renderRow.test.ts` — нові кейси для fill/border/radius/shadow
- `CanvasRowBox`/`CanvasWysiwygShell` — regression-тести на composition з "Add column"-кнопкою

### Верифікація

Headless Chrome: Row отримує Fill/Border/Corner-radius/Shadow через Inspector і через drag-ручки (той самий сценарій, що вже пройшла Section у Stage 3/4), Preview/export парність (той самий byte-level підхід), "Add column"-кнопка й далі працює на межах 1/4 колонок.

### Реалізовано (2026-09-08)

Точно за планом. `CanvasBlockShell.tsx` після переходу `CanvasRowBox` на `CanvasWysiwygShell` лишився без жодного реального споживача — видалено як мертвий код (3 docblock-згадки в `SpacingOverlay.tsx`/`NodeDropZone.tsx`/`CanvasWysiwygShell.tsx` оновлено). `components/ContainerStyleFields.tsx` заразом дедублював вже наявний byte-ідентичний дублікат `Field`-компонента між `SectionInspectorForm.tsx`/`RowInspectorForm.tsx` (не було в плані явно, виявлено під час реалізації). Верифіковано headless Chrome: Fill(#ff00aa)/Border(1px)/CornerRadius(8px) через Inspector, `getComputedStyle` до/після на боксі, canvas⇄export парність через Preview-iframe (`bgcolor="#ff00aa"` присутній), "Add column" + 4 padding-edge + corner-radius ручки без регресії, 0 console errors. 260/260 тестів (249+11 нових), `tsc`/`eslint` чисто.

---

## Stage 3 — Snap-значення на існуючих drag-ручках (~1-1.5 дня)

### Дизайн

Стосується вже наявних чотирьох родин ручок: `columnWidthsAfterDividerDrag`, `gapAfterDrag`, `paddingAfterEdgeDrag`, `cornerRadiusFromPointerOffset` (усі — `canvas/resizeMath.ts`). Кожна вже клемпить у діапазон через спільний `clamp()`; додається ДРУГИЙ прохід — "притягнути до найближчого notable-значення, якщо в межах порогу":

```ts
// canvas/snapValue.ts (новий)
export function snapToNearest(value: number, candidates: number[], thresholdPx = 4): { value: number; snapped: boolean } {
  const nearest = candidates.reduce((best, c) => Math.abs(c - value) < Math.abs(best - value) ? c : best, candidates[0]);
  return Math.abs(nearest - value) <= thresholdPx ? { value: nearest, snapped: true } : { value, snapped: false };
}
```

Кандидати для snap — залежать від ручки:
- **Padding-edge** (px): круглі кроки (`0, 4, 8, 12, 16, 20, 24, 32, 40, ...` — та сама `spacingScale`-шкала, що вже використовує `responsiveUtilityCatalog.ts` для padding-класів, не новий довільний список) + поточне значення ПРОТИЛЕЖНОГО краю (symmetric-padding snap) + значення того самого краю в БАТЬКІВСЬКОМУ контейнері (align-with-parent snap).
- **Gap** (px): та сама `spacingScale`-шкала.
- **Corner-radius** (px): менший набір круглих кроків (`0, 4, 8, 12, 16, 24, 9999`-подібне "pill", узгодити конкретний список під час імплементації).
- **Ширина колонки** (%): круглі відсотки (`25, 33, 50, 66, 75`) + рівномірний розподіл для поточної кількості колонок (`100/N`, уже є як `evenWidthPercents()`).

**Виклик у кожному `onDrag`** (не лише `onDragEnd`) — це визначає ЖИВЕ значення під час перетягування (для live-прев'ю, який кожна ручка вже має), а `onDragEnd` комітить те саме snapped-значення. Кожна з чотирьох `resizeMath.ts`-функцій отримує новий необов'язковий `snapCandidates?: number[]`-параметр — якщо переданий, застосовує `snapToNearest` ПІСЛЯ клемпінгу (порядок важливий: спершу clamp у межі, потім snap, інакше snap міг би повернути значення поза дозволеним діапазоном).

**Візуальна напрямна лінія.** Коли `snapped === true` під час драгу — коротка dashed-лінія на рівні snap-значення (у тій самій системі координат, що вже використовує `SpacingOverlay`/padding-ручки — `getBoundingClientRect`-різниця, без нового шару позиціювання) + сам хендл підсвічується (той самий amber-колір, що вже використовує `useResponsiveConflict`-конфлікт-індикатор — переспоживання наявної візуальної мови, не нова кольорова система).

### Файли

- `canvas/snapValue.ts` (новий) — `snapToNearest`
- `canvas/resizeMath.ts` — `snapCandidates?`-параметр у кожній з 4 функцій
- `canvas/CanvasWysiwygShell.tsx` — передає кандидатів у кожен `useEdgeDrag`/`useCornerDrag`, рендерить напрямну лінію + amber-підсвітку при snap
- `canvas/CanvasColumnDivider.tsx`, `canvas/SpacingOverlay.tsx` — аналогічно для gap/ширини колонки

### Тести

- `snapValue.test.ts` (новий) — притягує в межах порогу, не притягує поза порогом, повертає `snapped: false` при порожньому списку кандидатів
- `resizeMath.test.ts` — розширити кожну з 4 функцій на кейс із `snapCandidates`

### Верифікація

Headless Chrome: drag padding-ручки близько до 16px → притягується рівно на 16 (з підсвіченою ручкою й напрямною), drag далі за поріг → значення вільне (не притягнуте); те саме для ширини колонки й corner-radius.

### Реалізовано (2026-09-08) — з двома свідомими відхиленнями від плану

1. **`resizeMath.ts` НЕ отримав `snapCandidates?`-параметр у 4 функціях**, як пропонував план. Snap застосовується ОКРЕМИМ кроком (`snapToNearest`, новий `canvas/snapValue.ts`) у кожному canvas-компоненті-споживачі, ПІСЛЯ виклику вже наявної clamp-функції — менш інвазивно (жодна з 4 існуючих сигнатур/тестів не змінюється), і `resizeMath.ts` лишається "лише clamp", `snapValue.ts` — окремий шар. `snapColumnWidths` (композиція `columnWidthsAfterDividerDrag` + snap для колонок) усе ж живе в `resizeMath.ts` поруч зі своєю сестринською функцією — react-refresh-лінтер підказав перенести з компонентного файлу.
2. **Візуальна напрямна лінія замінена на зміну кольору ручки** (emerald при снепі, замість плану "dashed-лінія + amber"). Amber уже зайнятий responsive-conflict-індикатором — той самий колір для двох різних сигналів був би поганим UX; окрема лінія-напрямна визнана зайвою, бо сам бокс/gap/ширина колонки й так візуально "стрибає" до круглого значення під час драгу — найясніший можливий сигнал уже є.

Кандидати: `SPACING_SNAP_STEPS_PX` (новий експорт `responsiveUtilityCatalog.ts`, перевикористовує вже наявну `PADDING_TOP.base`-шкалу) для padding/gap; padding-edge додатково снепиться до поточного значення протилежного краю (symmetric snap) — "align-with-parent" з плану свідомо НЕ реалізовано (потребувало б нового prop "батьківський padding", не виправдано для цього stage). Corner-radius — новий hand-picked `[0,4,8,12,16,24,32,50,100,200]`. Ширина колонки — `[25,33,50,66,75]` + `evenWidthPercents`.

Верифіковано headless Chrome: drag top-padding-ручки (дефолт 32px) на ~17px → комітиться рівно 48px, ручка підсвічена emerald саме в момент снепу. 272/272 тестів (249+12+11, з урахуванням Stage 2), `tsc`/`eslint` чисто.

**Follow-up (2026-09-08, одразу після):** користувач зауважив, що gap-ручка вже показувала px-бейдж під час драгу, а padding-edge/corner-radius — ні. Додано той самий `VALUE_BADGE_CLASS`-бейдж до всіх padding- і corner-radius-ручок, позиціонований назовні від боксу. Верифіковано headless Chrome ("40px"/"8px" видно під час драгу, зникає після відпускання), 0 console errors.

**Follow-up 2 (2026-09-08, скріншот):** справа в хром-смужці Section trash-кнопка дублювала `SelectionToolbar`'s duplicate/remove-пару й тіснила corner-radius lock/unlock-тумблер. Видалено з `CanvasWysiwygShell.tsx` (+ зайві `onRemove`/`removeAriaLabel`-пропси й `removeNode`-імпорт у `CanvasSectionBox.tsx`/`CanvasRowBox.tsx`). Видалення й далі працює виключно через `SelectionToolbar`. Верифіковано headless Chrome: 1 remove-кнопка (було 2), клік коректно видаляє блок. 279/279 тестів, `tsc`/`eslint` чисто.

**Follow-up 3 (2026-09-08, реальний баг):** top-padding-бейдж і topLeft/topRight corner-radius-бейджі рендерились коректно (DOM/текст/computed-style — усе нормально), але були візуально НЕвидимі — `SelectionToolbar` (портальований, `z-50`) завжди спливає над вибраним боксом і малюється поверх normal-flow-контенту без z-index, точно там, де ці два бейджі позиціонувались (`bottom-full`, назовні). `elementFromPoint` на власних координатах бейджа підтвердив: повертав тулбар, не бейдж. Фікс: обидва бейджі перевернуто "всередину" боксу (`top-full`) — колізія усунена без зміни z-index. Методологічний урок: Playwright's `.innerText()` НЕ ловить цей клас бага (читає текст із DOM незалежно від того, що реально намальовано зверху) — потрібен `elementFromPoint`-based check для будь-якої майбутньої live-верифікації видимості. Верифіковано до/після, 279/279 тестів, `tsc`/`eslint` чисто.

**Follow-up 4:** користувач попросив підсвічувати саму цифру (не лише тонку ручку) тим самим emerald-кольором при снепі. Новий спільний `canvas/snapValue.ts`'s `snapBadgeClassName(snapped)`, перевикористаний усіма 6 бейджами (4 padding-edge + corner-radius + gap, раніше `SpacingOverlay.tsx` мав власну копію того самого inline-стилю). Верифіковано headless Chrome: border-color бейджа = emerald при снепі, нейтральний сірий інакше. 281/281 тестів, `tsc`/`eslint` чисто.

---

## Stage 4 — Розширення RichTextEditor: italic/underline/списки (~1 день)

### Дизайн

`components/RichTextEditor.tsx` сьогодні має рівно три команди (`applyBold`/`applyLink`/`applyColor`, кожна — `document.execCommand(...)` + кнопка з `onMouseDown={keepFocus}` щоб клік не забирав фокус до виконання команди). Додати за тим самим патерном:
- Italic — `execCommand("italic")` (браузер емітить `<i>`, вже в allowlist)
- Underline — `execCommand("underline")` (емітить `<u>`)
- Bulleted list — `execCommand("insertUnorderedList")` (емітить `<ul><li>`)
- Numbered list — `execCommand("insertOrderedList")` (емітить `<ol><li>`)

**Свідомо НЕ додається вирівнювання** (`justifyLeft/Center/Right`) — `TextBlock` уже має block-рівневе поле `align: TextAlign`, кероване через Inspector; окрема rich-text-команда вирівнювання створила б два джерела правди для тієї самої властивості на одному блоці. Якщо колись знадобиться per-run-вирівнювання всередині одного текстового блоку — окреме рішення, поза цим stage.

**Sanitizer.** `render/sanitizeRichText.ts`'s `ALLOWED_TAGS` (`b, strong, i, em, span, font, a, br`) не містить `u`/`ul`/`ol`/`li` — без цього нові команди мовчки зрізаються DOMPurify. Додати чотири теги в allowlist. `ALLOWED_ATTR` не потребує змін (списки не приносять нових атрибутів через `execCommand`).

**Рендер у експорті.** `render/renderText.ts` вставляє `contentHtml` як є всередину `<td>` з готовими `font-family`/`line-height`/`color`. Список (`<ul>/<li>`) успадкує ці стилі з `<td>`, але отримає БРАУЗЕРНІ дефолтні маркер/відступи (не завжди однаково рендеряться в email-клієнтах) — свідомо MVP-scope: жодного додаткового email-safe-CSS-reset для списків у цьому stage, лише перевірка, що список взагалі не зникає/не ламає розмітку в Preview. Якщо після живої перевірки виявиться реальна проблема з відступами в конкретному клієнті — окремий, пізніший fidelity-фікс (той самий підхід, що вже усталений для інших fidelity-багів цього репо — фіксити на реальному репро, не наперед).

### Файли

- `components/RichTextEditor.tsx` — 4 нові кнопки/команди
- `render/sanitizeRichText.ts` — `ALLOWED_TAGS` += `u, ul, ol, li`

### Тести

- `sanitizeRichText.test.ts` — нові теги проходять, усе інше й далі зрізається
- `RichTextEditor`-компонентний тест (якщо є існуючий патерн для цього файлу — перевірити перед додаванням) — кожна нова кнопка викликає відповідний `execCommand`

### Верифікація

Headless Chrome: набрати текст, застосувати Italic/Underline/List, підтвердити в Preview-iframe що `<i>`/`<u>`/`<ul><li>` присутні в exported HTML, не зрізані.

### Реалізовано (2026-09-08)

Точно за планом. Новий `RichTextEditor.test.tsx` мокає `document.execCommand` (jsdom не має реального rich-text-движка) і перевіряє точну команду для кожної кнопки. Верифіковано живим Chrome: реальний `execCommand` дав `<i><u>...</u></i>` для Italic+Underline, `<ul><li>...</li></ul>` для Bulleted list, 0 console errors. 280/280 тестів (272+8), `tsc`/`eslint` чисто.

---

## Stage 5 — Leaf-block WYSIWYG: Text/Image/Button/Divider/Spacer + ready-made (~4-5 днів, найбільша стадія)

### Проблема

`CanvasLeafChip.tsx` + `CanvasChipShell.tsx` рендерять КОЖЕН leaf-тип однаково — іконка + один рядок plain-тексту (`leafPreviewText()`). Реальний вигляд (шрифт/колір/розмір/зображення/кнопка зі стилями) існує лише в `render/render*.ts`-функціях, які сьогодні споживає тільки `BuilderPreviewPane`'s iframe (`buildDocumentHtml` → `renderNode.ts`-диспетчер → повний HTML-документ, `srcDoc` на iframe). Мета — показати ТОЙ САМИЙ реальний рендер прямо на canvas-чіпі, без дублювання логіки рендеру вдруге.

### Дизайн

**Підхід — перевикористати `render/renderNode.ts`'s реальну розмітку буквально, не переписувати паралельний React-рендер.** Це напряму продовжує вже усталений у Stage 3 принцип "canvas і email-експорт — одне джерело правди для чисел" (`computeSectionBox`/`toReactStyle`), доведений до максимуму: тут те саме джерело правди — це вже готовий HTML-РЯДОК, і canvas просто вставляє його як є. Це дає byte-рівневу гарантію, що canvas ⇄ export ніколи не розійдуться (найсильніша можлива гарантія парності, сильніша за "порахували ті самі числа різним кодом").

**A. Спільна CSS-інфраструктура (без якої вставлені фрагменти виглядатимуть неправильно).** `render/renderNode.ts`'s фрагменти покладаються на глобальні класи/шрифти, які сьогодні існують лише всередині повного експортованого документа (`renderShell.ts`'s `<style>`-блок: `.button-width`/`.img-bg-block`/responsive utility-класи, Google Fonts `<link>`). Винести СТИЛЬОВУ частину `renderShell.ts` (без `<html>/<body>`-обгортки) у нову перевикористовувану `buildStyleBlockCss(shell, usedResponsiveClasses): string` — той самий рефакторинг-прийом "не два незалежні реалізації, одна спільна функція, обидва боки імпортують", що вже стандарт цього модуля. Ця CSS-строка монтується ОДИН раз у `BuilderCanvas.tsx` через звичайний `<style dangerouslySetInnerHTML={{__html: css}}>` (стандартний React-патерн для сирого CSS, без XSS-поверхні — це не user-контрольований HTML, той самий рівень довіри, що вже має `BuilderPreviewPane`'s повний `srcDoc`). Google Fonts `<link>` — окремий новий хук `useSyncGoogleFontsIntoDocument(shell)` (`useEffect`, синхронізує `<link>`-теги в РЕАЛЬНИЙ `document.head` застосунку, на відміну від iframe-документа Preview, який має власний ізольований `<head>`) — монтується там само.

**B. Прокидання `availableWidthPx` крізь canvas-дерево.** Реальні Button/Image-розміри (`width`/`max-width`) залежать від доступної ширини контейнера — сьогодні цей параметр рахується РЕКУРСИВНО лише в `render/renderNode.ts` (для експорту), `CanvasNode.tsx`'s canvas-диспетчер його взагалі не знає (`CanvasNode({id})`, без width-контексту). Додати `availableWidthPx: number`-проп, прокинутий від `CanvasSectionBox`/`CanvasRowBox`/`CanvasColumnBox` (які вже рахують `computeBoxStyle().childrenAvailableWidthPx`, зі Stage 2) через `NodeDropZone` → `CanvasNode` → кожен leaf-компонент — дзеркалить ТУ САМУ рекурсію, що вже є в `renderNode.ts`, лише як React-пропси замість функціональних параметрів.

**C. Розширення `CanvasChipShell.tsx` на реальний контент замість плоского `label: string`.** Замінити `label: string`-проп на `children: ReactNode` (grip/select/remove/registry-логіка лишається незмінною — це вже добре ізольований шар). Кожен leaf-тип отримує свій маленький canvas-компонент (`CanvasTextPreview.tsx`, `CanvasImagePreview.tsx`, `CanvasButtonPreview.tsx`, `CanvasDividerPreview.tsx`, `CanvasSpacerPreview.tsx`, і `CanvasReadyMadePreview.tsx` для ready-made — та сама механіка, дешево додається одразу як інші 5 готові), кожен викликає відповідну `render*(block, ..., availableWidthPx)`-функцію (уже готові з export-шляху, нуль нової рендер-логіки) і вставляє результат:
```tsx
<table role="presentation" style={{ pointerEvents: "none", width: "100%" }}>
  <tbody dangerouslySetInnerHTML={{ __html: renderText(block, availableWidthPx) }} />
</table>
```
`pointerEvents: "none"` на вставленому фрагменті — той самий прийом, що вже використовує `CanvasWysiwygShell`'s селекшн-ring (`pointer-events-none`), тут вирішує одразу дві проблеми: (1) клік на вставленому `<a>`/`<img>` не тригерить навігацію/нативну поведінку браузера, (2) клік завжди "провалюється" до зовнішнього `CanvasChipShell`-контейнера для виділення блока — без жодної додаткової `preventDefault`-логіки.

**Скоуп цього stage — лише візуальне прев'ю, без inline-редагування** (підтверджено з користувачем): контент і стилі й далі редагуються виключно через Inspector (`TextBlockEditor.tsx`'s `RichTextEditor`, `ButtonInspectorForm` тощо) — так само, як зараз редагуються Section-стилі. `CanvasNode.tsx`'s dispatcher отримує нові гілки для кожного leaf-типу (замінює єдиний fallthrough `return <CanvasLeafChip id={id} />` на явний switch, дзеркальний до `renderNode.ts`'s власного).

### Файли

- `render/renderShell.ts` — виділення `buildStyleBlockCss()` (перевикористовується і повним документом, і canvas)
- `hooks/useSyncGoogleFontsIntoDocument.ts` (новий)
- `canvas/BuilderCanvas.tsx` — монтування спільного `<style>` + виклик нового хука
- `canvas/CanvasNode.tsx` — явні гілки на кожен leaf-тип + `availableWidthPx`-проп
- `canvas/CanvasSectionBox.tsx`/`CanvasRowBox.tsx`/`CanvasColumnBox.tsx` — прокидання `availableWidthPx` дітям
- `canvas/NodeDropZone.tsx` — прокидання `availableWidthPx` далі
- `canvas/CanvasChipShell.tsx` — `label: string` → `children: ReactNode`
- `canvas/CanvasTextPreview.tsx`, `CanvasImagePreview.tsx`, `CanvasButtonPreview.tsx`, `CanvasDividerPreview.tsx`, `CanvasSpacerPreview.tsx`, `CanvasReadyMadePreview.tsx` (усі нові)
- Стара `canvas/CanvasLeafChip.tsx`/`leafPreviewText()` — видалити після переходу (не тримати мертвий код "про всяк випадок")

### Тести

- `buildStyleBlockCss.test.ts` (новий) — CSS-рядок ідентичний тій частині, яку раніше генерував `renderShell.ts` для повного документа (доказ відсутності регресії експорту)
- Кожен `CanvasXPreview.tsx` — RTL/jsdom-тест: вставлений HTML відповідає `render*()`'s власному виводу для тих самих вхідних даних
- `CanvasNode.test.tsx` — нові гілки диспетчера

### Верифікація

Headless Chrome (обов'язково — це найбільша зміна плану): Text/Image/Button/Divider/Spacer на canvas виглядають ІДЕНТИЧНО до Preview-вкладки для того самого блока (пряме порівняння `getBoundingClientRect`/computed-style або скріншот-diff), клік на вставленому Button/Image `<a>` НЕ навігує/не відкриває посилання, клік у будь-якому місці чіпа виділяє блок (не проваливсь у `pointer-events:none`-контент), кастомний Google Font з `ShellSettingsForm` реально застосовується до Text-прев'ю на canvas (не лише в Preview-iframe), 0 console errors.

---

## Stage 6 — Marquee-виділення: масове видалення/дублювання (~2 дні)

### Дизайн

**Вже готова інфраструктура (нічого не міняти):** `state/selectionStore.ts` уже має повний `selectedIds: Set<string>` шар (`toggleBlockSelection`/`useIsMultiSelected`/`removeIdsFromSelection`/`clearMultiSelection`) — підготовлений заздалегідь у Stage 0 (`canva-plan-v1.md`), досі не спожитий жодним UI.

**A. Нова bulk-мутація виділення.** Додати `setSelectedIds(ids: string[]): void` в `selectionStore.ts` (єдиний write, що ЗАМІНЮЄ, а не toggles — потрібен для "відпустив marquee → ось точний набір виділених").

**B. Rectangle-tracking hook.** Новий `canvas/useMarqueeSelection.ts` — НЕ перевикористовує `usePointerDrag` (той — delta-based, commit-on-end; marquee потребує живого прямокутника + неперервного hit-тесту на кожен рух, інша форма задачі). Слухає `onPointerDown` на фоні `CanvasRootDropZone` (`BuilderCanvas.tsx:50`) — з guard'ом: спрацьовує лише коли `e.target === e.currentTarget` (клік по порожньому фону, не по дочірньому блоку/чіпу — підтверджено кодом, що жоден дочірній блок не має dnd-kit-слухачів поза grip-кнопкою, тож конфлікту з drag-активацією нема). На кожен `pointermove` — рахує прямокутник (з урахуванням `scrollTop` контейнера, бо він `overflow-y-auto`) і хіт-тестить його проти `getNodeRect(id)` для кожного зареєстрованого в `nodeRectRegistry` id (перетин прямокутників — стандартна AABB-перевірка). На `pointerup` — викликає `setSelectedIds([...hitIds])`.

**C. Візуальний прямокутник** — `position: fixed` (або `absolute` відносно canvas-контейнера) напівпрозорий div, та сама візуальна мова, що вже використовує ring/hover-стани (`border-primary/50 bg-primary/5`).

**D. Візуальне підсвічування виділених.** `useIsMultiSelected(id)` сьогодні ніде не читається в шеллах — підключити в `CanvasWysiwygShell.tsx`/`CanvasBlockShell.tsx`/`CanvasChipShell.tsx` як ЩЕ ОДИН ring-стан (окремо від `isSelected`/`isOver`, той самий `ringClass`-паттерн, новий варіант кольору для "у групі").

**E. Bulk-видалення/дублювання.** Розширити `BuilderCanvas.tsx`'s існуючий keyboard-`useEffect` (уже обробляє Cmd+Z/Shift+Cmd+Z) новою гілкою: `Delete`/`Backspace`, коли `getSelectedIds().size > 0` — цикл `removeNode(id)` по кожному виділеному. **Важлива, вже наявна властивість архітектури, яку варто підтвердити тестом, не вважати саморозуміючою:** усі виклики в одному синхронному циклі потрапляють у `COALESCE_WINDOW_MS` (500ms) `historyStore.ts`'s коалесингу — тобто масове видалення N блоків автоматично стає ОДНИМ undo-кроком, без жодної спеціальної групуючої логіки. Дублювання — той самий цикл, `duplicateNode(id)` по кожному виділеному.

**Явно поза цим stage (підтверджено з користувачем):** групове перетягування виділених блоків разом. Перевпорядкування лишається по одному блоку через звичайний grip-drag.

### Файли

- `state/selectionStore.ts` — `setSelectedIds`
- `canvas/useMarqueeSelection.ts` (новий)
- `canvas/MarqueeRectangle.tsx` (новий) — візуальний прямокутник
- `canvas/BuilderCanvas.tsx` — монтування marquee-хука на `CanvasRootDropZone`, новий Delete/Backspace-кейс у keyboard-ефекті
- `canvas/CanvasWysiwygShell.tsx`/`CanvasBlockShell.tsx`/`CanvasChipShell.tsx` — новий multi-select ring-стан

### Тести

- `selectionStore.test.ts` — `setSelectedIds` замінює, не toggles
- `useMarqueeSelection`-математика (rectangle-intersection) — чиста функція, тестована окремо від DOM (винести hit-test у `canvas/marqueeMath.ts` за тим самим "чиста математика окремо від хука" принципом, що вже `resizeMath.ts`)
- `historyStore.test.ts` — новий кейс: N `commit()`-викликів у межах `COALESCE_WINDOW_MS` → один undo-крок (підтверджує припущення з дизайну явним тестом, не лише коментарем)

### Верифікація

Headless Chrome: drag marquee-прямокутник над трьома блоками → усі три підсвічені; Delete → усі три зникають, Cmd+Z → усі три повертаються ОДНИМ кроком; клік по одному блоку (не marquee) продовжує працювати як single-select без регресії; marquee, розпочатий на самому блоці (не фоні), НЕ стартує (замість цього — звичайний single-select клік).

---

## Загальний висновок по обсягу

Після всіх 6 стадій: жодного клипованого/накладеного хрому Section; Row має той самий Fill/Border/Corner-radius/Shadow WYSIWYG, що Section; чотири родини drag-ручок (padding/gap/колонки/radius) притягуються до розумних значень із візуальною напрямною; RichTextEditor підтримує italic/underline/списки; усі leaf-блоки (і ready-made) показують СПРАВЖНІй вигляд на canvas замість іконки+тексту; можна виділити кілька блоків прямокутником і масово видалити/дублювати. Явно поза обсягом (наступний можливий milestone): inline-редагування тексту прямо на canvas, групове перетягування виділених блоків, гутер між колонками Row, per-run вирівнювання в rich-text.

## Ключові файли (для швидкої орієнтації)

| Файл | Роль у плані |
|---|---|
| `src/templateBuilder/canvas/CanvasWysiwygShell.tsx` | Stage 1 (headroom-константи), Stage 2 (Row теж використовує), Stage 3 (snap-візуалізація), Stage 6 (multi-select ring) |
| `src/templateBuilder/styling/sectionBoxStyle.ts` → `boxStyle.ts` | Stage 2 — генералізація на Row |
| `src/templateBuilder/render/containerStyleParts.ts` (новий) | Stage 2 — дедуп extraStyleParts між Section/Row |
| `src/templateBuilder/canvas/resizeMath.ts`, `snapValue.ts` (новий) | Stage 3 |
| `src/templateBuilder/components/RichTextEditor.tsx`, `render/sanitizeRichText.ts` | Stage 4 |
| `src/templateBuilder/render/renderShell.ts`, `canvas/CanvasChipShell.tsx`, нові `CanvasXPreview.tsx` | Stage 5 (найбільша) |
| `src/templateBuilder/state/selectionStore.ts`, нові `useMarqueeSelection.ts`/`marqueeMath.ts` | Stage 6 |

## Перевірка (наскрізна для всього плану)

- `npx jest src/templateBuilder` після кожної стадії — весь наявний набір проходить без регресій; `renderSection.test.ts` не змінюється НІКОЛИ (наскрізний доказ відсутності регресії експорту через усі 6 стадій).
- `npx tsc --noEmit` — чисто після кожної стадії.
- Headless Chrome (playwright-core + системний Chrome-бінарник, `NODE_PATH=./node_modules`, той самий метод, що усталений у цьому модулі) — окремий прогін для кожної стадії, конкретні сценарії описані вище.
- Ручна перевірка `npm run dev` → вкладка Template Builder — після кожної стадії.
