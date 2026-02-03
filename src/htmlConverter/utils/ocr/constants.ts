/**
 * Shared OCR constants and dictionaries
 */

// 2-letter words allowed in ALL CAPS
export const ALLOWED_SHORT_ALL_CAPS = new Set([
  "AI", "AN", "AS", "AT", "BE", "BY", "DO", "EX", "GO", "IF", "IN", "IS", "IT", "MY",
  "NO", "OF", "OK", "ON", "OR", "TO", "UP", "US", "WE",
]);

// Common 3-letter words
export const COMMON_3_LETTER_WORDS = new Set([
  "ALL", "AND", "ANY", "ARE", "BUT", "BUY", "CAN", "DID", "FOR", "GET", "HIS",
  "HER", "HOW", "NEW", "NOT", "NOW", "OUR", "OUT", "SEE", "THE", "TOP", "TRY",
  "USE", "WHY", "WIN", "YOU",
]);
