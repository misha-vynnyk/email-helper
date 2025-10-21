/**
 * Path Utilities for Frontend
 * Cross-platform path handling and validation
 */

/**
 * Normalize path for cross-platform compatibility
 * Expands ~ to home directory and normalizes separators
 * Also handles file:// URLs
 */
export function normalizePath(inputPath: string): string {
  if (!inputPath || typeof inputPath !== 'string') {
    return '';
  }

  let normalized = inputPath.trim();

  // Handle file:// URLs
  if (normalized.startsWith('file://')) {
    try {
      const url = new URL(normalized);
      normalized = decodeURIComponent(url.pathname);
    } catch (e) {
      console.warn('Failed to parse file:// URL:', normalized);
      // Fall through to regular processing
    }
  }

  // Expand tilde (~) to home directory
  if (normalized.startsWith('~/') || normalized === '~') {
    // In browser, we can't access os.homedir(), so we'll let the backend handle it
    // Just ensure it starts with ~/
    if (normalized === '~') {
      normalized = '~/';
    }
  }

  // Normalize path separators (convert backslashes to forward slashes)
  normalized = normalized.replace(/\\/g, '/');

  // Remove duplicate slashes
  normalized = normalized.replace(/\/+/g, '/');

  return normalized;
}

/**
 * Validate path format (basic validation)
 */
export function validatePathFormat(path: string): { valid: boolean; error?: string } {
  if (!path || typeof path !== 'string') {
    return { valid: false, error: 'Path is required' };
  }

  const trimmed = path.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Path cannot be empty' };
  }

  // Normalize the path first to handle file:// URLs
  const normalized = normalizePath(trimmed);

  // Check for invalid characters (basic check) - but allow file:// URLs
  if (!trimmed.startsWith('file://')) {
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(normalized)) {
      return { valid: false, error: 'Path contains invalid characters' };
    }
  }

  // Check for reasonable length
  if (trimmed.length > 500) {
    return { valid: false, error: 'Path is too long' };
  }

  return { valid: true };
}

/**
 * Get platform-specific path examples
 */
export function getPathExamples(): { platform: string; examples: string[] }[] {
  return [
    {
      platform: 'macOS',
      examples: ['~/Documents/EmailTemplates', '/Users/yourname/Templates', '~/Desktop/MyTemplates'],
    },
    {
      platform: 'Windows',
      examples: [
        'C:\\Users\\YourName\\Documents\\EmailTemplates',
        'C:/Users/YourName/Documents/EmailTemplates',
        'D:\\Templates',
      ],
    },
    {
      platform: 'Linux',
      examples: ['~/Documents/EmailTemplates', '/home/username/templates', '~/Desktop/MyTemplates'],
    },
    {
      platform: 'Universal (Recommended)',
      examples: ['~/Documents/EmailTemplates', '~/Templates', '~/Desktop/MyTemplates'],
    },
  ];
}

/**
 * Format path for display
 */
export function formatPathForDisplay(path: string): string {
  const normalized = normalizePath(path);

  // Truncate very long paths for display
  if (normalized.length > 60) {
    const parts = normalized.split('/');
    if (parts.length > 3) {
      return `.../${parts.slice(-2).join('/')}`;
    }
  }

  return normalized;
}

/**
 * Check if path looks like a folder path (ends with / or has no extension)
 */
export function isFolderPath(path: string): boolean {
  const normalized = normalizePath(path);
  return normalized.endsWith('/') || !normalized.includes('.');
}

/**
 * Check if path looks like a file path (has extension)
 */
export function isFilePath(path: string): boolean {
  const normalized = normalizePath(path);
  return normalized.includes('.') && !normalized.endsWith('/');
}

/**
 * Extract filename from path
 */
export function getFilename(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/');
  return parts[parts.length - 1] || '';
}

/**
 * Extract directory from path
 */
export function getDirectory(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/');
  parts.pop(); // Remove filename
  return parts.join('/') || '/';
}
