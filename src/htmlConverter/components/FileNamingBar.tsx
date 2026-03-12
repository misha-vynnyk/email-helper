import { useTranslation } from "react-i18next";
import { Plus, Minus, CheckSquare, Square } from "lucide-react";

interface FileNamingBarProps {
  fileName: string;
  setFileName: (val: string) => void;
  changeFileNumber: (delta: number) => void;
  showApproveNeeded: boolean;
  approveNeeded: boolean;
  setApproveNeeded: (val: boolean) => void;
  useAlfaOne: boolean;
  setUseAlfaOne: (val: boolean) => void;
}

export function FileNamingBar({
  fileName,
  setFileName,
  changeFileNumber,
  showApproveNeeded,
  approveNeeded,
  setApproveNeeded,
  useAlfaOne,
  setUseAlfaOne,
}: FileNamingBarProps) {
  const { t } = useTranslation();

  return (
    <div className='flex flex-wrap items-center gap-3'>
      <div className='flex items-center bg-card rounded-full shadow-soft hover:shadow-md p-1.5 pl-5 border border-border/50 hover:border-border transition-all duration-300 flex-1 min-w-[280px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50'>
        <span className='text-sm font-bold text-muted-foreground mr-3 shrink-0'>{t("File Name:", "Ім'я файлу:")}</span>
        <input type='text' value={fileName} onChange={(e) => setFileName(e.target.value)} onFocus={(e) => e.target.select()} className='bg-transparent border-none outline-none text-[15px] font-extrabold text-foreground w-full focus:ring-0 min-w-0 placeholder:text-muted-foreground transition-colors' />
        <div className='flex items-center gap-1.5 ml-2 shrink-0'>
          <button onClick={() => changeFileNumber(-1)} className='p-2 bg-secondary hover:bg-muted hover:scale-105 active:scale-95 rounded-full text-foreground transition-all shadow-sm'>
            <Minus size={14} strokeWidth={3} />
          </button>
          <button onClick={() => changeFileNumber(1)} className='p-2 bg-secondary hover:bg-muted hover:scale-105 active:scale-95 rounded-full text-foreground transition-all shadow-sm'>
            <Plus size={14} strokeWidth={3} />
          </button>
        </div>
      </div>

      {showApproveNeeded && (
        <button onClick={() => setApproveNeeded(!approveNeeded)} className={`flex items-center gap-2 px-5 py-3 rounded-full shadow-soft hover:shadow-md border hover:scale-[1.02] active:scale-95 transition-all duration-200 ${approveNeeded ? "bg-primary border-primary text-primary-foreground shadow-soft-lg transform -translate-y-0.5" : "bg-card border-border/50 text-muted-foreground hover:bg-muted hover:border-border"}`}>
          <div className={`transition-transform duration-300 ${approveNeeded ? "scale-110" : "scale-100"}`}>{approveNeeded ? <CheckSquare size={16} /> : <Square size={16} />}</div>
          <span className='text-sm font-bold'>Approve needed</span>
        </button>
      )}

      <button onClick={() => setUseAlfaOne(!useAlfaOne)} className={`flex items-center gap-2 px-5 py-3 rounded-full shadow-soft hover:shadow-md border hover:scale-[1.02] active:scale-95 transition-all duration-200 ${useAlfaOne ? "bg-primary border-primary text-primary-foreground shadow-soft-lg transform -translate-y-0.5" : "bg-card border-border/50 text-muted-foreground hover:bg-muted hover:border-border"}`}>
        <div className={`transition-transform duration-300 ${useAlfaOne ? "scale-110" : "scale-100"}`}>{useAlfaOne ? <CheckSquare size={16} /> : <Square size={16} />}</div>
        <span className='text-sm font-bold'>AlfaOne</span>
      </button>
    </div>
  );
}
