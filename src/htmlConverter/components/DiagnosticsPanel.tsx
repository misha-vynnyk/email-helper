import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy } from "lucide-react";

interface DiagnosticsPanelProps {
  logs: string[];
  inputHtml: string;
  handleCopy: (text: string, type: string) => void;
}

export function DiagnosticsPanel({ logs, inputHtml, handleCopy }: DiagnosticsPanelProps) {
  const { t } = useTranslation();
  const [leftTab, setLeftTab] = useState<"logs" | "raw">("logs");

  return (
    <div className='bg-card rounded-[2rem] shadow-soft hover:shadow-lg overflow-hidden flex flex-col border border-border/50 hover:border-border transition-all duration-300 mt-2 group'>
      <div className='flex items-center px-6 pt-4 gap-6 border-b border-border/50'>
        <button onClick={() => setLeftTab("logs")} className={`pb-3 text-sm font-bold border-b-2 transition-all ${leftTab === "logs" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground/80 hover:border-border"}`}>
          {t("Operations Log", "Лог операцій")}
        </button>
        <button onClick={() => setLeftTab("raw")} className={`pb-3 text-sm font-bold border-b-2 transition-all ${leftTab === "raw" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground/80 hover:border-border"}`}>
          {t("Raw HTML", "Вхідний HTML")}
        </button>
      </div>
      <div className='p-5 max-h-[350px] overflow-auto bg-background shadow-inner'>
        {leftTab === "logs" && (
          <div className='flex flex-col gap-2'>
            {logs.map((entry, idx) => (
              <div key={idx} className='font-mono text-xs text-foreground bg-card px-4 py-2.5 rounded-xl border border-border/50 shadow-sm'>
                {entry}
              </div>
            ))}
            {logs.length === 0 && <div className='text-sm text-muted-foreground italic font-medium p-4 text-center'>{t("No logs yet.", "Немає записів.")}</div>}
          </div>
        )}
        {leftTab === "raw" && (
          <div className='relative group'>
            <button onClick={() => handleCopy(inputHtml, "HTML")} className='absolute top-3 right-3 p-2 bg-background shadow-soft rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-105 text-muted-foreground hover:text-primary border border-border/50'>
              <Copy size={16} strokeWidth={2.5} />
            </button>
            <pre className='font-mono text-[11px] text-muted-foreground bg-background p-5 rounded-2xl overflow-x-auto border border-border/30 shadow-sm leading-relaxed'>{inputHtml || t("No HTML source.", "Немає вхідного коду.")}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
