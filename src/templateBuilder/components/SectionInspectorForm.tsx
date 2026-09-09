import { Input } from "@/components/ui/input";

import { updateSectionStyle } from "../state/builderStore";
import type { SectionBlock } from "../types";
import { ContainerStyleFields, Field } from "./ContainerStyleFields";
import { parseOptionalWidthPx } from "./parseOptionalWidthPx";

interface SectionInspectorFormProps {
  section: SectionBlock;
}

export function SectionInspectorForm({ section }: SectionInspectorFormProps) {
  const update = (patch: Partial<Omit<SectionBlock, "id" | "parentId" | "type" | "childIds">>) => updateSectionStyle(section.id, patch);

  return (
    <div className='space-y-3'>
      <div className='grid grid-cols-2 gap-3'>
        <Field label='Width (px, empty = fill container)'>
          <Input type='number' value={section.widthPx ?? ""} placeholder='auto' onChange={(e) => update({ widthPx: parseOptionalWidthPx(e.target.value) })} />
        </Field>
        <Field label='Gap between children (px)'>
          <Input type='number' value={section.gapPx} onChange={(e) => update({ gapPx: Number(e.target.value) || 0 })} />
        </Field>
        <Field label='Padding top'>
          <Input type='number' value={section.padding.top} onChange={(e) => update({ padding: { ...section.padding, top: Math.round(Number(e.target.value) || 0) } })} />
        </Field>
        <Field label='Padding right'>
          <Input type='number' value={section.padding.right} onChange={(e) => update({ padding: { ...section.padding, right: Math.round(Number(e.target.value) || 0) } })} />
        </Field>
        <Field label='Padding bottom'>
          <Input type='number' value={section.padding.bottom} onChange={(e) => update({ padding: { ...section.padding, bottom: Math.round(Number(e.target.value) || 0) } })} />
        </Field>
        <Field label='Padding left'>
          <Input type='number' value={section.padding.left} onChange={(e) => update({ padding: { ...section.padding, left: Math.round(Number(e.target.value) || 0) } })} />
        </Field>
      </div>

      <ContainerStyleFields
        fill={section.fill}
        border={section.border}
        cornerRadius={section.cornerRadius}
        cornerRadii={section.cornerRadii}
        shadow={section.shadow}
        onChange={update}
      />
    </div>
  );
}
