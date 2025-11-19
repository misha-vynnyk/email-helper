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
 * Filters out HTML sections marked with comment markers
 * Start marker can be with or without ===, end marker always uses -end suffix
 *
 * @param html - HTML content to filter
 * @param hiddenSections - Array of section names to hide
 * @returns Filtered HTML with specified sections removed (for preview only)
 */
// Cache for compiled regex patterns to avoid recompilation
const patternCache = new Map<
  string,
  { pattern1: RegExp; pattern2: RegExp; pattern3: RegExp; pattern4: RegExp }
>();

export function filterMarkedSections(html: string, hiddenSections: string[]): string {
  if (!html || !hiddenSections || hiddenSections.length === 0) {
    return html;
  }

  let filtered = html;

  // For each section to hide
  for (const sectionName of hiddenSections) {
    // Clean up section name (remove comment markers if user accidentally included them)
    let cleanName = sectionName.trim();
    // Remove comment markers: <!-- and --> (with or without ===)
    cleanName = cleanName.replace(/<!--=*\s*/g, "").replace(/\s*=*\s*-->/g, "");
    // Remove -end suffix if present
    cleanName = cleanName.replace(/-end\s*$/, "");

    if (!cleanName) continue; // Skip empty names

    // Check cache first
    let patterns = patternCache.get(cleanName);

    if (!patterns) {
      // Escape special regex characters in section name
      const escapedName = cleanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      // Compile patterns once and cache them
      // Start marker: supports both <!-- SectionName --> and <!--=== SectionName ===-->
      // End marker: always <!-- SectionName-end --> (with -end suffix)
      patterns = {
        // Pattern 1: <!-- SectionName --> ... <!-- SectionName-end -->
        pattern1: new RegExp(
          `<!--\\s*${escapedName}\\s*-->[\\s\\S]*?<!--\\s*${escapedName}-end\\s*-->`,
          "gi"
        ),
        // Pattern 2: <!--=== SectionName ===--> ... <!-- SectionName-end -->
        pattern2: new RegExp(
          `<!--={3,}\\s*${escapedName}\\s*={3,}-->[\\s\\S]*?<!--\\s*${escapedName}-end\\s*-->`,
          "gi"
        ),
        // Pattern 3: <!-- SectionName --> ... <!--=== SectionName-end ===-->
        pattern3: new RegExp(
          `<!--\\s*${escapedName}\\s*-->[\\s\\S]*?<!--={3,}\\s*${escapedName}-end\\s*={3,}-->`,
          "gi"
        ),
        // Pattern 4: <!--=== SectionName ===--> ... <!--=== SectionName-end ===-->
        pattern4: new RegExp(
          `<!--={3,}\\s*${escapedName}\\s*={3,}-->[\\s\\S]*?<!--={3,}\\s*${escapedName}-end\\s*={3,}-->`,
          "gi"
        ),
      };

      patternCache.set(cleanName, patterns);
    }

    // Apply all patterns
    filtered = filtered.replace(patterns.pattern1, "");
    filtered = filtered.replace(patterns.pattern2, "");
    filtered = filtered.replace(patterns.pattern3, "");
    filtered = filtered.replace(patterns.pattern4, "");
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

  // Pattern 1: <!-- SectionName --> (without ===)
  const pattern1 = /<!--\s*([^\s=-]+)\s*-->/gi;
  // Pattern 2: <!--=== SectionName ===--> (with ===)
  const pattern2 = /<!--={3,}\s*([^\s=]+)\s*={3,}-->/gi;

  let match;

  // Find sections without ===
  while ((match = pattern1.exec(html)) !== null) {
    const sectionName = match[1].trim();
    // Exclude end markers (those starting with / or ending with -end)
    if (!sectionName.startsWith("/") && !sectionName.endsWith("-end")) {
      sections.add(sectionName);
    }
  }

  // Find sections with ===
  while ((match = pattern2.exec(html)) !== null) {
    const sectionName = match[1].trim();
    // Exclude end markers (those starting with / or ending with -end)
    if (!sectionName.startsWith("/") && !sectionName.endsWith("-end")) {
      sections.add(sectionName);
    }
  }

  return Array.from(sections).sort();
}
