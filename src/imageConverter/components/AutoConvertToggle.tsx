/**
 * Auto Convert Toggle — Switch between auto and manual conversion.
 * Props-based. Tailwind styling.
 */

import { Zap } from "lucide-react";
import { ConversionSettings } from "../types";

interface AutoConvertToggleProps {
  settings: ConversionSettings;
  updateSettings: (s: Partial<ConversionSettings>) => void;
}

export default function AutoConvertToggle({ settings, updateSettings }: AutoConvertToggleProps) {
  return (
    <div className='flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/30 transition-all'>
      <div className='flex items-center gap-3'>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${settings.autoConvert ? 'bg-primary/10 text-primary' : 'bg-slate-200/50 text-muted-foreground'}`}>
           <Zap size={14} fill={settings.autoConvert ? "currentColor" : "none"} />
        </div>
        <div>
          <h4 className='text-xs font-semibold text-foreground'>Auto-Convert</h4>
          <p className='text-[10px] text-muted-foreground leading-none mt-0.5'>On upload</p>
        </div>
      </div>
      
      <button 
        onClick={() => updateSettings({ autoConvert: !settings.autoConvert })}
        className={`w-10 h-5 rounded-full p-0.5 transition-all duration-300 ${settings.autoConvert ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}>
        <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${settings.autoConvert ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
