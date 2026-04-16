import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy } from "lucide-react";

interface DiagnosticsPanelProps {
  logs: string[];
  inputHtml: string;
  handleCopy: (text: string, type: string) => void;
  aiLogs?: string[];
  aiConnected?: boolean;
  showAiTerminal?: boolean;
}

export function DiagnosticsPanel({ logs, inputHtml, handleCopy, aiLogs = [], aiConnected = false, showAiTerminal = false }: DiagnosticsPanelProps) {
  const { t } = useTranslation();
  const [leftTab, setLeftTab] = useState<"logs" | "raw" | "ai_terminal">("logs");

  return (
    <div className='bg-card rounded-[2rem] shadow-soft hover:shadow-lg overflow-hidden flex flex-col border border-border/50 hover:border-border transition-all duration-300 mt-2 group'>
      <div className='flex items-center px-6 pt-4 gap-6 border-b border-border/50'>
        <button onClick={() => setLeftTab("logs")} className={`pb-3 text-sm font-bold border-b-2 transition-all ${leftTab === "logs" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground/80 hover:border-border"}`}>
          {t("Operations Log", "Лог операцій")}
        </button>
        <button onClick={() => setLeftTab("raw")} className={`pb-3 text-sm font-bold border-b-2 transition-all ${leftTab === "raw" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground/80 hover:border-border"}`}>
          {t("Raw HTML", "Вхідний HTML")}
        </button>
        {showAiTerminal && (
          <button onClick={() => setLeftTab("ai_terminal")} className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${leftTab === "ai_terminal" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground/80 hover:border-border"}`}>
            AI Terminal
            <span className={`w-2 h-2 rounded-full ${aiConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></span>
          </button>
        )}
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
        {leftTab === "ai_terminal" && showAiTerminal && (
          <div className='flex gap-1.5 bg-black/95 p-5 rounded-2xl overflow-x-auto min-h-[300px] border border-border/30 shadow-inner custom-scrollbar flex-col-reverse justify-start'>
            {/* flex-col-reverse makes CSS auto-scroll to bottom naturally without JS ref if we reverse array */}
            {aiLogs.slice().reverse().map((entry, idx) => (
              <div key={idx} className='font-mono text-[11px] text-green-400 break-words leading-tight'>
                {entry}
              </div>
            ))}
            {aiLogs.length === 0 && <div className='text-sm text-green-700 italic font-mono p-4 text-center'>Waiting for connection...</div>}
          </div>
        )}
      </div>
    </div>
  );
}
