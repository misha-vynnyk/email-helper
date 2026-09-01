import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { GripVertical, Trash2 } from "lucide-react";
import { memo, type CSSProperties, type ReactNode } from "react";

interface CanvasWysiwygShellProps {
  label: ReactNode;
  /** toReactStyle(computeSectionBox(...)) — the block's real padding/fill/border/cornerRadius/shadow/width, applied directly to this component's single root element. */
  computedStyle: CSSProperties;
  isSelected: boolean;
  isDragging: boolean;
  isOver: boolean;
  setNodeRef: (node: HTMLElement | null) => void;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  onSelect: () => void;
  onRemove: () => void;
  removeAriaLabel: string;
  /** { transform, transition } from dnd-kit — same object CanvasBlockShell's `style` prop carries. */
  positionStyle: CSSProperties;
  children: ReactNode;
}

/**
 * WYSIWYG counterpart to `CanvasBlockShell`, for Section only: the root element carries the
 * block's REAL computed box style (padding/fill/border/cornerRadius/shadow/width) instead of a
 * fixed schematic placeholder, so children render inset by the section's actual padding.
 *
 * The selection ring and the grip/label/remove chrome are `position: absolute` children of that
 * same root element rather than a separate box, deliberately — an absolutely positioned
 * descendant's `inset`/`top` offsets resolve against the root's padding edge regardless of the
 * root's own padding value, so the chrome can sit outside the visible box (`-top-6`) and the ring
 * can trace its edges (`inset-0`, `border-radius: inherit`) without either fighting the section's
 * real padding/border/radius the way nesting them inside a separately-padded wrapper would.
 *
 * `marginTop: 24` (inline, not a `mt-6` class) reserves the headroom the `-top-6` chrome needs
 * above it — without it, the first top-level Section's chrome is clipped by the scroll
 * container's own padding, and a Section stacked right below another has its chrome overlapping
 * the box above it (both confirmed live). This has to be an inline style, not a Tailwind class:
 * `CanvasRootDropZone`'s `space-y-3` compiles to `.space-y-3 > :not([hidden]) ~ :not([hidden])`,
 * whose specificity beats a plain `.mt-6` class for every non-first sibling — confirmed live, a
 * `mt-6` class was silently overridden back down to `space-y-3`'s 12px on every Section but the
 * first. An inline style always wins the cascade regardless of a parent's utility classes.
 */
export const CanvasWysiwygShell = memo(function CanvasWysiwygShell({
  label,
  computedStyle,
  isSelected,
  isDragging,
  isOver,
  setNodeRef,
  attributes,
  listeners,
  onSelect,
  onRemove,
  removeAriaLabel,
  positionStyle,
  children,
}: CanvasWysiwygShellProps) {
  const ringState = isSelected ? "selected" : isOver ? "over" : "idle";
  const ringClass = isSelected ? "border-primary" : isOver ? "border-primary/50 bg-primary/5" : "border-dashed border-border/60 hover:border-border";

  return (
    <div
      ref={setNodeRef}
      data-testid='wysiwyg-box'
      style={{ ...computedStyle, ...positionStyle, marginTop: 24, opacity: isDragging ? 0.4 : 1 }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className='relative min-h-12 cursor-pointer transition-colors'>
      <div
        data-testid='wysiwyg-ring'
        data-state={ringState}
        style={{ borderRadius: computedStyle.borderRadius }}
        className={`pointer-events-none absolute inset-0 border-2 transition-colors ${ringClass}`}
      />
      <div className='pointer-events-none absolute -top-6 left-0 right-0 flex items-center justify-between text-xs font-semibold text-muted-foreground'>
        <div className='pointer-events-auto flex items-center gap-2'>
          <button type='button' {...attributes} {...listeners} className='cursor-grab hover:text-foreground' aria-label='Drag to reorder'>
            <GripVertical size={14} />
          </button>
          {label}
        </div>
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className='pointer-events-auto text-muted-foreground hover:text-destructive'
          aria-label={removeAriaLabel}>
          <Trash2 size={14} />
        </button>
      </div>
      {children}
    </div>
  );
});
