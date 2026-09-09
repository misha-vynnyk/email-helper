import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import FigmaImportDropzone from "../FigmaImportDropzone";

// jsdom's File has no .text() (unlike every real browser) — polyfill via FileReader,
// which jsdom does implement, so the component's real `file.text()` call is exercised as-is.
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

function file(name: string, content: string): File {
  return new File([content], name, { type: name.endsWith(".json") ? "application/json" : "text/markdown" });
}

describe("FigmaImportDropzone", () => {
  it("calls onFilesReady once both desktop.json and mobile.json have been dropped", async () => {
    const onFilesReady = jest.fn();
    render(<FigmaImportDropzone onFilesReady={onFilesReady} />);

    const dropzone = screen.getByText(/Перетягни сюди/);

    fireEvent.drop(dropzone, { dataTransfer: { files: [file("desktop.json", '[{"a":1}]')] } });
    await waitFor(() => expect(screen.getByTestId("figma-import-slot-desktop")).toHaveClass("text-primary"));
    expect(onFilesReady).not.toHaveBeenCalled();

    fireEvent.drop(dropzone, { dataTransfer: { files: [file("mobile.json", '[{"a":2}]')] } });

    await waitFor(() =>
      expect(onFilesReady).toHaveBeenCalledWith({
        descriptionContent: undefined,
        desktopRaw: '[{"a":1}]',
        mobileRaw: '[{"a":2}]',
      })
    );
  });

  it("accepts all three files dropped together, description included", async () => {
    const onFilesReady = jest.fn();
    render(<FigmaImportDropzone onFilesReady={onFilesReady} />);

    const dropzone = screen.getByText(/Перетягни сюди/);

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file("description.md", "# hello"), file("desktop.json", "[]"), file("mobile.json", "[]")],
      },
    });

    await waitFor(() =>
      expect(onFilesReady).toHaveBeenCalledWith({ descriptionContent: "# hello", desktopRaw: "[]", mobileRaw: "[]" })
    );
  });

  it("flags a file with an unrecognized name instead of silently dropping it", async () => {
    const onFilesReady = jest.fn();
    render(<FigmaImportDropzone onFilesReady={onFilesReady} />);

    const dropzone = screen.getByText(/Перетягни сюди/);
    fireEvent.drop(dropzone, { dataTransfer: { files: [file("Desktop.json", "[]")] } });

    await waitFor(() => expect(screen.getByText(/Desktop\.json/)).toBeInTheDocument());
    expect(onFilesReady).not.toHaveBeenCalled();
  });
});
