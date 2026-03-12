import { Check as CheckIcon } from "lucide-react";
import type { UploadSession } from "../types";

interface HistoryPromptProps {
  matchingHistorySession: UploadSession | null | undefined;
  doneCount: number;
  isUploading: boolean;
  lastUploadedCount: number;
  fileNameFolder: string;
  handleTakeFromHistory: () => void;
}

export function HistoryPrompt({
  matchingHistorySession,
  doneCount,
  isUploading,
  lastUploadedCount,
  fileNameFolder,
  handleTakeFromHistory,
}: HistoryPromptProps) {
  if (!matchingHistorySession || doneCount <= 0 || isUploading || lastUploadedCount > 0) return null;

  return (
    <div className='p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col gap-3 animate-in fade-in zoom-in slide-in-from-top-2'>
      <div className='flex items-start gap-3'>
        <div className='p-2 bg-primary/20 rounded-full text-primary shrink-0'>
          <CheckIcon className='w-5 h-5' />
        </div>
        <div>
          <h4 className='text-sm font-semibold text-primary mb-1'>Знайдено історію для "{fileNameFolder}"</h4>
          <p className='text-xs text-muted-foreground leading-relaxed'>
            Ця папка вже завантажувалася {new Date(matchingHistorySession.timestamp).toLocaleDateString()} {new Date(matchingHistorySession.timestamp).toLocaleTimeString()}.
            <br />
            Ви можете миттєво перевикористати посилання та ALT-тексти.
          </p>
        </div>
      </div>
      <button onClick={handleTakeFromHistory} disabled={isUploading} className='self-start flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95 hover:shadow-md focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-sm disabled:cursor-not-allowed'>
        <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
          <path d='m13 2-2 10h9l-9 10 2-10H4l9-10Z' />
        </svg>
        Миттєво взяти з історії
      </button>
    </div>
  );
}
