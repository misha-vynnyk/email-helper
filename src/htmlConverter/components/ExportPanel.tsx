import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Download, ArrowRightLeft } from "lucide-react";

interface ExportPanelProps {
  outputHtmlRef: React.RefObject<HTMLTextAreaElement>;
  outputMjmlRef: React.RefObject<HTMLTextAreaElement>;
  isAutoExporting: boolean;
  handleExportHTML: () => void;
  handleExportMJML: () => void;
  handleDownloadHTML: () => void;
  handleDownloadMJML: () => void;
  handleCopy: (text: string, type: string) => void;
}

export function ExportPanel({
  outputHtmlRef,
  outputMjmlRef,
  isAutoExporting,
  handleExportHTML,
  handleExportMJML,
  handleDownloadHTML,
  handleDownloadMJML,
  handleCopy,
}: ExportPanelProps) {
  const { t } = useTranslation();
  const [rightTab, setRightTab] = useState<"html" | "mjml">("html");

  return (
    <div className='bg-card rounded-[2rem] shadow-soft hover:shadow-lg flex flex-col flex-1 min-h-[500px] border border-border/50 hover:border-border transition-all duration-300 group'>
      <div className='flex items-center justify-between px-6 pt-5'>
        <div className='flex gap-6'>
          <button onClick={() => setRightTab("html")} className={`pb-3 text-sm font-bold border-b-2 transition-all ${rightTab === "html" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground/80 hover:border-border"}`}>
            HTML {t("Output", "Результат")}
          </button>
          <button onClick={() => setRightTab("mjml")} className={`pb-3 text-sm font-bold border-b-2 transition-all ${rightTab === "mjml" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground/80 hover:border-border"}`}>
            MJML {t("Output", "Результат")}
          </button>
        </div>

        <div className='flex gap-1.5 pb-3'>
          <button onClick={rightTab === "html" ? handleExportHTML : handleExportMJML} disabled={isAutoExporting} className='p-2 bg-secondary hover:bg-muted text-foreground rounded-full transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow group/btn' title='Export'>
            <ArrowRightLeft size={15} strokeWidth={2.5} className='group-hover/btn:text-primary transition-colors' />
          </button>
          <button
            onClick={() => {
              const ref = rightTab === "html" ? outputHtmlRef : outputMjmlRef;
              if (ref.current) handleCopy(ref.current.value, rightTab.toUpperCase());
            }}
            className='p-2 bg-secondary hover:bg-muted text-foreground rounded-full transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow group/btn'
            title='Copy'>
            <Copy size={15} strokeWidth={2.5} className='group-hover/btn:text-primary transition-colors' />
          </button>
          <button onClick={rightTab === "html" ? handleDownloadHTML : handleDownloadMJML} className='p-2 bg-secondary hover:bg-muted text-foreground rounded-full transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow group/btn' title='Download'>
            <Download size={15} strokeWidth={2.5} className='group-hover/btn:text-primary transition-colors' />
          </button>
        </div>
      </div>

      <div className='p-5 flex-1 flex flex-col bg-background shadow-inner rounded-b-[2rem]'>
        {/* Both textareas must be mounted so refs don't break logic */}
        <textarea ref={outputHtmlRef} readOnly className={`flex-[1_1_300px] w-full bg-card border border-border/50 shadow-sm rounded-2xl p-5 font-mono text-[13px] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all text-foreground ${rightTab === "html" ? "block" : "hidden"}`} placeholder={t("HTML output will appear here...", "Після експорту тут з'явиться готовий HTML код...")} />
        <textarea ref={outputMjmlRef} readOnly className={`flex-[1_1_300px] w-full bg-card border border-border/50 shadow-sm rounded-2xl p-5 font-mono text-[13px] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all text-foreground ${rightTab === "mjml" ? "block" : "hidden"}`} placeholder={t("MJML output will appear here...", "Після експорту тут з'явиться готовий MJML код...")} />
      </div>
    </div>
  );
}
