/**
 * Image API Endpoints
 */

import { getApiBase } from '../../config/api';

export interface ImageConversionOptions {
  format: 'webp' | 'jpeg' | 'png' | 'avif';
  quality?: number;
  width?: number;
  height?: number;
}

export interface ConversionResult {
  originalSize: number;
  convertedSize: number;
  format: string;
  data: string; // base64
}

export const imageEndpoints = {
  convert: (file: File, options: ImageConversionOptions) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('format', options.format);
    if (options.quality) formData.append('quality', options.quality.toString());
    if (options.width) formData.append('width', options.width.toString());
    if (options.height) formData.append('height', options.height.toString());

    return fetch(`${getApiBase()}/api/images/convert`, {
      method: 'POST',
      body: formData,
    }).then(res => res.json());
  },

  upload: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    return fetch(`${getApiBase()}/api/images/upload`, {
      method: 'POST',
      body: formData,
    }).then(res => res.json());
  },
};
