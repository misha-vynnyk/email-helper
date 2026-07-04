import { FileCog, HardDrive, PenLine, Settings2 } from "lucide-react";
import React from "react";

import { cn } from "../lib/utils";
import { useEmailSender } from "./EmailSenderContext";
import { cardClass, Note, NoteTone, SectionHeader } from "./ui";

type StorageMode = "localStorage" | "env" | "state";

const OPTIONS: { value: StorageMode; label: string; Icon: typeof HardDrive; hint: string }[] = [
  { value: "localStorage", label: "LocalStorage", Icon: HardDrive, hint: "Save credentials in browser localStorage" },
  { value: "env", label: ".env File", Icon: FileCog, hint: "Load credentials from environment variables" },
  { value: "state", label: "Manual Entry", Icon: PenLine, hint: "Enter credentials manually (session only)" },
];

const DESCRIPTIONS: Record<StorageMode, { tone: NoteTone; text: string }> = {
  localStorage: { tone: "info", text: "Credentials are automatically saved and loaded from browser localStorage" },
  env: { tone: "warning", text: "Credentials are loaded from environment variables (.env file)" },
  state: { tone: "success", text: "Credentials are entered manually and stored only in component state" },
};

export const StorageToggle: React.FC = () => {
  const { useStorageToggle, setUseStorageToggle } = useEmailSender();
  const description = DESCRIPTIONS[useStorageToggle];

  return (
    <div className={cn(cardClass, "p-4 flex flex-col gap-3")}>
      <SectionHeader
        icon={<Settings2 size={16} />}
        title='Credential Storage Method'
        subtitle='Where SMTP credentials live'
      />

      <div role='group' aria-label='storage method' className='flex items-center bg-background rounded-full border border-border/50 shadow-inner p-1 gap-1'>
        {OPTIONS.map(({ value, label, Icon, hint }) => {
          const isActive = useStorageToggle === value;
          return (
            <button
              key={value}
              type='button'
              title={hint}
              aria-pressed={isActive}
              onClick={() => setUseStorageToggle(value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-95",
                isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className='w-3.5 h-3.5 shrink-0' />
              <span className='truncate'>{label}</span>
            </button>
          );
        })}
      </div>

      <Note tone={description.tone}>{description.text}</Note>

      {useStorageToggle === "env" && (
        <Note tone='warning'>
          <strong>Environment variables setup:</strong> create a{" "}
          <code className='font-mono text-[11px]'>.env</code> file with:
          <pre className='mt-1.5 rounded-lg bg-black/5 dark:bg-white/5 px-2.5 py-2 font-mono text-[11px] leading-relaxed overflow-x-auto'>
            {"VITE_EMAIL_USER=your-email@gmail.com\nVITE_DESTINATION_EMAIL_USER=recipient@example.com\nVITE_EMAIL_PASS=your-app-password"}
          </pre>
        </Note>
      )}
    </div>
  );
};
