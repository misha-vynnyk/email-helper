import { Lock, Unlock } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateSectionStyle } from "../state/builderStore";
import { type ContainerShadow, type CornerRadiusValue, type SectionBlock,toggleCornerRadiusLock } from "../types";
import { parseOptionalWidthPx } from "./parseOptionalWidthPx";

const ZERO_CORNER_RADII: CornerRadiusValue = { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 };
const CORNER_LABELS: Array<{ key: keyof CornerRadiusValue; label: string }> = [
  { key: "topLeft", label: "Top left" },
  { key: "topRight", label: "Top right" },
  { key: "bottomRight", label: "Bottom right" },
  { key: "bottomLeft", label: "Bottom left" },
];

const DEFAULT_SHADOW: ContainerShadow = { xPx: 0, yPx: 2, blurPx: 4, color: "rgba(0,0,0,0.1)" };

interface SectionInspectorFormProps {
  section: SectionBlock;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='space-y-1'>
      <Label className='text-xs text-muted-foreground'>{label}</Label>
      {children}
    </div>
  );
}

function OptionalSection({
  label,
  enabled,
  onToggle,
  children,
}: {
  label: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className='space-y-2 rounded-md border border-border/50 p-3'>
      <div className='flex items-center gap-2'>
        <Checkbox checked={enabled} onCheckedChange={(v) => onToggle(Boolean(v))} />
        <Label className='text-xs font-semibold'>{label}</Label>
      </div>
      {enabled && children}
    </div>
  );
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

      <OptionalSection label='Fill' enabled={section.fill !== undefined} onToggle={(enabled) => update({ fill: enabled ? "#ffffff" : undefined })}>
        <Input type='color' value={section.fill ?? "#ffffff"} onChange={(e) => update({ fill: e.target.value })} />
      </OptionalSection>

      <OptionalSection label='Border' enabled={section.border !== undefined} onToggle={(enabled) => update({ border: enabled ? { widthPx: 1, color: "#000000" } : undefined })}>
        <div className='grid grid-cols-2 gap-2'>
          <Field label='Width (px)'>
            <Input type='number' value={section.border?.widthPx ?? 1} onChange={(e) => update({ border: { widthPx: Number(e.target.value) || 0, color: section.border?.color ?? "#000000" } })} />
          </Field>
          <Field label='Color'>
            <Input type='color' value={section.border?.color ?? "#000000"} onChange={(e) => update({ border: { widthPx: section.border?.widthPx ?? 1, color: e.target.value } })} />
          </Field>
        </div>
      </OptionalSection>

      <OptionalSection
        label='Corner radius'
        enabled={section.cornerRadius !== undefined || section.cornerRadii !== undefined}
        onToggle={(enabled) => update(enabled ? { cornerRadius: 8, cornerRadii: undefined } : { cornerRadius: undefined, cornerRadii: undefined })}>
        <div className='flex items-center justify-between'>
          <Label className='text-xs text-muted-foreground'>{section.cornerRadii === undefined ? "All corners" : "Per corner"}</Label>
          <button
            type='button'
            onClick={() => update(toggleCornerRadiusLock(section.cornerRadius, section.cornerRadii))}
            className='text-muted-foreground hover:text-foreground'
            aria-label={section.cornerRadii === undefined ? "Unlock corner radius (edit each corner independently)" : "Lock corner radius (all corners follow one value)"}>
            {section.cornerRadii === undefined ? <Lock size={13} /> : <Unlock size={13} />}
          </button>
        </div>
        {section.cornerRadii === undefined ? (
          <Input type='number' value={section.cornerRadius ?? 8} onChange={(e) => update({ cornerRadius: Number(e.target.value) || 0 })} />
        ) : (
          <div className='grid grid-cols-2 gap-2'>
            {CORNER_LABELS.map(({ key, label }) => (
              <Field key={key} label={label}>
                <Input
                  type='number'
                  value={section.cornerRadii?.[key] ?? 0}
                  onChange={(e) => update({ cornerRadii: { ...(section.cornerRadii ?? ZERO_CORNER_RADII), [key]: Number(e.target.value) || 0 } })}
                />
              </Field>
            ))}
          </div>
        )}
      </OptionalSection>

      <OptionalSection label='Shadow' enabled={section.shadow !== undefined} onToggle={(enabled) => update({ shadow: enabled ? DEFAULT_SHADOW : undefined })}>
        <div className='grid grid-cols-2 gap-2'>
          <Field label='X (px)'>
            <Input type='number' value={section.shadow?.xPx ?? DEFAULT_SHADOW.xPx} onChange={(e) => update({ shadow: { ...(section.shadow ?? DEFAULT_SHADOW), xPx: Number(e.target.value) || 0 } })} />
          </Field>
          <Field label='Y (px)'>
            <Input type='number' value={section.shadow?.yPx ?? DEFAULT_SHADOW.yPx} onChange={(e) => update({ shadow: { ...(section.shadow ?? DEFAULT_SHADOW), yPx: Number(e.target.value) || 0 } })} />
          </Field>
          <Field label='Blur (px)'>
            <Input type='number' value={section.shadow?.blurPx ?? DEFAULT_SHADOW.blurPx} onChange={(e) => update({ shadow: { ...(section.shadow ?? DEFAULT_SHADOW), blurPx: Number(e.target.value) || 0 } })} />
          </Field>
          <Field label='Color'>
            <Input value={section.shadow?.color ?? DEFAULT_SHADOW.color} onChange={(e) => update({ shadow: { ...(section.shadow ?? DEFAULT_SHADOW), color: e.target.value } })} />
          </Field>
        </div>
      </OptionalSection>
    </div>
  );
}
