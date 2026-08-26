import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { buildGoogleFontsHref, fontFamilyStack, GOOGLE_FONT_CATALOG } from "../googleFontCatalog";
import { updateShellConfig } from "../state/builderStore";
import type { ShellConfig } from "../types";

interface GoogleFontPickerProps {
  shell: ShellConfig;
}

/** Picks from a bundled 50-font catalog instead of requiring a trip to fonts.google.com — toggling
 * a font recomputes the combined <link> href; "Use as default" fills the plain Font family field. */
export function GoogleFontPicker({ shell }: GoogleFontPickerProps) {
  const [query, setQuery] = useState("");
  const filtered = GOOGLE_FONT_CATALOG.filter((font) => font.name.toLowerCase().includes(query.toLowerCase()));

  const toggleFont = (font: (typeof GOOGLE_FONT_CATALOG)[number]) => {
    const isSelecting = !shell.googleFonts.includes(font.name);
    const googleFonts = isSelecting ? [...shell.googleFonts, font.name] : shell.googleFonts.filter((n) => n !== font.name);

    // Picking the very first font also applies it as the default (fontFamily/fontMatchSelector) —
    // otherwise checking a font silently does nothing visible, which reads as "it didn't work".
    // Later additions only extend the <link> bundle; use "Use as default" to switch which one applies.
    const becomesDefault = isSelecting && shell.googleFonts.length === 0;

    updateShellConfig({
      googleFonts,
      googleFontsHref: buildGoogleFontsHref(googleFonts),
      ...(becomesDefault ? { fontFamily: fontFamilyStack(font.name, font.category), fontMatchSelector: font.name } : {}),
    });
  };

  return (
    <div className='space-y-1'>
      <Label className='text-xs text-muted-foreground'>Google Fonts (curated list of 50)</Label>
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder='Search fonts...' />
      <div className='max-h-40 overflow-y-auto rounded-md border border-input p-1 space-y-0.5'>
        {filtered.map((font) => (
          <div key={font.name} className='flex items-center justify-between gap-2 rounded px-1 py-0.5 hover:bg-muted/40'>
            <label className='flex flex-1 cursor-pointer items-center gap-2 text-xs'>
              <Checkbox checked={shell.googleFonts.includes(font.name)} onCheckedChange={() => toggleFont(font)} />
              {font.name}
            </label>
            <button
              type='button'
              onClick={() => updateShellConfig({ fontFamily: fontFamilyStack(font.name, font.category), fontMatchSelector: font.name })}
              className='text-[10px] text-muted-foreground hover:text-foreground'>
              Use as default
            </button>
          </div>
        ))}
        {filtered.length === 0 && <p className='px-1 py-1 text-xs text-muted-foreground'>No fonts match &quot;{query}&quot;.</p>}
      </div>
    </div>
  );
}
