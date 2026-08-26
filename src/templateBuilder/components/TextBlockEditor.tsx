import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateNodeFields } from "../state/builderStore";
import type { TextAlign, TextBlock } from "../types";
import { RichTextEditor } from "./RichTextEditor";

interface TextBlockEditorProps {
  block: TextBlock;
}

const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function TextBlockEditor({ block }: TextBlockEditorProps) {
  return (
    <div className='space-y-2'>
      <RichTextEditor key={block.id} value={block.contentHtml} onChange={(contentHtml) => updateNodeFields(block.id, { contentHtml })} />
      <div className='grid grid-cols-3 gap-2'>
        <div className='space-y-1'>
          <Label className='text-xs text-muted-foreground'>Size (px)</Label>
          <Input type='number' value={block.fontSizePx} onChange={(e) => updateNodeFields(block.id, { fontSizePx: Number(e.target.value) || 0 })} />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs text-muted-foreground'>Weight</Label>
          <Input type='number' step={100} min={100} max={900} value={block.fontWeight} onChange={(e) => updateNodeFields(block.id, { fontWeight: Number(e.target.value) || 400 })} />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs text-muted-foreground'>Color</Label>
          <Input type='color' value={block.color} onChange={(e) => updateNodeFields(block.id, { color: e.target.value })} />
        </div>
      </div>
      <div className='space-y-1'>
        <Label className='text-xs text-muted-foreground'>Align</Label>
        <select className={selectClass} value={block.align} onChange={(e) => updateNodeFields(block.id, { align: e.target.value as TextAlign })}>
          <option value='left'>Left</option>
          <option value='center'>Center</option>
          <option value='right'>Right</option>
        </select>
      </div>
      <div className='flex items-center gap-2'>
        <Checkbox checked={block.href !== undefined} onCheckedChange={(v) => updateNodeFields(block.id, { href: v ? "urlhere" : undefined })} />
        <Label className='text-xs'>Wrap entire block in a link</Label>
      </div>
      {block.href !== undefined && <Input value={block.href} onChange={(e) => updateNodeFields(block.id, { href: e.target.value })} placeholder='https://...' />}
    </div>
  );
}
