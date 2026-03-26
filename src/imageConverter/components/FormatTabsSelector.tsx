/**
 * Format Tabs Selector — Row of format buttons.
 * Props-based. Tailwind styling.
 */

import { ImageFormat } from "../types";

interface FormatTabsSelectorProps {
  value: ImageFormat;
  onChange: (format: ImageFormat) => void;
  preserveFormat: boolean;
  onPreserveFormatChange: (preserve: boolean) => void;
  disabled?: boolean;
}

const FORMAT_INFO: Record<ImageFormat, { label: string; description: string; recommended?: boolean }> = {
  jpeg: { label: "JPG", description: "Universal compatibility, good for photos" },
  webp: { label: "WebP", description: "Best compression with quality, 30% smaller than JPG", recommended: true },
  avif: { label: "AVIF", description: "Next-gen format, 50% smaller, limited support" },
  png: { label: "PNG", description: "Lossless, supports transparency" },
  gif: { label: "GIF", description: "Animated images, limited colors" },
};

export default function FormatTabsSelector({
  value,
  onChange,
  preserveFormat,
  onPreserveFormatChange,
  disabled = false,
}: FormatTabsSelectorProps) {
  const formats: ImageFormat[] = ["jpeg", "webp", "avif", "png", "gif"];

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-wrap gap-2'>
        {/* Original Format Option */}
        <button
          onClick={() => !disabled && onPreserveFormatChange(true)}
          disabled={disabled}
          className={`
            relative px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-2xl border-2 transition-all duration-300
            hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
            ${preserveFormat
              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105 z-10"
              : "bg-white dark:bg-slate-900 text-muted-foreground border-transparent hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
            }
          `}
        >
          Original
        </button>

        {formats.map((format) => {
          const info = FORMAT_INFO[format];
          const isSelected = !preserveFormat && value === format;

          return (
            <button
              key={format}
              onClick={() => {
                if (!disabled) {
                  onPreserveFormatChange(false);
                  onChange(format);
                }
              }}
              disabled={disabled}
              className={`
                relative px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-2xl border-2 transition-all duration-300
                hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                ${isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105 z-10"
                  : "bg-white dark:bg-slate-900 text-muted-foreground border-transparent hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                }
              `}
            >
              <div className='flex items-center gap-1.5'>
                {info.label}
                {info.recommended && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white animate-pulse" : "bg-success"}`} />
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Selection Tooltip/Description */}
      <p className='text-[11px] text-muted-foreground italic px-1'>
        {preserveFormat 
          ? "Keep each image in its original file format."
          : FORMAT_INFO[value].description
        }
      </p>
    </div>
  );
}

