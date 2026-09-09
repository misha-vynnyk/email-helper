import { Lock, Unlock } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { type ContainerBorder, type ContainerFill, type ContainerShadow, type CornerRadiusValue, toggleCornerRadiusLock } from "../types";

const ZERO_CORNER_RADII: CornerRadiusValue = { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 };
const CORNER_LABELS: Array<{ key: keyof CornerRadiusValue; label: string }> = [
  { key: "topLeft", label: "Top left" },
  { key: "topRight", label: "Top right" },
  { key: "bottomRight", label: "Bottom right" },
  { key: "bottomLeft", label: "Bottom left" },
];

const DEFAULT_SHADOW: ContainerShadow = { xPx: 0, yPx: 2, blurPx: 4, color: "rgba(0,0,0,0.1)" };

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
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

export interface ContainerStylePatch {
  fill?: ContainerFill;
  border?: ContainerBorder;
  cornerRadius?: number;
  cornerRadii?: CornerRadiusValue;
  shadow?: ContainerShadow;
}

interface ContainerStyleFieldsProps extends ContainerStylePatch {
  onChange: (patch: ContainerStylePatch) => void;
}

/**
 * Fill/Border/Corner-radius(+lock)/Shadow controls — shared by `SectionInspectorForm` and
 * `RowInspectorForm` (canva-plan-v2.md Stage 2 gave `RowBlock` the same four optional style
 * fields `SectionBlock` already had), so this nontrivial form is written once instead of hand-rolled
 * twice. Parameterized by plain values + an `onChange` patch callback, not by either concrete
 * block type — the caller's own `update`/`updateSectionStyle`/`updateRowStyle` wiring is unaffected.
 */
export function ContainerStyleFields({ fill, border, cornerRadius, cornerRadii, shadow, onChange }: ContainerStyleFieldsProps) {
  return (
    <>
      <OptionalSection label='Fill' enabled={fill !== undefined} onToggle={(enabled) => onChange({ fill: enabled ? "#ffffff" : undefined })}>
        {/* No gradient-authoring UI yet — a JSON-imported gradient fill renders correctly on
         * canvas/export either way; this guard just keeps a gradient object from being fed
         * straight into a <input type="color">, which only understands a hex string. */}
        <Input type='color' value={typeof fill === "string" ? fill : "#ffffff"} onChange={(e) => onChange({ fill: e.target.value })} />
      </OptionalSection>

      <OptionalSection label='Border' enabled={border !== undefined} onToggle={(enabled) => onChange({ border: enabled ? { widthPx: 1, color: "#000000" } : undefined })}>
        <div className='grid grid-cols-2 gap-2'>
          <Field label='Width (px)'>
            <Input type='number' value={border?.widthPx ?? 1} onChange={(e) => onChange({ border: { widthPx: Number(e.target.value) || 0, color: border?.color ?? "#000000" } })} />
          </Field>
          <Field label='Color'>
            <Input type='color' value={border?.color ?? "#000000"} onChange={(e) => onChange({ border: { widthPx: border?.widthPx ?? 1, color: e.target.value } })} />
          </Field>
        </div>
      </OptionalSection>

      <OptionalSection
        label='Corner radius'
        enabled={cornerRadius !== undefined || cornerRadii !== undefined}
        onToggle={(enabled) => onChange(enabled ? { cornerRadius: 8, cornerRadii: undefined } : { cornerRadius: undefined, cornerRadii: undefined })}>
        <div className='flex items-center justify-between'>
          <Label className='text-xs text-muted-foreground'>{cornerRadii === undefined ? "All corners" : "Per corner"}</Label>
          <button
            type='button'
            onClick={() => onChange(toggleCornerRadiusLock(cornerRadius, cornerRadii))}
            className='text-muted-foreground hover:text-foreground'
            aria-label={cornerRadii === undefined ? "Unlock corner radius (edit each corner independently)" : "Lock corner radius (all corners follow one value)"}>
            {cornerRadii === undefined ? <Lock size={13} /> : <Unlock size={13} />}
          </button>
        </div>
        {cornerRadii === undefined ? (
          <Input type='number' value={cornerRadius ?? 8} onChange={(e) => onChange({ cornerRadius: Number(e.target.value) || 0 })} />
        ) : (
          <div className='grid grid-cols-2 gap-2'>
            {CORNER_LABELS.map(({ key, label }) => (
              <Field key={key} label={label}>
                <Input
                  type='number'
                  value={cornerRadii?.[key] ?? 0}
                  onChange={(e) => onChange({ cornerRadii: { ...(cornerRadii ?? ZERO_CORNER_RADII), [key]: Number(e.target.value) || 0 } })}
                />
              </Field>
            ))}
          </div>
        )}
      </OptionalSection>

      <OptionalSection label='Shadow' enabled={shadow !== undefined} onToggle={(enabled) => onChange({ shadow: enabled ? DEFAULT_SHADOW : undefined })}>
        <div className='grid grid-cols-2 gap-2'>
          <Field label='X (px)'>
            <Input type='number' value={shadow?.xPx ?? DEFAULT_SHADOW.xPx} onChange={(e) => onChange({ shadow: { ...(shadow ?? DEFAULT_SHADOW), xPx: Number(e.target.value) || 0 } })} />
          </Field>
          <Field label='Y (px)'>
            <Input type='number' value={shadow?.yPx ?? DEFAULT_SHADOW.yPx} onChange={(e) => onChange({ shadow: { ...(shadow ?? DEFAULT_SHADOW), yPx: Number(e.target.value) || 0 } })} />
          </Field>
          <Field label='Blur (px)'>
            <Input type='number' value={shadow?.blurPx ?? DEFAULT_SHADOW.blurPx} onChange={(e) => onChange({ shadow: { ...(shadow ?? DEFAULT_SHADOW), blurPx: Number(e.target.value) || 0 } })} />
          </Field>
          <Field label='Color'>
            <Input value={shadow?.color ?? DEFAULT_SHADOW.color} onChange={(e) => onChange({ shadow: { ...(shadow ?? DEFAULT_SHADOW), color: e.target.value } })} />
          </Field>
        </div>
      </OptionalSection>
    </>
  );
}
