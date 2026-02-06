import { formatHtml } from "../formatter";

describe("htmlConverter formatter", () => {
  describe("formatHtml", () => {
    // ... existing tests ... can be kept or rewritten for clarity.
    // I will rewrite the file to include previous + new tests.

    it("should transform h1 to headline block", () => {
      const input = "<h1>Welcome to Newsletter</h1>";
      const result = formatHtml(input);
      expect(result).toContain("Welcome to Newsletter");
      expect(result).toContain("font-size:22px");
      expect(result).toContain("font-weight:bold");
    });

    it("should transform h5 to button", () => {
      const input = "<h5>Click Me</h5>";
      const result = formatHtml(input);
      expect(result).toContain("Click Me");
      expect(result).toContain("background-color: #28b628");
      expect(result).toContain("border-radius: 10px");
    });

    it("should center text (centerText template)", () => {
      // Regex: /<p[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/p>/gi
      const input = '<p style="text-align: center">Centered Text</p>';
      const result = formatHtml(input);
      expect(result).toContain("Centered Text");
      expect(result).toContain("text-align:center");
    });

    it("should handle small text (smallText template)", () => {
      // Regex: /<h6[^>]*>([\s\S]*?)<\/h6>/gi
      const input = "<h6>Small Print</h6>";
      const result = formatHtml(input);
      expect(result).toContain("Small Print");
      expect(result).toContain("font-size:12px");
    });

    it("should handle quotes (quote template)", () => {
      // Regex: /<h4[^>]*>([\s\S]*?)<\/h4>/gi
      const input = "<h4>Inspirational Quote</h4>";
      const result = formatHtml(input);
      expect(result).toContain("Inspirational Quote");
      // Quotes usually have some padding or style.
      // templates.ts: padding-left: 20px;
      expect(result).toContain("padding-left: 20px");
    });

    it("should handle right side image (rightSideImg template)", () => {
      // Regex: /i-r-s([\s\S]*?)i-r-s-e/gi
      const input = "i-r-sImage Texti-r-s-e";
      const result = formatHtml(input);
      expect(result).toContain("Image Text");
      expect(result).toContain('align="right"');
      expect(result).toContain("float: right");
    });

    it("should handle footer block (footerBlock template)", () => {
      // Regex: /ftr-s([\s\S]*?)ftr-e/gi
      const input = "ftr-sFooter Contentftr-e";
      const result = formatHtml(input);
      expect(result).toContain("Footer Content");
      expect(result).toContain("padding-top: 34px"); // HTML footer padding
      expect(result).toContain("font-size:12px");
    });

    it("should transform signature placeholders", () => {
      // Regex: /sign-i([\s\S]*?)sign-i-e/gi
      const input = "sign-iMy Signaturesign-i-e";
      const result = formatHtml(input);
      expect(result).toContain('alt="Signature"');
      expect(result).toContain('width="200"'); // HTML signature width
    });

    it("should wrap images in specific structure", () => {
      const input = '<img src="image.jpg" alt="test">';
      const result = formatHtml(input);
      // It replaces the src with config.storageUrl in the template wrapImg
      expect(result).toContain('src="https://storage.5th-elementagency.com/"');
      // The original image src is currently NOT preserved in the wrapImg template based on templates.ts analysis
      // It uses ${config.storageUrl} directly.
    });

    it("should handle mixed content", () => {
      const input = "<h1>Title</h1><p>Text</p><h5>Button</h5>";
      const result = formatHtml(input);
      expect(result).toContain("Title");
      expect(result).toContain("Text");
      expect(result).toContain("Button");
    });
  });
});
