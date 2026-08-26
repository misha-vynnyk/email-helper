import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateNodeFields } from "../state/builderStore";
import type { SpacerBlock } from "../types";

interface SpacerBlockEditorProps {
  block: SpacerBlock;
}

export function SpacerBlockEditor({ block }: SpacerBlockEditorProps) {
  return (
    <div className='space-y-1'>
      <Label className='text-xs text-muted-foreground'>Height (px)</Label>
      <Input type='number' value={block.heightPx} onChange={(e) => updateNodeFields(block.id, { heightPx: Number(e.target.value) || 0 })} />
    </div>
  );
}
