import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateLeaf } from "../state/builderStore";
import type { DividerBlock } from "../types";

interface DividerBlockEditorProps {
  block: DividerBlock;
}

export function DividerBlockEditor({ block }: DividerBlockEditorProps) {
  return (
    <div className='grid grid-cols-3 gap-2'>
      <div className='space-y-1'>
        <Label className='text-xs text-muted-foreground'>Color</Label>
        <Input type='color' value={block.color} onChange={(e) => updateLeaf(block.id, { color: e.target.value })} />
      </div>
      <div className='space-y-1'>
        <Label className='text-xs text-muted-foreground'>Thickness (px)</Label>
        <Input type='number' value={block.thicknessPx} onChange={(e) => updateLeaf(block.id, { thicknessPx: Number(e.target.value) || 0 })} />
      </div>
      <div className='space-y-1'>
        <Label className='text-xs text-muted-foreground'>Width (%)</Label>
        <Input type='number' min={1} max={100} value={block.widthPercent} onChange={(e) => updateLeaf(block.id, { widthPercent: Number(e.target.value) || 0 })} />
      </div>
    </div>
  );
}
