/**
 * HTML Section Filter Utility
 * Filters out HTML sections marked with comment markers for preview purposes
 *
 * Supports multiple formats for start marker:
 * - <!-- SectionName -->
 * - <!--=== SectionName ===-->
 *
 * End marker format (always):
 * - <!-- SectionName-end -->
 *
 * Performance optimizations:
 * - Regex patterns are cached to avoid recompilation
 * - Efficient string replacement using native replace()
 */

/**
 * Keeps ONLY the specified HTML sections, hiding all others that are marked
 * Useful for "Focus Mode" on a single block while preserving global CSS and wrappers
 * 
 * @param html - HTML content to filter
 * @param shownSections - Array of section names to KEEP visible
 * @returns Filtered HTML with other sections removed
 */
export function keepOnlyMarkedSections(html: string, shownSections: string[]): string {
  if (!html || !shownSections || shownSections.length === 0) {
    return html;
  }
  
  // 1. Get all sections available in the HTML
  const allSections = extractSectionNames(html);
  
  // 2. Determine which sections need to be hidden (all EXCEPT the shown ones)
  const sectionsToHide = allSections.filter(section => !shownSections.includes(section));
  
  // 3. Delegate to filterMarkedSections to do the actual removal
  return filterMarkedSections(html, sectionsToHide);
}

/**
 * Filters out HTML sections marked with comment markers
 * Start marker can be with or without ===, end marker always uses -end suffix
 *
 * @param html - HTML content to filter
 * @param hiddenSections - Array of section names to hide
 * @returns Filtered HTML with specified sections removed (for preview only)
 */
// Cache for compiled regex patterns to avoid recompilation
const patternCache = new Map<string, { exact: RegExp }>();

export function filterMarkedSections(html: string, hiddenSections: string[]): string {
  if (!html || !hiddenSections || hiddenSections.length === 0) {
    return html;
  }

  let filtered = html;

  // For each section to hide
  for (const sectionName of hiddenSections) {
    let cleanName = sectionName.trim();
    // Clean up if user accidentally included comment markers
    cleanName = cleanName.replace(/<!--=*\s*/g, "").replace(/\s*=*(?:-->|--!>)/g, "");
    cleanName = cleanName.replace(/-end\s*$/, "");

    if (!cleanName) continue; // Skip empty names

    let patterns = patternCache.get(cleanName);

    if (!patterns) {
      const escapedName = cleanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      patterns = {
        // Matches <!--=== ExactName ===--> ... <!--=== ExactName-end ===-->
        // Allowing hyphens, equals, asterisks, and spaces as decorators, plus optional trailing digits for numbered blocks
        exact: new RegExp(
          `<!--[-=*\\s]*${escapedName}(?:-\\d+(?:-[a-zA-Z]+)?)?[-=*\\s]*(?:-->|--!>)[\\s\\S]*?<!--[-=*\\s]*${escapedName}(?:-\\d+(?:-[a-zA-Z]+)?)?-end[-=*\\s]*(?:-->|--!>)`,
          "gi"
        )
      };

      patternCache.set(cleanName, patterns);
    }

    filtered = filtered.replace(patterns.exact, "");
  }

  // Clean up multiple consecutive newlines/whitespace left after removal
  filtered = filtered.replace(/\n\s*\n\s*\n/g, "\n\n");

  return filtered;
}

/**
 * Extract all section names from HTML marked with comment markers
 * Useful for auto-detecting available sections
 *
 * @param html - HTML content to scan
 * @returns Array of section names found in the HTML
 */
