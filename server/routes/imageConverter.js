const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

const router = express.Router();

/**
 * Get optimized compression options based on format and mode
 */
function getCompressionOptions(format, quality, mode) {
  const options = { quality };

  switch (mode) {
    case 'maximum-quality':
      // Maximum quality settings
      switch (format) {
        case 'jpeg':
          return {
            quality: Math.max(quality, 90),
            chromaSubsampling: '4:4:4', // No chroma subsampling for best quality
            mozjpeg: true, // Use mozjpeg encoder (better compression at same quality)
            trellisQuantisation: true, // Better compression
            overshootDeringing: true, // Reduce compression artifacts
            optimizeScans: true, // Progressive JPEG optimization
          };
        case 'webp':
          return {
            quality: Math.max(quality, 90),
            lossless: false,
            nearLossless: true, // Near-lossless mode for best quality
            smartSubsample: true, // Better chroma subsampling
            effort: 6, // Higher effort for better compression
          };
        case 'avif':
          return {
            quality: Math.max(quality, 90),
            effort: 9, // Maximum effort (slowest but best)
            chromaSubsampling: '4:4:4',
          };
        case 'png':
          return {
            compressionLevel: 9, // Maximum compression
            palette: false, // True color
            effort: 10, // Maximum effort
            quality: 100,
          };
        default:
          return options;
      }

    case 'maximum-compression':
      // Aggressive compression
      switch (format) {
        case 'jpeg':
          return {
            quality: Math.min(quality, 75),
            chromaSubsampling: '4:2:0', // Standard chroma subsampling
            mozjpeg: true,
            trellisQuantisation: true,
            optimizeScans: true,
            progressive: true,
          };
        case 'webp':
          return {
            quality: Math.min(quality, 75),
            effort: 6,
            smartSubsample: true,
          };
        case 'avif':
          return {
            quality: Math.min(quality, 70),
            effort: 6,
          };
        case 'png':
          return {
            compressionLevel: 9,
            palette: true, // Try palette mode for smaller files
            effort: 10,
          };
        default:
          return options;
      }

    case 'lossless':
      // Lossless compression
      switch (format) {
        case 'webp':
          return {
            lossless: true,
            effort: 6,
          };
        case 'png':
          return {
            compressionLevel: 9,
            effort: 10,
            quality: 100,
          };
        case 'avif':
          return {
            lossless: true,
            effort: 9,
          };
        default:
          // JPEG doesn't support lossless, use highest quality
          return {
            quality: 100,
            chromaSubsampling: '4:4:4',
            mozjpeg: true,
          };
      }

    case 'balanced':
    default:
      // Balanced settings (default)
      switch (format) {
        case 'jpeg':
          return {
            quality,
            mozjpeg: true,
            optimizeScans: true,
          };
        case 'webp':
          return {
            quality,
            effort: 4,
          };
        case 'avif':
          return {
            quality,
            effort: 4,
          };
        case 'png':
          return {
            compressionLevel: 6,
            effort: 7,
          };
        default:
          return options;
      }
  }
}

