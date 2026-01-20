const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

const execFileAsync = promisify(execFile);

// Import gifsicle binary path
let gifsicle;
try {
  gifsicle = require('gifsicle');
} catch (error) {
  console.error('⚠️ Gifsicle not found. Install it with: npm install gifsicle');
  gifsicle = null;
}

// Constants for GIF optimization
const GIF_MIN_LOSSY = 10;
const GIF_MAX_LOSSY = 200;
const GIF_TARGET_SIZE_TOLERANCE = 0.05; // 5%
const GIF_MAX_OPTIMIZATION_ITERATIONS = 10;
const GIF_OPTIMIZATION_TIMEOUT = 60000; // 60 seconds

/**
 * Convert quality (1-100) to gifsicle lossy level (10-200)
 * Lower lossy = better quality
 * Quality 100 -> lossy 10
 * Quality 1 -> lossy 200
 */
function calculateLossyFromQuality(quality) {
  // Invert the scale: high quality = low lossy
  const normalized = (100 - quality) / 100;
  const lossy = Math.round(GIF_MIN_LOSSY + normalized * (GIF_MAX_LOSSY - GIF_MIN_LOSSY));
  return Math.max(GIF_MIN_LOSSY, Math.min(GIF_MAX_LOSSY, lossy));
}

/**
 * Run gifsicle with given parameters
 */
async function runGifsicle(inputPath, outputPath, options = {}) {
  if (!gifsicle) {
    throw new Error('Gifsicle is not installed. Please run: npm install gifsicle');
  }

  const args = [
    '--no-warnings',
    '--optimize=3', // Maximum optimization
  ];

  // Add lossy compression if specified
  if (options.lossy !== undefined) {
    args.push(`--lossy=${options.lossy}`);
  }

  // Add resize options if specified
  if (options.resize) {
    const { width, height, preserveAspectRatio } = options.resize;
    if (width && height) {
      args.push(`--resize=${width}x${height}`);
    } else if (width) {
      args.push(`--resize-width=${width}`);
    } else if (height) {
      args.push(`--resize-height=${height}`);
    }
  }

  // Add colors optimization
  args.push('--colors=256');

  // Input and output
  args.push(inputPath);
  args.push('-o', outputPath);

  try {
    await execFileAsync(gifsicle, args, { timeout: GIF_OPTIMIZATION_TIMEOUT });
  } catch (error) {
    if (error.killed) {
      throw new Error('GIF optimization timed out (exceeded 60 seconds)');
    }
    throw new Error(`Gifsicle error: ${error.message}`);
  }
}

/**
 * Optimize GIF with quality-based compression
 */
async function optimizeGifWithQuality(inputBuffer, quality, frameResize = null) {
  if (!gifsicle) {
    throw new Error('Gifsicle is not installed. Please run: npm install gifsicle');
  }

  // Validate parameters
  if (!Buffer.isBuffer(inputBuffer)) {
    throw new Error('Input must be a Buffer');
  }
  if (quality < 1 || quality > 100) {
    throw new Error('Quality must be between 1 and 100');
  }
  if (frameResize) {
    if (frameResize.enabled && frameResize.width && frameResize.width < 16) {
      throw new Error('Frame width must be at least 16px');
    }
    if (frameResize.enabled && frameResize.height && frameResize.height < 16) {
      throw new Error('Frame height must be at least 16px');
    }
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gif-optimize-'));
  const inputPath = path.join(tempDir, 'input.gif');
  const outputPath = path.join(tempDir, 'output.gif');

  try {
    // Write input buffer to temp file
    await fs.writeFile(inputPath, inputBuffer);

    const lossy = calculateLossyFromQuality(quality);
    const resizeOptions = frameResize?.enabled ? {
      width: frameResize.width,
      height: frameResize.height,
      preserveAspectRatio: frameResize.preserveAspectRatio,
    } : null;

    // Run gifsicle
    await runGifsicle(inputPath, outputPath, {
      lossy,
      resize: resizeOptions,
    });

    // Read optimized file
    const outputBuffer = await fs.readFile(outputPath);

    return {
      buffer: outputBuffer,
      size: outputBuffer.length,
      lossy,
    };
  } finally {
    // Cleanup temp files
    try {
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});
      await fs.rmdir(tempDir).catch(() => {});
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }
}

/**
 * Optimize GIF to target file size using binary search
 */
