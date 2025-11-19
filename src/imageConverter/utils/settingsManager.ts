/**
 * Settings Export/Import Manager
 * Save and load conversion settings profiles
 */

import { logger } from '../../utils/logger';
import { ConversionSettings } from '../types';

export interface SettingsProfile {
  name: string;
  settings: ConversionSettings;
  createdAt: number;
  description?: string;
}

/**
 * Export settings as JSON file
 */
export function exportSettings(settings: ConversionSettings, profileName: string = 'default'): void {
  const profile: SettingsProfile = {
    name: profileName,
    settings,
    createdAt: Date.now(),
    description: `Image converter settings exported on ${new Date().toLocaleString()}`,
  };

  const json = JSON.stringify(profile, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `image-converter-settings-${profileName}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import settings from JSON file
 */
export async function importSettings(file: File): Promise<ConversionSettings> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const profile: SettingsProfile = JSON.parse(json);

        // Validate profile structure
        if (!profile.settings) {
          throw new Error('Invalid settings file: missing settings object');
        }

        // Validate required fields
        const required = ['format', 'quality', 'compressionMode', 'processingMode'];
        for (const field of required) {
          if (!(field in profile.settings)) {
            throw new Error(`Invalid settings file: missing required field '${field}'`);
          }
        }

        resolve(profile.settings);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to parse settings file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Export all current settings including cache stats
 */
export function exportFullProfile(
  settings: ConversionSettings,
  cacheStats?: { count: number; size: number }
): void {
  const profile = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    settings,
    cacheStats,
    metadata: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
    },
  };

  const json = JSON.stringify(profile, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `image-converter-full-profile-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Quick export as shareable link (base64 encoded)
 */
export function exportAsShareableLink(settings: ConversionSettings): string {
  const simplified = {
    f: settings.format,
    q: settings.quality,
    c: settings.compressionMode,
    p: settings.processingMode,
    af: settings.autoConvert,
    pf: settings.preserveFormat,
    aq: settings.autoQuality,
    px: settings.preserveExif,
  };

  const json = JSON.stringify(simplified);
  const base64 = btoa(json);
  return `${window.location.origin}${window.location.pathname}?settings=${base64}`;
}

/**
 * Import from shareable link
 */
export function importFromShareableLink(base64: string): Partial<ConversionSettings> {
  try {
    const json = atob(base64);
    const simplified = JSON.parse(json);

    return {
      format: simplified.f,
      quality: simplified.q,
      compressionMode: simplified.c,
      processingMode: simplified.p,
      autoConvert: simplified.af,
      preserveFormat: simplified.pf,
      autoQuality: simplified.aq,
      preserveExif: simplified.px,
    };
      } catch (error) {
        logger.error('SettingsManager', 'Failed to import from link', error);
        throw new Error('Invalid settings link');
      }
}