// Configure multer for memory storage
// SECURITY: Strict file size and type limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB (needed for GIF optimization)
    files: 20,                   // Max 20 files at once
    fields: 20,                  // Max 20 form fields
  },
  fileFilter: (req, file, cb) => {
    // SECURITY: Only allow specific image types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

/**
 * Convert a single image
 */
router.post('/convert', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const {
      format = 'jpeg',
      quality = '85',
      backgroundColor = '#FFFFFF',
      resizeMode = 'original',
      preset,
      width,
      height,
      preserveAspectRatio = 'true',
      compressionMode = 'balanced',
      targetFileSize,
      gifFrameResize,
    } = req.body;

    // Handle GIF optimization with Gifsicle
    if (req.file.mimetype === 'image/gif' || format === 'gif') {
      const { optimizeGifToTargetSize, optimizeGifWithQuality } = require('../utils/gifOptimizer');

      try {
        const targetSize = targetFileSize ? parseInt(targetFileSize) : null;
        const frameResize = gifFrameResize ? JSON.parse(gifFrameResize) : null;

        let result;
        if (targetSize) {
          result = await optimizeGifToTargetSize(req.file.buffer, targetSize, frameResize);
        } else {
          result = await optimizeGifWithQuality(req.file.buffer, parseInt(quality), frameResize);
        }

        // Set response headers with metrics
        res.set('Content-Type', 'image/gif');
        res.set('X-Original-Size', req.file.size.toString());
        res.set('X-Optimized-Size', result.size.toString());
        res.set('X-Compression-Ratio', (req.file.size / result.size).toFixed(2));
        if (result.lossy) {
          res.set('X-GIF-Lossy', result.lossy.toString());
        }
        if (result.iterations) {
          res.set('X-GIF-Iterations', result.iterations.toString());
        }
        if (result.warning) {
          res.set('X-Warning', result.warning);
        }

        res.send(result.buffer);
        return;
      } catch (error) {
        console.error('GIF optimization error:', error);
        return res.status(500).json({ error: error.message || 'Failed to optimize GIF' });
      }
    }

    let pipeline = sharp(req.file.buffer);

    // Handle resize
    if (resizeMode === 'preset' && preset) {
      const maxDimension = parseInt(preset);
      pipeline = pipeline.resize(maxDimension, maxDimension, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    } else if (resizeMode === 'custom') {
      const resizeWidth = width ? parseInt(width) : undefined;
      const resizeHeight = height ? parseInt(height) : undefined;

      if (resizeWidth || resizeHeight) {
        pipeline = pipeline.resize(resizeWidth, resizeHeight, {
          fit: preserveAspectRatio === 'true' ? 'inside' : 'fill',
          withoutEnlargement: true,
        });
      }
    }

    // Handle transparency for formats that don't support it
    if (format === 'jpeg') {
      pipeline = pipeline.flatten({ background: backgroundColor });
    }

    // Convert to target format with advanced compression settings
    const qualityNum = parseInt(quality);
    const outputOptions = getCompressionOptions(format, qualityNum, compressionMode);

    pipeline = pipeline.toFormat(format, outputOptions);

    // Get the converted image buffer
    const buffer = await pipeline.toBuffer();

    // Send as blob
    res.set('Content-Type', `image/${format}`);
    res.send(buffer);
  } catch (error) {
    console.error('Image conversion error:', error);
    res.status(500).json({ error: error.message || 'Failed to convert image' });
  }
});

/**
 * Convert multiple images
 */
router.post('/convert-batch', upload.array('images', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const {
      format = 'jpeg',
      quality = '85',
      backgroundColor = '#FFFFFF',
      resizeMode = 'original',
      preset,
      width,
      height,
      preserveAspectRatio = 'true',
      compressionMode = 'balanced',
      targetFileSize,
      gifFrameResize,
    } = req.body;

    const results = [];

    for (const file of req.files) {
      try {
        // Handle GIF optimization with Gifsicle
        if (file.mimetype === 'image/gif' || format === 'gif') {
          const { optimizeGifToTargetSize, optimizeGifWithQuality } = require('../utils/gifOptimizer');

          try {
            const targetSize = targetFileSize ? parseInt(targetFileSize) : null;
            const frameResize = gifFrameResize ? JSON.parse(gifFrameResize) : null;

            let result;
            if (targetSize) {
              result = await optimizeGifToTargetSize(file.buffer, targetSize, frameResize);
            } else {
              result = await optimizeGifWithQuality(file.buffer, parseInt(quality), frameResize);
            }

            const base64 = `data:image/gif;base64,${result.buffer.toString('base64')}`;
            results.push(base64);
            continue;
          } catch (error) {
            console.error(`GIF optimization failed for ${file.originalname}:`, error);
            results.push(null);
            continue;
          }
        }
        let pipeline = sharp(file.buffer);

        // Handle resize
        if (resizeMode === 'preset' && preset) {
          const maxDimension = parseInt(preset);
          pipeline = pipeline.resize(maxDimension, maxDimension, {
            fit: 'inside',
            withoutEnlargement: true,
          });
        } else if (resizeMode === 'custom') {
          const resizeWidth = width ? parseInt(width) : undefined;
          const resizeHeight = height ? parseInt(height) : undefined;

          if (resizeWidth || resizeHeight) {
            pipeline = pipeline.resize(resizeWidth, resizeHeight, {
              fit: preserveAspectRatio === 'true' ? 'inside' : 'fill',
              withoutEnlargement: true,
            });
          }
        }

        // Handle transparency
        if (format === 'jpeg') {
          pipeline = pipeline.flatten({ background: backgroundColor });
        }

        // Convert format with advanced compression
        const qualityNum = parseInt(quality);
        const outputOptions = getCompressionOptions(format, qualityNum, compressionMode);

        pipeline = pipeline.toFormat(format, outputOptions);

        const buffer = await pipeline.toBuffer();
        const base64 = `data:image/${format};base64,${buffer.toString('base64')}`;

        results.push(base64);
      } catch (error) {
        console.error(`Failed to convert ${file.originalname}:`, error);
        results.push(null);
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Batch conversion error:', error);
    res.status(500).json({ error: error.message || 'Failed to convert images' });
  }
});

module.exports = router;
