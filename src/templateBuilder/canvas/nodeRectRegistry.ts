const registry = new Map<string, HTMLElement>();

/** Composed alongside each canvas box's own dnd-kit `setNodeRef`/`ref` callback (CanvasSectionBox,
 * CanvasRowBox, CanvasChipShell) — not a replacement for it. React invokes a callback ref with
 * `null` on unmount, so a removed/unmounted node unregisters itself automatically; no extra
 * cleanup effect needed. */
export function registerNodeRef(id: string, el: HTMLElement | null): void {
  if (el) registry.set(id, el);
  else registry.delete(id);
}

/** Recomputed on every call (no caching) — that's what lets SelectionToolbar reposition
 * correctly on scroll/resize just by calling this again. */
export function getNodeRect(id: string): DOMRect | null {
  const el = registry.get(id);
  return el ? el.getBoundingClientRect() : null;
}
