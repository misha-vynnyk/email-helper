import { Copy, Trash2 } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { duplicateNode, removeNode } from "../state/builderStore";
import { getSelectedId, useSelectedId } from "../state/selectionStore";
import { getNodeRect } from "./nodeRectRegistry";

const GAP_PX = 6;

/** Floating toolbar over the selected canvas block, portaled to document.body. Repositions on
 * scroll via a capture-phase `window` listener — the same technique already shipping in
 * `src/htmlConverter/components/EditorSelectionToolbar.tsx:71-72` — because a capture-phase
 * listener on `window` fires for a scroll on ANY descendant scrollable element even though native
 * `scroll` events don't bubble, so this doesn't need to know which specific ancestor
 * (CanvasRootDropZone's `overflow-y-auto` div) actually scrolls. */
export function SelectionToolbar() {
  const selectedId = useSelectedId();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  const reposition = useCallback(() => {
    const id = getSelectedId();
    const rect = id ? getNodeRect(id) : null;
    if (!rect) {
      setPosition(null);
      return;
    }
    const width = toolbarRef.current?.offsetWidth ?? 0;
    const height = toolbarRef.current?.offsetHeight ?? 0;
    setPosition({
      left: Math.max(GAP_PX, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - GAP_PX)),
      top: Math.max(GAP_PX, rect.top - height - GAP_PX),
    });
  }, []);

  // Two-phase positioning: the toolbar renders once (in the DOM, but not yet correctly placed)
  // before its own size is known, then this synchronously re-measures before paint — avoids a
  // visible flash at {0,0} on the very first render after a selection change.
  useLayoutEffect(reposition, [selectedId, reposition]);

  useEffect(() => {
    if (!selectedId) return undefined;
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [selectedId, reposition]);

  if (!selectedId || !position) return null;

  return createPortal(
    <div
      ref={toolbarRef}
      role='toolbar'
      aria-label='Selected block actions'
      style={{ position: "fixed", left: position.left, top: position.top }}
      className='z-50 flex items-center gap-1 rounded-md border border-border bg-card p-1 shadow-lg'>
      <button type='button' onClick={() => duplicateNode(selectedId)} className='text-muted-foreground hover:text-foreground p-1' aria-label='Duplicate block'>
        <Copy size={14} />
      </button>
      <button type='button' onClick={() => removeNode(selectedId)} className='text-muted-foreground hover:text-destructive p-1' aria-label='Remove block'>
        <Trash2 size={14} />
      </button>
    </div>,
    document.body
  );
}
