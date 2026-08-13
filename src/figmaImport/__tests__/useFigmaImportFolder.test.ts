import { act, renderHook } from "@testing-library/react";

// Mocking the endpoints module directly (not just its readFolder call) sidesteps
// api/client -> config/api & utils/logger, both of which use import.meta.env and don't
// survive ts-jest's CommonJS transform (see FigmaImportPanel.logic.test.ts for the same issue).
jest.mock("../../api/endpoints/figmaImport", () => ({
  figmaImportEndpoints: { readFolder: jest.fn() },
}));

import { figmaImportEndpoints } from "../../api/endpoints/figmaImport";
import { useFigmaImportFolder } from "../useFigmaImportFolder";

const mockedReadFolder = figmaImportEndpoints.readFolder as jest.Mock;

const validDivider = { id: "divider-1", type: "divider", color: "#676767" };

describe("useFigmaImportFolder", () => {
  afterEach(() => {
    mockedReadFolder.mockReset();
  });

  it("populates validation/raw state on a successful fetch", async () => {
    mockedReadFolder.mockResolvedValue({
      description: { exists: false },
      desktopJson: { exists: true, content: JSON.stringify([validDivider]) },
      mobileJson: { exists: true, content: JSON.stringify([validDivider]) },
    });

    const { result } = renderHook(() => useFigmaImportFolder());
    await act(async () => {
      await result.current.load("/some/folder");
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.validation?.valid).toBe(true);
    expect(result.current.desktopRaw).toContain("divider-1");
  });

  it("sets a specific error message when desktop.json is missing", async () => {
    mockedReadFolder.mockResolvedValue({
      description: { exists: false },
      desktopJson: { exists: false },
      mobileJson: { exists: true, content: JSON.stringify([validDivider]) },
    });

    const { result } = renderHook(() => useFigmaImportFolder());
    await act(async () => {
      await result.current.load("/some/folder");
    });

    expect(result.current.error).toBe("desktop.json not found in folder");
  });

  it("sets a specific error message when mobile.json is missing", async () => {
    mockedReadFolder.mockResolvedValue({
      description: { exists: false },
      desktopJson: { exists: true, content: JSON.stringify([validDivider]) },
      mobileJson: { exists: false },
    });

    const { result } = renderHook(() => useFigmaImportFolder());
    await act(async () => {
      await result.current.load("/some/folder");
    });

    expect(result.current.error).toBe("mobile.json not found in folder");
  });

  it("catches a thrown fetch error into a general error message instead of an unhandled rejection", async () => {
    mockedReadFolder.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useFigmaImportFolder());
    await act(async () => {
      await result.current.load("/some/folder");
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("network down");
  });
});
