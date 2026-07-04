import { RotateCcw,ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const PRESETS = [375, 600, 800] as const;
type Preset = (typeof PRESETS)[number];
const WIDTH_KEY = "html-converter-preview-width";
const ZOOM_KEY = "html-converter-preview-zoom";

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 2.0;
const ZOOM_DEFAULT = 1.0;

function clampZoom(z: number): number {
  return Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)) / ZOOM_STEP) * ZOOM_STEP;
}

function countImages(html: string): number {
  return (html.match(/<img[\s>]/gi) ?? []).length;
}

function buildSrcDoc(html: string): string {
  return `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <style>body{margin:0;padding:16px;background:#f4f4f4;font-family:sans-serif;}</style>
</head><body>${html}</body></html>`;
}

export function EmailPreviewPane({ html }: { html: string }) {
  const [width, setWidth] = useState<number>(() => {
    const saved = parseInt(localStorage.getItem(WIDTH_KEY) ?? "", 10);
    return PRESETS.includes(saved as Preset) ? saved : 600;
  });
  const [zoom, setZoom] = useState<number>(() => {
    const saved = parseFloat(localStorage.getItem(ZOOM_KEY) ?? "");
    return isNaN(saved) ? ZOOM_DEFAULT : clampZoom(saved);
  });
  const [customInput, setCustomInput] = useState("");
  const [iframeHeight, setIframeHeight] = useState(400);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => { localStorage.setItem(WIDTH_KEY, String(width)); }, [width]);
  useEffect(() => { localStorage.setItem(ZOOM_KEY, String(zoom)); }, [zoom]);

  const handleIframeLoad = useCallback(() => {
    try {
      const h = iframeRef.current?.contentDocument?.body?.scrollHeight;
      if (h && h > 0) setIframeHeight(h + 32);
    } catch {
      // cross-origin fallback
    }
  }, []);

  const applyCustomWidth = useCallback(() => {
    const n = parseInt(customInput, 10);
    if (n >= 200 && n <= 1600) setWidth(n);
  }, [customInput]);

  const handleZoomIn    = useCallback(() => setZoom((z) => clampZoom(z + ZOOM_STEP)), []);
  const handleZoomOut   = useCallback(() => setZoom((z) => clampZoom(z - ZOOM_STEP)), []);
  const handleZoomReset = useCallback(() => setZoom(ZOOM_DEFAULT), []);

  const isPreset = PRESETS.includes(width as Preset);
  const sizeKb = html ? (new Blob([html]).size / 1024).toFixed(1) : null;
  const imgCount = html ? countImages(html) : null;

  return (
    <div className="flex flex-col gap-2 h-full min-h-0">

      {/* Controls row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Width presets */}
        {PRESETS.map((w) => (
          <button
            key={w}
            onClick={() => { setWidth(w); setCustomInput(""); }}
            className={`px-2 py-1 text-xs rounded-md border transition-colors ${
              width === w && isPreset
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {w === 375 ? "Mobile 375" : w === 600 ? "Email 600" : "Desktop 800"}
          </button>
        ))}

        {/* Custom width */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={200}
            max={1600}
            placeholder="px"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyCustomWidth()}
            className={`w-16 h-6 text-xs px-1.5 rounded border bg-background text-center transition-colors ${
              !isPreset && customInput ? "border-primary" : "border-input"
            }`}
          />
          <button
            onClick={applyCustomWidth}
            className="h-6 px-2 text-xs rounded border border-input bg-background hover:bg-muted transition-colors"
          >
            OK
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border/60 mx-0.5" />

        {/* Zoom controls */}
        <button
          onClick={handleZoomOut}
          disabled={zoom <= ZOOM_MIN}
          className="p-1 rounded border border-input bg-background hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Zoom out (−25%)"
        >
          <ZoomOut size={13} />
        </button>
        <button
          onClick={handleZoomReset}
          className={`min-w-[42px] h-6 px-1.5 text-xs rounded border transition-colors ${
            zoom === ZOOM_DEFAULT
              ? "border-border bg-muted text-muted-foreground"
              : "border-primary bg-primary/10 text-primary font-semibold hover:bg-primary/20"
          }`}
          title="Reset zoom to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= ZOOM_MAX}
          className="p-1 rounded border border-input bg-background hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Zoom in (+25%)"
        >
          <ZoomIn size={13} />
        </button>
        {zoom !== ZOOM_DEFAULT && (
          <button
            onClick={handleZoomReset}
            className="p-1 rounded border border-input bg-background hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Reset zoom"
          >
            <RotateCcw size={11} />
          </button>
        )}
      </div>

      {/* iframe container */}
      <div className="flex-1 overflow-auto bg-muted/30 rounded-xl p-2 min-h-0">
        {html ? (
          <div className="flex justify-start min-w-0">
            <iframe
              ref={iframeRef}
              srcDoc={buildSrcDoc(html)}
              sandbox=""
              onLoad={handleIframeLoad}
              title="Email Preview"
              style={
                {
                  width: `${width}px`,
                  height: `${iframeHeight}px`,
                  border: "none",
                  borderRadius: "8px",
                  flexShrink: 0,
                  display: "block",
                  zoom,
                } as React.CSSProperties & { zoom: number }
              }
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            Натисніть Export для генерації HTML Preview
          </div>
        )}
      </div>

      {/* Stats */}
      {sizeKb && (
        <div className="flex gap-3 text-xs text-muted-foreground px-1">
          <span>{sizeKb} KB</span>
          {imgCount !== null && <span>{imgCount} зображ.</span>}
          {zoom !== ZOOM_DEFAULT && (
            <span className="text-primary/70">{Math.round(zoom * 100)}% zoom</span>
          )}
        </div>
      )}
    </div>
  );
}
