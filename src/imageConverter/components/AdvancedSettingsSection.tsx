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
      {/* Resize */}
      <div>
        <div className='flex items-center gap-2 mb-3'>
          <Maximize2 size={14} className='text-muted-foreground' />
          <h4 className='text-sm font-semibold text-foreground'>Resize</h4>
        </div>
        <select
          value={settings.resize.mode}
          onChange={(e) => updateSettings({ resize: { ...settings.resize, mode: e.target.value as ResizeMode } })}
          className='w-full bg-card border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all'
        >
          <option value='original'>Original Size</option>
          <option value='preset'>Preset Size</option>
          <option value='custom'>Custom Size</option>
        </select>

        {settings.resize.mode === "preset" && (
          <div className='flex gap-1.5 mt-3'>
            {[1920, 1200, 800].map((size) => (
              <button
                key={size}
                onClick={() => updateSettings({ resize: { ...settings.resize, preset: size } })}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  settings.resize.preset === size
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border/50 hover:border-primary/50"
                }`}
              >
                {size}px
              </button>
            ))}
          </div>
        )}

        {settings.resize.mode === "custom" && (
          <div className='mt-3 flex flex-col gap-2'>
            <div className='flex gap-2'>
              <input
                type='number'
                placeholder='Width (px)'
                value={settings.resize.width || ""}
                onChange={(e) => updateSettings({ resize: { ...settings.resize, width: Number(e.target.value) || undefined } })}
                className='flex-1 bg-card border border-border/50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
              />
              <input
                type='number'
                placeholder='Height (px)'
                value={settings.resize.height || ""}
                onChange={(e) => updateSettings({ resize: { ...settings.resize, height: Number(e.target.value) || undefined } })}
                className='flex-1 bg-card border border-border/50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
              />
            </div>
            <div className='flex flex-wrap gap-x-4 gap-y-2'>
              <label className='flex items-center gap-2 cursor-pointer group'>
                <input
                  type='checkbox'
                  checked={settings.resize.preserveAspectRatio}
                  onChange={(e) => updateSettings({ resize: { ...settings.resize, preserveAspectRatio: e.target.checked } })}
                  className='accent-primary'
                />
                <span className='text-xs text-muted-foreground group-hover:text-foreground transition-colors'>Preserve aspect ratio</span>
              </label>
              <label className='flex items-center gap-2 cursor-pointer group'>
                <input
                  type='checkbox'
                  checked={settings.resize.allowUpscale}
                  onChange={(e) => updateSettings({ resize: { ...settings.resize, allowUpscale: e.target.checked } })}
                  className='accent-primary'
                />
                <span className='text-xs text-muted-foreground group-hover:text-foreground transition-colors'>Allow upscale</span>
              </label>
            </div>
          </div>
        )}
      </div>

      <hr className='border-border/30' />

      {/* EXIF */}
      <div>
        <div className='flex items-center gap-2 mb-3'>
          <Camera size={14} className='text-muted-foreground' />
          <h4 className='text-sm font-semibold text-foreground'>EXIF Metadata</h4>
        </div>
        <label className='flex items-start gap-3 cursor-pointer hover:bg-muted p-2 rounded-lg transition-colors group'>
          <input
            type='checkbox'
            checked={settings.preserveExif}
            onChange={(e) => updateSettings({ preserveExif: e.target.checked })}
            className='accent-primary mt-0.5'
          />
          <div>
            <span className='text-sm font-medium text-foreground block group-hover:text-primary transition-colors'>Preserve EXIF Data</span>
            <span className='text-xs text-muted-foreground'>Keep camera info, location, and metadata</span>
          </div>
        </label>
      </div>

      {/* Background Color (JPEG only) */}
      {settings.format === "jpeg" && (
        <>
          <hr className='border-border/30' />
          <div>
            <div className='flex items-center gap-2 mb-3'>
              <Palette size={14} className='text-muted-foreground' />
              <h4 className='text-sm font-semibold text-foreground'>Background Color</h4>
            </div>
            <div className='flex items-center gap-3 p-3 bg-card border border-border/50 rounded-xl'>
              <input
                type='color'
                value={settings.backgroundColor}
                onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                className='w-12 h-10 rounded-lg border border-border/50 cursor-pointer bg-transparent'
              />
              <input
                type='text'
                value={settings.backgroundColor}
                onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                placeholder='#FFFFFF'
                className='flex-1 bg-background border border-border/50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary'
              />
            </div>
          </div>
        </>
      )}

      {/* GIF Info */}
      {(settings.format === "gif" || settings.preserveFormat) && (
        <>
          <hr className='border-border/30' />
          <div>
            <div className='flex items-center gap-2 mb-3'>
              <Film size={14} className='text-muted-foreground' />
              <h4 className='text-sm font-semibold text-foreground'>GIF Animation Support</h4>
            </div>
            <div className='p-3 bg-primary/5 border border-primary/20 rounded-xl text-[11px] leading-relaxed text-muted-foreground'>
              <p className='mb-2'>✨ <strong className='text-primary'>Every frame compressed:</strong> We use server-side processing for GIFs to ensure all animation frames are preserved and optimized.</p>
              <p>To resize, use the "Resize" panel above. Settings will be applied to all frames.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
