import * as React from "react";

const SLOT_BY_FILENAME = {
  "description.md": "description",
  "desktop.json": "desktop",
  "mobile.json": "mobile",
} as const;

type SlotKey = (typeof SLOT_BY_FILENAME)[keyof typeof SLOT_BY_FILENAME];

const FILENAME_BY_SLOT: Record<SlotKey, string> = {
  description: "description.md",
  desktop: "desktop.json",
  mobile: "mobile.json",
};

type Slots = Partial<Record<SlotKey, { name: string; content: string }>>;

export interface FigmaImportDroppedFiles {
  descriptionContent?: string;
  desktopRaw: string;
  mobileRaw: string;
}

interface FigmaImportDropzoneProps {
  onFilesReady: (files: FigmaImportDroppedFiles) => void;
}

export default function FigmaImportDropzone({ onFilesReady }: FigmaImportDropzoneProps) {
  const slotsRef = React.useRef<Slots>({});
  const [slots, setSlots] = React.useState<Slots>({});
  const [unrecognized, setUnrecognized] = React.useState<string[]>([]);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const unknown: string[] = [];

    const entries = await Promise.all(
      files.map(async (file) => {
        const slot = SLOT_BY_FILENAME[file.name as keyof typeof SLOT_BY_FILENAME];
        if (!slot) {
          unknown.push(file.name);
          return null;
        }
        return [slot, { name: file.name, content: await file.text() }] as const;
      })
    );

    const next: Slots = { ...slotsRef.current };
    for (const entry of entries) {
      if (entry) next[entry[0]] = entry[1];
    }
    slotsRef.current = next;
    setSlots(next);
    setUnrecognized(unknown);

    if (next.desktop && next.mobile) {
      onFilesReady({
        descriptionContent: next.description?.content,
        desktopRaw: next.desktop.content,
        mobileRaw: next.mobile.content,
      });
    }
  };

  return (
    <div className='flex flex-col gap-2'>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center text-sm transition-colors ${
          isDragOver ? "border-primary bg-primary/10" : "border-border text-muted-foreground"
        }`}>
        Перетягни сюди description.md, desktop.json, mobile.json — окремо або разом
        <input
          ref={inputRef}
          type='file'
          multiple
          accept='.md,.json'
          className='hidden'
          onChange={(e) => e.target.files && void handleFiles(e.target.files)}
        />
      </div>

      <ul className='flex gap-4 text-xs'>
        {(Object.keys(FILENAME_BY_SLOT) as SlotKey[]).map((key) => (
          <li
            key={key}
            data-testid={`figma-import-slot-${key}`}
            className={slots[key] ? "text-primary" : "text-muted-foreground"}>
            {slots[key] ? "✓" : "○"} {FILENAME_BY_SLOT[key]}
          </li>
        ))}
      </ul>

      {unrecognized.length > 0 && (
        <div className='text-xs text-destructive'>
          Невідомі файли (очікую description.md/desktop.json/mobile.json): {unrecognized.join(", ")}
        </div>
      )}
    </div>
  );
}
