import { Play as ProcessIcon, Upload as UploadIcon, Replace as ReplaceIcon } from "lucide-react";

interface ImageProcessorActionsProps {
  pendingCount: number;
  autoProcess: boolean;
  processAllPending: () => void;
  doneCount: number;
  setUploadDialogOpen: (val: boolean) => void;
  lastUploadedCount: number;
  hasOutput: boolean;
  isUploading: boolean;
  replacementDone: boolean;
  handleReplaceInOutput: () => void;
  handleClear: () => void;
}

export function ImageProcessorActions({
  pendingCount,
  autoProcess,
  processAllPending,
  doneCount,
  setUploadDialogOpen,
  lastUploadedCount,
  hasOutput,
  isUploading,
  replacementDone,
  handleReplaceInOutput,
  handleClear,
}: ImageProcessorActionsProps) {
  return (
    <div className='flex flex-row gap-2 mt-2'>
      {pendingCount > 0 && !autoProcess && (
        <button onClick={processAllPending} className='flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-muted text-foreground rounded-lg border border-border/50 font-semibold text-sm transition-all hover:-translate-y-px hover:shadow-sm hover:border-border active:scale-95'>
          <ProcessIcon size={16} />
          Обробити все ({pendingCount})
        </button>
      )}

      <button onClick={() => setUploadDialogOpen(true)} disabled={doneCount === 0} className='flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-semibold text-sm transition-all hover:-translate-y-px hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:active:scale-100'>
        <UploadIcon size={16} />
        Upload to Storage ({doneCount})
      </button>

      {lastUploadedCount > 0 && (
        <button
          title={!hasOutput ? "Спочатку експортуйте HTML або MJML" : isUploading ? "Йде завантаження..." : replacementDone ? "URLs вже замінені" : "Замінити зображення на storage URLs"}
          onClick={handleReplaceInOutput}
          disabled={replacementDone || !hasOutput || isUploading}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:-translate-y-px hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 disabled:hover:shadow-none ${replacementDone ? "bg-green-600 text-white" : "bg-card border border-border/50 text-foreground hover:bg-muted hover:border-border"}`}>
          {replacementDone ? <CheckIcon size={16} /> : <ReplaceIcon size={16} />}
          {replacementDone ? `✓ Замінено (${lastUploadedCount})` : `Замінити (${lastUploadedCount})`}
        </button>
      )}

      <button onClick={handleClear} className='flex items-center justify-center px-4 py-2 bg-card border border-border/50 hover:bg-muted hover:border-border text-foreground rounded-lg font-semibold text-sm transition-all hover:-translate-y-px hover:shadow-sm active:scale-95'>
        Очистити
      </button>
    </div>
  );
}

function CheckIcon({ size }: { size: number }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
      <path d='M20 6 9 17l-5-5' />
    </svg>
  );
}
