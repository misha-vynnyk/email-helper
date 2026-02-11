import { renderHook, act } from "@testing-library/react";
import { useHtmlConverterLogic } from "../hooks/useHtmlConverterLogic";
import { DEFAULT_UI_SETTINGS } from "../hooks/useHtmlConverterSettings";

// Mocks
jest.mock("../hooks/useHtmlConverterSettings", () => ({
  useHtmlConverterSettings: () => ({
    ui: DEFAULT_UI_SETTINGS,
    setUi: jest.fn(),
  }),
  DEFAULT_UI_SETTINGS: {
    showLogsPanel: true,
  },
}));

jest.mock("../hooks/useContentReplacer", () => ({
  useContentReplacer: () => ({
    replaceUrlsInContentByMap: jest.fn(),
    replaceUrlsInContent: jest.fn(),
    replaceAltsInContent: jest.fn(),
  }),
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

  it("should toggle Alfa One setting", () => {
    const { result } = renderHook(() => useHtmlConverterLogic(defaultProps));

    expect(result.current.state.useAlfaOne).toBe(false);

    act(() => {
      result.current.actions.setUseAlfaOne(true);
    });

    expect(result.current.state.useAlfaOne).toBe(true);
  });

  it("should log messages when log panel is active", () => {
    const { result } = renderHook(() => useHtmlConverterLogic(defaultProps));

    act(() => {
      result.current.actions.addLog("Test message");
    });

    expect(result.current.state.log).toContain("Test message");
  });
});
