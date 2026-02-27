import { ArrowRightLeft, Download } from "lucide-react";

interface EditorToolbarProps {
  onExportHTML: () => void;
  onExportMJML: () => void;
  onAutoExportAll: () => void;
  isAutoExporting: boolean;
  className?: string;
}

export function EditorToolbar({ onExportHTML, onExportMJML, onAutoExportAll, isAutoExporting, className = "" }: EditorToolbarProps) {
  return (
    <div className={`bg-card border border-border/50 rounded-xl shadow-soft p-3 ${className}`}>
      <div className='flex flex-wrap items-center gap-2'>
        <button onClick={onExportHTML} disabled={isAutoExporting} className='flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
          <ArrowRightLeft size={16} />
          Експортувати HTML
        </button>
        <button onClick={onExportMJML} disabled={isAutoExporting} className='flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
          <ArrowRightLeft size={16} />
          Експортувати MJML
        </button>
        <button onClick={onAutoExportAll} disabled={isAutoExporting} className='flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto'>
          <Download size={16} />
          {isAutoExporting ? "Готую..." : "Зробити все"}
        </button>
      </div>
    </div>
  );
}
