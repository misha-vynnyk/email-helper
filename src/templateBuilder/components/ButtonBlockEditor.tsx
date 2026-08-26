import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateLeaf } from "../state/builderStore";
import type { ButtonBlock, ButtonWidth, TextAlign } from "../types";

interface ButtonBlockEditorProps {
  block: ButtonBlock;
}

const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function ButtonBlockEditor({ block }: ButtonBlockEditorProps) {
  return (
    <div className='space-y-2'>
      <div className='space-y-1'>
        <Label className='text-xs text-muted-foreground'>Label</Label>
        <Input value={block.label} onChange={(e) => updateLeaf(block.id, { label: e.target.value })} />
      </div>
      <div className='space-y-1'>
        <Label className='text-xs text-muted-foreground'>Href</Label>
        <Input value={block.href} onChange={(e) => updateLeaf(block.id, { href: e.target.value })} placeholder='https://...' />
      </div>

      <div className='flex items-center gap-2'>
        <Checkbox checked={block.bgColor !== undefined} onCheckedChange={(v) => updateLeaf(block.id, { bgColor: v ? "#2563eb" : undefined })} />
        <Label className='text-xs'>Filled background</Label>
      </div>
      {block.bgColor !== undefined && <Input type='color' value={block.bgColor} onChange={(e) => updateLeaf(block.id, { bgColor: e.target.value })} />}

      <div className='space-y-1'>
        <Label className='text-xs text-muted-foreground'>Text color</Label>
        <Input type='color' value={block.textColor} onChange={(e) => updateLeaf(block.id, { textColor: e.target.value })} />
      </div>

      <div className='flex items-center gap-2'>
        <Checkbox checked={block.border !== undefined} onCheckedChange={(v) => updateLeaf(block.id, { border: v ? { widthPx: 1, color: "#000000" } : undefined })} />
        <Label className='text-xs'>Add border</Label>
      </div>
      {block.border !== undefined && (
        <div className='grid grid-cols-2 gap-2'>
          <div className='space-y-1'>
            <Label className='text-xs text-muted-foreground'>Border width (px)</Label>
            <Input type='number' value={block.border.widthPx} onChange={(e) => updateLeaf(block.id, { border: { ...block.border!, widthPx: Number(e.target.value) || 0 } })} />
          </div>
          <div className='space-y-1'>
            <Label className='text-xs text-muted-foreground'>Border color</Label>
            <Input type='color' value={block.border.color} onChange={(e) => updateLeaf(block.id, { border: { ...block.border!, color: e.target.value } })} />
          </div>
        </div>
      )}

      <div className='grid grid-cols-3 gap-2'>
        <div className='space-y-1'>
          <Label className='text-xs text-muted-foreground'>Radius (px)</Label>
          <Input type='number' value={block.borderRadiusPx} onChange={(e) => updateLeaf(block.id, { borderRadiusPx: Number(e.target.value) || 0 })} />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs text-muted-foreground'>Size (px)</Label>
          <Input type='number' value={block.fontSizePx} onChange={(e) => updateLeaf(block.id, { fontSizePx: Number(e.target.value) || 0 })} />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs text-muted-foreground'>Weight</Label>
          <Input type='number' step={100} min={100} max={900} value={block.fontWeight} onChange={(e) => updateLeaf(block.id, { fontWeight: Number(e.target.value) || 400 })} />
        </div>
      </div>

      <div className='space-y-1'>
        <Label className='text-xs text-muted-foreground'>Align</Label>
        <select className={selectClass} value={block.align} onChange={(e) => updateLeaf(block.id, { align: e.target.value as TextAlign })}>
          <option value='left'>Left</option>
          <option value='center'>Center</option>
          <option value='right'>Right</option>
        </select>
      </div>

      <div className='grid grid-cols-2 gap-2'>
        <div className='space-y-1'>
          <Label className='text-xs text-muted-foreground'>Width</Label>
          <select
            className={selectClass}
            value={typeof block.width === "number" ? "fixed" : block.width}
            onChange={(e) => {
              const mode = e.target.value;
              const width: ButtonWidth = mode === "fixed" ? (typeof block.width === "number" ? block.width : 210) : (mode as ButtonWidth);
              updateLeaf(block.id, { width });
            }}>
            <option value='auto'>Auto (fit content)</option>
            <option value='fixed'>Fixed (px)</option>
            <option value='full'>Full width</option>
          </select>
        </div>
        {typeof block.width === "number" && (
          <div className='space-y-1'>
            <Label className='text-xs text-muted-foreground'>Width (px)</Label>
            <Input type='number' value={block.width} onChange={(e) => updateLeaf(block.id, { width: Number(e.target.value) || 0 })} />
          </div>
        )}
      </div>
    </div>
  );
}
