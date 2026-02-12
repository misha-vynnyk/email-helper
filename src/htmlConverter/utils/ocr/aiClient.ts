import { OcrAnalyzeResult } from "./analyzer";
import { cleanupAltCandidate, formatCtaAsAction, truncateAlt } from "./postprocess/cleanup";

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

/**
 * Client for the Python AI Backend (PaddleOCR + BLIP + CLIP)
 * Endpoint: http://localhost:8000/api/analyze
 */
export class AiBackendClient {
  private static readonly API_URL = "http://localhost:8000/api/analyze";
  private static readonly HEALTH_URL = "http://localhost:8000/health";
  private static readonly TIMEOUT = 60000; // 60 second timeout for analysis
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second between retries

  /**
   * Checks if the AI backend is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(this.HEALTH_URL, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Analyzes an image using the AI Backend with retry logic
   */
  static async analyzeImage(blob: Blob, mode: "fast" | "detailed" = "detailed"): Promise<OcrAnalyzeResult> {
    // Check if backend is available first
    const available = await this.isAvailable();
    if (!available) {
      throw new Error("AI Backend is not available. Please ensure the Python FastAPI server is running (npm run dev:ai)");
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await this.performAnalysis(blob, mode);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // If it's a timeout or network error on last attempt, throw
        if (attempt === this.MAX_RETRIES) {
          throw new Error(`AI analysis failed after ${this.MAX_RETRIES} attempts: ${lastError.message}`);
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY * attempt));
      }
    }

    throw lastError || new Error("AI analysis failed");
  }

  /**
   * Performs the actual analysis request
   */
  private static async performAnalysis(blob: Blob, mode: "fast" | "detailed"): Promise<OcrAnalyzeResult> {
    const formData = new FormData();
    formData.append("file", blob, "image.png");
    formData.append("mode", mode);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`AI Backend Error: ${response.status} ${response.statusText} - ${errorText}`);
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

      // Format CTA as action description
      const ctaSuggestions = cta ? [formatCtaAsAction(cta)] : [];

      return {
        ocrText: ocrText,
        ocrTextRaw: ocrText,
        altSuggestions,
        ctaSuggestions,
        nameSuggestions: filenameCandidates.filter((s: string) => s),
        textLikelihood: 1,
        cacheHit: false,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
