import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateShellConfig, useShellConfig } from "../state/builderStore";
import { GoogleFontPicker } from "./GoogleFontPicker";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='space-y-1'>
      <Label className='text-xs text-muted-foreground'>{label}</Label>
      {children}
    </div>
  );
}

export function ShellSettingsForm() {
  const shell = useShellConfig();

  return (
    <div className='grid grid-cols-2 gap-3'>
      <Field label='Title'>
        <Input value={shell.title} onChange={(e) => updateShellConfig({ title: e.target.value })} />
      </Field>
      <Field label='Content width (px)'>
        <Input
          type='number'
          value={shell.contentWidthPx}
          onChange={(e) => updateShellConfig({ contentWidthPx: Number(e.target.value) || 0 })}
        />
      </Field>
      <Field label='Font family (with fallback stack)'>
        <Input value={shell.fontFamily} onChange={(e) => updateShellConfig({ fontFamily: e.target.value })} />
      </Field>
      <Field label='Font match selector (optional)'>
        <Input
          value={shell.fontMatchSelector ?? ""}
          onChange={(e) => updateShellConfig({ fontMatchSelector: e.target.value || undefined })}
          placeholder='e.g. Roboto'
        />
      </Field>
      <div className='col-span-2'>
        <GoogleFontPicker shell={shell} />
      </div>
      <div className='col-span-2'>
        <Field label='Google Fonts link (auto-filled by the picker above, or paste your own)'>
          <Input
            value={shell.googleFontsHref ?? ""}
            onChange={(e) => updateShellConfig({ googleFontsHref: e.target.value || undefined })}
            placeholder='https://fonts.googleapis.com/css2?...'
          />
        </Field>
      </div>
      <Field label='Outer background'>
        <Input type='color' value={shell.outerBackground} onChange={(e) => updateShellConfig({ outerBackground: e.target.value })} />
      </Field>
      <Field label='Content background'>
        <Input type='color' value={shell.contentBackground} onChange={(e) => updateShellConfig({ contentBackground: e.target.value })} />
      </Field>
    </div>
  );
}
