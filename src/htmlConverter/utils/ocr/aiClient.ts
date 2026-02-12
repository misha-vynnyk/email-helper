import { OcrAnalyzeResult } from "./analyzer";
import { cleanupAltCandidate, formatCtaAsAction, truncateAlt } from "./postprocess/cleanup";
import { FILENAME_STOP_WORDS } from "./constants";

/**
 * Polish AI-generated alt text to follow accessibility best practices:
 * - Remove filler words at the start ("a", "an", "the", "there is", "this is")
 * - Capitalize first letter
 * - Truncate to 125 chars
 */
function polishAiAltText(text: string): string {
  if (!text) return text;

  let t = text.trim();

  // Remove common AI caption filler patterns at the start
  const fillerPatterns = [/^there\s+is\s+(a|an)\s+/i, /^this\s+is\s+(a|an)\s+/i, /^(a|an|the)\s+/i, /^image\s+of\s+(a|an|the)?\s*/i, /^photo\s+of\s+(a|an|the)?\s*/i, /^picture\s+of\s+(a|an|the)?\s*/i];

  for (const pattern of fillerPatterns) {
    t = t.replace(pattern, "");
  }

  // Remove trailing filler like "in the image" or "in the photo"
  t = t.replace(/\s+(in|on)\s+(the|a|an)\s+(image|photo|picture|background)\.?$/i, "");

  // Capitalize first letter (sentence case)
  if (t.length > 0) {
    t = t.charAt(0).toUpperCase() + t.slice(1);
  }

  // Apply standard cleanup and truncation
  return truncateAlt(cleanupAltCandidate(t));
}

function normalizeAiFilenameSuggestion(value: string): string {
  const words = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, " ")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .filter((w) => !FILENAME_STOP_WORDS.has(w));

  const normalized = words.join("-");
  return normalized.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

/**
 * Client for the Python AI Backend (PaddleOCR + BLIP + CLIP)
 * Endpoint: http://localhost:8000/api/analyze
 */
export class AiBackendClient {
  private static readonly API_URL = "http://localhost:8000/api/analyze";

  /**
   * Checks if the AI backend is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch("http://localhost:8000/health", { method: "GET" });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Analyzes an image using the AI Backend
   */
  static async analyzeImage(blob: Blob, mode: "fast" | "detailed" = "detailed"): Promise<OcrAnalyzeResult> {
    const formData = new FormData();
    formData.append("file", blob, "image.png");
    formData.append("mode", mode);

    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`AI Backend Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Map Backend response to OcrAnalyzeResult
      // Backend returns: { alt_text, filename, candidates: { alt_texts, filenames }, cta, raw: { ocr, caption, tags } }

      const ocrText = data.raw?.ocr || "";
      const rawAltCandidates = data.candidates?.alt_texts || [data.alt_text];
      const filenameCandidates = data.candidates?.filenames || [data.filename];
      const cta = data.cta || "";

      // Apply accessibility best practices to alt suggestions
      const altSuggestions = rawAltCandidates
        .filter((s: string) => s)
        .map((s: string) => polishAiAltText(s))
        .filter((s: string) => s && s.length >= 3);

      const nameSuggestions = filenameCandidates
        .filter((s: string) => s)
        .map((s: string) => normalizeAiFilenameSuggestion(s))
        .filter((s: string) => s && s.length >= 3);

      // Format CTA as action description
      const ctaSuggestions = cta ? [formatCtaAsAction(cta)] : [];

      return {
        ocrText: ocrText,
        ocrTextRaw: ocrText,
        altSuggestions,
        ctaSuggestions,
        nameSuggestions,
        textLikelihood: 1,
        cacheHit: false,
      };
    } catch (error) {
      console.error("AI Backend Call Failed:", error);
      throw error;
    }
  }
}
