/**
 * Advanced Settings Section — Resize, EXIF, Background, GIF options.
 * Props-based. Tailwind styling.
 */

import { Maximize2, Camera, Palette, Film } from "lucide-react";
import { ConversionSettings, ResizeMode } from "../types";

interface AdvancedSettingsSectionProps {
  settings: ConversionSettings;
  updateSettings: (settings: Partial<ConversionSettings>) => void;
}

export default function AdvancedSettingsSection({ settings, updateSettings }: AdvancedSettingsSectionProps) {
  return (
    <div className='flex flex-col gap-5'>
      {/* Resize Control */}
      <section>
        <div className='flex items-center gap-2 mb-3'>
          <div className='w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary'>
            <Maximize2 size={14} strokeWidth={3} />
          </div>
          <h4 className='text-[10px] font-semibold uppercase text-foreground'>Resize</h4>
        </div>
        
        <div className='bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800 mb-3'>
          <div className='flex gap-1'>
            {(["original", "preset", "custom"] as ResizeMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => updateSettings({ resize: { ...settings.resize, mode } })}
                className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${
                  settings.resize.mode === mode
                    ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {settings.resize.mode === "preset" && (
          <div className='grid grid-cols-3 gap-2 animate-in slide-in-from-top-2 duration-300'>
            {[1920, 1200, 800].map((size) => (
              <button
                key={size}
                onClick={() => updateSettings({ resize: { ...settings.resize, preset: size } })}
                className={`py-1.5 text-[10px] font-semibold rounded-lg border transition-all ${
                  settings.resize.preset === size
                    ? "bg-primary/5 border-primary text-primary"
                    : "bg-transparent border-slate-100 dark:border-slate-800 text-muted-foreground hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {size}px
              </button>
            ))}
          </div>
        )}

        {settings.resize.mode === "custom" && (
          <div className='space-y-3'>
            <div className='flex gap-2'>
              <div className='flex-1 space-y-1.5'>
                <span className='text-[10px] font-medium text-muted-foreground ml-1'>W</span>
                <input
                  type='number'
                  placeholder='PX'
                  value={settings.resize.width || ""}
                  onChange={(e) => updateSettings({ resize: { ...settings.resize, width: Number(e.target.value) || undefined } })}
                  className='w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all'
                />
              </div>
              <div className='flex-1 space-y-1.5'>
                <span className='text-[10px] font-medium text-muted-foreground ml-1'>H</span>
                <input
                  type='number'
                  placeholder='PX'
                  value={settings.resize.height || ""}
                  onChange={(e) => updateSettings({ resize: { ...settings.resize, height: Number(e.target.value) || undefined } })}
                  className='w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all'
                />
              </div>
            </div>
            
            <div className='grid grid-cols-2 gap-2'>
              <label className='flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer group hover:border-primary/30 transition-all'>
                <input
                  type='checkbox'
                  checked={settings.resize.preserveAspectRatio}
                  onChange={(e) => updateSettings({ resize: { ...settings.resize, preserveAspectRatio: e.target.checked } })}
                  className='w-4 h-4 rounded-lg accent-primary'
                />
                <span className='text-[10px] font-medium text-muted-foreground group-hover:text-foreground'>Keep ratio</span>
              </label>
              <label className='flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer group hover:border-primary/30 transition-all'>
                <input
                  type='checkbox'
                  checked={settings.resize.allowUpscale}
                  onChange={(e) => updateSettings({ resize: { ...settings.resize, allowUpscale: e.target.checked } })}
                  className='w-4 h-4 rounded-lg accent-primary'
                />
                <span className='text-[10px] font-medium text-muted-foreground group-hover:text-foreground'>Upscale</span>
              </label>
            </div>
          </div>
        )}
      </section>

      {/* Metadata & Composition */}
      <section className='space-y-4'>
         {/* EXIF Toggle */}
        <div className='flex items-center justify-between group'>
          <div className='flex items-center gap-3'>
            <div className='w-6 h-6 rounded-md bg-teal-500/10 flex items-center justify-center text-teal-600'>
               <Camera size={14} strokeWidth={3} />
            </div>
            <div>
              <h4 className='text-[10px] font-semibold uppercase text-foreground'>EXIF Data</h4>
              <p className='text-[9px] text-muted-foreground leading-none mt-0.5'>Camera & GPS info</p>
            </div>
          </div>
          <button 
            onClick={() => updateSettings({ preserveExif: !settings.preserveExif })}
            className={`w-10 h-5 rounded-full p-0.5 transition-all duration-300 ${settings.preserveExif ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-800'}`}>
            <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${settings.preserveExif ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Background Color Picker (JPEG only) */}
        {settings.format === "jpeg" && (
          <div className='space-y-3'>
             <div className='flex items-center gap-2'>
                <div className='w-6 h-6 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-600'>
                   <Palette size={14} strokeWidth={3} />
                </div>
                <h4 className='text-[10px] font-semibold uppercase text-foreground'>Background</h4>
             </div>
             
             <div className='flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800'>
                <div className='relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700'>
                   <input
                     type='color'
                     value={settings.backgroundColor}
                     onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                     className='absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer bg-transparent'
                   />
                </div>
                <input
                  type='text'
                  value={settings.backgroundColor}
                  onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                  placeholder='#FFFFFF'
                  className='flex-1 bg-transparent border-none text-sm font-medium focus:ring-0 text-foreground'
                />
             </div>
          </div>
        )}
      </section>

      {/* Logic Insights (GIF/Server-Side) */}
      {(settings.format === "gif" || settings.preserveFormat) && (
        <section className='animate-in slide-in-from-bottom-4 duration-700'>
          <div className='p-3 bg-gradient-to-br from-indigo-500/5 to-primary/5 rounded-xl border border-primary/10'>
             <div className='flex flex-col gap-2'>
                <div className='flex items-center gap-2'>
                  <Film size={16} className='text-primary' />
                  <span className='text-[10px] font-semibold text-primary'>GIF Info</span>
                </div>
                
                <p className='text-[11px] leading-relaxed text-slate-600 dark:text-slate-400'>
                  GIFs are processed <span className='text-primary font-semibold'>server-side</span> to preserve animation frames and transparency.
                </p>
                
                <div className='flex items-center gap-2 bg-white/50 dark:bg-slate-950/50 p-2 rounded-lg border border-white/20 dark:border-slate-800'>
                   <div className='w-1.5 h-1.5 rounded-full bg-primary animate-pulse' />
                   <span className='text-[9px] font-medium opacity-70'>All frames receive settings</span>
                </div>
             </div>
          </div>
        </section>
      )}
    </div>
  );
}

