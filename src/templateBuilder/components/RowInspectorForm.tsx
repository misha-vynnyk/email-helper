import { Input } from "@/components/ui/input";

import { updateRowStyle } from "../state/builderStore";
import type { RowBlock } from "../types";
import { ContainerStyleFields, Field } from "./ContainerStyleFields";
import { parseOptionalWidthPx } from "./parseOptionalWidthPx";

interface RowInspectorFormProps {
  row: RowBlock;
}

export function RowInspectorForm({ row }: RowInspectorFormProps) {
  const update = (patch: Partial<Omit<RowBlock, "id" | "parentId" | "type" | "childIds">>) => updateRowStyle(row.id, patch);

  return (
    <div className='space-y-3'>
      <div className='grid grid-cols-2 gap-3'>
        <Field label='Width (px, empty = fill container)'>
          <Input type='number' value={row.widthPx ?? ""} placeholder='auto' onChange={(e) => update({ widthPx: parseOptionalWidthPx(e.target.value) })} />
        </Field>
        <div />
        <Field label='Padding top'>
          <Input type='number' value={row.padding.top} onChange={(e) => update({ padding: { ...row.padding, top: Math.round(Number(e.target.value) || 0) } })} />
        </Field>
        <Field label='Padding right'>
          <Input type='number' value={row.padding.right} onChange={(e) => update({ padding: { ...row.padding, right: Math.round(Number(e.target.value) || 0) } })} />
        </Field>
        <Field label='Padding bottom'>
          <Input type='number' value={row.padding.bottom} onChange={(e) => update({ padding: { ...row.padding, bottom: Math.round(Number(e.target.value) || 0) } })} />
        </Field>
        <Field label='Padding left'>
          <Input type='number' value={row.padding.left} onChange={(e) => update({ padding: { ...row.padding, left: Math.round(Number(e.target.value) || 0) } })} />
        </Field>
      </div>

      <ContainerStyleFields fill={row.fill} border={row.border} cornerRadius={row.cornerRadius} cornerRadii={row.cornerRadii} shadow={row.shadow} onChange={update} />
    </div>
  );
}
