import { downloadOrSaveFile } from "../downloadOrSaveFile";

describe("downloadOrSaveFile", () => {
  const originalElectronAPI = window.electronAPI;

  afterEach(() => {
    window.electronAPI = originalElectronAPI;
    jest.restoreAllMocks();
  });

  it("falls back to a browser anchor download when no Electron API is present", async () => {
    window.electronAPI = undefined;
    // jsdom doesn't implement these at all (not even as a stub), so they can't be jest.spyOn'd —
    // define them directly and restore afterward.
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const createObjectURL = jest.fn().mockReturnValue("blob:mock");
    const revokeObjectURL = jest.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    try {
      const outcome = await downloadOrSaveFile("<html></html>", "test.html", { getFolder: () => undefined });

      expect(outcome).toEqual({ kind: "browser-download" });
      expect(createObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    } finally {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });

  it("uses the already-known folder and reports saved on success, without re-prompting", async () => {
    const saveToPath = jest.fn().mockResolvedValue({ saved: true });
    const openFolderDialog = jest.fn();
    window.electronAPI = { isElectron: true, saveToPath, openFolderDialog } as unknown as typeof window.electronAPI;

    const outcome = await downloadOrSaveFile("<html></html>", "test.html", { getFolder: () => "/existing/folder" });

    expect(outcome).toEqual({ kind: "saved" });
    expect(openFolderDialog).not.toHaveBeenCalled();
    expect(saveToPath).toHaveBeenCalledWith("<html></html>", "/existing/folder", "test.html");
  });

  it("prompts for a folder when none is known yet, and reports it back via onFolderResolved", async () => {
    const saveToPath = jest.fn().mockResolvedValue({ saved: true });
    const openFolderDialog = jest.fn().mockResolvedValue("/picked/folder");
    window.electronAPI = { isElectron: true, saveToPath, openFolderDialog } as unknown as typeof window.electronAPI;
    const onFolderResolved = jest.fn();

    const outcome = await downloadOrSaveFile("<html></html>", "test.html", { getFolder: () => undefined, onFolderResolved });

    expect(outcome).toEqual({ kind: "saved" });
    expect(onFolderResolved).toHaveBeenCalledWith("/picked/folder");
    expect(saveToPath).toHaveBeenCalledWith("<html></html>", "/picked/folder", "test.html");
  });

  it("reports folder-pick-canceled and never calls saveToPath when the folder dialog is dismissed", async () => {
    const saveToPath = jest.fn();
    const openFolderDialog = jest.fn().mockResolvedValue(null);
    window.electronAPI = { isElectron: true, saveToPath, openFolderDialog } as unknown as typeof window.electronAPI;

    const outcome = await downloadOrSaveFile("<html></html>", "test.html", { getFolder: () => undefined });

    expect(outcome).toEqual({ kind: "folder-pick-canceled" });
    expect(saveToPath).not.toHaveBeenCalled();
  });

  it("maps saveToPath's canceled flag to file-exists, and a failure to save-error with the raw error passed through untouched", async () => {
    const saveToPath = jest.fn().mockResolvedValueOnce({ saved: false, canceled: true }).mockResolvedValueOnce({ saved: false, canceled: false, error: "disk full" });
    window.electronAPI = { isElectron: true, saveToPath, openFolderDialog: jest.fn() } as unknown as typeof window.electronAPI;

    const first = await downloadOrSaveFile("x", "a.html", { getFolder: () => "/f" });
    const second = await downloadOrSaveFile("x", "b.html", { getFolder: () => "/f" });

    expect(first).toEqual({ kind: "file-exists" });
    expect(second).toEqual({ kind: "save-error", error: "disk full" });
  });
});
