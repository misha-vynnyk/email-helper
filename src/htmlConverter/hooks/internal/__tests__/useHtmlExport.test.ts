import { act, renderHook } from "@testing-library/react";

// useHtmlExport pulls in useHtmlConverterLogic (for the ConverterMode/StorageProfile types
// and supportsMjml) -> useHtmlConverterSettings -> config/api.ts, which uses import.meta.env
// (Vite-only syntax the ts-jest CJS transform can't parse) — stub it out, same technique
// already used by UiSettingsTab.test.tsx for this exact chain.
jest.mock("@/config/api", () => ({ getApiBase: () => "", isApiAvailable: () => true, apiCall: jest.fn(), API_URL: "", default: "" }));
jest.mock("@/hooks/useCloudflareCredentials", () => ({
  useCloudflareCredentials: () => ({
    credentials: { accountId: "", apiToken: "" },
    setCredentials: jest.fn(),
    clearCredentials: jest.fn(),
    loaded: true,
    hasOwnToken: false,
    isSecureStorage: false,
  }),
}));

import { profile as alphaoneProfile } from "../../../advanced/profiles/alphaone";
import { useHtmlExport } from "../useHtmlExport";

// Regression guard for the "New tokens" section's profile-merge fix (advanced converter's
// font-size detection toggle): disabling the toggle must ADD sizeDetectionEnabled:false onto
// the active storage profile's own font override, never replace it wholesale — alphaone
// already overrides font.stack/headlinePx, and a naive `{ font: { sizeDetectionEnabled:
// false } }` replacement would silently wipe those out every time this toggle is off while
// on the AlfaOne storage profile.
describe("useHtmlExport — detectFontSizeRoles toggle preserves the active profile's own font overrides", () => {
  function setup(detectFontSizeRoles: boolean) {
    const editorDiv = document.createElement("div");
    editorDiv.innerHTML = "<p>Some content to convert</p>";
    const outputHtml = document.createElement("textarea");
    const outputMjml = document.createElement("textarea");

    const { result } = renderHook(() =>
      useHtmlExport({
        editorRef: { current: editorDiv },
        outputHtmlRef: { current: outputHtml },
        outputMjmlRef: { current: outputMjml },
        uploadedUrlMap: {},
        uploadedAltMap: {},
        uploadedWidthMap: {},
        addLog: () => {},
        setHasOutput: () => {},
        storageProfile: "alphaone",
        converterMode: "advanced",
        rawPastedHtmlRef: { current: null },
        detectFontSizeRoles,
      }),
    );
    act(() => {
      result.current.handleExportHTML();
    });
    return outputHtml.value;
  }

  it("keeps AlfaOne's font-stack override when the toggle is ON (default)", () => {
    const html = setup(true);
    expect(html).toContain(alphaoneProfile.font?.stack);
  });

  it("keeps AlfaOne's font-stack override when the toggle is OFF", () => {
    const html = setup(false);
    expect(html).toContain(alphaoneProfile.font?.stack);
  });
});
