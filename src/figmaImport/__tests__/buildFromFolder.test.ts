import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { buildTemplateFromFolder } from "../buildFromFolder";

// Real temp directories, not figma-to-html/ (that folder is .gitignore'd and won't survive
// checkouts other than the one working tree it happened to be authored in).
const validDivider = { id: "divider-1", type: "divider", color: "#FCBF24" };

function writeJsonFiles(folderPath: string, desktop: unknown, mobile: unknown): void {
  fs.writeFileSync(path.join(folderPath, "desktop.json"), JSON.stringify(desktop));
  fs.writeFileSync(path.join(folderPath, "mobile.json"), JSON.stringify(mobile));
}

describe("buildTemplateFromFolder", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "figma-import-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("builds desktop and mobile HTML from valid desktop.json/mobile.json", () => {
    writeJsonFiles(tmpDir, [validDivider], [validDivider]);

    const result = buildTemplateFromFolder(tmpDir, { title: "Test Template" });

    expect(result.desktopHtml).toContain("border-bottom: 1px solid #FCBF24;");
    expect(result.mobileHtml).toContain("border-bottom: 1px solid #FCBF24;");
  });

  it("throws a readable message (not a raw ENOENT) when desktop.json is missing", () => {
    fs.writeFileSync(path.join(tmpDir, "mobile.json"), JSON.stringify([validDivider]));

    expect(() => buildTemplateFromFolder(tmpDir, { title: "Test Template" })).toThrow(
      `Missing desktop.json in ${tmpDir}`
    );
  });

  it("throws with schema error details, including the file name, for a broken file", () => {
    writeJsonFiles(tmpDir, [{ ...validDivider, thicknessPx: "1px" }], [validDivider]);

    expect(() => buildTemplateFromFolder(tmpDir, { title: "Test Template" })).toThrow(/desktop\.json.*thicknessPx/s);
  });
});
