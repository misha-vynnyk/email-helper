/**
 * @jest-environment jsdom
 *
 * jsdom doesn't implement the CSS Custom Highlight API — a minimal polyfill is
 * installed per-test so the "supported" path can be exercised, and removed to
 * verify the feature-detect skip path.
 */
import { renderHook } from "@testing-library/react";
import type { RefObject } from "react";

import { useGreetingHighlighter } from "../hooks/internal/useGreetingHighlighter";

class FakeHighlight {
  ranges: Range[];
  constructor(...ranges: Range[]) {
    this.ranges = ranges;
  }
}

function installHighlightApi() {
  const registry = { set: jest.fn(), delete: jest.fn() };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- polyfilling a jsdom-missing global for tests
  (globalThis as any).CSS = { ...(globalThis as any).CSS, highlights: registry };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- polyfilling a jsdom-missing global for tests
  (globalThis as any).Highlight = FakeHighlight;
  return registry;
}

function removeHighlightApi() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const css = (globalThis as any).CSS ?? {};
  delete css.highlights;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).CSS = css;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).Highlight;
}

function createEditor(html: string): HTMLDivElement {
  const editor = document.createElement("div");
  editor.innerHTML = html;
  document.body.appendChild(editor);
  return editor;
}

afterEach(() => {
  document.body.innerHTML = "";
  jest.useRealTimers();
  removeHighlightApi();
});

describe("useGreetingHighlighter — API непідтримувана (feature detect)", () => {
  it("нічого не робить і не падає, коли CSS.highlights відсутній", () => {
    removeHighlightApi();
    const editor = createEditor("<p>Dear Reader,</p>");
    const editorRef: RefObject<HTMLDivElement> = { current: editor };

    expect(() => renderHook(() => useGreetingHighlighter({ editorRef, enabled: true }))).not.toThrow();
  });
});

describe("useGreetingHighlighter — API підтримувана", () => {
  it("реєструє hc-greeting з Ranges для знайдених привітань при монтуванні", () => {
    const registry = installHighlightApi();
    const editor = createEditor("<p>Dear Reader,</p><p>Body text.</p>");
    const editorRef: RefObject<HTMLDivElement> = { current: editor };

    renderHook(() => useGreetingHighlighter({ editorRef, enabled: true }));

    expect(registry.set).toHaveBeenCalledTimes(1);
    const [name, highlight] = registry.set.mock.calls[0];
    expect(name).toBe("hc-greeting");
    expect((highlight as FakeHighlight).ranges).toHaveLength(1);
  });

  it("не реєструє нічого, коли вимкнено", () => {
    const registry = installHighlightApi();
    const editor = createEditor("<p>Dear Reader,</p>");
    const editorRef: RefObject<HTMLDivElement> = { current: editor };

    renderHook(() => useGreetingHighlighter({ editorRef, enabled: false }));

    expect(registry.set).not.toHaveBeenCalled();
  });

  it("оновлює підсвітку з дебаунсом 250мс після input у редакторі", () => {
    jest.useFakeTimers();
    const registry = installHighlightApi();
    const editor = createEditor("<p>Body text only.</p>");
    const editorRef: RefObject<HTMLDivElement> = { current: editor };

    renderHook(() => useGreetingHighlighter({ editorRef, enabled: true }));
    expect(registry.set).toHaveBeenCalledTimes(1);
    expect((registry.set.mock.calls[0][1] as FakeHighlight).ranges).toHaveLength(0);

    editor.innerHTML = "<p>Hi there,</p>";
    editor.dispatchEvent(new Event("input", { bubbles: true }));

    jest.advanceTimersByTime(249);
    expect(registry.set).toHaveBeenCalledTimes(1); // ще не спрацював дебаунс

    jest.advanceTimersByTime(1);
    expect(registry.set).toHaveBeenCalledTimes(2);
    expect((registry.set.mock.calls[1][1] as FakeHighlight).ranges).toHaveLength(1);
  });

  it("видаляє hc-greeting і знімає listener при unmount", () => {
    const registry = installHighlightApi();
    const editor = createEditor("<p>Dear Reader,</p>");
    const editorRef: RefObject<HTMLDivElement> = { current: editor };
    const removeSpy = jest.spyOn(editor, "removeEventListener");

    const { unmount } = renderHook(() => useGreetingHighlighter({ editorRef, enabled: true }));
    unmount();

    expect(registry.delete).toHaveBeenCalledWith("hc-greeting");
    expect(removeSpy).toHaveBeenCalledWith("input", expect.any(Function));
  });

  it("видаляє попередню підсвітку, коли фічу вимикають (rerender enabled -> false)", () => {
    const registry = installHighlightApi();
    const editor = createEditor("<p>Dear Reader,</p>");
    const editorRef: RefObject<HTMLDivElement> = { current: editor };

    const { rerender } = renderHook(({ enabled }) => useGreetingHighlighter({ editorRef, enabled }), { initialProps: { enabled: true } });
    expect(registry.set).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });

    expect(registry.delete).toHaveBeenCalledWith("hc-greeting");
    expect(registry.set).toHaveBeenCalledTimes(1); // не реєструє знову, поки вимкнено
  });
});