export function extractSectionNames(html: string): string[] {
  if (!html) return [];

  const sections = new Set<string>();

  // Use a more generic pattern that greedily eats decorations (spaces, equals, asterisks, hyphens)
  // before and after the actual meat of the name.
  const pattern = /<!--[-=*\\s]*([^>]*?)[-=*\\s]*(?:-->|--!>)/gi;

  let match;
  while ((match = pattern.exec(html)) !== null) {
    let sectionName = match[1].trim();

    // Clean up decorators using literal character classes
    // Note: \\s is used safely in a literal Regex instead of string building
    sectionName = sectionName.replace(/^[-=*~!\s]+|[-=*~!\s]+$/g, '');

    // Strip generic numeric block suffixes (e.g. Note-1 -> Note, Content-2-mob -> Content)
    sectionName = sectionName.replace(/-\d+(?:-[a-zA-Z]+)?$/, '');

    // Ignore common standard HTML comments, conditional comments, or generic endings
    const lowerName = sectionName.toLowerCase();
    if (
      !sectionName ||
      lowerName.startsWith("/") ||
      lowerName.endsWith("-end") ||
      lowerName.endsWith(" end") ||
      lowerName.startsWith("end ") ||
      lowerName.startsWith("start ") ||
      lowerName.includes("ends here") ||
      lowerName.includes("starts here") ||
      lowerName.startsWith("[if") ||
      lowerName.startsWith("<![endif]") ||
      lowerName.includes("<") || 
      lowerName.includes(">") ||
      lowerName.includes("=") ||
      lowerName.includes('"')
    ) {
      continue;
    }
    
    // Normalize case: "HEADER" -> "Header", "hero-section" -> "Hero-section"
    sectionName = lowerName.charAt(0).toUpperCase() + lowerName.slice(1);

    sections.add(sectionName);
  }

  return Array.from(sections).sort();
}

/**
 * Extracts ONLY the specified HTML section (start to end comment), 
 * and wraps it with the document's original <style> and <head> elements 
 * to preserve the formatting.
 * 
 * @param html - Original HTML document
 * @param sectionPrefix - The block name or prefix to search for (case-insensitive)
 * @returns String containing only the styles + extracted block, or original HTML if not found.
 */
export function extractMarkedSectionWithStyles(html: string, sectionPrefix: string): string {
  if (!html || !sectionPrefix) return html;

  const escapedPrefix = sectionPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Find start comment matching: <!-- (maybe spaces) (prefix) (maybe anything else) -->
  const startRegex = new RegExp(`<!--=*\\s*(${escapedPrefix}[^>]*?)\\s*=*(?:-->|--!>)`, 'i');
  const startMatch = startRegex.exec(html);
  
  if (!startMatch) return html; // Block not found
  
  const exactBlockName = startMatch[1].trim();
  const escapedExactName = exactBlockName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Find everything between start and end comment
  // Example end: <!-- exactBlockName-end --> or <!-- exactBlockName-end --!>
  const extRegex = new RegExp(
    `<!--=*\\s*${escapedExactName}\\s*=*(?:-->|--!>)([\\s\\S]*?)<!--=*\\s*${escapedExactName}-end\\s*=*(?:-->|--!>)`,
    'i'
  );
  
  let blockMatch = extRegex.exec(html);
  let extractedContent = '';
  
  if (blockMatch) {
    extractedContent = blockMatch[1];
  } else {
    // Try a looser fallback: any -end tag after the start
    const fallbackRegex = new RegExp(
      `<!--=*\\s*${escapedExactName}\\s*=*(?:-->|--!>)([\\s\\S]*?)<!--[^-]*?-end\\s*=*(?:-->|--!>)`,
      'i'
    );
    const fallbackMatch = fallbackRegex.exec(html);
    if (fallbackMatch) {
      extractedContent = fallbackMatch[1];
    } else {
      return html; // Block end not found
    }
  }

  // Extract <style> and <link> from <head> (or anywhere)
  const styleRegex = /<style\b[^>]*>[\s\S]*?<\/style>/gi;
  const linkRegex = /<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi;
  
  let styles = '';
  let match;
  
  while ((match = styleRegex.exec(html)) !== null) {
    styles += match[0] + '\\n';
  }
  
  while ((match = linkRegex.exec(html)) !== null) {
    styles += match[0] + '\\n';
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
${styles}
</head>
<body style="margin: 0; padding: 0;">
  ${extractedContent}
</body>
</html>`;
}
