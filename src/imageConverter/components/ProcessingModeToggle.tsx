/**
 * Processing Mode Toggle — Client vs Server processing.
 * Props-based. Tailwind styling.
 */

import { useEffect } from "react";
import { Monitor, Cloud, Cpu } from "lucide-react";

import { isApiAvailable } from "../../config/api";
import { ConversionSettings, ProcessingMode } from "../types";

interface ProcessingModeToggleProps {
  settings: ConversionSettings;
  updateSettings: (s: Partial<ConversionSettings>) => void;
}

export default function ProcessingModeToggle({ settings, updateSettings }: ProcessingModeToggleProps) {
  const apiAvailable = isApiAvailable();

  useEffect(() => {
    if (settings.processingMode === "server" && !apiAvailable) {
      updateSettings({ processingMode: "client" });
    }
  }, [apiAvailable, settings.processingMode, updateSettings]);

  const options: { value: ProcessingMode; icon: React.ReactNode; label: string; tooltip: string; disabled?: boolean }[] = [
    { value: "client", icon: <Monitor size={14} />, label: "CLIENT", tooltip: "Process in browser (faster, no upload)" },
    { value: "server", icon: <Cloud size={14} />, label: "SERVER", tooltip: apiAvailable ? "Process on server (better quality)" : "Server unavailable", disabled: !apiAvailable },
  ];

  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-2 px-1'>
         <Cpu size={14} className='text-primary' strokeWidth={3} />
         <span className='text-[10px] font-semibold text-muted-foreground'>Processing</span>
      </div>
      
      <div className='bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800'>
        <div className='flex gap-1'>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => !opt.disabled && updateSettings({ processingMode: opt.value })}
              disabled={opt.disabled}
              title={opt.tooltip}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${
                settings.processingMode === opt.value
                  ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground disabled:opacity-30"
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      
      <p className='text-[9px] text-muted-foreground/60 px-1'>
        {settings.processingMode === "client" ? "Local Browser Node" : "Cloud Optimization Cluster"}
      </p>
    </div>
  );
}

