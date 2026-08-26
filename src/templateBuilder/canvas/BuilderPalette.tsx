import { useDraggable } from "@dnd-kit/core";
import { Columns2, Columns3, Image as ImageIcon, LayoutTemplate, type LucideIcon, Minus, MousePointerClick, MoveVertical, RectangleHorizontal, Type } from "lucide-react";
import type { ReactNode } from "react";

import type { DragData, PaletteType } from "../dnd/dragTypes";
import { READY_MADE_CATALOG } from "../readyMadeCatalog";

const STRUCTURE_ITEMS: Array<{ paletteType: PaletteType; label: string; icon: LucideIcon }> = [
  { paletteType: "section", label: "Section", icon: RectangleHorizontal },
  { paletteType: "row2", label: "2-Col Row", icon: Columns2 },
  { paletteType: "row3", label: "3-Col Row", icon: Columns3 },
];

const CONTENT_ITEMS: Array<{ paletteType: PaletteType; label: string; icon: LucideIcon }> = [
  { paletteType: "text", label: "Text", icon: Type },
  { paletteType: "image", label: "Image", icon: ImageIcon },
  { paletteType: "button", label: "Button", icon: MousePointerClick },
  { paletteType: "divider", label: "Divider", icon: Minus },
  { paletteType: "spacer", label: "Spacer", icon: MoveVertical },
];

function PaletteChip({ dragId, label, Icon, dragData }: { dragId: string; label: string; Icon: LucideIcon; dragData: DragData }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: dragId, data: dragData });

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

function PaletteCategory({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className='space-y-1.5'>
      <h4 className='text-[10px] font-semibold text-muted-foreground uppercase'>{title}</h4>
      <div className='grid grid-cols-2 gap-2'>{children}</div>
    </div>
  );
}

/** Палітра структурних (Section/Row), контентних (Text/Image/...) і готових (Header etc.)
 * блоків — тягнеться на BuilderCanvas. Ready-made-секція генерується з READY_MADE_CATALOG, не
 * прописується вручну — новий готовий блок (Footer, соцмережі...) це лише новий запис у
 * каталозі, без змін тут. */
export function BuilderPalette() {
  return (
    <div className='space-y-3'>
      <PaletteCategory title='Structure'>
        {STRUCTURE_ITEMS.map(({ paletteType, label, icon }) => (
          <PaletteChip key={paletteType} dragId={`palette-${paletteType}`} label={label} Icon={icon} dragData={{ kind: "palette", paletteType }} />
        ))}
      </PaletteCategory>

      <PaletteCategory title='Content'>
        {CONTENT_ITEMS.map(({ paletteType, label, icon }) => (
          <PaletteChip key={paletteType} dragId={`palette-${paletteType}`} label={label} Icon={icon} dragData={{ kind: "palette", paletteType }} />
        ))}
      </PaletteCategory>

      <PaletteCategory title='Ready-made'>
        {READY_MADE_CATALOG.map((definition) => (
          <PaletteChip key={definition.id} dragId={`ready-made-${definition.id}`} label={definition.name} Icon={LayoutTemplate} dragData={{ kind: "ready-made", definitionId: definition.id }} />
        ))}
      </PaletteCategory>
    </div>
  );
}
