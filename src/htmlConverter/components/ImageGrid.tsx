import { ProcessedImage, ImageFormat, ImageFormatOverride } from "../types";
import { ImageItem } from "./ImageItem";

interface ImageGridProps {
  images: ProcessedImage[];
  globalFormat: ImageFormat;
  onDownload: (id: string) => void;
  onRemove: (id: string) => void;
  onFormatChange: (id: string, format: ImageFormatOverride) => void;
}

export function ImageGrid({ images, globalFormat, onDownload, onRemove, onFormatChange }: ImageGridProps) {
  if (images.length === 0) return null;

  return (
    <div className='flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent'>
      {images.map((img) => (
        <ImageItem key={img.id} image={img} globalFormat={globalFormat} onDownload={onDownload} onRemove={onRemove} onFormatChange={onFormatChange} />
      ))}
    </div>
  );
}
