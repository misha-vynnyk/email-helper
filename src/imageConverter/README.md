# Image Converter & Optimizer

Convert and optimize images for web use with support for multiple formats and processing modes.

## Features

### Output Formats

- **JPG** - Best for photos, no transparency
- **WebP** - Modern format with good compression
- **AVIF** - Next-gen format with excellent compression
- **PNG** - Lossless format with transparency support

### Processing Modes

#### Client Mode (Browser)

- Processes images directly in the browser using Canvas API
- No upload required - faster for small files
- Maximum file size: 10MB per image
- Works offline

#### Server Mode

- Processes images on the server using Sharp library
- Better quality and compression
- Maximum file size: 50MB per image
- Supports all features including AVIF

### Image Optimization Options

1. **Quality Control** (1-100%)
   - Adjust compression level
   - Default: 85%
   - Higher = better quality, larger file size

2. **Background Color** (JPG only)
   - Choose background color for transparent areas
   - Default: white (#FFFFFF)
   - Only applies to JPG since it doesn't support transparency

3. **Resize Options**
   - **Original**: Keep original dimensions
   - **Preset**: Quick resize to common widths (1920px, 1200px, 800px)
   - **Custom**: Specify exact width/height with optional aspect ratio preservation

### Batch Processing

- Upload multiple images at once
- Process them all with the same settings
- Track individual file status
- Download all at once or individually
- See total size savings

## Usage

1. **Select Processing Mode**
   - Choose Client or Server mode based on your needs

2. **Upload Images**
   - Drag & drop files into the upload zone
   - Or click "Browse Files" to select from file picker
   - Supports: PNG, JPG, JPEG, WebP

3. **Configure Settings**
   - Select output format
   - Adjust quality slider
   - Set background color (for JPG)
   - Choose resize options

4. **Convert**
   - Click "Convert All" to process all images
   - Or convert individual files
   - Monitor progress in the queue

5. **Download**
   - Download individual files
   - Or "Download All" to get all converted images

## Tips

- Use **WebP** for best balance of quality and file size
- Use **JPG** at 80-85% quality for photos
- Use **PNG** for images that need transparency
- Use **AVIF** for maximum compression (newer browsers only)
- Server mode provides better quality for complex images
- Batch process similar images with the same settings for consistency

## Technical Details

### Client-side Processing

- Uses HTML5 Canvas API
- `canvas.toBlob()` for format conversion
- Limited to formats supported by browser

### Server-side Processing

- Uses Sharp library (libvips)
- High-performance image processing
- Full format support including AVIF
- Better compression algorithms

## Browser Compatibility

- Client mode: Works in all modern browsers
- WebP: Chrome, Firefox, Safari 14+, Edge
- AVIF: Chrome 85+, Firefox 93+, Safari 16+

For maximum compatibility, use JPG or PNG.
