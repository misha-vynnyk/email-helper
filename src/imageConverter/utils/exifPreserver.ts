/**
 * EXIF Metadata Preservation
 * Extracts and re-embeds EXIF data during image conversion
 */

import { logger } from '../../utils/logger';
import piexif from 'piexifjs';

export interface ExifData {
  data: string | null; // Base64 encoded EXIF data
  hasExif: boolean;
}

/**
 * Extract EXIF data from image file
 */
export async function extractExif(file: File): Promise<ExifData> {
  try {
    // Read file as data URL
    const dataUrl = await fileToDataUrl(file);

    // Check if image has EXIF data
    const exifObj = piexif.load(dataUrl);

    if (exifObj && Object.keys(exifObj).length > 0) {
      // Convert EXIF object to bytes
      const exifBytes = piexif.dump(exifObj);

      return {
        data: exifBytes,
        hasExif: true,
      };
    }

    return {
      data: null,
      hasExif: false,
    };
  } catch (error) {
    logger.warn('ExifPreserver', 'Failed to extract EXIF', error);
    return {
      data: null,
      hasExif: false,
    };
  }
}

/**
 * Insert EXIF data into converted image blob
 */
export async function insertExif(blob: Blob, exifData: string): Promise<Blob> {
  try {
    // Convert blob to data URL
    const dataUrl = await blobToDataUrl(blob);

    // Insert EXIF data
    const newDataUrl = piexif.insert(exifData, dataUrl);

    // Convert back to blob
    return dataUrlToBlob(newDataUrl);
  } catch (error) {
    logger.warn('ExifPreserver', 'Failed to insert EXIF, returning original', error);
    return blob;
  }
}

/**
 * Helper: Convert File to Data URL
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Helper: Convert Blob to Data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Helper: Convert Data URL to Blob
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * Get EXIF orientation value
 */
export function getExifOrientation(exifData: string | null): number | null {
  if (!exifData) return null;

  try {
    const exifObj = piexif.load(`data:image/jpeg;base64,${exifData}`);
    return exifObj['0th']?.[piexif.ImageIFD.Orientation] || null;
  } catch {
    return null;
  }
}

/**
 * Remove EXIF data (for privacy)
 */
export async function removeExif(blob: Blob): Promise<Blob> {
  try {
    const dataUrl = await blobToDataUrl(blob);
    const newDataUrl = piexif.remove(dataUrl);
    return dataUrlToBlob(newDataUrl);
  } catch (error) {
    logger.warn('ExifPreserver', 'Failed to remove EXIF, returning original', error);
    return blob;
  }
}
