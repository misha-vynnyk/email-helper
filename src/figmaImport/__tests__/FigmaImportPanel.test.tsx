import { fireEvent, render, screen, waitFor } from "@testing-library/react";

// Same reasoning as FigmaImportPanel.logic.test.ts: FigmaImportPanel.tsx -> useFigmaImportFolder
// -> api/endpoints/figmaImport -> api/client -> config/api & utils/logger, both of which use
// import.meta.env and don't survive ts-jest's CommonJS transform. None of these RTL tests touch
// the desktop.json/mobile.json folder flow (only the single-tree paste/file flow below), so a
// fixed stub matching the hook's return shape is enough — no need to vary it per test.
jest.mock("../useFigmaImportFolder", () => ({
  useFigmaImportFolder: () => ({
    loading: false,
    error: null,
    description: undefined,
    descriptionExists: false,
    desktopRaw: undefined,
    mobileRaw: undefined,
    validation: null,
    load: jest.fn(),
    setFromFiles: jest.fn(),
    reset: jest.fn(),
  }),
}));

import FigmaImportPanel, { slugifyFileName } from "../FigmaImportPanel";

// jsdom's File has no .text() (unlike every real browser) — polyfill via FileReader, same as
// FigmaImportDropzone.test.tsx.
if (!File.prototype.text) {
  File.prototype.text = function (this: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}

const validTreeJson = JSON.stringify([{ id: "divider-1", type: "divider", color: "#676767" }]);

function typeTreeJson(value: string) {
  fireEvent.change(screen.getByPlaceholderText(/Вставте JSON-масив DesignNode/), { target: { value } });
}

function clickGenerate() {
  fireEvent.click(screen.getByRole("button", { name: "Generate" }));
}

describe("FigmaImportPanel — single-tree paste/file flow", () => {
  it("shows the preview iframe with no error block for a valid tree", async () => {
    render(<FigmaImportPanel />);

    typeTreeJson(validTreeJson);
    clickGenerate();

    await waitFor(() => expect(screen.getByTitle("Tree preview")).toBeInTheDocument());
    const iframe = screen.getByTitle("Tree preview") as HTMLIFrameElement;
    expect(iframe.getAttribute("srcDoc")).toContain("border-bottom: 1px solid #676767;");
    expect(screen.queryByText(/Помилки валідації/)).not.toBeInTheDocument();
  });

  it("shows an error block with the error count and no iframe for invalid JSON", async () => {
    render(<FigmaImportPanel />);

    typeTreeJson("{not valid json");
    clickGenerate();

    await waitFor(() => expect(screen.getByText(/Помилки валідації/)).toBeInTheDocument());
    expect(screen.getByText(/Помилки валідації \(\d+\)/)).toBeInTheDocument();
    expect(screen.queryByTitle("Tree preview")).not.toBeInTheDocument();
  });

  it("shows the Download HTML button only after a successful generate, and triggers a download on click", async () => {
    render(<FigmaImportPanel />);

    expect(screen.queryByRole("button", { name: "Download HTML" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Назва темплейту/), { target: { value: "My Title" } });
    typeTreeJson(validTreeJson);
    clickGenerate();

    await waitFor(() => expect(screen.getByRole("button", { name: "Download HTML" })).toBeInTheDocument());

    const createObjectURL = jest.fn(() => "blob:mock-url");
    const revokeObjectURL = jest.fn();
    (global.URL as unknown as { createObjectURL: typeof createObjectURL }).createObjectURL = createObjectURL;
    (global.URL as unknown as { revokeObjectURL: typeof revokeObjectURL }).revokeObjectURL = revokeObjectURL;

    let capturedDownloadAttr: string | undefined;
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        capturedDownloadAttr = this.download;
      });

    fireEvent.click(screen.getByRole("button", { name: "Download HTML" }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(capturedDownloadAttr).toBe(`${slugifyFileName("My Title")}.html`);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");

    clickSpy.mockRestore();
  });

  it("fills the textarea from a selected .json file", async () => {
    render(<FigmaImportPanel />);

    const fileInput = screen.getByLabelText(/Обрати файл/) as HTMLInputElement;
    const selectedFile = new File([validTreeJson], "tree.json", { type: "application/json" });
    fireEvent.change(fileInput, { target: { files: [selectedFile] } });

    await waitFor(() =>
      expect(screen.getByPlaceholderText(/Вставте JSON-масив DesignNode/)).toHaveValue(validTreeJson)
    );
  });
});
