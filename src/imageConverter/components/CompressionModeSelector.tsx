/**
 * Compression Mode Selector — Dropdown with 4 modes.
 * Props-based. Tailwind styling.
 */

import { Gauge, Sparkles, Minimize2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { ConversionSettings, CompressionMode } from "../types";

interface CompressionModeSelectorProps {
  settings: ConversionSettings;
  updateSettings: (s: Partial<ConversionSettings>) => void;
}




export default function CompressionModeSelector({ settings, updateSettings }: CompressionModeSelectorProps) {
  const compressionModes: { id: CompressionMode; label: string; icon: any; desc: string }[] = [
    { id: "balanced", label: "Balanced", icon: Gauge, desc: "Size vs Quality" },
    { id: "maximum-quality", label: "Premium", icon: Sparkles, desc: "Ultra Fidelity" },
    { id: "maximum-compression", label: "Compact", icon: Minimize2, desc: "Max Savings" },
    { id: "lossless", label: "Lossless", icon: ShieldCheck, desc: "Bit-Perfect" },
  ];

  const isLosslessAvailable = settings.format === "png" || settings.format === "webp";

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-2'>
        {compressionModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => updateSettings({ compressionMode: mode.id })}
            disabled={mode.id === "lossless" && !isLosslessAvailable}
            className={`group flex flex-col items-start p-3 rounded-xl border transition-all duration-200 text-left relative overflow-hidden disabled:opacity-40 disabled:grayscale ${
              settings.compressionMode === mode.id
                ? "border-primary bg-primary/5 shadow-md"
                : "border-slate-100 dark:border-slate-800 bg-transparent hover:border-slate-200 dark:hover:border-slate-700"
            }`}
          >
             {settings.compressionMode === mode.id && (
               <div className='absolute top-0 right-0 w-6 h-6 bg-primary text-white flex items-center justify-center rounded-bl-lg'>
                  <CheckCircle2 size={10} strokeWidth={3} />
               </div>
             )}
             
            <div className={`mb-2 p-1.5 rounded-lg transition-colors ${settings.compressionMode === mode.id ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-900 text-muted-foreground group-hover:text-foreground'}`}>
              <mode.icon size={16} strokeWidth={3} />
            </div>
            
            <span className={`text-[10px] font-semibold uppercase ${settings.compressionMode === mode.id ? 'text-primary' : 'text-foreground'}`}>
              {mode.label}
            </span>
            <p className='text-[9px] text-muted-foreground/60 leading-none mt-0.5'>
              {mode.desc}
            </p>
          </button>
        ))}
      </div>

      {settings.compressionMode === "lossless" && !isLosslessAvailable && (
        <div className='flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl'>
           <div className='w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse' />
           <p className='text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tight'>Lossless restricted to PNG/WebP</p>
        </div>
      )}
    </div>
  );
}

