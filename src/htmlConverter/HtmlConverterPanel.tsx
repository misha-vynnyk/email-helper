import { Download, Trash2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { CheatsheetPanel } from "./components/CheatsheetPanel";
import { DiagnosticsPanel } from "./components/DiagnosticsPanel";
import { EditorSelectionToolbar } from "./components/EditorSelectionToolbar";
import { ExportPanel } from "./components/ExportPanel";
import { FileNamingBar } from "./components/FileNamingBar";
import { Header } from "./components/Header";
import UploadHistory from "./components/UploadHistory";
import { useEditorHotkeys } from "./hooks/internal/useEditorHotkeys";
import { useEditorImageDrop } from "./hooks/internal/useEditorImageDrop";
import { useMarkerHighlighter } from "./hooks/internal/useMarkerHighlighter";
import { useHtmlConverterLogic } from "./hooks/useHtmlConverterLogic";
import { useIsDesktop } from "./hooks/useIsDesktop";
import ImageProcessor from "./ImageProcessor";

export default function HtmlConverterPanel() {
  const { t } = useTranslation();

  // Refs for contenteditable divs and textareas
  const editorRef = useRef<HTMLDivElement>(null);
  const outputHtmlRef = useRef<HTMLTextAreaElement>(null);
  const outputMjmlRef = useRef<HTMLTextAreaElement>(null);

  // Business Logic Hook
  const { state, actions, settings } = useHtmlConverterLogic({
    editorRef,
    outputHtmlRef,
    outputMjmlRef,
  });

  const { ui, setUi, imageAnalysis, setImageAnalysis, aiBackendStatus } = settings;

  // Editor enhancements (opt-in via settings)
  useMarkerHighlighter({ editorRef, enabled: ui.editorMarkerHighlight, oneBrSymbol: ui.oneBrSymbol });
  useEditorHotkeys({ editorRef, enabled: ui.editorHotkeys, oneBrSymbol: ui.oneBrSymbol });

  // Image drag-and-drop — always on, not an opt-in beta toggle (base capability like paste)
  const { isDragOver } = useEditorImageDrop({ editorRef });

  // Desktop gets two independently-tall columns (left content flows regardless of how
  // tall the right column is); mobile needs the result panel right after the editor,
  // ahead of the service controls. CSS Grid can't do both — a shared row would stretch
  // the shorter column to match the taller one — so the two arrangements are built as
  // distinct JSX trees below and switched on viewport width instead.
  const isDesktop = useIsDesktop(1024);

  // The two layout trees are structurally different (see `key` comment below), so the
  // editor's actual slot in the DOM tree changes across the isDesktop flip. contentEditable
  // is uncontrolled — its live content and the listeners useEditorSync/useEditorHotkeys/etc.
  // attached once at mount only survive as long as the underlying DOM node does.
  //
  // editorCard is portaled into `editorContainer`, a bare DOM node created once via the
  // useState initializer (so it exists synchronously on the very first render — unlike a
  // ref populated from a slot's mount callback, which would need an extra commit before
  // becoming non-null, missing the once-on-mount effects above). React only tracks what's
  // *inside* a portal container, never the container's own position, so a layout effect is
  // free to physically move `editorContainer` between slot divs with plain appendChild
  // whenever isDesktop flips. Moving it directly (without the portal) corrupted React's own
  // reconciliation instead — it still owned that DOM position and threw on the next update
  // ("insertBefore ... is not a child of this node") because we'd yanked the node out from
  // under it. The portal keeps editorCard's real DOM node (content, focus, listeners) alive
  // and correctly tracked no matter which slot it currently lives in.
  const [editorContainer] = useState(() => {
    const el = document.createElement("div");
    el.style.display = "contents";
    return el;
  });
  const editorSlotRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const slot = editorSlotRef.current;
    if (slot && editorContainer.parentElement !== slot) {
      slot.appendChild(editorContainer);
    }
  }, [isDesktop, editorContainer]);

  const editorCard = (
    <div className='bg-card flex flex-col rounded-[2rem] p-5 md:p-8 shadow-soft hover:shadow-lg border border-border/50 hover:border-border transition-all duration-300 group'>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-5'>
        <h2 className='text-lg md:text-xl font-extrabold flex items-center gap-2 text-foreground group-hover:text-primary transition-colors'>✏️ {t("Text Editor", "Редактор тексту")}</h2>
        <div className='flex gap-3 md:gap-5'>
          <button onClick={actions.handleAutoExportAll} disabled={state.isAutoExporting} className='flex items-center gap-2 bg-primary hover:brightness-110 text-primary-foreground font-bold px-6 py-2.5 rounded-full shadow-soft transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 text-sm'>
            <Download size={16} strokeWidth={2.5} />
            {state.isAutoExporting ? t("Preparing...", "Preparing...") : t("Do Everything", "Do Everything")}
          </button>
          <button onClick={actions.handleClear} className='p-2.5 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-full transition-all hover:scale-105 active:scale-95' title={t("Clear All", "Очистити все")}>
            <Trash2 size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning className={`w-full min-h-[300px] max-h-[600px] overflow-auto bg-background border border-border/50 rounded-2xl p-6 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary transition-all empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground shadow-inner editor-content${ui.editorMarkerHighlight ? " editor-marker-styles" : ""}${isDragOver ? " ring-2 ring-primary/40" : ""}`} data-placeholder={t("Paste or type text here...", "Вставте або введіть текст сюди...")} />
    </div>
  );

  const imageProcessorBox = state.showImageProcessor && (
    <div className='bg-card rounded-[2rem] shadow-soft hover:shadow-lg p-1.5 overflow-hidden border-[3px] border-primary/40 hover:border-primary/60 transition-all duration-300 relative group'>
      <div className='absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] uppercase font-extrabold px-3 py-1 rounded-bl-xl z-20 shadow-sm leading-none group-hover:bg-primary/90 transition-colors'>Images Detected</div>
      {/* Legacy component renders here for now */}
      <ImageProcessor
        editorRef={editorRef}
        onLog={actions.addLog}
        visible={state.showImageProcessor}
        onVisibilityChange={actions.setShowImageProcessor}
        triggerExtract={state.triggerExtract}
        fileName={state.fileName}
        onHistoryAdd={actions.handleAddToHistory}
        onReplaceUrls={actions.handleReplaceUrls}
        onUploadedUrlsChange={actions.setUploadedUrlMap}
        onUploadedAltsChange={actions.handleAltsUpdate}
        onResetReplacement={actions.handleResetReplacement}
        hasOutput={state.hasOutput}
        autoProcess={state.autoProcess}
        storageProvider={state.storageProfile}
        imageAnalysisSettings={imageAnalysis}
        uploadHistory={state.uploadHistory}
        uploadMode={state.uploadMode}
        browserExecutablePath={ui.browserExecutablePath}
      />
    </div>
  );

  const exportPanel = (
    <ExportPanel
      outputHtmlRef={outputHtmlRef}
      outputMjmlRef={outputMjmlRef}
      isAutoExporting={state.isAutoExporting}
      handleExportHTML={actions.handleExportHTML}
      handleExportMJML={actions.handleExportMJML}
      handleDownloadHTML={actions.handleDownloadHTML}
      handleDownloadMJML={actions.handleDownloadMJML}
      handleCopy={actions.handleCopy}
      exportType={state.exportType}
      previewHtml={state.previewHtml}
    />
  );

  const cheatsheet = <CheatsheetPanel oneBrSymbol={ui.oneBrSymbol} />;

  const fileNamingBar = (
    <FileNamingBar
      fileName={state.fileName}
      setFileName={actions.setFileName}
      changeFileNumber={actions.changeFileNumber}
      showApproveNeeded={ui.showApproveNeeded}
      approveNeeded={state.approveNeeded}
      setApproveNeeded={actions.setApproveNeeded}
      storageProfile={state.storageProfile}
      setStorageProfile={actions.setStorageProfile}
      exportType={state.exportType}
      setExportType={actions.setExportType}
      converterMode={state.converterMode}
      setConverterMode={actions.setConverterMode}
    />
  );

  const diagnostics = ((ui.showInputHtml && state.inputHtml) || (ui.showLogsPanel && state.log.length > 0)) && (
    <DiagnosticsPanel logs={state.log} inputHtml={state.inputHtml} handleCopy={actions.handleCopy} />
  );

  return (
    <div className='w-full min-h-screen bg-background p-4 md:p-8 text-foreground font-sans transition-colors duration-300'>
      <div className='max-w-[1600px] mx-auto flex flex-col gap-6'>
        {/* TOP BAR */}
        <div className='w-full flex items-center justify-between'>
          <Header ui={ui} setUi={setUi} imageAnalysis={imageAnalysis} setImageAnalysis={setImageAnalysis} autoProcess={state.autoProcess} setAutoProcess={actions.setAutoProcess} aiBackendStatus={aiBackendStatus} unseenLogCount={state.unseenLogCount} uploadMode={state.uploadMode} setUploadMode={actions.setUploadMode} browserDetectionStatus={state.browserDetectionStatus} />
        </div>

        {/* MAIN LAYOUT
            `key` on each branch's root forces React to unmount/remount across the
            isDesktop flip instead of reconciling by position. Without it, both
            branches are plain <div>s at the same tree slot: React sees the same
            element TYPE and diffs children index-by-index rather than swapping
            trees, even though the desktop tree has an extra col-span-7 wrapper
            the mobile tree doesn't. That off-by-one nesting splices the editor's
            live contentEditable DOM (uncontrolled, so React never re-renders it)
            onto whatever div lines up positionally in the other tree — observed
            as pasted content reappearing inside the header's button row with the
            buttons themselves gone.

            editorCard is exempted via the portal below, but everything else under
            these roots (cheatsheet, fileNamingBar, diagnostics, imageProcessorBox,
            exportPanel) still fully remounts on every isDesktop flip — e.g. resizing
            the window across the 1024px breakpoint, not just switching devices. That
            resets their local UI state: ExportPanel's html/mjml tab, DiagnosticsPanel's
            logs/raw tab, CheatsheetPanel's expanded state, ImageProcessor's upload
            dialog and snackbar. Accepted trade-off — the two trees are genuinely
            different shapes (nested columns vs. a flat list, different ordering), so
            without the key React would reconcile these components against each other
            positionally instead of remounting cleanly, which is worse. */}
        {isDesktop ? (
          <div key='desktop-layout' className='grid grid-cols-12 gap-6 items-start'>
            {/* LEFT COLUMN (7 cols) */}
            <div className='col-span-7 flex flex-col gap-6'>
              <div ref={editorSlotRef} />
              {cheatsheet}
              {fileNamingBar}
              {diagnostics}
            </div>
            {/* RIGHT COLUMN (5 cols) */}
            <div className='col-span-5 flex flex-col gap-6'>
              {imageProcessorBox}
              {exportPanel}
            </div>
          </div>
        ) : (
          // Mobile order: editor first, then the result (what the user came for),
          // then the service controls that configure it.
          <div key='mobile-layout' className='flex flex-col gap-6'>
            <div ref={editorSlotRef} />
            {imageProcessorBox}
            {exportPanel}
            {cheatsheet}
            {fileNamingBar}
            {diagnostics}
          </div>
        )}

        {/* Portaled into editorContainer, which the layout effect above keeps physically
            parented under whichever slot div is currently active — see comment above. */}
        {createPortal(editorCard, editorContainer)}

        {/* UPLOAD HISTORY */}
        {ui.showUploadHistory && (
          <div>
            <UploadHistory sessions={state.uploadHistory} onClear={actions.handleClearHistory} />
          </div>
        )}
      </div>

      {/* Floating marker toolbar (portal, positions itself over the selection) */}
      <EditorSelectionToolbar editorRef={editorRef} converterMode={state.converterMode} oneBrSymbol={ui.oneBrSymbol} enabled={ui.editorSelectionToolbar} />
    </div>
  );
}
