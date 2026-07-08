import { Check, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { useState } from "react";

import { buildMarkers } from "../markers";

function CopyChip({ text, display }: { text: string; display?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button onClick={handleCopy} title={`Копіювати "${text}"`} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-mono text-xs border transition-all active:scale-95 select-none ${copied ? "bg-success/15 border-success/30 text-success" : "bg-muted/60 border-border/60 text-foreground hover:bg-muted hover:border-border"}`}>
      {copied ? <Check size={11} strokeWidth={3} /> : <Copy size={11} strokeWidth={2} />}
      {display ?? text}
    </button>
  );
}

export function CheatsheetPanel({ oneBrSymbol = "§" }: { oneBrSymbol?: string }) {
  const [open, setOpen] = useState(false);
  const markers = buildMarkers(oneBrSymbol);

  return (
    <div className='bg-card rounded-2xl border border-border/50 shadow-soft transition-all duration-300 overflow-hidden'>
      <button onClick={() => setOpen((v) => !v)} className='w-full flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors'>
        <span className='text-sm font-semibold text-foreground'>Шпаргалка позначок</span>
        {open ? <ChevronUp size={16} className='text-muted-foreground' /> : <ChevronDown size={16} className='text-muted-foreground' />}
      </button>

      {open && (
        <div className='px-5 pb-4 flex flex-col gap-3'>
          {markers.map((marker) => {
            const copyText = marker.kind === "wrapper" ? `${marker.open}\n\n${marker.close}` : marker.kind === "heading" ? marker.tag : marker.text;
            const display = marker.kind === "wrapper" ? `${marker.open} … ${marker.close}` : undefined;
            return (
              <div key={copyText} className='flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <span className='text-sm text-foreground'>{marker.labelUk}</span>
                  {marker.hint && <span className='ml-1.5 text-xs text-muted-foreground'>— {marker.hint}</span>}
                </div>
                <CopyChip text={copyText} display={display} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
