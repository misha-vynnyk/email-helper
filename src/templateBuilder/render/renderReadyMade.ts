import { READY_MADE_BY_ID, type ReadyMadeSlot } from "../readyMadeCatalog";
import type { ReadyMadeBlock } from "../types";
import { escapeHtml } from "./escape";
import { responsiveClassAttr } from "./responsiveClassAttr";
import { isSafeHref } from "./security";

function substituteSlotValue(slot: ReadyMadeSlot, rawValue: string | undefined): string {
  const value = rawValue ?? slot.defaultValue;
  if (slot.kind === "href") return escapeHtml(isSafeHref(value) ? value : "urlhere");
  return escapeHtml(value);
}

/** Fills a ready-made block's fixed template with its current slot values — same
 * `escapeHtml`/`isSafeHref` sanitization every other renderer already uses (renderText.ts,
 * renderImage.ts), not new logic. Unknown `definitionId` (shouldn't happen) renders nothing
 * rather than throwing.
 *
 * `classAttrSlots` are substituted first, via the same `responsiveClassAttr` every other
 * renderer uses to merge a node's opted-in responsive classes onto its own literal class(es) —
 * otherwise a class checked in ResponsiveClassPicker would get tree-shaken into the exported
 * `<style>` (see collectResponsiveUsage.ts) but never actually land on any element. */
export function renderReadyMade(block: ReadyMadeBlock): string {
  const definition = READY_MADE_BY_ID.get(block.definitionId);
  if (!definition) return "";

  const withClassAttrs = (definition.classAttrSlots ?? []).reduce(
    (html, slot) => html.split(slot.placeholder).join(responsiveClassAttr(slot.baseClass, block.responsiveClassNames)),
    definition.template,
  );

  return definition.slots.reduce((html, slot) => html.split(`{{${slot.key}}}`).join(substituteSlotValue(slot, block.values[slot.key])), withClassAttrs);
}
