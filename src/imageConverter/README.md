# Image Converter

Image optimization and CDN upload tool for email templates.

## Features

- **Format Conversion** - Convert images to WebP, JPEG, PNG
- **Compression** - Reduce file size with quality control
- **Batch Processing** - Process multiple images at once
- **CDN Upload** - Direct upload to CDN with automatic URL insertion
- **Auto-Convert** - Automatically convert images when added
- **Preview** - Live preview of converted images
- **Drag & Drop** - Easy file upload interface

## Usage

```typescript
import { ImageConverterPanel } from '@/imageConverter';

function MyComponent() {
  return <ImageConverterPanel />;
}
```

## Components

### ImageConverterPanel

Main container component for the image converter interface.

### FileUploadZone

Drag-and-drop file upload area.

**Props:**

- `onFilesAdded: (files: File[]) => void` - Callback when files are added
- `accept?: string` - Accepted file types (default: "image/\*")
- `multiple?: boolean` - Allow multiple files (default: true)

### ImageGridItem

Individual image item in the grid.

**Props:**

- `image: ProcessedImage` - Image data
- `onRemove: () => void` - Remove callback
- `onUpdate: (data: Partial<ProcessedImage>) => void` - Update callback

### CompressionModeSelector

Choose compression level (Lossless, Balanced, High).

**Props:**

- `value: CompressionMode`
- `onChange: (mode: CompressionMode) => void`

### ConversionSettings

Global conversion settings panel.

### BatchProcessor

Batch operations (convert all, upload all, clear all).

### AutoConvertToggle

Toggle automatic conversion on file add.

### ProcessingModeToggle

Toggle between Manual and Auto-CDN modes.

## Types

```typescript
interface ProcessedImage {
  id: string;
  file: File;
  preview: string;
  convertedFile?: File;
  convertedPreview?: string;
  cdnUrl?: string;
  format: "webp" | "jpeg" | "png";
  quality: number;
  status: "pending" | "converting" | "converted" | "uploading" | "uploaded" | "error";
  error?: string;
}

type CompressionMode = "lossless" | "balanced" | "high";
type ProcessingMode = "manual" | "auto-cdn";
```

## Compression Modes

**Lossless** (Quality: 100)

- Best quality, larger file size
- Suitable for graphics with text

**Balanced** (Quality: 85)

- Good balance between quality and size
- Recommended for most email images

**High Compression** (Quality: 60)

- Smaller file size, lower quality
- Suitable for backgrounds and decorative elements

## Processing Modes

**Manual**

- Convert images locally
- Review before uploading
- Full control over each image

**Auto-CDN**

- Automatically upload to CDN after conversion
- Faster workflow
- Suitable for batch operations

## API

### Image Conversion

```typescript
POST /api/image-converter/convert
Content-Type: multipart/form-data

Body:
- file: File
- format: 'webp' | 'jpeg' | 'png'
- quality: number (0-100)

Response:
{
  convertedFile: Blob,
  stats: {
    originalSize: number,
    convertedSize: number,
    compressionRatio: number
  }
}
```

### CDN Upload

```typescript
POST /api/image-converter/upload-cdn
Content-Type: multipart/form-data

Body:
- file: File
- filename: string

Response:
{
  url: string,
  filename: string,
  size: number
}
```

## State Management

The module uses local React state with hooks. Consider migrating to Zustand for better state management if the module grows.

## Configuration

### Supported Formats

- Input: JPEG, PNG, GIF, WebP, SVG
- Output: WebP, JPEG, PNG

### File Size Limits

- Maximum file size: 10 MB (configurable on backend)
- Recommended size: < 500 KB for email images

### Quality Settings

- Default quality: 85
- Lossless: 100
- Balanced: 85
- High compression: 60

## Best Practices

1. **Use WebP** for modern email clients
2. **Provide fallbacks** (JPEG/PNG) for older clients
3. **Compress images** before uploading to email service
4. **Use CDN** for faster email loading
5. **Test images** in multiple email clients
6. **Optimize dimensions** (max 600px width for email)

## Future Improvements

- [ ] Bulk resize to specific dimensions
- [ ] Image cropping/editing
- [ ] Advanced compression options
- [ ] Image format recommendations
- [ ] Auto-detect optimal quality
- [ ] Local storage caching
- [ ] Undo/redo support
- [ ] Export settings profiles
