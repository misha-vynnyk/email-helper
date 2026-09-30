import { FolderOpen } from "lucide-react";
import React, { Dispatch, SetStateAction } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useElectronAPI } from "@/hooks/useElectronAPI";
import { cn } from "@/lib/utils";

import type { BrowserDetectionStatus } from "../hooks/useBrowserDetection";
import type { UploadMode } from "../hooks/useHtmlConverterLogic";
import type { UiSettings } from "../hooks/useHtmlConverterSettings";
import { DEFAULT_UI_SETTINGS } from "../hooks/useHtmlConverterSettings";
import { BetaBadge } from "./BetaBadge";

type UiSettingsTabProps = {
  ui: UiSettings;
  setUi: Dispatch<SetStateAction<UiSettings>>;
  uploadMode: UploadMode;
  setUploadMode: Dispatch<SetStateAction<UploadMode>>;
  browserDetectionStatus: BrowserDetectionStatus;
};

// Only the "Конвертація" section actually mixes settings that affect just one of the two
// converters (Simple/Advanced) with ones that affect both — that's the one place scope needs
// to be visible at a glance. Everywhere else in this tab (panels, editor, general behavior,
// upload infra) is unrelated to which converter is active, so it stays unlabeled — tagging
// every row "Обидва" there would just reintroduce the same clutter this is meant to fix.
type ConverterScope = "simple" | "advanced" | "both";

const SCOPE_LABEL: Record<ConverterScope, string> = {
  simple: "Дефолт",
  advanced: "Розширений",
  both: "Обидва",
};

const SCOPE_CLASS: Record<ConverterScope, string> = {
  simple: "border-sky-300/70 text-sky-700 dark:border-sky-800 dark:text-sky-400",
  advanced: "border-violet-300/70 text-violet-700 dark:border-violet-800 dark:text-violet-400",
  both: "border-border text-muted-foreground",
};

const ScopeBadge: React.FC<{ scope: ConverterScope }> = ({ scope }) => (
  <Badge
    variant='outline'
    className={cn(
      "rounded-full px-1.5 py-0 text-[9px] font-semibold uppercase leading-4 tracking-wide",
      SCOPE_CLASS[scope],
    )}
  >
    {SCOPE_LABEL[scope]}
  </Badge>
);

type RowProps = {
  id: string;
  label: string;
  hint?: string;
  badge?: boolean;
  scope?: ConverterScope;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
};

