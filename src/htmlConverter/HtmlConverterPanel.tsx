import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Download, Trash2 } from "lucide-react";

import ImageProcessor from "./ImageProcessor";
import UploadHistory from "./components/UploadHistory";
import { Header } from "./components/Header";
import { FileNamingBar } from "./components/FileNamingBar";
import { DiagnosticsPanel } from "./components/DiagnosticsPanel";
import { ExportPanel } from "./components/ExportPanel";
import { useHtmlConverterLogic } from "./hooks/useHtmlConverterLogic";
import { useAiLogger } from "./hooks/useAiLogger";

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

  // AI Logger Hook
  const { aiLogs, aiConnected } = useAiLogger(ui.showAiTerminal);

  return (
    <div className='w-full min-h-screen bg-background p-4 md:p-8 text-foreground font-sans transition-colors duration-300'>
      <div className='max-w-[1600px] mx-auto flex flex-col gap-6'>
        {/* TOP BAR */}
        <div className='w-full flex items-center justify-between'>
          <Header ui={ui} setUi={setUi} imageAnalysis={imageAnalysis} setImageAnalysis={setImageAnalysis} autoProcess={state.autoProcess} setAutoProcess={actions.setAutoProcess} aiBackendStatus={aiBackendStatus} unseenLogCount={state.unseenLogCount} />
        </div>

        {/* MAIN GRID */}
        <div className='grid grid-cols-1 xl:grid-cols-12 gap-6 items-start'>
          {/* LEFT COLUMN (7 cols) */}
          <div className='col-span-1 xl:col-span-7 flex flex-col gap-6'>
            {/* EDITOR CARD */}
            <div className='bg-card flex flex-col rounded-[2rem] p-8 md:p-5 shadow-soft hover:shadow-lg border border-border/50 hover:border-border transition-all duration-300 group'>
              <div className='flex flex-row justify-between mb-5'>
                <h2 className='text-lg md:text-xl font-extrabold flex items-center gap-2 text-foreground group-hover:text-primary transition-colors'>✏️ {t("Text Editor", "Редактор тексту")}</h2>
                <div className='flex gap-5'>
                  <button onClick={actions.handleAutoExportAll} disabled={state.isAutoExporting} className='flex items-center gap-2 bg-primary hover:brightness-110 text-primary-foreground font-bold px-6 py-2.5 rounded-full shadow-soft transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 text-sm'>
                    <Download size={16} strokeWidth={2.5} />
                    {state.isAutoExporting ? t("Preparing...", "Preparing...") : t("Do Everything", "Do Everything")}
                  </button>
                  <button onClick={actions.handleClear} className='p-2.5 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-full transition-all hover:scale-105 active:scale-95' title={t("Clear All", "Очистити все")}>
                    <Trash2 size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              <div ref={editorRef} contentEditable suppressContentEditableWarning className='w-full min-h-[300px] max-h-[600px] overflow-auto bg-background border border-border/50 rounded-2xl p-6 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary transition-all empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground shadow-inner editor-content' data-placeholder={t("Paste or type text here...", "Вставте або введіть текст сюди...")} />
            </div>

            {/* FILE SETTINGS (Floating Pills) */}
            <FileNamingBar 
              fileName={state.fileName} 
              setFileName={actions.setFileName} 
              changeFileNumber={actions.changeFileNumber} 
              showApproveNeeded={ui.showApproveNeeded} 
              approveNeeded={state.approveNeeded} 
              setApproveNeeded={actions.setApproveNeeded} 
              useAlfaOne={state.useAlfaOne} 
              setUseAlfaOne={actions.setUseAlfaOne} 
            />

            {/* DIAGNOSTICS TABS */}
            {((ui.showInputHtml && state.inputHtml) || (ui.showLogsPanel && state.log.length > 0) || (ui.showAiTerminal)) && (
              <DiagnosticsPanel logs={state.log} inputHtml={state.inputHtml} handleCopy={actions.handleCopy} aiLogs={aiLogs} aiConnected={aiConnected} showAiTerminal={ui.showAiTerminal} />
            )}
          </div>

          {/* RIGHT COLUMN (5 cols) */}
          <div className='col-span-1 xl:col-span-5 flex flex-col gap-6'>
            {/* IMAGE PROCESSOR (Legacy wrapper) */}
            {state.showImageProcessor && (
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
                  storageProvider={state.useAlfaOne ? "alphaone" : "default"}
                  imageAnalysisSettings={imageAnalysis}
                  uploadHistory={state.uploadHistory}
                />
              </div>
            )}

            {/* OUTPUT TABS */}
            <ExportPanel 
              outputHtmlRef={outputHtmlRef} 
              outputMjmlRef={outputMjmlRef} 
              isAutoExporting={state.isAutoExporting} 
              handleExportHTML={actions.handleExportHTML} 
              handleExportMJML={actions.handleExportMJML} 
              handleDownloadHTML={actions.handleDownloadHTML} 
              handleDownloadMJML={actions.handleDownloadMJML} 
              handleCopy={actions.handleCopy} 
            />
          </div>
        </div>

        {/* UPLOAD HISTORY */}
        {ui.showUploadHistory && (
          <div>
            <UploadHistory sessions={state.uploadHistory} onClear={actions.handleClearHistory} />
          </div>
        )}
      </div>
    </div>
  );
}
