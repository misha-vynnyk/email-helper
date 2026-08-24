import { Download, Eye, LayoutTemplate } from "lucide-react";
import { useState } from "react";

import { BuilderCanvas } from "./canvas/BuilderCanvas";
import { BuilderPreviewPane } from "./components/BuilderPreviewPane";
import { Inspector } from "./components/Inspector";
import { downloadHtmlFile } from "./downloadHtmlFile";
import { buildDocumentHtml } from "./render/buildDocumentHtml";
import { getCanvas, getShellConfig } from "./state/builderStore";

type ViewMode = "canvas" | "preview";

export default function BuilderPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>("canvas");

  // Read via imperative getters instead of subscribing — this component doesn't need to
  // re-render on every canvas/shell edit, only at click time when the user actually exports.
  const handleDownload = async () => {
    const shell = getShellConfig();
    const canvas = getCanvas();
    const html = buildDocumentHtml(shell, canvas);
    await downloadHtmlFile(html, `${shell.title || "template"}.html`);
  };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4 h-[calc(100vh-48px)]'>
      <div className='flex flex-col gap-3 min-h-0'>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setViewMode("canvas")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${viewMode === "canvas" ? "border-primary bg-primary/10" : "border-border/60 bg-muted/40 hover:bg-muted"}`}>
            <LayoutTemplate size={14} />
            Canvas
          </button>
          <button
            type='button'
            onClick={() => setViewMode("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${viewMode === "preview" ? "border-primary bg-primary/10" : "border-border/60 bg-muted/40 hover:bg-muted"}`}>
            <Eye size={14} />
            Preview
          </button>
          <button
            type='button'
            onClick={handleDownload}
            className='ml-auto flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-3 py-1.5 rounded-md shadow-sm transition-all'>
            <Download size={14} />
            Download HTML
          </button>
        </div>

        <div className='flex-1 min-h-0 overflow-y-auto'>{viewMode === "canvas" ? <BuilderCanvas /> : <BuilderPreviewPane />}</div>
      </div>

      <div className='overflow-y-auto'>
        <Inspector />
      </div>
    </div>
  );
}
