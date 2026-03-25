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
    <div className='bg-card rounded-[2rem] p-6 shadow-soft hover:shadow-lg border border-border/50 hover:border-border transition-all duration-300 group'>
      {/* Header */}
      <div className='flex items-center gap-3 mb-6'>
        <div className='flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary'>
          <Settings size={18} />
        </div>
        <div>
          <h3 className='text-sm font-semibold text-foreground'>Conversion Settings</h3>
          <p className='text-xs text-muted-foreground'>Format, quality & processing</p>
        </div>
      </div>

      <div className='flex flex-col gap-5'>
        {/* Auto Convert */}
        <AutoConvertToggle settings={settings} updateSettings={updateSettings} />

        {/* Processing Mode */}
        <div>
          <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2'>Processing</h4>
          <ProcessingModeToggle settings={settings} updateSettings={updateSettings} />
        </div>

        <hr className='border-border/30' />

        {/* Format Selection */}
        <div>
          <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2'>Output Format</h4>
          <FormatTabsSelector
            value={settings.format}
            onChange={(format) => updateSettings({ format })}
            preserveFormat={settings.preserveFormat}
            onPreserveFormatChange={(preserve) => updateSettings({ preserveFormat: preserve })}
          />
        </div>

        <hr className='border-border/30' />

        {/* Compression Mode */}
        <div>
          <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2'>Compression</h4>
          <CompressionModeSelector settings={settings} updateSettings={updateSettings} />
        </div>

        <hr className='border-border/30' />

        {/* Quality */}
        <QualityControl
          autoQuality={settings.autoQuality}
          quality={settings.quality}
          onAutoQualityChange={(auto) => updateSettings({ autoQuality: auto })}
          onQualityChange={(quality) => updateSettings({ quality })}
          compressionMode={settings.compressionMode}
        />

        <hr className='border-border/30' />

        {/* Estimated Size */}
        <EstimatedSizeIndicator
          originalSize={targetFile?.originalSize || 0}
          originalFormat={targetFile?.file?.type || ""}
          settings={settings}
          disabled={!targetFile}
        />

        {/* Advanced Settings Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className='flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1'
        >
          {showAdvanced ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          Advanced Settings
        </button>

        {showAdvanced && (
          <AdvancedSettingsSection settings={settings} updateSettings={updateSettings} />
        )}
      </div>
    </div>
  );
}
