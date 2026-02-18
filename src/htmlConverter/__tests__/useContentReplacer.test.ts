import { renderHook } from "@testing-library/react";

import { useContentReplacer } from "../hooks/useContentReplacer";

describe("useContentReplacer", () => {
  it("should escape alt text when replacing existing alt attribute", () => {
    const { result } = renderHook(() => useContentReplacer());

    const input = '<img src="https://cdn.example.com/a.png" alt="old">';
    const altMap = {
      "https://cdn.example.com/a.png": 'John "J" & <Team>',
    };

    const output = result.current.replaceAltsInContent(input, altMap);

    expect(output.count).toBe(1);
    expect(output.replaced).toContain('alt="John &quot;J&quot; &amp; &lt;Team&gt;"');
  });

  it("should escape alt text when injecting missing alt attribute", () => {
    const { result } = renderHook(() => useContentReplacer());

    const input = '<img src="https://cdn.example.com/b.png">';
    const altMap = {
      "https://cdn.example.com/b.png": "Client's banner",
    };

    const output = result.current.replaceAltsInContent(input, altMap);

    expect(output.count).toBe(1);
    expect(output.replaced).toContain('alt="Client&#39;s banner"');
  });
});

