import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Copy, Download, Minus, ArrowRightLeft, CheckSquare, Square } from "lucide-react";

import ImageProcessor from "./ImageProcessor";
import UploadHistory from "./UploadHistory";
import { Header } from "./components/Header";
import { useHtmlConverterLogic } from "./hooks/useHtmlConverterLogic";

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

  const [leftTab, setLeftTab] = useState<"logs" | "raw">("logs");
  const [rightTab, setRightTab] = useState<"html" | "mjml">("html");

  return (
    <div className='w-full min-h-screen bg-background p-4 md:p-8 text-foreground font-sans transition-colors duration-300'>
      <div className='max-w-[1600px] mx-auto flex flex-col gap-6'>
        {/* TOP BAR */}
        <div className='w-full flex items-center justify-between'>
          <Header ui={ui} setUi={setUi} imageAnalysis={imageAnalysis} setImageAnalysis={setImageAnalysis} autoProcess={state.autoProcess} setAutoProcess={actions.setAutoProcess} aiBackendStatus={aiBackendStatus} unseenLogCount={state.unseenLogCount} onClear={actions.handleClear} isAutoExporting={state.isAutoExporting} onAutoExportAll={actions.handleAutoExportAll} />
        </div>

        {/* MAIN GRID */}
        <div className='grid grid-cols-1 xl:grid-cols-12 gap-6 items-start'>
          {/* LEFT COLUMN (7 cols) */}
          <div className='col-span-1 xl:col-span-7 flex flex-col gap-6'>
            {/* EDITOR CARD */}
            <div className='bg-card rounded-[2rem] p-6 md:p-8 shadow-soft flex flex-col border border-border/50'>
              <h2 className='text-lg md:text-xl font-extrabold mb-5 flex items-center gap-2 text-foreground'>✏️ {t("Text Editor", "Редактор тексту")}</h2>
              <div ref={editorRef} contentEditable suppressContentEditableWarning className='w-full min-h-[300px] max-h-[600px] overflow-auto bg-background border border-border/50 rounded-2xl p-6 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary transition-all empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground shadow-inner' data-placeholder={t("Paste or type text here...", "Вставте або введіть текст сюди...")} />
            </div>

            {/* FILE SETTINGS (Floating Pills) */}
            <div className='flex flex-wrap items-center gap-3'>
              <div className='flex items-center bg-card rounded-full shadow-soft p-1.5 pl-5 border border-border/50 flex-1 min-w-[280px]'>
                <span className='text-sm font-bold text-muted-foreground mr-3 shrink-0'>{t("File Name:", "Ім'я файлу:")}</span>
                <input type='text' value={state.fileName} onChange={(e) => actions.setFileName(e.target.value)} onFocus={(e) => e.target.select()} className='bg-transparent border-none outline-none text-[15px] font-extrabold text-foreground w-full focus:ring-0 min-w-0 placeholder:text-muted-foreground' />
                <div className='flex items-center gap-1.5 ml-2 shrink-0'>
                  <button onClick={() => actions.changeFileNumber(-1)} className='p-2 bg-secondary hover:bg-muted rounded-full text-foreground transition-colors shadow-sm'>
                    <Minus size={14} strokeWidth={3} />
                  </button>
                  <button onClick={() => actions.changeFileNumber(1)} className='p-2 bg-secondary hover:bg-muted rounded-full text-foreground transition-colors shadow-sm'>
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>

              {ui.showApproveNeeded && (
                <button onClick={() => actions.setApproveNeeded(!state.approveNeeded)} className={`flex items-center gap-2 px-5 py-3 rounded-full shadow-soft border transition-all ${state.approveNeeded ? "bg-primary border-primary text-primary-foreground shadow-soft-lg transform -translate-y-0.5" : "bg-card border-border/50 text-muted-foreground hover:bg-muted"}`}>
                  {state.approveNeeded ? <CheckSquare size={16} /> : <Square size={16} />}
                  <span className='text-sm font-bold'>Approve needed</span>
                </button>
              )}

              <button onClick={() => actions.setUseAlfaOne(!state.useAlfaOne)} className={`flex items-center gap-2 px-5 py-3 rounded-full shadow-soft border transition-all ${state.useAlfaOne ? "bg-primary border-primary text-primary-foreground shadow-soft-lg transform -translate-y-0.5" : "bg-card border-border/50 text-muted-foreground hover:bg-muted"}`}>
                {state.useAlfaOne ? <CheckSquare size={16} /> : <Square size={16} />}
                <span className='text-sm font-bold'>AlfaOne</span>
              </button>
            </div>

            {/* DIAGNOSTICS TABS */}
            {((ui.showInputHtml && state.inputHtml) || (ui.showLogsPanel && state.log.length > 0)) && (
              <div className='bg-card rounded-[2rem] shadow-soft overflow-hidden flex flex-col border border-border/50 mt-2'>
                <div className='flex items-center px-6 pt-4 gap-6 border-b border-border/50'>
                  <button onClick={() => setLeftTab("logs")} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${leftTab === "logs" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground/80"}`}>
                    {t("Operations Log", "Лог операцій")}
                  </button>
                  <button onClick={() => setLeftTab("raw")} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${leftTab === "raw" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground/80"}`}>
                    {t("Raw HTML", "Вхідний HTML")}
                  </button>
                </div>
                <div className='p-5 max-h-[350px] overflow-auto bg-background shadow-inner'>
                  {leftTab === "logs" && (
                    <div className='flex flex-col gap-2'>
                      {state.log.map((entry, idx) => (
                        <div key={idx} className='font-mono text-xs text-foreground bg-card px-4 py-2.5 rounded-xl border border-border/50 shadow-sm'>
                          {entry}
                        </div>
                      ))}
                      {state.log.length === 0 && <div className='text-sm text-muted-foreground italic font-medium p-4 text-center'>{t("No logs yet.", "Немає записів.")}</div>}
                    </div>
                  )}
                  {leftTab === "raw" && (
                    <div className='relative group'>
                      <button onClick={() => actions.handleCopy(state.inputHtml, "HTML")} className='absolute top-3 right-3 p-2 bg-background shadow-soft rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-105 text-muted-foreground hover:text-primary border border-border/50'>
                        <Copy size={16} strokeWidth={2.5} />
                      </button>
                      <pre className='font-mono text-[11px] text-muted-foreground bg-background p-5 rounded-2xl overflow-x-auto border border-border/30 shadow-sm leading-relaxed'>{state.inputHtml || t("No HTML source.", "Немає вхідного коду.")}</pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN (5 cols) */}
          <div className='col-span-1 xl:col-span-5 flex flex-col gap-6'>
            {/* IMAGE PROCESSOR (Legacy wrapper wrapper) */}
            {state.showImageProcessor && (
              <div className='bg-card rounded-[2rem] shadow-soft p-1.5 overflow-hidden border-[3px] border-primary/40 relative'>
                <div className='absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] uppercase font-extrabold px-3 py-1 rounded-bl-xl z-20 shadow-sm leading-none'>Images Detected</div>
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
                />
              </div>
            )}

            {/* OUTPUT TABS */}
            <div className='bg-card rounded-[2rem] shadow-soft overflow-hidden flex flex-col flex-1 min-h-[500px] border border-border/50'>
              <div className='flex items-center justify-between border-b border-border/50 px-6 pt-5 bg-card'>
                <div className='flex gap-6'>
                  <button onClick={() => setRightTab("html")} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${rightTab === "html" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground/80"}`}>
                    HTML {t("Output", "Результат")}
                  </button>
                  <button onClick={() => setRightTab("mjml")} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${rightTab === "mjml" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground/80"}`}>
                    MJML {t("Output", "Результат")}
                  </button>
                </div>

                <div className='flex gap-1.5 pb-3'>
                  <button onClick={rightTab === "html" ? actions.handleExportHTML : actions.handleExportMJML} disabled={state.isAutoExporting} className='p-2 bg-secondary hover:bg-muted text-foreground rounded-full transition-colors active:scale-95 shadow-sm' title='Export'>
                    <ArrowRightLeft size={15} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => {
                      const ref = rightTab === "html" ? outputHtmlRef : outputMjmlRef;
                      if (ref.current) actions.handleCopy(ref.current.value, rightTab.toUpperCase());
                    }}
                    className='p-2 bg-secondary hover:bg-muted text-foreground rounded-full transition-colors active:scale-95 shadow-sm'
                    title='Copy'>
                    <Copy size={15} strokeWidth={2.5} />
                  </button>
                  <button onClick={rightTab === "html" ? actions.handleDownloadHTML : actions.handleDownloadMJML} className='p-2 bg-secondary hover:bg-muted text-foreground rounded-full transition-colors active:scale-95 shadow-sm' title='Download'>
                    <Download size={15} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              <div className='p-5 flex-1 flex flex-col bg-background shadow-inner'>
                {/* Both textareas must be mounted so refs don't break logic */}
                <textarea ref={outputHtmlRef} readOnly className={`flex-[1_1_300px] w-full bg-card border border-border/50 shadow-sm rounded-2xl p-5 font-mono text-[13px] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all text-foreground ${rightTab === "html" ? "block" : "hidden"}`} placeholder={t("HTML output will appear here...", "Після експорту тут з'явиться готовий HTML код...")} />
                <textarea ref={outputMjmlRef} readOnly className={`flex-[1_1_300px] w-full bg-card border border-border/50 shadow-sm rounded-2xl p-5 font-mono text-[13px] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all text-foreground ${rightTab === "mjml" ? "block" : "hidden"}`} placeholder={t("MJML output will appear here...", "Після експорту тут з'явиться готовий MJML код...")} />
              </div>
            </div>
          </div>
        </div>

        {/* UPLOAD HISTORY */}
        {ui.showUploadHistory && (
          <div className='mt-4 bg-card rounded-[2rem] shadow-soft p-6 md:p-8 border border-border/50'>
            <h3 className='text-xl font-extrabold mb-6 text-foreground flex items-center gap-2'>📜 {t("Upload History", "Історія завантажень")}</h3>
            {/* Legacy UI */}
            <div className='bg-background rounded-2xl p-4 border border-border/50 shadow-inner'>
              <UploadHistory sessions={state.uploadHistory} onClear={actions.handleClearHistory} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
