import { useState, Dispatch, SetStateAction } from "react";
import { Code, Settings } from "lucide-react";
import { SettingsPopover } from "./SettingsPopover";
import type { UiSettings } from "../hooks/useHtmlConverterSettings";
import type { ImageAnalysisSettings } from "../types";

interface HeaderProps {
  ui: UiSettings;
  setUi: Dispatch<SetStateAction<UiSettings>>;
  imageAnalysis: ImageAnalysisSettings;
  setImageAnalysis: Dispatch<SetStateAction<ImageAnalysisSettings>>;
  autoProcess: boolean;
  setAutoProcess: Dispatch<SetStateAction<boolean>>;
  aiBackendStatus: "checking" | "online" | "offline" | "ollama_offline";
  unseenLogCount: number;



}

export function Header({ ui, setUi, imageAnalysis, setImageAnalysis, autoProcess, setAutoProcess, aiBackendStatus, unseenLogCount }: HeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"ui" | "image">("ui");

  return (
    <header className='flex items-center justify-between w-full h-16 px-6 bg-card border border-border/50 rounded-full shadow-sm hover:shadow-md transition-all duration-300'>
      <div className='flex items-center gap-3'>
        <div className='flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary'>
          <Code className='w-5 h-5' />
        </div>
        <div>
          <h1 className='text-base font-bold text-foreground tracking-tight leading-none'>HTML Конвертер</h1>
          <p className='text-xs text-muted-foreground mt-0.5'>to MJML & Table</p>
        </div>
      </div>

      <div className='flex items-center gap-4'>
        {/* AI Backend Status Indicator */}
        {imageAnalysis.useAiBackend && (
          <div className='flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background border border-border/50 shadow-inner cursor-help' 
            title={
              aiBackendStatus === "online" 
              ? "AI сервер працює" 
              : aiBackendStatus === "ollama_offline"
                ? "Ollama не знайдена"
                : aiBackendStatus === "checking" 
                  ? "Перевірка AI сервера..." 
                  : "AI сервер не доступний"
            }>
            <div
              className='w-2 h-2 rounded-full'
              style={{
                backgroundColor: aiBackendStatus === "online" 
                  ? "#10B981" 
                  : aiBackendStatus === "checking" 
                    ? "#F59E0B" 
                    : aiBackendStatus === "ollama_offline"
                      ? "#F97316"
                      : "#EF4444",
                animation: aiBackendStatus === "checking" ? "pulse 1.5s infinite" : "none",
              }}
            />
            <span className='text-[10px] font-bold text-muted-foreground tracking-wider'>AI</span>
          </div>
        )}

        {/* Global Controls */}
        <div className='flex items-center gap-1'>
          <SettingsPopover
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            settingsTab={settingsTab}
            setSettingsTab={setSettingsTab}
            ui={ui}
            setUi={setUi}
            imageAnalysis={imageAnalysis}
            setImageAnalysis={setImageAnalysis}
            autoProcess={autoProcess}
            setAutoProcess={setAutoProcess}
            aiBackendStatus={aiBackendStatus}
            triggerElement={
              <button
                className='relative p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 hover:scale-105 active:scale-95'
                title='UI налаштування'
                onClick={() => {
                  setSettingsTab("ui");
                  setSettingsOpen(true);
                }}>
                <Settings className='w-5 h-5' />
                {!ui.showLogsPanel && unseenLogCount > 0 && <span className='absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-destructive rounded-full shadow-sm ring-2 ring-card'>{unseenLogCount > 99 ? "99+" : unseenLogCount}</span>}
              </button>
            }
          />
        </div>
      </div>
    </header>
  );
}
