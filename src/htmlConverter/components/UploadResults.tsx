import React from "react";
import { CheckCircle, Image as ImageIcon, Link2, Copy, Check } from "lucide-react";
import type { UploadResult } from "../types";

function toShortPath(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname.startsWith("/") ? u.pathname.slice(1) : u.pathname;
  } catch {
    return url;
  }
}

interface UploadResultsProps {
  results: UploadResult[];
  copiedUrl: string | null;
  onCopyUrl: (url: string, isShortPath?: boolean) => void;
  onCopyAllUrls: (isShortPath?: boolean) => void;
  className?: string;
}

export const UploadResults: React.FC<UploadResultsProps> = ({ results, copiedUrl, onCopyUrl, onCopyAllUrls, className = "" }) => {
  const successCount = results.filter((r) => r.success).length;

  return (
    <div className={`p-4 rounded-xl bg-card border border-border/50 shadow-soft ${className}`}>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2 text-foreground'>
          <CheckCircle className='text-success' size={20} />
          <h3 className='text-sm font-semibold'>
            Uploaded Files ({successCount}/{results.length})
          </h3>
        </div>
        {successCount > 0 && (
          <div className='flex gap-2 text-foreground'>
            <button title='Copy all full URLs' onClick={() => onCopyAllUrls(false)} className='flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-secondary hover:bg-muted text-foreground rounded-md transition-all hover:scale-105 active:scale-95'>
              {copiedUrl === "all" ? <Check size={14} /> : <Link2 size={14} />}
              {copiedUrl === "all" ? "✓" : "Copy URLs"}
            </button>
            <button title='Copy all short paths' onClick={() => onCopyAllUrls(true)} className='flex items-center gap-1 text-xs font-semibold px-2 py-1 border border-border/50 hover:bg-muted text-foreground rounded-md transition-all hover:scale-105 active:scale-95'>
              {copiedUrl === "all-short" ? <Check size={14} /> : <Copy size={14} />}
              {copiedUrl === "all-short" ? "✓" : "Copy Paths"}
            </button>
          </div>
        )}
      </div>

      <div className='flex flex-col gap-2'>
        {results.map((result, index) => (
          <div key={index} className={`p-3 rounded-lg border flex items-center gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm ${result.success ? "bg-success/5 border-success/15 hover:bg-success/10" : "bg-destructive/5 border-destructive/15 hover:bg-destructive/10"}`}>
            <ImageIcon className={`shrink-0 ${result.success ? "text-success" : "text-destructive"}`} size={18} />

            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium text-foreground mb-1 truncate'>{result.filename}</p>
              {result.success ? <p className='text-xs font-mono text-muted-foreground truncate'>{result.url}</p> : <p className='text-xs text-destructive'>{result.error || "Upload failed"}</p>}
            </div>

            {result.success && (
              <div className='flex gap-2 shrink-0 text-foreground'>
                <button title='Copy full URL' onClick={() => onCopyUrl(result.url, false)} className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md transition-all hover:scale-105 active:scale-95 ${copiedUrl === result.url ? "text-success bg-success/10" : "text-primary hover:bg-primary/10"}`}>
                  {copiedUrl === result.url ? <Check size={14} /> : <Link2 size={14} />}
                  {copiedUrl === result.url ? "✓" : "URL"}
                </button>
                <button title='Copy short path' onClick={() => onCopyUrl(result.url, true)} className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md transition-all hover:scale-105 active:scale-95 ${copiedUrl === `${result.url}-short` ? "text-success bg-success/10" : "text-muted-foreground hover:bg-muted"}`}>
                  {copiedUrl === `${result.url}-short` ? <Check size={14} /> : <Copy size={14} />}
                  {copiedUrl === `${result.url}-short` ? "✓" : "Path"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export { toShortPath };
