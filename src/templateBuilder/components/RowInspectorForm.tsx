import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateRowStyle } from "../state/builderStore";
import type { RowBlock } from "../types";

interface RowInspectorFormProps {
  row: RowBlock;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='space-y-1'>
      <Label className='text-xs text-muted-foreground'>{label}</Label>
      {children}
    </div>
  );
}

export function RowInspectorForm({ row }: RowInspectorFormProps) {
  const update = (patch: Partial<Pick<RowBlock, "padding" | "widthPx">>) => updateRowStyle(row.id, patch);

  return (
    <div className='grid grid-cols-2 gap-3'>
      <Field label='Width (px, empty = fill container)'>
        <Input type='number' value={row.widthPx ?? ""} placeholder='auto' onChange={(e) => update({ widthPx: e.target.value === "" ? undefined : Number(e.target.value) || undefined })} />
      </Field>
      <div />
      <Field label='Padding top'>
        <Input type='number' value={row.padding.top} onChange={(e) => update({ padding: { ...row.padding, top: Number(e.target.value) || 0 } })} />
      </Field>
      <Field label='Padding right'>
        <Input type='number' value={row.padding.right} onChange={(e) => update({ padding: { ...row.padding, right: Number(e.target.value) || 0 } })} />
      </Field>
      <Field label='Padding bottom'>
        <Input type='number' value={row.padding.bottom} onChange={(e) => update({ padding: { ...row.padding, bottom: Number(e.target.value) || 0 } })} />
      </Field>
      <Field label='Padding left'>
        <Input type='number' value={row.padding.left} onChange={(e) => update({ padding: { ...row.padding, left: Number(e.target.value) || 0 } })} />
      </Field>
    </div>
  );
}
