export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File, maxSize: number): ValidationResult {
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: `${file.name}: Not an image file` };
  }

  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return { valid: false, error: `${file.name}: File too large (max ${maxSizeMB}MB)` };
  }

  return { valid: true };
}

export function validateImageFiles(
  files: File[],
  maxSize: number
): { validFiles: File[]; errors: string[] } {
  const validFiles: File[] = [];
  const errors: string[] = [];

  files.forEach((file) => {
    const result = validateImageFile(file, maxSize);
    if (result.valid) {
      validFiles.push(file);
    } else if (result.error) {
      errors.push(result.error);
    }
  });

  return { validFiles, errors };
}
