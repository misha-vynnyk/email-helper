import { replaceAltsInContent } from "../utils/contentReplacer";

describe("contentReplacer", () => {
  it("should escape alt text when replacing existing alt attribute", () => {
    const input = '<img src="https://cdn.example.com/a.png" alt="old">';
    const altMap = {
      "https://cdn.example.com/a.png": 'John "J" & <Team>',
    };

    const output = replaceAltsInContent(input, altMap);

    expect(output.count).toBe(1);
    expect(output.replaced).toContain('alt="John &quot;J&quot; &amp; &lt;Team&gt;"');
  });

  it("should escape alt text when injecting missing alt attribute", () => {
    const input = '<img src="https://cdn.example.com/b.png">';
    const altMap = {
      "https://cdn.example.com/b.png": "Client's banner",
    };

    const output = replaceAltsInContent(input, altMap);

    expect(output.count).toBe(1);
    expect(output.replaced).toContain('alt="Client&#39;s banner"');
  });
});
