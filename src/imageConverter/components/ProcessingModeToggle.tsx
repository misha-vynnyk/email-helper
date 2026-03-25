/**
 * Processing Mode Toggle — Client vs Server processing.
 * Props-based. Tailwind styling.
 */

import { useEffect } from "react";
import { Monitor, Cloud } from "lucide-react";

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
    { value: "client", icon: <Monitor size={14} />, label: "Client", tooltip: "Process in browser (faster, no upload)" },
    { value: "server", icon: <Cloud size={14} />, label: "Server", tooltip: apiAvailable ? "Process on server (better quality)" : "Server unavailable", disabled: !apiAvailable },
  ];

  return (
    <div className='flex gap-1.5'>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => !opt.disabled && updateSettings({ processingMode: opt.value })}
          disabled={opt.disabled}
          title={opt.tooltip}
          className={`
            flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg border transition-all
            disabled:opacity-40 disabled:cursor-not-allowed
            ${settings.processingMode === opt.value
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-card text-foreground border-border/50 hover:border-primary/50 hover:bg-primary/5"
            }
          `}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
