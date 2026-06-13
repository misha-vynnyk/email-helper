import { Check, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { useState } from "react";

interface Tag {
  label: string;
  tag: string;
  hint?: string;
}

interface WrapperTag {
  label: string;
  open: string;
  close: string;
  hint?: string;
}

type Entry = { type: "tag"; data: Tag } | { type: "wrapper"; data: WrapperTag };

const ENTRIES: Entry[] = [
  { type: "tag", data: { label: "Заголовок", tag: "h1", hint: "headline" } },
  { type: "tag", data: { label: "Відступ", tag: "h4", hint: "padding both sides" } },
  { type: "tag", data: { label: "Кнопка", tag: "h5", hint: "button" } },
  { type: "tag", data: { label: "Малий текст", tag: "h6", hint: "small text" } },
  { type: "tag", data: { label: "Перенос рядка", tag: "§", hint: "1 <br>" } },
  { type: "wrapper", data: { label: "Фото праворуч", open: "i-r-s", close: "i-r-s-e", hint: "wrap only normal text, no picture" } },
  { type: "wrapper", data: { label: "Фото ліворуч", open: "i-l-s", close: "i-l-s-e", hint: "wrap only normal text, no picture" } },
  { type: "wrapper", data: { label: "Підпис", open: "sign-i", close: "sign-i-e" } },
  { type: "wrapper", data: { label: "Футер", open: "ftr-s", close: "ftr-e" } },
];

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

export function CheatsheetPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className='bg-card rounded-2xl border border-border/50 shadow-soft transition-all duration-300 overflow-hidden'>
      <button onClick={() => setOpen((v) => !v)} className='w-full flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors'>
        <span className='text-sm font-semibold text-foreground'>Шпаргалка позначок</span>
        {open ? <ChevronUp size={16} className='text-muted-foreground' /> : <ChevronDown size={16} className='text-muted-foreground' />}
      </button>

      {open && (
        <div className='px-5 pb-4 flex flex-col gap-3'>
          {ENTRIES.map((entry) => {
            if (entry.type === "tag") {
              const { label, tag, hint } = entry.data;
              return (
                <div key={tag} className='flex items-center justify-between gap-3'>
                  <div className='min-w-0'>
                    <span className='text-sm text-foreground'>{label}</span>
                    {hint && <span className='ml-1.5 text-xs text-muted-foreground'>— {hint}</span>}
                  </div>
                  <CopyChip text={tag} />
                </div>
              );
            }

            const { label, open: openTag, close, hint } = entry.data;
            return (
              <div key={openTag} className='flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <span className='text-sm text-foreground'>{label}</span>
                  {hint && <span className='ml-1.5 text-xs text-muted-foreground'>— {hint}</span>}
                </div>
                <CopyChip text={`${openTag}\n\n${close}`} display={`${openTag} … ${close}`} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
