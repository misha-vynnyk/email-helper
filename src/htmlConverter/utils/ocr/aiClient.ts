import { OcrAnalyzeResult } from "./analyzer";

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
    formData.append("file", blob, "image.png"); // Filename doesn't matter much here
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
      const altCandidates = data.candidates?.alt_texts || [data.alt_text];
      const filenameCandidates = data.candidates?.filenames || [data.filename];
      const cta = data.cta || "";

      return {
        ocrText: ocrText,
        ocrTextRaw: ocrText,
        altSuggestions: altCandidates.filter((s: string) => s), // All ALT text candidates
        ctaSuggestions: cta ? [cta] : [], // CTA if found
        nameSuggestions: filenameCandidates.filter((s: string) => s), // All filename candidates
        textLikelihood: 1, // Assume 1 if backend processed it
        cacheHit: false, // Backend might cache internally, but treated as fresh here
      };
    } catch (error) {
      console.error("AI Backend Call Failed:", error);
      throw error;
    }
  }
}
