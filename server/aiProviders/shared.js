/**
 * Shared logic across AI providers (Ollama, Cloudflare Workers AI): image
 * preprocessing, the analyze prompt, and defensive JSON extraction from a
 * model's free-text response (only Ollama's `format:"json"` guarantees clean
 * JSON — Cloudflare Workers AI vision models have no equivalent, so every
 * provider funnels its raw text through extractJsonFromText()).
 */

const DEFAULT_PROMPT =
  'Analyze this image and return a strictly formatted JSON object with these keys:\n' +
  '- "filename": Exactly ONE lowercase word representing the main object (e.g., \'sneaker\', \'logo\', \'fashion\').\n' +
  '- "alt_text": A very short, crisp, and clean description (max 10 words). No "Image of" or "This is".\n' +
  '- "cta": Only the text from a Call-to-Action button if visible. Otherwise empty string.\n\n' +
  'Respond ONLY with valid JSON.';

async function resizeImageToJpeg(buffer) {
  try {
    const sharp = require("sharp");
    return await sharp(buffer)
      .resize(768, 768, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    return buffer;
  }
}

/**
 * Best-effort JSON extraction from an LLM's free-text response.
 * Tries, in order: direct parse, a fenced ```json/``` code block, then the
 * first-`{`-to-last-`}` substring. Returns null (not a default object) so
 * callers can distinguish "parsed" from "fell back" and attach a warning.
 */
function extractJsonFromText(text) {
  if (typeof text !== "string" || !text.trim()) return null;

  const attempts = [text.trim()];

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) attempts.push(fenced[1].trim());

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    attempts.push(text.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // try next candidate
    }
  }
  return null;
}

/** Normalizes any provider's parsed `{filename, alt_text, cta}` into the response shape aiClient.ts expects. */
function normalizeProviderResult(parsed, { warning } = {}) {
  const filename = String(parsed?.filename || "image");
  const altText = String(parsed?.alt_text || "Image");
  const cta = String(parsed?.cta || "");
  return {
    filename,
    alt_text: altText,
    cta,
    candidates: { filenames: [filename], alt_texts: [altText] },
    raw: { ocr: cta, caption: altText, tags: [] },
    cached: false,
    ...(warning ? { warning } : {}),
  };
}

module.exports = { DEFAULT_PROMPT, resizeImageToJpeg, extractJsonFromText, normalizeProviderResult };
