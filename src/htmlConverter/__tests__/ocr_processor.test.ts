import { processOcrOutput } from "../utils/ocr/postprocess/processor";

describe("OCR processor filename suggestions", () => {
  it("should avoid article stop-words in proposed file names", () => {
    const result = processOcrOutput("THE MARKET UPDATE\nCLICK HERE", { spellCorrect: false });

    expect(result.nameSuggestions).not.toContain("the");
    expect(result.nameSuggestions).toEqual(expect.arrayContaining(["market", "update"]));
  });
});

