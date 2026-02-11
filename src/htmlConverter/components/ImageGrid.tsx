import { Box, Stack } from "@mui/material";
import { spacingMUI } from "../../theme/tokens";
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
    <Box>
      <Stack direction='row' spacing={spacingMUI.sm} sx={{ overflowX: "auto", pb: spacingMUI.xs }}>
        {images.map((img) => (
          <ImageItem key={img.id} image={img} globalFormat={globalFormat} onDownload={onDownload} onRemove={onRemove} onFormatChange={onFormatChange} />
        ))}
      </Stack>
    </Box>
  );
}
