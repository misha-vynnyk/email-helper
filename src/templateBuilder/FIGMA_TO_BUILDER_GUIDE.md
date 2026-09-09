# Figma → Template Builder guide

How a Claude Code session reads a Figma design and authors a `BuilderDocument` for this app's
Template Builder — either by hand through the Import JSON dialog (`BuilderPanel.tsx`'s "Import
JSON" button → `components/ImportJsonDialog.tsx`), or, once Phase 2 lands, via the `build_template`
MCP tool. Unlike `figma-to-html/CLAUDE.md` (gitignored, local-only notes for the old `figmaImport`
pipeline), this file is committed and travels with the repo — it's the guide for this app's own
block model, not a scratch pad for one investigation.

`schema.ts` is the source of truth for the exact shape of every field — this file doesn't
duplicate it. Read `schema.ts` (or `types.ts`, which it mirrors) before authoring a document; treat
anything below that disagrees with `schema.ts` as this guide being stale, not `schema.ts`.

## Reading the Figma source

1. **`get_design_context` first.** This is the primary source — it returns the actual structure,
   colors, spacing, and text content of the selected node(s), which is what you're translating.
2. **`get_metadata`/`get_screenshot` to orient and verify**, not to replace `get_design_context`.
   Use `get_metadata` when you need the node tree's ids/names without the full style payload;
   use `get_screenshot` to sanity-check your classification against what the design actually looks
   like (e.g. "is this really two columns, or one column with wide internal padding?").

## Classification discipline

Treat deviating from either of these as a sign you've misread the source, not as a stylistic choice:

- **Literal values, not role tokens.** A `SectionBlock.fill` is a literal `"#DADAD8"` (or a
  `linearGradient` object with literal stop colors) read straight off the Figma node — never a
  semantic name like `"brand-primary"` or `"surface-2"`. This app's templates don't have a design
  token layer; every value in the exported HTML is already the literal one the template's own
  hand-written source uses.
- **Plain Section/Row composition for repeated patterns — no special "card" or "list" primitive.**
  When the Figma source has N visually-repeated items (e.g. a row of link cards, a list of
  features), model each repetition as its own `SectionBlock`/`RowBlock` subtree with the same
  children, not as a single node with a `variant`/`items` array — this is just `BuilderNode`'s
  actual model: there is no repeating/list node kind in `schema.ts`.

## When a region should be one image instead of built from blocks

Applies to any visually self-contained region that combines a background photo with overlaid
text/logo/decoration — most commonly a header/hero banner. This schema has no way to overlay text
on an image anyway (blocks stack vertically, no absolute positioning), so approximating an overlay
with a separate `Image` + `Text` underneath it is a worse, lossy substitute for what's often
actually the right call: export the whole region as ONE image.

**Decision rule:** a region is a single image UNLESS it contains any of —
- a **date** (issue date, "today", any timestamp that changes per send),
- **lorem/placeholder text** (a clear sign the real copy gets typed in per send), or
- a **button** (any clickable CTA).

If none of these apply, export the region as ONE `ImageBlock` — call `get_screenshot` on that
exact node (not the whole page) to get a pixel-perfect composite with the text/logo/decoration
already baked in, and use that as `src`. Do NOT approximate it with separate `Image`/`Text` blocks
stacked below each other — that changes the actual layout (overlay becomes sequential) for no
benefit, since nothing in the region is editable per-send anyway.

If any of the three DO apply, decompose the region normally (`Section`/`Row`/`Text`/`Image`/
`Button`, per the rules above) — never bake changing content into a static image; a date or a
per-send headline baked into a raster image can't be edited without regenerating the image, has no
real text for screen readers, and can't be A/B-tested.

This is a judgment call made while reading the Figma source, not something the app can check after
the fact — once a region is authored as one `ImageBlock`, there's no text left in the document to
inspect. Apply it consistently at classification time, the same way the rules above are applied.

## When gradient fill / button icon actually apply

Both are real, but narrow: don't reach for them by default.

- **`ContainerFill` as a `linearGradient`** — only when the Figma node's fill genuinely is a CSS
  linear gradient (Figma will show multiple color stops on a single fill, not a flat color). A
  flat color is always just the plain color string, even if it looks like it could be a very
  short/subtle gradient — don't manufacture a 2-stop gradient out of a solid fill.
- **`ButtonBlock.icon`** — only when the button in the Figma source visibly has a small icon
  glyph before its label (the pattern this schema models came from a real "Unsubscribe" button
  with an icon; most buttons — CTAs, "Learn more", etc. — don't have one). If a button has no
  icon in the source, omit the field entirely rather than setting it to some default/placeholder
  icon.
  - `icon.src`: if you don't have a real uploaded URL for the icon yet, use
    `PLACEHOLDER_IMAGE_SRC` from `types.ts` (`"https://storage.5th-elementagency.com/files/"`) —
    the same placeholder convention every new `ImageBlock` already defaults to. The app's normal
    image-upload flow replaces it later; this phase doesn't need a real asset URL to produce a
    valid, renderable document.
  - `icon.alt`: write real alt text when the source makes the icon's meaning obvious (e.g. an
    envelope/unsubscribe icon → `"Unsubscribe"`). If it's genuinely unclear, leave it as a short
    literal placeholder — filling it in accurately later is the existing AI alt-text tool's job
    (`/ai-api/api/analyze`), not something to guess at during classification.

## Two mechanical reading mistakes to check for every time

Both of these are the kind of mistake that produces a document that still validates fine and
renders without errors — `validateBuilderDocument()` and the render pipeline have no way to catch
either, since both are about *reading the Figma source correctly*, not about the shape of the
resulting JSON. Check for both every time:

- **Gaps between top-level sections.** Figma frequently wraps a page's top-level sections in a
  `flex-col` container with its own `gap-*` (and often `padding` top/bottom on the outermost
  frame) — easy to miss because it's on a *wrapper* you don't otherwise need to model, not on any
  individual section. Since `BuilderNode`'s root list has no implicit spacing between siblings
  (unlike a `Section`'s `gapPx`, which only applies to ITS OWN children), that gap has to be
  authored explicitly as `SpacerBlock` nodes (`parentId: null`) between each top-level group, plus
  one before the first and one after the last if the wrapper had top/bottom padding too. Also
  check whether `shell.contentBackground` should match `shell.outerBackground` — if the Figma
  wrapper has no separate "content column" fill distinct from the page background (i.e. floating
  cards directly on one canvas color, not cards on a white content strip), set both shell colors
  the same so the spacer gaps show the right color instead of defaulting to white.
- **Picking the correct layer when photos are stacked.** A photo placeholder is often two (or
  more) `<img>`s layered in the same container — e.g. a plain/base rectangle fill underneath, and
  the real photo positioned absolutely on top of it, cropped via negative offsets to fill the
  frame. Reading `get_design_context`'s reference code top-to-bottom and grabbing the first `<img>`
  you see, or the one with the most generic name, is a real trap — it's frequently the base/mask
  layer, not the actual photo. The one that actually renders is the LAST `<img>` in that
  container's DOM order (later siblings paint on top in normal stacking), and it usually also has
  a descriptive `data-name` worth cross-checking against what the image is supposed to depict.

## Type cheat-sheet

The full, authoritative shapes live in `schema.ts`; this is just enough to recognize each kind
while reading a Figma tree. Every node also carries `id` (any unique string you assign) and
`parentId` (the id of its container, or `null` for a top-level node).

| Kind | Container? | Key fields |
|---|---|---|
| `section` | yes (`childIds`) | `padding`, `widthPx?`, `gapPx`, `fill?`, `border?`, `cornerRadius?`/`cornerRadii?`, `shadow?` |
| `row` | yes (`childIds`, of `row-column` only) | same style fields as `section`, minus `gapPx` (children sit side-by-side, not stacked) |
| `row-column` | yes (`childIds`) | `widthPercent` — a `row`'s children, always; count must be between `MIN_ROW_COLUMNS` (1) and `MAX_ROW_COLUMNS` (4) |
| `text` | no | `contentHtml`, `fontSizePx`, `fontWeight`, `color`, `align`, `fontFamily?`, `href?` |
| `image` | no | `src`, `alt`, `widthPx`, `href?` — default `src` to `PLACEHOLDER_IMAGE_SRC` when you don't have a real uploaded URL yet |
| `button` | no | `label`, `href`, `textColor`, `borderRadiusPx`, `align`, `fontSizePx`, `fontWeight`, `width` ("auto"/"full"/px), `bgColor?`, `border?`, `icon?` |
| `divider` | no | `color`, `thicknessPx`, `widthPercent` |
| `spacer` | no | `heightPx` |
| `ready-made` | no | `definitionId` (see `readyMadeCatalog.ts` for the current catalog), `values` (slot key → value) — a fixed, battle-tested snippet with a few editable slots; reach for one only when the Figma source is clearly the same pattern (e.g. a standard adaptive header), not as a shortcut around modeling something properly with the primitives above |

A document is `{ shell?: Partial<ShellConfig>, nodes: BuilderNode[] }` — `nodes` is a **flat
array**, not a nested tree; every node's `parentId`/`childIds` encode the structure. `rootIds` is
derived automatically (nodes with `parentId: null`, in array order) — don't include it yourself.
`shell` can omit any field; omitted fields fall back to `createDefaultShellConfig()`'s defaults.

Before submitting, run the document through `validateBuilderDocument()` (or the Import JSON
dialog, which calls it for you) — it catches both schema-shape mistakes and structural ones
(dangling `parentId`, a `childIds` entry that doesn't exist, a `row` with the wrong child count or
child kind, a `parentId` cycle) with a specific `path`/`message` per problem.
