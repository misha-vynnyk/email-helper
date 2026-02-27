import { ProcessedImage, ImageFormat, ImageFormatOverride } from "../types";
import { getImageFormat } from "../imageUtils";
import { X, Download } from "lucide-react";

interface ImageItemProps {
  image: ProcessedImage;
  globalFormat: ImageFormat;
  onDownload: (id: string) => void;
  onRemove: (id: string) => void;
  onFormatChange: (id: string, format: ImageFormatOverride) => void;
}

export function ImageItem({ image, globalFormat, onDownload, onRemove, onFormatChange }: ImageItemProps) {
  const imgFormat = getImageFormat(image, globalFormat);

  // Distinct colors by output format
  const isPng = imgFormat === "png";

  return (
    <div className='flex flex-col gap-1 items-center'>
      <div className='relative min-w-[80px] max-w-[80px] h-[80px] rounded-lg overflow-hidden border border-border/50'>
        <img src={image.previewUrl} alt={image.name} className='w-full h-full object-cover' />

        {/* Format Badge */}
        <span className={`absolute top-1 right-1 h-4 flex items-center px-1 text-[10px] font-bold rounded-sm border border-white/40 leading-none ${isPng ? "bg-green-600 text-white" : "bg-orange-500 text-white"}`}>{imgFormat.toUpperCase()}</span>

        {image.status === "processing" && (
          <div className='absolute inset-0 bg-background/80 flex items-center justify-center'>
            <div className='w-[80%] h-1 bg-muted rounded-full overflow-hidden'>
              <div className='h-full bg-primary animate-pulse w-full' />
            </div>
          </div>
        )}

        {image.status === "done" && (
          <button title='Завантажити' onClick={() => onDownload(image.id)} className='absolute bottom-1 right-1 bg-green-600 hover:bg-green-500 text-white w-5 h-5 rounded flex items-center justify-center transition-colors'>
            <Download size={12} />
          </button>
        )}

        <button title='Видалити' onClick={() => onRemove(image.id)} className='absolute bottom-1 left-1 bg-red-600 hover:bg-red-500 text-white w-5 h-5 rounded flex items-center justify-center transition-colors'>
          <X size={12} />
        </button>
      </div>

      {/* Format Selector */}
      <div className='flex items-center h-5 border border-border/50 rounded overflow-hidden divide-x divide-border/50'>
        <button title='Авто (прозорість → PNG)' onClick={() => onFormatChange(image.id, "auto")} className={`flex-1 min-w-[28px] text-[10px] h-full flex items-center justify-center hover:bg-muted transition-colors ${(image.formatOverride || "auto") === "auto" ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"}`}>
          Auto
        </button>
        <button onClick={() => onFormatChange(image.id, "jpeg")} className={`flex-1 min-w-[28px] text-[10px] h-full flex items-center justify-center hover:bg-muted transition-colors ${image.formatOverride === "jpeg" ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"}`}>
          JPG
        </button>
        <button onClick={() => onFormatChange(image.id, "png")} className={`flex-1 min-w-[28px] text-[10px] h-full flex items-center justify-center hover:bg-muted transition-colors ${image.formatOverride === "png" ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"}`}>
          PNG
        </button>
      </div>
    </div>
  );
}
