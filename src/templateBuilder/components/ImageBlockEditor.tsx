import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateLeaf } from "../state/builderStore";
import type { ImageBlock } from "../types";

interface ImageBlockEditorProps {
  block: ImageBlock;
}

export function ImageBlockEditor({ block }: ImageBlockEditorProps) {
  return (
    <div className='space-y-2'>
      <div className='grid grid-cols-2 gap-2'>
        <div className='space-y-1'>
          <Label className='text-xs text-muted-foreground'>Alt text</Label>
          <Input value={block.alt} onChange={(e) => updateLeaf(block.id, { alt: e.target.value })} />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs text-muted-foreground'>Width (px)</Label>
          <Input type='number' value={block.widthPx} onChange={(e) => updateLeaf(block.id, { widthPx: Number(e.target.value) || 0 })} />
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <Checkbox checked={block.href !== undefined} onCheckedChange={(v) => updateLeaf(block.id, { href: v ? "urlhere" : undefined })} />
        <Label className='text-xs'>Wrap image in a link</Label>
      </div>
      {block.href !== undefined && <Input value={block.href} onChange={(e) => updateLeaf(block.id, { href: e.target.value })} placeholder='https://...' />}
    </div>
  );
}
