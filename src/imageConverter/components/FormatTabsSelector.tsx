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
    <div className='flex flex-wrap gap-1.5'>
      {/* Original Format Option */}
      <button
        onClick={() => !disabled && onPreserveFormatChange(true)}
        disabled={disabled}
        title='Keep original format for each image'
        className={`
          relative px-3 py-1.5 text-sm font-medium rounded-lg border transition-all duration-200
          hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed
          ${preserveFormat
            ? "bg-primary text-primary-foreground border-primary shadow-md"
            : "bg-card text-foreground border-border/50 hover:border-primary/50 hover:bg-primary/5"
          }
        `}
      >
        Original
      </button>

      {/* Divider */}
      <div className='w-px h-8 bg-border/30 mx-0.5 self-center' />

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
            title={info.description}
            className={`
              relative px-3 py-1.5 text-sm font-medium rounded-lg border transition-all duration-200
              hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed
              ${isSelected
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-card text-foreground border-border/50 hover:border-primary/50 hover:bg-primary/5"
              }
            `}
          >
            <span className='flex items-center gap-1.5'>
              {info.label}
              {info.recommended && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  isSelected ? "bg-white/20 text-white" : "bg-success text-white"
                }`}>
                  Best
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