async function optimizeGifToTargetSize(
  inputBuffer,
  targetSizeBytes,
  frameResize = null,
  maxIterations = GIF_MAX_OPTIMIZATION_ITERATIONS
) {
  if (!gifsicle) {
    throw new Error('Gifsicle is not installed. Please run: npm install gifsicle');
  }

  // Validate parameters
  if (!Buffer.isBuffer(inputBuffer)) {
    throw new Error('Input must be a Buffer');
  }
  if (targetSizeBytes < 10240) {
    throw new Error('Target size must be at least 10KB');
  }
  if (targetSizeBytes > 50 * 1024 * 1024) {
    throw new Error('Target size must not exceed 50MB');
  }
  if (frameResize) {
    if (frameResize.enabled && frameResize.width && frameResize.width < 16) {
      throw new Error('Frame width must be at least 16px');
    }
    if (frameResize.enabled && frameResize.height && frameResize.height < 16) {
      throw new Error('Frame height must be at least 16px');
    }
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gif-target-'));
  const inputPath = path.join(tempDir, 'input.gif');

  try {
    // Write input buffer to temp file
    await fs.writeFile(inputPath, inputBuffer);

    const resizeOptions = frameResize?.enabled ? {
      width: frameResize.width,
      height: frameResize.height,
      preserveAspectRatio: frameResize.preserveAspectRatio,
    } : null;

    // Binary search for optimal lossy value
    let minLossy = GIF_MIN_LOSSY;
    let maxLossy = GIF_MAX_LOSSY;
    let bestResult = null;
    let iteration = 0;

    const tolerance = targetSizeBytes * GIF_TARGET_SIZE_TOLERANCE;
    const maxAcceptableSize = targetSizeBytes + tolerance;

    while (iteration < maxIterations && minLossy <= maxLossy) {
      iteration++;
      const currentLossy = Math.round((minLossy + maxLossy) / 2);
      const outputPath = path.join(tempDir, `output-${iteration}.gif`);

      try {
        // Run gifsicle with current lossy value
        await runGifsicle(inputPath, outputPath, {
          lossy: currentLossy,
          resize: resizeOptions,
        });

        // Check result size
        const stats = await fs.stat(outputPath);
        const currentSize = stats.size;

        console.log(`GIF optimization iteration ${iteration}/${maxIterations}: lossy=${currentLossy}, size=${currentSize}/${targetSizeBytes}`);

        if (currentSize <= maxAcceptableSize) {
          // This result is acceptable
          const buffer = await fs.readFile(outputPath);

          // Keep this result if it's better (larger size = better quality)
          if (!bestResult || currentSize > bestResult.size) {
            bestResult = {
              buffer,
              size: currentSize,
              lossy: currentLossy,
              iterations: iteration,
            };
          }

          // Try for better quality (lower lossy)
          maxLossy = currentLossy - 1;
        } else {
          // File too large, need more compression (higher lossy)
          minLossy = currentLossy + 1;
        }

        // Cleanup iteration file
        await fs.unlink(outputPath).catch(() => {});
      } catch (error) {
        console.error(`Error in iteration ${iteration}:`, error.message);
        // If this iteration failed, continue with binary search
        if (currentLossy < (minLossy + maxLossy) / 2) {
          minLossy = currentLossy + 1;
        } else {
          maxLossy = currentLossy - 1;
        }
      }
    }

    if (!bestResult) {
      // If no acceptable result found, try with maximum compression
      const outputPath = path.join(tempDir, 'output-max.gif');
      await runGifsicle(inputPath, outputPath, {
        lossy: GIF_MAX_LOSSY,
        resize: resizeOptions,
      });

      const buffer = await fs.readFile(outputPath);
      const size = buffer.length;

      bestResult = {
        buffer,
        size,
        lossy: GIF_MAX_LOSSY,
        iterations: iteration + 1,
        warning: 'Could not reach target size even with maximum compression',
      };

      await fs.unlink(outputPath).catch(() => {});
    }

    return bestResult;
  } finally {
    // Cleanup temp files
    try {
      await fs.unlink(inputPath).catch(() => {});
      const files = await fs.readdir(tempDir).catch(() => []);
      for (const file of files) {
        await fs.unlink(path.join(tempDir, file)).catch(() => {});
      }
      await fs.rmdir(tempDir).catch(() => {});
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }
}

module.exports = {
  optimizeGifWithQuality,
  optimizeGifToTargetSize,
  calculateLossyFromQuality,
};
