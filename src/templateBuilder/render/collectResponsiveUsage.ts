import { READY_MADE_BY_ID } from "../readyMadeCatalog";
import type { BuilderNode } from "../types";

export interface ResponsiveUsage {
  /** Every utility class actually referenced somewhere on the canvas — either picked directly
   * via ResponsiveClassPicker, or pulled in by a ready-made block's `usesUtilityClasses`. */
  classNames: Set<string>;
  /** Every ready-made `definitionId` actually present, so their own `extraShellCss` can be
   * looked up and shipped only when that block type is actually used. */
  readyMadeIds: Set<string>;
}

/** One pass over the node map — drives renderShell.ts's tree-shaken `<style>` output (unused
 * utility classes, unused breakpoint tiers, and unused ready-made block CSS are never emitted). */
export function collectResponsiveUsage(nodes: Record<string, BuilderNode>): ResponsiveUsage {
  const classNames = new Set<string>();
  const readyMadeIds = new Set<string>();

  for (const node of Object.values(nodes)) {
    for (const className of node.responsiveClassNames ?? []) classNames.add(className);

    if (node.type === "ready-made") {
      readyMadeIds.add(node.definitionId);
      const definition = READY_MADE_BY_ID.get(node.definitionId);
      for (const className of definition?.usesUtilityClasses ?? []) classNames.add(className);
    }
  }

  return { classNames, readyMadeIds };
}
