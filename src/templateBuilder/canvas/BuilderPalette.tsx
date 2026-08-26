import { useDraggable } from "@dnd-kit/core";
import { Columns2, Columns3, Image as ImageIcon, type LucideIcon, Minus, MousePointerClick, MoveVertical, RectangleHorizontal, Type } from "lucide-react";

import type { DragData, PaletteType } from "../dnd/dragTypes";

const PALETTE_ITEMS: Array<{ paletteType: PaletteType; label: string; icon: LucideIcon }> = [
  { paletteType: "section", label: "Section", icon: RectangleHorizontal },
  { paletteType: "row2", label: "2-Col Row", icon: Columns2 },
  { paletteType: "row3", label: "3-Col Row", icon: Columns3 },
  { paletteType: "text", label: "Text", icon: Type },
  { paletteType: "image", label: "Image", icon: ImageIcon },
  { paletteType: "button", label: "Button", icon: MousePointerClick },
  { paletteType: "divider", label: "Divider", icon: Minus },
  { paletteType: "spacer", label: "Spacer", icon: MoveVertical },
];

function PaletteChip({ paletteType, label, Icon }: { paletteType: PaletteType; label: string; Icon: LucideIcon }) {
  const dragData: DragData = { kind: "palette", paletteType };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `palette-${paletteType}`, data: dragData });

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      type='button'
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className='flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-card px-3 py-3 text-xs font-medium text-foreground hover:border-primary/50 hover:bg-muted/40 transition-colors cursor-grab'>
      <Icon size={18} />
      {label}
    </button>
  );
}

/** Палітра структурних (Section/Row) і контентних (Text/Image) блоків — тягнеться на BuilderCanvas. */
export function BuilderPalette() {
  return (
    <div className='grid grid-cols-2 gap-2'>
      {PALETTE_ITEMS.map(({ paletteType, label, icon }) => (
        <PaletteChip key={paletteType} paletteType={paletteType} label={label} Icon={icon} />
      ))}
    </div>
  );
}