const Row: React.FC<RowProps> = ({ id, label, hint, badge, scope, checked, onCheckedChange }) => (
  <div className='flex items-center justify-between'>
    <div>
      <Label htmlFor={id} className='text-sm cursor-pointer inline-flex items-center gap-1.5'>
        {label}
        {scope && <ScopeBadge scope={scope} />}
        {badge && <BetaBadge />}
      </Label>
      {hint && <p className='text-[11px] text-muted-foreground mt-0.5'>{hint}</p>}
    </div>
    <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

export const UiSettingsTab: React.FC<UiSettingsTabProps> = ({ ui, setUi, uploadMode, setUploadMode, browserDetectionStatus }) => {
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
          <Row id='showInputHtml'     label='Вхідний HTML'            checked={ui.showInputHtml}     onCheckedChange={(v) => set("showInputHtml", v)} />
          <Row id='showUploadHistory' label='Історія завантажень'     checked={ui.showUploadHistory} onCheckedChange={(v) => set("showUploadHistory", v)} />
        </div>
      </section>

      {/* ── Редактор ───────────────────────────────────────────────────────── */}
      <div className='h-px bg-border' />
      <section className='space-y-3'>
        <h3 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>Редактор</h3>
        <div className='space-y-3'>
          <Row id='editorSelectionToolbar' label='Тулбар при виділенні'   badge hint='Плаваюча панель маркерів над виділеним текстом'                          checked={ui.editorSelectionToolbar} onCheckedChange={(v) => set("editorSelectionToolbar", v)} />
          <Row id='editorMarkerHighlight'  label='Підсвічування позначок' badge hint='Маркери (i-r-s, ftr-s, § …) виділяються кольором у редакторі'            checked={ui.editorMarkerHighlight}  onCheckedChange={(v) => set("editorMarkerHighlight", v)} />
          <Row id='editorGreetingHighlight' label='Підсвічування привітань' badge hint='Знайдені привітання ("Dear Reader," тощо) виділяються червоним у редакторі — текст не змінюється' checked={ui.editorGreetingHighlight} onCheckedChange={(v) => set("editorGreetingHighlight", v)} />
          <Row id='editorHotkeys'          label='Гарячі клавіші'         badge hint='⌘/Ctrl+⌥+1/4/5/6 — заголовки, ⌘/Ctrl+⌥+0 — звичайний текст, ⌘/Ctrl+⇧+Enter — перенос' checked={ui.editorHotkeys}          onCheckedChange={(v) => set("editorHotkeys", v)} />
        </div>
      </section>

      {/* ── Конвертація ────────────────────────────────────────────────────────
          Єдина секція, де реально змішані налаштування різного скоупу (тільки
          Дефолт / тільки Розширений / обидва конвертери) — тому єдина, де на
          кожному рядку є бейдж, що саме він стосується. */}
      <div className='h-px bg-border' />
      <section className='space-y-3'>
        <h3 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>Конвертація</h3>
        <div className='space-y-3'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <Label htmlFor='oneBrSymbol' className='text-sm inline-flex items-center gap-1.5'>
                Символ одинарного переносу
                <ScopeBadge scope='both' />
              </Label>
              <p className='text-[11px] text-muted-foreground mt-0.5'>Замінюється на один &lt;br&gt; при експорті</p>
            </div>
            <Input
              id='oneBrSymbol'
              value={ui.oneBrSymbol}
              onChange={(e) => setUi((prev) => ({ ...prev, oneBrSymbol: e.target.value }))}
              onBlur={(e) => {
                if (!e.target.value) setUi((prev) => ({ ...prev, oneBrSymbol: DEFAULT_UI_SETTINGS.oneBrSymbol }));
              }}
              maxLength={4}
              className='h-8 w-16 text-xs text-center font-mono'
            />
          </div>
          <Row id='formatHtmlOnDownload'  label='Форматувати HTML при завантаженні' scope='both'     hint='Prettier-відступи у скачаному файлі — лише для читабельності коду, на рендер не впливає' checked={ui.formatHtmlOnDownload} onCheckedChange={(v) => set("formatHtmlOnDownload", v)} />
          <Row id='preserveTextColors'    label='Перенесення кольору тексту'        scope='simple'   badge hint='Експериментально: червоний і зелений текст переноситься у фіксований колір профілю в HTML/MJML; інші кольори (крім посилань) ігноруються, як і зараз' checked={ui.preserveTextColors} onCheckedChange={(v) => set("preserveTextColors", v)} />
          <Row id='detectFontSizeRoles'   label='Визначати розмір тексту за розміром джерела' scope='advanced' badge hint='Дрібний шрифт (напр. дисклеймер) і "фальшиві" заголовки (збільшений розмір без тегу заголовка) визначаються відносно типового розміру тексту документа' checked={ui.detectFontSizeRoles} onCheckedChange={(v) => set("detectFontSizeRoles", v)} />
        </div>
      </section>

      {/* ── Поведінка ──────────────────────────────────────────────────────── */}
      <div className='h-px bg-border' />
      <section className='space-y-3'>
        <h3 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>Поведінка</h3>
        <div className='space-y-3'>
          <Row id='rememberUiLayout'      label='Запамʼятовувати layout'          hint='Вимкни, щоб скидати вигляд при перезавантаженні'   checked={ui.rememberUiLayout}      onCheckedChange={(v) => set("rememberUiLayout", v)} />
          <Row id='autoCloseUploadDialog' label='Авто-закриття після завантаження' checked={ui.autoCloseUploadDialog} onCheckedChange={(v) => set("autoCloseUploadDialog", v)} />
          <Row id='showApproveNeeded'     label='Показувати "Approve Needed"'      checked={ui.showApproveNeeded}     onCheckedChange={(v) => set("showApproveNeeded", v)} />
        </div>
      </section>

      {/* ── Завантаження та збереження (тільки в Electron) ───────────────────
          Папка збереження / спосіб завантаження / шлях до браузера — три різні
          налаштування однієї теми (куди й як йде готовий файл), об'єднані в
          одну секцію замість трьох окремих, щоб не плодити заголовки/розділювачі
          для настільки спорідненого функціоналу. electronAPI.saveToPath() —
          єдиний спосіб записати файл напряму за шляхом; у звичайному браузері
          такого API немає (завжди діалог збереження), тож уся секція там марна. */}
      {electronAPI && (
        <>
          <div className='h-px bg-border' />
          <section className='space-y-4'>
            <h3 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>Завантаження та збереження</h3>

            <div className='space-y-1.5'>
              <Label className='text-sm'>Папка для збереження файлів</Label>
              <div className='flex gap-2 items-center'>
                <Input
                  value={ui.downloadFolder}
                  onChange={(e) => setUi((prev) => ({ ...prev, downloadFolder: e.target.value }))}
                  placeholder='Оберіть папку або введіть шлях...'
                  className='h-8 text-xs flex-1 font-mono'
                />
                <button
                  onClick={async () => {
                    const folder = await electronAPI.openFolderDialog();
                    if (folder) setUi((prev) => ({ ...prev, downloadFolder: folder }));
                  }}
                  className='h-8 px-2 flex items-center gap-1.5 rounded-lg border border-input bg-background hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0'
                  title='Обрати папку'>
                  <FolderOpen size={14} />
                </button>
                {ui.downloadFolder && (
                  <button
                    onClick={() => setUi((prev) => ({ ...prev, downloadFolder: "" }))}
                    className='h-8 px-2 rounded-lg border border-input bg-background hover:bg-destructive/10 hover:text-destructive text-xs text-muted-foreground transition-colors shrink-0'
                    title='Очистити'>
                    ✕
                  </button>
                )}
              </div>
              {!ui.downloadFolder && <p className='text-[11px] text-muted-foreground'>Без папки — файли збережуться через діалог збереження</p>}
            </div>

            <div className='space-y-1.5'>
              <Label className='text-sm'>Спосіб завантаження</Label>
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
            </div>

            {/* Web/dev режим (без electronAPI) на dev-машинах бере шлях напряму з
                automation/config.json — там ця ручна підказка не потрібна, тому
                весь блок і так усередині electronAPI-гарду вище. */}
            {uploadMode === "playwright" && (
              <div className='space-y-1.5'>
                <Label className='text-sm'>Браузер для завантаження (Brave)</Label>
                <div className='flex gap-2 items-center'>
                  <Input
                    value={ui.browserExecutablePath}
                    onChange={(e) => setUi((prev) => ({ ...prev, browserExecutablePath: e.target.value }))}
                    placeholder='Автоматично, або оберіть вручну...'
                    className='h-8 text-xs flex-1 font-mono'
                  />
                  <button
                    onClick={async () => {
                      const filePath = await electronAPI.openFileDialog([{ name: "Brave Browser", extensions: ["exe", "app", "*"] }]);
                      if (filePath) setUi((prev) => ({ ...prev, browserExecutablePath: filePath }));
                    }}
                    className='h-8 px-2 flex items-center gap-1.5 rounded-lg border border-input bg-background hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0'
                    title='Обрати браузер'>
                    <FolderOpen size={14} />
                  </button>
                  {ui.browserExecutablePath && (
                    <button
                      onClick={() => setUi((prev) => ({ ...prev, browserExecutablePath: "" }))}
                      className='h-8 px-2 rounded-lg border border-input bg-background hover:bg-destructive/10 hover:text-destructive text-xs text-muted-foreground transition-colors shrink-0'
                      title='Очистити'>
                      ✕
                    </button>
                  )}
                </div>
                {browserDetectionStatus === "checking" && (
                  <p className='text-[11px] text-muted-foreground'>Перевіряю, чи встановлено Brave...</p>
                )}
                {browserDetectionStatus === "found" && (
                  <p className='text-[11px] text-success'>✓ Brave знайдено автоматично.</p>
                )}
                {browserDetectionStatus === "not-found" && (
                  <p className='text-[11px] text-destructive'>⚠ Браузер не знайдено автоматично — вкажи шлях вручну вище.</p>
                )}
                {browserDetectionStatus === "skipped" && (
                  <p className='text-[11px] text-muted-foreground'>
                    Заповни, якщо Brave не знайдено автоматично — застосунок покаже помилку "Не знайдено браузер Brave", коли шлях невірний.
                  </p>
                )}
              </div>
            )}
          </section>
        </>
      )}

    </div>
  );
};
