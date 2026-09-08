import { UTILITY_CLASS_CATALOG } from "../responsiveUtilityCatalog";
import { useBuilderNode } from "./builderStore";

const PROPERTIES_BY_CLASS_NAME = new Map(UTILITY_CLASS_CATALOG.map((entry) => [entry.className, entry.properties]));

/**
 * True when `nodeId` has a responsive utility class (any tier) that also touches `cssProperty` —
 * meaning a drag-edited desktop value (padding-edge/corner-radius handle) may be silently
 * overridden on narrower viewports by that class's `!important` rule. Informational only: the
 * drag still writes the desktop value regardless, this just flags the class-based override so the
 * warning surfaces at edit time instead of only inside a real email client.
 */
export function useResponsiveConflict(nodeId: string, cssProperty: string): boolean {
  const node = useBuilderNode(nodeId);
  return (node?.responsiveClassNames ?? []).some((className) => PROPERTIES_BY_CLASS_NAME.get(className)?.includes(cssProperty) ?? false);
}
