/**
 * Auto Convert Toggle — Switch between auto and manual conversion.
 * Props-based. Tailwind styling.
 */

import { Zap, Hand } from "lucide-react";
import { ConversionSettings } from "../types";

interface AutoConvertToggleProps {
  settings: ConversionSettings;
  updateSettings: (s: Partial<ConversionSettings>) => void;
}

export default function AutoConvertToggle({ settings, updateSettings }: AutoConvertToggleProps) {
  return (
    <div className={`p-3 rounded-xl border transition-all duration-200 ${
      settings.autoConvert
        ? "bg-primary/5 border-primary/20"
        : "bg-card border-border/50"
    }`}>
      <label className='flex items-center gap-3 cursor-pointer'>
        <button
          onClick={() => updateSettings({ autoConvert: !settings.autoConvert })}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            settings.autoConvert ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
              settings.autoConvert ? "translate-x-[18px]" : "translate-x-1"
            }`}
          />
        </button>
        <div className='flex items-center gap-2'>
          {settings.autoConvert ? (
            <Zap size={14} className='text-primary' />
          ) : (
            <Hand size={14} className='text-muted-foreground' />
          )}
          <span className='text-sm font-medium text-foreground'>
            {settings.autoConvert ? "Auto-Convert" : "Manual Mode"}
          </span>
        </div>
      </label>
    </div>
  );
}
