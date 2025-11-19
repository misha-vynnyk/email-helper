/**
 * Format Recommendation System
 * Recommends optimal image format based on image characteristics
 */

import { logger } from '../../utils/logger';
import { ImageFormat } from '../types';
import { analyzeImage, ImageAnalysis } from './imageAnalyzer';

export interface FormatRecommendation {
  format: ImageFormat;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  alternatives?: ImageFormat[];
}

/**
 * Recommend optimal format based on image analysis
 */
export async function recommendFormat(file: File): Promise<FormatRecommendation> {
  try {
    const analysis = await analyzeImage(file);
    return recommendFormatFromAnalysis(analysis);
  } catch (error) {
    // Fallback recommendation on error
    return {
      format: 'webp',
      reason: 'Default recommendation (analysis failed)',
      confidence: 'low',
      alternatives: ['jpeg', 'png'],
    };
  }
}

/**
 * Recommend format based on image analysis results
 */
export function recommendFormatFromAnalysis(analysis: ImageAnalysis): FormatRecommendation {
  // Rule 1: Transparency requires PNG or WebP
  if (analysis.hasTransparency) {
    return {
      format: 'webp',
      reason: 'Image has transparency - WebP supports alpha channel',
      confidence: 'high',
      alternatives: ['png'],
    };
  }

  // Rule 2: Text/Graphics with limited colors → PNG
  if (analysis.hasText && analysis.colors < 256) {
    return {
      format: 'png',
      reason: 'Text or graphics with limited colors - PNG is lossless',
      confidence: 'high',
      alternatives: ['webp'],
    };
  }

  // Rule 3: High color count + smooth gradients (photos) → WebP or JPEG
  if (analysis.isPhoto && analysis.colors > 2000) {
    return {
      format: 'webp',
      reason: 'Photographic image - WebP provides best compression',
      confidence: 'high',
      alternatives: ['jpeg'],
    };
  }

  // Rule 4: Graphics/logos with moderate colors → WebP
  if (analysis.hasText) {
    return {
      format: 'webp',
      reason: 'Contains text - WebP offers good quality',
      confidence: 'medium',
      alternatives: ['png', 'jpeg'],
    };
  }

  // Rule 5: Simple graphics with few colors → PNG
  if (analysis.colors < 512) {
    return {
      format: 'png',
      reason: 'Simple graphics with limited colors',
      confidence: 'medium',
      alternatives: ['webp'],
    };
  }

  // Default: WebP for general purpose
  return {
    format: 'webp',
    reason: 'WebP provides best balance of quality and size',
    confidence: 'medium',
    alternatives: ['jpeg', 'png'],
  };
}

/**
 * Get format recommendation for multiple files
 */
export async function recommendFormatBatch(
  files: File[]
): Promise<Map<string, FormatRecommendation>> {
  const recommendations = new Map<string, FormatRecommendation>();

  await Promise.all(
    files.map(async (file) => {
      try {
        const recommendation = await recommendFormat(file);
        recommendations.set(file.name, recommendation);
      } catch (error) {
        logger.error('FormatRecommender', `Failed to analyze ${file.name}`, error);
      }
    })
  );

  return recommendations;
}
