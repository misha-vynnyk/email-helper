/**
 * Settings Sidebar — Right panel with all conversion settings.
 * Props-based (no context). Tailwind styling.
 */

import { useState } from "react";
import { Settings, ChevronDown, ChevronRight } from "lucide-react";

import { ConversionSettings, ImageFile } from "../types";
import FormatTabsSelector from "./FormatTabsSelector";
import CompressionModeSelector from "./CompressionModeSelector";
import QualityControl from "./QualityControl";
import AdvancedSettingsSection from "./AdvancedSettingsSection";
import EstimatedSizeIndicator from "./EstimatedSizeIndicator";
import AutoConvertToggle from "./AutoConvertToggle";
import ProcessingModeToggle from "./ProcessingModeToggle";

interface SettingsSidebarProps {
  files: ImageFile[];
  settings: ConversionSettings;
  updateSettings: (s: Partial<ConversionSettings>) => void;
}

export default function SettingsSidebar({ files, settings, updateSettings }: SettingsSidebarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedFiles = files.filter((f) => f.selected);
  const targetFile = selectedFiles.length === 1 ? selectedFiles[0] : (files.length === 1 ? files[0] : null);

  return (
    <div className='flex flex-col gap-4'>
      {/* MAIN SETTINGS CARD */}
      <div className='bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-800 transition-all duration-300'>
        {/* Header */}
        <div className='flex items-center justify-between mb-5'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary'>
              <Settings size={16} className='animate-spin-slow' />
            </div>
            <div>
              <h3 className='text-xs font-bold text-foreground'>Settings</h3>
              <p className='text-[10px] text-muted-foreground'>Format & Quality</p>
            </div>
          </div>
        </div>

        <div className='flex flex-col gap-5'>
          {/* Format Selection */}
          <section className='space-y-2'>
            <div className='flex items-center justify-between'>
              <h4 className='text-[10px] font-semibold text-muted-foreground uppercase'>Format</h4>
            </div>
            <FormatTabsSelector
              value={settings.format}
              onChange={(format) => updateSettings({ format })}
              preserveFormat={settings.preserveFormat}
              onPreserveFormatChange={(preserve) => updateSettings({ preserveFormat: preserve })}
            />
          </section>

          <div className='h-px bg-slate-100 dark:bg-slate-800/50' />

          {/* Compression Mode */}
          <section className='space-y-2'>
            <h4 className='text-[10px] font-semibold text-muted-foreground uppercase'>Compression</h4>
            <CompressionModeSelector settings={settings} updateSettings={updateSettings} />
          </section>

          <div className='h-px bg-slate-100 dark:bg-slate-800/50' />

          {/* Quality */}
          <QualityControl
            autoQuality={settings.autoQuality}
            quality={settings.quality}
            onAutoQualityChange={(auto) => updateSettings({ autoQuality: auto })}
            onQualityChange={(quality) => updateSettings({ quality })}
            compressionMode={settings.compressionMode}
          />

          <div className='h-px bg-slate-100 dark:bg-slate-800/50' />

          {/* Estimated Size */}
          <EstimatedSizeIndicator
            originalSize={targetFile?.originalSize || 0}
            originalFormat={targetFile?.file?.type || ""}
            settings={settings}
            disabled={!targetFile}
          />
        </div>
      </div>

      {/* ADVANCED SETTINGS CARD */}
      <div className='bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-md border border-slate-100 dark:border-slate-800 transition-all duration-300 overflow-hidden'>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className='w-full flex items-center justify-between group py-1'
        >
          <div className='flex items-center gap-3'>
            <div className='w-6 h-6 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors'>
               {showAdvanced ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            <span className='text-xs font-semibold text-foreground'>Advanced</span>
          </div>
          {!showAdvanced && <div className='w-2 h-2 rounded-full bg-primary/20 group-hover:bg-primary transition-colors' />}
        </button>

        {showAdvanced && (
          <div className='mt-4 pt-4 border-t border-slate-100 dark:border-slate-800'>
             <div className='flex flex-col gap-4'>
                <AutoConvertToggle settings={settings} updateSettings={updateSettings} />
                <div className='h-px bg-slate-50 dark:bg-slate-800/30' />
                <ProcessingModeToggle settings={settings} updateSettings={updateSettings} />
                <div className='h-px bg-slate-50 dark:bg-slate-800/30' />
                <AdvancedSettingsSection settings={settings} updateSettings={updateSettings} />
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

