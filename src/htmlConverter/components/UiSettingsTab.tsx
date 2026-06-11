import React, { Dispatch, SetStateAction } from "react";
import type { UiSettings } from "../hooks/useHtmlConverterSettings";
import type { UploadMode } from "../hooks/useHtmlConverterLogic";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useElectronAPI } from "@/hooks/useElectronAPI";

type UiSettingsTabProps = {
  ui: UiSettings;
  setUi: Dispatch<SetStateAction<UiSettings>>;
  uploadMode: UploadMode;
  setUploadMode: Dispatch<SetStateAction<UploadMode>>;
};

type RowProps = {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
};

const Row: React.FC<RowProps> = ({ id, label, hint, checked, onCheckedChange }) => (
  <div className='flex items-center justify-between'>
    <div>
      <Label htmlFor={id} className='text-sm cursor-pointer'>{label}</Label>
      {hint && <p className='text-[11px] text-muted-foreground mt-0.5'>{hint}</p>}
    </div>
    <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

export const UiSettingsTab: React.FC<UiSettingsTabProps> = ({ ui, setUi, uploadMode, setUploadMode }) => {
  const electronAPI = useElectronAPI();

  const set = (key: keyof UiSettings, value: boolean) =>
    setUi((prev) => ({ ...prev, [key]: value }));

  return (
    <div className='flex flex-col gap-5'>

      {/* ── Панелі ─────────────────────────────────────────────────────────── */}
      <section className='space-y-3'>
        <h3 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>Панелі</h3>
        <div className='space-y-3'>
          <Row id='showLogsPanel'     label='Лог операцій'           checked={ui.showLogsPanel}     onCheckedChange={(v) => set("showLogsPanel", v)} />
          <Row id='showAiTerminal'    label='Термінал AI'             checked={ui.showAiTerminal}    onCheckedChange={(v) => set("showAiTerminal", v)} />
          <Row id='showInputHtml'     label='Вхідний HTML'            checked={ui.showInputHtml}     onCheckedChange={(v) => set("showInputHtml", v)} />
          <Row id='showUploadHistory' label='Історія завантажень'     checked={ui.showUploadHistory} onCheckedChange={(v) => set("showUploadHistory", v)} />
        </div>
      </section>

      <div className='h-px bg-border' />

      {/* ── Поведінка ──────────────────────────────────────────────────────── */}
      <section className='space-y-3'>
        <h3 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>Поведінка</h3>
        <div className='space-y-3'>
          <Row id='rememberUiLayout'      label='Запамʼятовувати layout'          hint='Вимкни, щоб скидати вигляд при перезавантаженні'   checked={ui.rememberUiLayout}      onCheckedChange={(v) => set("rememberUiLayout", v)} />
          <Row id='autoCloseUploadDialog' label='Авто-закриття після завантаження' checked={ui.autoCloseUploadDialog} onCheckedChange={(v) => set("autoCloseUploadDialog", v)} />
          <Row id='showApproveNeeded'     label='Показувати "Approve Needed"'      checked={ui.showApproveNeeded}     onCheckedChange={(v) => set("showApproveNeeded", v)} />
        </div>

        <div className='flex items-center justify-between pt-1'>
          <Label htmlFor='warningSize' className='text-sm'>Попередження про розмір файлу</Label>
          <div className='flex items-center gap-1.5'>
            <Input
              id='warningSize'
              type='number'
              value={ui.warningFileSizeKB}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) setUi((prev) => ({ ...prev, warningFileSizeKB: val }));
              }}
              min={0}
              step={100}
              className='h-8 w-20 text-xs text-center'
            />
            <span className='text-xs text-muted-foreground'>KB</span>
          </div>
        </div>
      </section>

      {/* ── Завантаження (Electron) ────────────────────────────────────────── */}
      {electronAPI && (
        <>
          <div className='h-px bg-border' />
          <section className='space-y-3'>
            <h3 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>Завантаження</h3>
            <div className='grid grid-cols-2 gap-2'>
              {(["electron", "playwright"] as const).map((mode) => {
                const active = uploadMode === mode;
                const isElectron = mode === "electron";
                return (
                  <button
                    key={mode}
                    onClick={() => setUploadMode(mode)}
                    className={[
                      "flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-all duration-150",
                      active
                        ? "border-primary bg-primary/8 shadow-sm"
                        : "border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-border",
                    ].join(" ")}
                  >
                    <div className='flex items-center justify-between w-full'>
                      <span className={`text-xs font-semibold ${active ? "text-primary" : "text-foreground"}`}>
                        {isElectron ? "Built-in" : "Playwright"}
                      </span>
                      <span className={[
                        "w-2 h-2 rounded-full border transition-all",
                        active ? "bg-primary border-primary" : "bg-transparent border-muted-foreground/40",
                      ].join(" ")} />
                    </div>
                    <span className='text-[11px] text-muted-foreground leading-snug'>
                      {isElectron ? "BrowserWindow вбудований" : "Зовнішній Brave + CDP"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}

    </div>
  );
};
