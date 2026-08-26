export type PaletteType = "section" | "row2" | "row3" | "text" | "image" | "button" | "divider" | "spacer";

/**
 * `"node"` covers moving ANY existing node — leaf, or a whole Section/Row(/Row-column)
 * subtree — since the normalized tree addresses every container the same way, regardless of
 * depth or type; `parentId: null` means "lives at the canvas root".
 *
 * `"ready-made"` is a separate palette-drag variant from `"palette"` (not folded into
 * `PaletteType`) because ready-made blocks are pure data (readyMadeCatalog.ts) — a new one is
 * just a new catalog entry, never a new literal to add to a closed union here.
 */
export type DragData = { kind: "palette"; paletteType: PaletteType } | { kind: "ready-made"; definitionId: string } | { kind: "node"; parentId: string | null };

/** What a drop target resolves to. `"container"` is a container's own background (its
 * NodeDropZone/CanvasRootDropZone) — insert at the end. `"node"` is hovering a specific sibling
 * — insert at that sibling's position. Both carry `parentId` directly; no id string ever needs
 * parsing to recover it. */
export type DropData = { kind: "container"; parentId: string | null } | { kind: "node"; parentId: string | null };

/** Opaque dnd-kit id for a container's own children drop-zone — deliberately distinct from the
 * container's own node id (which is already registered as a separate sortable/draggable via
 * `useSortable` on the box itself). The string itself carries no meaning; `DropData.parentId`
 * is what callers read. */
export function containerDropZoneId(containerId: string): string {
  return `${containerId}::drop`;
}
