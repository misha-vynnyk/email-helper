import type { ResponsiveTier } from "./responsiveUtilityCatalog";
import { PLACEHOLDER_IMAGE_SRC } from "./types";

export type ReadyMadeSlotKind = "image-src" | "href" | "text";

export interface ReadyMadeSlot {
  key: string;
  label: string;
  kind: ReadyMadeSlotKind;
  defaultValue: string;
}

/** A block-specific CSS rule, scoped to one of the fixed responsive tiers (see
 * responsiveUtilityCatalog.ts) — NOT a bare/unscoped rule. `renderShell.ts` folds these into the
 * same `@media` block it already builds for that tier's utility classes, so a rule meant to only
 * apply below e.g. 464px never leaks into wider viewports. */
export interface ReadyMadeCssRule {
  tier: ResponsiveTier;
  selector: string;
  declaration: string;
}

/** One `{{placeholder}}` in `template` reserved for the node's own opted-in responsive classes
 * (see components/ResponsiveClassPicker.tsx), merged via render/responsiveClassAttr.ts with
 * whatever literal class(es) that element already has — same "existing class + opted-in
 * classes" merge every other renderer already does, just injected via a placeholder since a
 * ready-made template is a fixed string, not built up programmatically. */
export interface ReadyMadeClassAttrSlot {
  placeholder: string;
  /** Literal class this element already carries (e.g. "sm-hidden"), if any. */
  baseClass?: string;
}

export interface ReadyMadeDefinition {
  id: string;
  name: string;
  slots: ReadyMadeSlot[];
  /** Literal HTML with `{{slotKey}}` placeholders — see render/renderReadyMade.ts for substitution. */
  template: string;
  /** Where in `template` the node's own responsiveClassNames get merged in — see
   * ReadyMadeClassAttrSlot. Optional: a block with no such slot just can't be targeted by
   * ResponsiveClassPicker (nothing in its markup would receive the class anyway). */
  classAttrSlots?: ReadyMadeClassAttrSlot[];
  /** General utility classes (from responsiveUtilityCatalog.ts) this block's fixed markup
   * depends on — so tree-shaking still includes them even though nothing on the canvas
   * "manually" checked them via ResponsiveClassPicker. */
  usesUtilityClasses?: string[];
  /** Block-specific CSS with no home in the general utility catalog (e.g. a one-off class this
   * exact snippet invented) — shipped only when this definitionId is actually used anywhere on
   * the canvas, and only inside its declared tier's `@media` block. */
  extraShellCss?: ReadyMadeCssRule[];
}

const HEADER_SIMPLE_TEMPLATE = `<!--[------ Header start ------]-->
<tr>
  <td{{__classAttr__}} align="center"
    valign="top"
    style="margin: 0; padding: 0;">
    <a href="{{href}}"
      target="_blank"
      style="padding: 0; margin: 0; border: 0; text-decoration: none; display: block;">
      <img width="600"
        src="{{src}}"
        alt="Logo"
        style="display: block; margin: 0; padding: 0; border: 0; width: 100%; max-width: 600px; height: auto; object-position: center; object-fit: contain;" />
    </a>
  </td>
</tr>
<!--[------ Header / end ------]-->`;

const HEADER_ADAPTIVE_TEMPLATE = `<!--[------ Header start ------]-->
<tr>
  <td{{__classAttrDesktop__}} align="center"
    valign="top"
    style="margin: 0; padding: 0;">
    <a href="{{href}}"
      target="_blank"
      style="padding: 0; margin: 0; border: 0; text-decoration: none; display: block;">
      <img width="600"
        src="{{desktopSrc}}"
        alt="Logo"
        style="display: block; margin: 0; padding: 0; border: 0; width: 100%; max-width: 600px; height: auto; object-position: center; object-fit: contain;" />
    </a>
  </td>
  <!--[if !mso 9]><!-->
  <td{{__classAttrMobile__}} align="center"
    valign="top"
    style="margin: 0; padding: 0; display: none;">
    <a href="{{href}}"
      target="_blank"
      style="padding: 0; margin: 0; border: 0; text-decoration: none; display: block;">
      <img width="464"
        src="{{mobileSrc}}"
        alt="Logo"
        style="display: block; margin: 0; padding: 0; border: 0; width: 100%; max-width: 464px; height: auto; object-position: center; object-fit: contain;" />
    </a>
  </td>
  <!--<![endif]-->
</tr>
<!--[------ Header / end ------]-->`;

/** First two ready-made blocks — bundled here, not grown from scratch: a future third block
 * (footer, social row, ...) is pure data, no new palette/canvas/Inspector code needed. */
export const READY_MADE_CATALOG: ReadyMadeDefinition[] = [
  {
    id: "header-simple",
    name: "Header (simple)",
    slots: [
      { key: "src", label: "Logo image", kind: "image-src", defaultValue: PLACEHOLDER_IMAGE_SRC },
      { key: "href", label: "Link", kind: "href", defaultValue: "urlhere" },
    ],
    template: HEADER_SIMPLE_TEMPLATE,
    classAttrSlots: [{ placeholder: "{{__classAttr__}}" }],
  },
  {
    id: "header-adaptive",
    name: "Header (adaptive)",
    slots: [
      { key: "desktopSrc", label: "Desktop logo", kind: "image-src", defaultValue: PLACEHOLDER_IMAGE_SRC },
      { key: "mobileSrc", label: "Mobile logo", kind: "image-src", defaultValue: PLACEHOLDER_IMAGE_SRC },
      { key: "href", label: "Link", kind: "href", defaultValue: "urlhere" },
    ],
    template: HEADER_ADAPTIVE_TEMPLATE,
    classAttrSlots: [
      { placeholder: "{{__classAttrDesktop__}}", baseClass: "sm-hidden" },
      { placeholder: "{{__classAttrMobile__}}", baseClass: "sm-tab-cell" },
    ],
    usesUtilityClasses: ["sm-hidden"],
    // Only the small-screen override — the cell's base `display: none` stays inline on the cell
    // itself (matching the original reference snippet), this just flips it back on at the sm
    // breakpoint. Not in the general utility catalog: it's specific to this block's own
    // two-cell/MSO-conditional technique, not a reusable Tailwind-style primitive. Scoped to the
    // "sm" tier so it only applies below 464px, same as sm-hidden.
    extraShellCss: [{ tier: "sm", selector: ".sm-tab-cell", declaration: "display: block !important;" }],
  },
];

/** id-indexed lookup — every call site that needs "the definition for this id" (render, store
 * actions, canvas chips, drag labels, the Inspector editor) uses this instead of its own
 * `READY_MADE_CATALOG.find(...)` scan. O(1) instead of O(catalog size) per lookup; more relevant
 * as the catalog grows past its first 2 entries. */
export const READY_MADE_BY_ID: Map<string, ReadyMadeDefinition> = new Map(READY_MADE_CATALOG.map((definition) => [definition.id, definition]));
