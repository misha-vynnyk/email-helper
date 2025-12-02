# GIF Optimization

## Overview

The Image Converter now supports advanced GIF optimization using Gifsicle, a powerful command-line tool for optimizing and manipulating GIF images. This feature allows you to:

- Optimize GIFs to a specific target file size
- Adjust compression quality manually
- Resize GIF frames while maintaining animation
- Preserve aspect ratio during resizing

## How It Works

### Adaptive Compression to Target Size

When you specify a target file size (e.g., 1.5 MB), the optimizer uses a **binary search algorithm** to find the optimal compression level that gets as close as possible to your target:

1. **Initial Range**: Starts with a lossy compression range from 10 (best quality) to 200 (maximum compression)
2. **Iterations**: Performs up to 10 optimization passes
3. **Binary Search**: On each iteration:
   - Tries the middle value of the current range
   - Checks if the result is within ±5% of target
   - Adjusts range based on whether file is too large or too small
4. **Best Result**: Keeps the highest quality result that fits within the target size

### Lossy Compression Levels

Gifsicle's lossy compression parameter works as follows:

- **Range**: 10 to 200
- **Lower values** (10-80): Better quality, larger file size
- **Medium values** (80-120): Balanced quality and size
- **Higher values** (120-200): Maximum compression, lower quality

The quality slider in the UI (1-100) is automatically converted to the appropriate lossy level:
- Quality 100 → Lossy 10 (best quality)
- Quality 50 → Lossy 105 (balanced)
- Quality 1 → Lossy 200 (maximum compression)

## Features

### Target File Size Optimization

Set a specific file size (in MB) and let the optimizer find the best quality that meets your requirement:

```typescript
{
  targetFileSize: 1572864, // 1.5 MB in bytes
  format: "gif",
  quality: 85, // Used as fallback if target size not specified
}
```

**Benefits**:
- Predictable output file size
- Automatic quality adjustment
- Ideal for file size restrictions (e.g., email attachments)

**Tolerance**: The optimizer aims for ±5% of the target size to balance quality and accuracy.

### Frame Resizing

Reduce the dimensions of GIF frames to decrease file size while maintaining the animation:

```typescript
{
  gifFrameResize: {
    enabled: true,
    width: 400,
    height: 300,
    preserveAspectRatio: true,
  }
}
```

**Options**:
- **Width/Height**: Specify one or both dimensions (minimum 16px)
- **Preserve Aspect Ratio**: Automatically adjust the other dimension to maintain proportions
- **Independent Scaling**: Set both dimensions to scale non-proportionally

### Optimization Parameters

The GIF optimizer applies several advanced optimizations:

- **Color Optimization**: Reduces to 256 colors (GIF maximum)
- **Frame Optimization**: Removes redundant frame data (optimize level 3)
- **Lossy Compression**: Reduces quality while maintaining visual appearance
- **Metadata Removal**: Strips unnecessary metadata to reduce size

## Usage Examples

### Basic Quality-Based Optimization

Optimize a GIF with quality setting:

```typescript
const settings: ConversionSettings = {
  format: "gif",
  quality: 85, // Converts to lossy ~38
  compressionMode: "balanced",
};
```

### Target File Size Optimization

Optimize to exactly 1.5 MB:

```typescript
const settings: ConversionSettings = {
  format: "gif",
  targetFileSize: 1.5 * 1024 * 1024, // 1.5 MB in bytes
  compressionMode: "balanced",
};
```

### Combined Optimization with Frame Resize

Target size with frame resizing:

```typescript
const settings: ConversionSettings = {
  format: "gif",
  targetFileSize: 2 * 1024 * 1024, // 2 MB
  gifFrameResize: {
    enabled: true,
    width: 800,
    preserveAspectRatio: true,
  },
};
```

## Best Practices

### Choosing Target Size

1. **Email Attachments**: 1-2 MB (many email providers limit to 5-10 MB)
2. **Web Display**: 0.5-1 MB (faster loading)
3. **Social Media**: 1-5 MB (depends on platform)
4. **Messaging Apps**: 0.5-1.5 MB (WhatsApp limit is 16 MB)

### Optimization Strategy

**For Best Quality**:
- Start with quality 90-95
- Use target size only if necessary
- Avoid excessive frame resizing

**For Maximum Compression**:
- Use target size feature
- Resize frames to 50-70% of original
- Set quality to 70-80

**For Balanced Results**:
- Use quality 80-85
- Optional: Resize to 80-90% of original
- Enable target size if specific limit needed

### Performance Considerations

- **Optimization Time**: Binary search may take 10-30 seconds for large GIFs
- **Timeout**: Operations timeout after 60 seconds
- **File Size Limits**: Input files up to 50 MB
- **Minimum Target**: Target size must be at least 10 KB

