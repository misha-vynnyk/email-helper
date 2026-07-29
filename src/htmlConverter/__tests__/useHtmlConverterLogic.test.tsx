import { act,renderHook } from "@testing-library/react";

import { useHtmlConverterLogic } from "../hooks/useHtmlConverterLogic";
import { DEFAULT_UI_SETTINGS } from "../hooks/useHtmlConverterSettings";

// Mocks
jest.mock("../hooks/useBrowserDetection", () => ({
  useBrowserDetection: () => ({ status: "skipped", path: null }),
}));
jest.mock("../hooks/useHtmlConverterSettings", () => ({
  useHtmlConverterSettings: () => ({
    ui: DEFAULT_UI_SETTINGS,
    setUi: jest.fn(),
  }),
  DEFAULT_UI_SETTINGS: {
    showLogsPanel: true,
  },
}));

describe("useHtmlConverterLogic", () => {
  // Mock Refs
  const mockEditorRef = { current: document.createElement("div") };
  const mockOutputHtmlRef = { current: document.createElement("textarea") };
  const mockOutputMjmlRef = { current: document.createElement("textarea") };

  const defaultProps = {
    editorRef: mockEditorRef,
    outputHtmlRef: mockOutputHtmlRef,
    outputMjmlRef: mockOutputMjmlRef,
  };

  it("should initialize with default file name", () => {
    const { result } = renderHook(() => useHtmlConverterLogic(defaultProps));
    expect(result.current.state.fileName).toBe("promo-1");
  });

  it("should increase file number correctly", () => {
    const { result } = renderHook(() => useHtmlConverterLogic(defaultProps));

    act(() => {
      result.current.actions.changeFileNumber(1);
    });

    expect(result.current.state.fileName).toBe("promo-2");
  });

  it("should decrease file number correctly", () => {
    const { result } = renderHook(() => useHtmlConverterLogic(defaultProps));

    // First increase to promo-2
    act(() => {
      result.current.actions.changeFileNumber(1);
    });
    expect(result.current.state.fileName).toBe("promo-2");

    // Then decrease
    act(() => {
      result.current.actions.changeFileNumber(-1);
    });
    expect(result.current.state.fileName).toBe("promo-1");
  });

  it("should switch storage profile", () => {
    const { result } = renderHook(() => useHtmlConverterLogic(defaultProps));

    expect(result.current.state.storageProfile).toBe("default");

    act(() => {
      result.current.actions.setStorageProfile("ttt");
    });

    expect(result.current.state.storageProfile).toBe("ttt");
  });

  it("forces exportType to \"html\" when switching to a non-default profile (ttt/alphaone/red are HTML-only)", () => {
    const { result } = renderHook(() => useHtmlConverterLogic(defaultProps));

    act(() => {
      result.current.actions.setExportType("both");
    });
    expect(result.current.state.exportType).toBe("both");

    act(() => {
      result.current.actions.setStorageProfile("red");
    });
    expect(result.current.state.exportType).toBe("html");
  });

  it("does the same for ttt/alphaone, not just red", () => {
    const { result } = renderHook(() => useHtmlConverterLogic(defaultProps));

    act(() => {
      result.current.actions.setExportType("mjml");
      result.current.actions.setStorageProfile("ttt");
    });
    expect(result.current.state.exportType).toBe("html");

    act(() => {
      result.current.actions.setExportType("both");
      result.current.actions.setStorageProfile("alphaone");
    });
    expect(result.current.state.exportType).toBe("html");
  });

  it("does NOT force exportType away from \"both\" for the default profile", () => {
    const { result } = renderHook(() => useHtmlConverterLogic(defaultProps));

    act(() => {
      result.current.actions.setStorageProfile("ttt");
    });
    expect(result.current.state.exportType).toBe("html");

    act(() => {
      result.current.actions.setExportType("both");
      result.current.actions.setStorageProfile("default");
    });
    expect(result.current.state.exportType).toBe("both");
  });

  it("should log messages when log panel is active", () => {
    const { result } = renderHook(() => useHtmlConverterLogic(defaultProps));

    act(() => {
      result.current.actions.addLog("Test message");
    });

    expect(result.current.state.log).toContain("Test message");
  });
});