## Technical Details

### Binary Search Algorithm

```javascript
function optimizeToTargetSize(input, targetSize) {
  let minLossy = 10;  // Best quality
  let maxLossy = 200; // Worst quality
  let bestResult = null;

  for (let i = 0; i < 10; i++) {
    const currentLossy = Math.round((minLossy + maxLossy) / 2);
    const result = optimize(input, currentLossy);

    if (result.size <= targetSize * 1.05) { // Within 5% tolerance
      bestResult = result;
      maxLossy = currentLossy - 1; // Try better quality
    } else {
      minLossy = currentLossy + 1; // More compression needed
    }
  }

  return bestResult;
}
```

### Response Headers

The server returns optimization metrics in headers:

- `X-Original-Size`: Original file size in bytes
- `X-Optimized-Size`: Optimized file size in bytes
- `X-Compression-Ratio`: Ratio of compression (e.g., 2.5 = 60% reduction)
- `X-GIF-Lossy`: Lossy level used (10-200)
- `X-GIF-Iterations`: Number of optimization iterations
- `X-Warning`: Any warnings (e.g., couldn't reach target size)

## Troubleshooting

### "Gifsicle not installed" Error

Install Gifsicle in the server:

```bash
cd server
npm install gifsicle
```

### "Could not reach target size" Warning

The optimizer couldn't compress the GIF to the target size even with maximum compression. Solutions:

1. Increase target size
2. Enable frame resizing
3. Reduce frame count (edit GIF externally)
4. Reduce color palette (edit GIF externally)

### Optimization Timeout

If optimization takes too long (>60 seconds):

1. Reduce source file size
2. Use simpler target (quality instead of target size)
3. Pre-process GIF to reduce frames/complexity

### Quality Issues

If optimized GIF looks poor:

1. Increase quality setting (or target file size)
2. Disable lossy compression (quality 95-100)
3. Avoid excessive frame resizing
4. Consider using PNG for static images

## Comparison: GIF vs Other Formats

| Format | Animation | Transparency | File Size | Browser Support |
|--------|-----------|--------------|-----------|-----------------|
| GIF    | ✅ Yes    | ✅ Yes (1-bit)| Large     | 100%           |
| WebP   | ✅ Yes    | ✅ Yes (alpha)| Small     | 95%+           |
| AVIF   | ✅ Yes    | ✅ Yes (alpha)| Smallest  | 90%+           |
| MP4    | ✅ Yes    | ❌ No        | Smallest  | 95%+ (video)   |

**When to use GIF**:
- Maximum compatibility required
- Simple animations with few colors
- Transparency needed
- Email or messaging apps

**When to consider alternatives**:
- Modern web only → Use WebP/AVIF
- Complex video-like content → Use MP4/WebM
- Static image → Use WebP/AVIF/JPEG

## API Reference

### Backend Functions

#### `optimizeGifToTargetSize(inputBuffer, targetSizeBytes, frameResize, maxIterations)`

Optimize GIF to specific target file size using binary search.

**Parameters**:
- `inputBuffer` (Buffer): Input GIF file buffer
- `targetSizeBytes` (number): Target file size in bytes (10 KB - 50 MB)
- `frameResize` (object|null): Frame resize options
- `maxIterations` (number): Maximum optimization iterations (default: 10)

**Returns**: `Promise<{ buffer, size, lossy, iterations, warning? }>`

#### `optimizeGifWithQuality(inputBuffer, quality, frameResize)`

Optimize GIF based on quality setting.

**Parameters**:
- `inputBuffer` (Buffer): Input GIF file buffer
- `quality` (number): Quality level 1-100
- `frameResize` (object|null): Frame resize options

**Returns**: `Promise<{ buffer, size, lossy }>`

### Frontend Types

```typescript
interface ConversionSettings {
  format: ImageFormat;
  quality: number;
  targetFileSize?: number; // Optional: target size in bytes
  gifFrameResize?: {
    enabled: boolean;
    width?: number;
    height?: number;
    preserveAspectRatio: boolean;
  };
  // ... other settings
}
```

## Future Enhancements

Potential improvements for future versions:

- [ ] Frame rate adjustment (reduce FPS)
- [ ] Color palette optimization
- [ ] Dithering options
- [ ] Frame deduplication
- [ ] Progress tracking for long optimizations
- [ ] Preview of quality levels
- [ ] Batch optimization with different target sizes
- [ ] GIF to WebP/AVIF conversion with animation
- [ ] Frame extraction and editing

## Resources

- [Gifsicle Documentation](https://www.lcdf.org/gifsicle/)
- [GIF Format Specification](https://www.w3.org/Graphics/GIF/spec-gif89a.txt)
- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images)

## License

This GIF optimization feature uses Gifsicle, which is distributed under the GNU General Public License v2.
