import React, { Dispatch, SetStateAction, useCallback,useEffect, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { getApiBase } from "@/config/api";

import { STORAGE_KEYS } from "../constants";
import type { UiSettings } from "../hooks/useHtmlConverterSettings";
import type { ImageAnalysisSettings } from "../types";
import { OCR_PRESETS } from "../utils/ocrPresets";

type ImageSettingsTabProps = {
  ui: UiSettings;
  setUi: Dispatch<SetStateAction<UiSettings>>;
  imageAnalysis: ImageAnalysisSettings;
  setImageAnalysis: Dispatch<SetStateAction<ImageAnalysisSettings>>;
  autoProcess: boolean;
  setAutoProcess: Dispatch<SetStateAction<boolean>>;
  aiBackendStatus: "checking" | "online" | "offline" | "ollama_offline";
};

const OLLAMA_HOST_KEY = "html-converter-ollama-host";
const OLLAMA_MODEL_KEY = "html-converter-ollama-model";
const DEFAULT_OLLAMA_HOST = "http://localhost:11434";
const DEFAULT_MODEL = "gemma3:4b";

type OllamaSettings = {
  temperature: number;
  num_predict: number;
  num_ctx: number;
  prompt: string;
  default_prompt: string;
};

type TestResult = { success: boolean; response?: string; error?: string; latency_ms: number };

export const ImageSettingsTab: React.FC<ImageSettingsTabProps> = ({ ui, setUi, imageAnalysis, setImageAnalysis, autoProcess, setAutoProcess, aiBackendStatus }) => {
  const [ollamaHost, setOllamaHost] = useState<string>(() => {
    try { return localStorage.getItem(OLLAMA_HOST_KEY) || DEFAULT_OLLAMA_HOST; } catch { return DEFAULT_OLLAMA_HOST; }
  });
  const [ollamaModel, setOllamaModel] = useState<string>(() => {
    try { return localStorage.getItem(OLLAMA_MODEL_KEY) || DEFAULT_MODEL; } catch { return DEFAULT_MODEL; }
  });
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [ollamaSettings, setOllamaSettings] = useState<OllamaSettings>({
    temperature: 0.1,
    num_predict: 64,
    num_ctx: 1024,
    prompt: "",
    default_prompt: "",
  });
  const [ollamaSaveStatus, setOllamaSaveStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [showModelParams, setShowModelParams] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing">("idle");
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const fetchModelsAndSettings = useCallback(async () => {
    try {
      const [modelsRes, settingsRes] = await Promise.all([
        fetch(`${getApiBase()}/ai-api/api/models`),
        fetch(`${getApiBase()}/ai-api/api/settings`),
      ]);
      if (modelsRes.ok) {
        const data = await modelsRes.json();
        setAvailableModels(data.models || []);
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setOllamaSettings({
          temperature: data.temperature ?? 0.1,
          num_predict: data.num_predict ?? 64,
          num_ctx: data.num_ctx ?? 1024,
          prompt: data.prompt ?? "",
          default_prompt: data.default_prompt ?? "",
        });
        if (data.model) {
          setOllamaModel(data.model);
          localStorage.setItem(OLLAMA_MODEL_KEY, data.model);
        }
      }
    } catch {
      // backend not available yet
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(OLLAMA_HOST_KEY, ollamaHost);
  }, [ollamaHost]);

  useEffect(() => {
    localStorage.setItem(OLLAMA_MODEL_KEY, ollamaModel);
  }, [ollamaModel]);

  useEffect(() => {
    if (imageAnalysis.useAiBackend) fetchModelsAndSettings();
  }, [imageAnalysis.useAiBackend, fetchModelsAndSettings]);

  const handleSaveOllamaSettings = async () => {
    setOllamaSaveStatus("saving");
    try {
      const res = await fetch(`${getApiBase()}/ai-api/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ollama_host: ollamaHost.trim(),
          model: ollamaModel,
          temperature: ollamaSettings.temperature,
          num_predict: ollamaSettings.num_predict,
          num_ctx: ollamaSettings.num_ctx,
          prompt: ollamaSettings.prompt,
        }),
      });
      setOllamaSaveStatus(res.ok ? "ok" : "error");
    } catch {
      setOllamaSaveStatus("error");
    }
    setTimeout(() => setOllamaSaveStatus("idle"), 2500);
  };

  const handleTestModel = async () => {
    setTestStatus("testing");
    setTestResult(null);
    try {
      const res = await fetch(`${getApiBase()}/ai-api/api/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: ollamaModel }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ success: false, error: String(err), latency_ms: 0 });
    }
    setTestStatus("idle");
  };

  const handleAutoProcessChange = (checked: boolean) => {
    setAutoProcess(checked);
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.IMAGE_SETTINGS);
      const settings = stored ? JSON.parse(stored) : {};
      settings.autoProcess = checked;
      localStorage.setItem(STORAGE_KEYS.IMAGE_SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  };

  const statusColor = {
    online: "#10B981",
    ollama_offline: "#F97316",
    checking: "#F59E0B",
    offline: "#EF4444",
  }[aiBackendStatus];

  const statusLabel = {
    online: "Підключено",
    ollama_offline: "Ollama не запущена",
    checking: "Перевірка...",
    offline: "Недоступно",
  }[aiBackendStatus];

  const handleClearCache = async () => {
    try {
      await fetch(`${getApiBase()}/ai-api/api/cache`, { method: "DELETE" });
    } catch { /* non-fatal */ }
    setImageAnalysis((prev) => ({ ...prev, _cacheBust: Date.now() }));
  };

  return (
    <div className='flex flex-col gap-5'>

      {/* ── Зображення ─────────────────────────────────────────────────────── */}
      <section className='space-y-3'>
        <h3 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>Зображення</h3>
        <div className='flex items-center justify-between'>
          <Label htmlFor='autoProcess' className='text-sm cursor-pointer'>Авто-оптимізація формату і розміру</Label>
          <Switch id='autoProcess' checked={autoProcess} onCheckedChange={handleAutoProcessChange} />
        </div>
      </section>

      <div className='h-px bg-border' />

      {/* ── Розпізнавання тексту ───────────────────────────────────────────── */}
      <section className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>Розпізнавання тексту</h3>
            <p className='text-[12px] text-muted-foreground mt-0.5'>ALT-текст і назви файлів при завантаженні</p>
          </div>
          <Switch id='enableOcr' checked={imageAnalysis.enabled} onCheckedChange={(c) => setImageAnalysis((prev) => ({ ...prev, enabled: c }))} />
        </div>

        {imageAnalysis.enabled && (
          <div className='space-y-3'>

            {/* Авто-режим */}
            <div className='flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30'>
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='autoAnalyze'
                  disabled={imageAnalysis.engine !== "ocr" && !imageAnalysis.useAiBackend}
                  checked={imageAnalysis.runMode === "auto"}
                  onCheckedChange={(c) => setImageAnalysis((prev) => ({ ...prev, runMode: c ? "auto" : "manual" }))}
                />
                <Label htmlFor='autoAnalyze' className='text-sm cursor-pointer'>Авто-аналіз при відкритті</Label>
              </div>
              <div className='flex items-center gap-1.5'>
                <Input
                  type='number' min='0' max='50'
                  disabled={imageAnalysis.runMode !== "auto"}
                  value={imageAnalysis.autoAnalyzeMaxFiles}
                  onChange={(e) => {
                    const n = Number(e.target.value || 0);
                    setImageAnalysis((prev) => ({ ...prev, autoAnalyzeMaxFiles: Number.isFinite(n) ? Math.max(0, Math.min(50, n)) : 0 }));
                  }}
                  className='h-7 w-14 text-xs text-center'
                />
                <span className='text-xs text-muted-foreground'>файлів</span>
              </div>
            </div>

            {/* ── Tesseract ───────────────────────────────────────────────── */}
            <div className='rounded-lg border border-border/60 overflow-hidden'>
              <div className='flex items-center justify-between px-3 py-2.5 bg-muted/20'>
                <span className='text-sm font-medium'>Tesseract.js</span>
                <Switch
                  checked={imageAnalysis.engine === "ocr"}
                  onCheckedChange={(c) => setImageAnalysis((prev) => ({ ...prev, engine: c ? "ocr" : "off" }))}
                />
              </div>

              {imageAnalysis.engine === "ocr" && (
                <div className='px-3 pb-3 pt-2 space-y-3 border-t border-border/40'>
                  <Select
                    value={ui.ocrSimpleMode}
                    onValueChange={(v) => {
                      setUi((prev) => ({ ...prev, ocrSimpleMode: v as UiSettings["ocrSimpleMode"] }));
                      if (v !== "custom" && OCR_PRESETS[v]) setImageAnalysis((prev) => ({ ...prev, ...OCR_PRESETS[v] }));
                    }}>
                    <SelectTrigger className='h-8 text-xs'>
                      <SelectValue placeholder='Виберіть режим' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='custom'>Власні налаштування</SelectItem>
                      <SelectItem value='fast'>Швидко (CPU легкий)</SelectItem>
                      <SelectItem value='balanced'>Збалансовано (рекомендовано)</SelectItem>
                      <SelectItem value='banner'>Банер з текстом (найточніше)</SelectItem>
                      <SelectItem value='max'>Максимальна якість (повільно)</SelectItem>
                    </SelectContent>
                  </Select>

                  <button
                    onClick={() => setUi((prev) => ({ ...prev, showAdvancedOcrSettings: !prev.showAdvancedOcrSettings }))}
                    className='flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full'>
                    <span>{ui.showAdvancedOcrSettings ? "▾" : "▸"}</span>
                    Розширені налаштування OCR
                  </button>

                  {ui.showAdvancedOcrSettings && (
                    <div className='space-y-5 pt-1'>
                      {/* Width range */}
                      <div className='grid grid-cols-2 gap-3'>
                        <div className='space-y-1.5'>
                          <Label className='text-xs'>Мін. ширина: {imageAnalysis.ocrMinWidth}px</Label>
                          <Slider min={0} max={1600} step={50} value={[imageAnalysis.ocrMinWidth]}
                            onValueChange={([v]) => setImageAnalysis((prev) => ({ ...prev, ocrMinWidth: v }))} />
                        </div>
                        <div className='space-y-1.5'>
                          <Label className='text-xs'>Макс. ширина: {imageAnalysis.ocrMaxWidth}px</Label>
                          <Slider min={600} max={2000} step={50} value={[imageAnalysis.ocrMaxWidth]}
                            onValueChange={([v]) => setImageAnalysis((prev) => ({ ...prev, ocrMaxWidth: v }))} />
                        </div>
                      </div>

                      <div className='h-px bg-border/50' />

                      {/* Smart precheck */}
                      <div className='space-y-2'>
                        <div className='flex items-center gap-2'>
                          <Checkbox id='smartPrecheck' checked={imageAnalysis.smartPrecheck}
                            onCheckedChange={(c) => setImageAnalysis((prev) => ({ ...prev, smartPrecheck: !!c }))} />
                          <Label htmlFor='smartPrecheck' className='text-xs cursor-pointer'>Smart precheck — пропускати OCR якщо тексту немає</Label>
                        </div>
                        {imageAnalysis.smartPrecheck && (
                          <div className='pl-6 space-y-3'>
                            <div className='space-y-1.5'>
                              <Label className='text-xs'>Поріг тексту: {imageAnalysis.textLikelihoodThreshold.toFixed(3)}</Label>
                              <Slider min={0.02} max={0.18} step={0.005} value={[imageAnalysis.textLikelihoodThreshold]}
                                onValueChange={([v]) => setImageAnalysis((prev) => ({ ...prev, textLikelihoodThreshold: v }))} />
                            </div>
                            <div className='space-y-1.5'>
                              <Label className='text-xs'>Edge threshold: {imageAnalysis.precheckEdgeThreshold}</Label>
                              <Slider min={30} max={140} step={5} value={[imageAnalysis.precheckEdgeThreshold]}
                                onValueChange={([v]) => setImageAnalysis((prev) => ({ ...prev, precheckEdgeThreshold: v }))} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className='h-px bg-border/50' />

                      {/* Preprocess */}
                      <div className='space-y-2'>
                        <div className='flex items-center gap-2'>
                          <Checkbox id='preprocess' checked={imageAnalysis.preprocess}
                            onCheckedChange={(c) => setImageAnalysis((prev) => ({ ...prev, preprocess: !!c }))} />
                          <Label htmlFor='preprocess' className='text-xs cursor-pointer'>Preprocess (grayscale / contrast / threshold)</Label>
                        </div>
                        {imageAnalysis.preprocess && (
                          <div className='pl-6 space-y-4'>
                            <div className='grid grid-cols-2 gap-3'>
                              <div className='space-y-1.5'>
                                <Label className='text-xs'>PSM</Label>
                                <Select value={imageAnalysis.ocrPsm} onValueChange={(v) => setImageAnalysis((prev) => ({ ...prev, ocrPsm: v as ImageAnalysisSettings["ocrPsm"] }))}>
                                  <SelectTrigger className='h-7 text-xs'><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value='11'>11 — Sparse (банери)</SelectItem>
                                    <SelectItem value='6'>6 — Single block</SelectItem>
                                    <SelectItem value='7'>7 — Single line</SelectItem>
                                    <SelectItem value='8'>8 — Single word</SelectItem>
                                    <SelectItem value='4'>4 — Column</SelectItem>
                                    <SelectItem value='3'>3 — Auto</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className='space-y-1.5'>
                                <Label className='text-xs'>Scale</Label>
                                <Select value={String(imageAnalysis.ocrScaleFactor)} onValueChange={(v) => setImageAnalysis((prev) => ({ ...prev, ocrScaleFactor: Number(v) }))}>
                                  <SelectTrigger className='h-7 text-xs'><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value='1'>1×</SelectItem>
                                    <SelectItem value='2'>2× (+точність)</SelectItem>
                                    <SelectItem value='3'>3×</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className='grid grid-cols-2 gap-3'>
                              <div className='space-y-1.5'>
                                <Label className='text-xs'>Contrast: {imageAnalysis.preprocessContrast.toFixed(1)}×</Label>
                                <Slider min={1} max={3} step={0.1} value={[imageAnalysis.preprocessContrast]}
                                  onValueChange={([v]) => setImageAnalysis((prev) => ({ ...prev, preprocessContrast: v }))} />
                              </div>
                              <div className='space-y-1.5'>
                                <Label className='text-xs'>Brightness: {imageAnalysis.preprocessBrightness.toFixed(2)}×</Label>
                                <Slider min={0.8} max={1.4} step={0.02} value={[imageAnalysis.preprocessBrightness]}
                                  onValueChange={([v]) => setImageAnalysis((prev) => ({ ...prev, preprocessBrightness: v }))} />
                              </div>
                            </div>
                            <div className='space-y-2'>
                              <div className='flex items-center gap-2'>
                                <Checkbox id='useThreshold' checked={imageAnalysis.preprocessUseThreshold}
                                  onCheckedChange={(c) => setImageAnalysis((prev) => ({ ...prev, preprocessUseThreshold: !!c }))} />
                                <Label htmlFor='useThreshold' className='text-xs cursor-pointer'>Threshold (binarize)</Label>
                              </div>
                              {imageAnalysis.preprocessUseThreshold && (
                                <div className='pl-6 space-y-1.5'>
                                  <Label className='text-xs'>Threshold: {imageAnalysis.preprocessThreshold}</Label>
                                  <Slider min={0} max={255} step={5} value={[imageAnalysis.preprocessThreshold]}
                                    onValueChange={([v]) => setImageAnalysis((prev) => ({ ...prev, preprocessThreshold: v }))} />
                                </div>
                              )}
                            </div>
                            <div className='space-y-2'>
                              <div className='flex items-center gap-2'>
                                <Checkbox id='blur' checked={imageAnalysis.preprocessBlur}
                                  onCheckedChange={(c) => setImageAnalysis((prev) => ({ ...prev, preprocessBlur: !!c }))} />
                                <Label htmlFor='blur' className='text-xs cursor-pointer'>Blur (reduce noise)</Label>
                              </div>
                              {imageAnalysis.preprocessBlur && (
                                <div className='pl-6 space-y-1.5'>
                                  <Label className='text-xs'>Blur radius: {imageAnalysis.preprocessBlurRadius}</Label>
                                  <Slider min={1} max={3} step={1} value={[imageAnalysis.preprocessBlurRadius]}
                                    onValueChange={([v]) => setImageAnalysis((prev) => ({ ...prev, preprocessBlurRadius: v }))} />
                                </div>
                              )}
                            </div>
                            <div className='flex items-center gap-2'>
                              <Checkbox id='sharpen' checked={imageAnalysis.preprocessSharpen}
                                onCheckedChange={(c) => setImageAnalysis((prev) => ({ ...prev, preprocessSharpen: !!c }))} />
                              <Label htmlFor='sharpen' className='text-xs cursor-pointer'>Sharpen (edge enhance)</Label>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className='h-px bg-border/50' />

                      {/* Area + Whitelist */}
                      <div className='grid grid-cols-2 gap-3'>
                        <div className='space-y-1.5'>
                          <Label className='text-xs'>Область (crop)</Label>
                          <Select value={imageAnalysis.roiPreset}
                            onValueChange={(p: string) => {
                              const preset = p as ImageAnalysisSettings["roiPreset"];
                              setImageAnalysis((prev) => {
                                if (preset === "full") return { ...prev, roiEnabled: false, roiPreset: preset, roiX: 0, roiY: 0, roiW: 1, roiH: 1 };
                                if (preset === "auto") return { ...prev, roiEnabled: true, roiPreset: preset, roiX: 0, roiY: 0, roiW: 1, roiH: 1 };
                                if (preset === "top60") return { ...prev, roiEnabled: true, roiPreset: preset, roiX: 0, roiY: 0, roiW: 1, roiH: 0.6 };
                                if (preset === "top60_left70") return { ...prev, roiEnabled: true, roiPreset: preset, roiX: 0, roiY: 0, roiW: 0.7, roiH: 0.6 };
                                return { ...prev, roiEnabled: true, roiPreset: preset };
                              });
                            }}>
                            <SelectTrigger className='h-7 text-xs'><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value='full'>Повне зображення</SelectItem>
                              <SelectItem value='auto'>Auto detect</SelectItem>
                              <SelectItem value='top60'>Верхні 60%</SelectItem>
                              <SelectItem value='top60_left70'>Верх 60% + Ліво 70%</SelectItem>
                              <SelectItem value='custom'>Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className='space-y-1.5'>
                          <Label className='text-xs'>Whitelist</Label>
                          <Input className='h-7 text-xs font-mono' placeholder='A-Z 0-9...'
                            value={imageAnalysis.ocrWhitelist}
                            onChange={(e) => setImageAnalysis((prev) => ({ ...prev, ocrWhitelist: e.target.value }))} />
                        </div>
                      </div>
                      {imageAnalysis.roiPreset === "custom" && imageAnalysis.roiEnabled && (
                        <div className='space-y-1.5'>
                          <Label className='text-xs text-muted-foreground'>ROI (0..1): X Y W H</Label>
                          <div className='grid grid-cols-4 gap-1.5'>
                            <Input type='number' step='0.05' min='0' max='1' placeholder='X' className='h-7 text-xs text-center' value={imageAnalysis.roiX} onChange={(e) => setImageAnalysis((prev) => ({ ...prev, roiX: Number(e.target.value) }))} />
                            <Input type='number' step='0.05' min='0' max='1' placeholder='Y' className='h-7 text-xs text-center' value={imageAnalysis.roiY} onChange={(e) => setImageAnalysis((prev) => ({ ...prev, roiY: Number(e.target.value) }))} />
                            <Input type='number' step='0.05' min='0.1' max='1' placeholder='W' className='h-7 text-xs text-center' value={imageAnalysis.roiW} onChange={(e) => setImageAnalysis((prev) => ({ ...prev, roiW: Number(e.target.value) }))} />
                            <Input type='number' step='0.05' min='0.1' max='1' placeholder='H' className='h-7 text-xs text-center' value={imageAnalysis.roiH} onChange={(e) => setImageAnalysis((prev) => ({ ...prev, roiH: Number(e.target.value) }))} />
                          </div>
                        </div>
                      )}
                      <div className='flex items-center gap-2'>
                        <Checkbox id='spellCorrection' checked={imageAnalysis.spellCorrectionBanner}
                          onCheckedChange={(c) => setImageAnalysis((prev) => ({ ...prev, spellCorrectionBanner: !!c }))} />
                        <Label htmlFor='spellCorrection' className='text-xs cursor-pointer'>Spell correction (banner/CTA)</Label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Ollama AI ───────────────────────────────────────────────── */}
            <div className='rounded-lg border border-border/60 overflow-hidden'>
              <div className='flex items-center justify-between px-3 py-2.5 bg-muted/20'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium'>Ollama AI</span>
                  {imageAnalysis.useAiBackend && (
                    <span
                      className='flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full border'
                      style={{ color: statusColor, borderColor: `${statusColor}40`, backgroundColor: `${statusColor}10` }}>
                      <span className='w-1.5 h-1.5 rounded-full inline-block' style={{ backgroundColor: statusColor }} />
                      {statusLabel}
                    </span>
                  )}
                </div>
                <Switch id='useAiBackend' checked={imageAnalysis.useAiBackend || false}
                  onCheckedChange={(c) => setImageAnalysis((prev) => ({ ...prev, useAiBackend: c }))} />
              </div>

              {imageAnalysis.useAiBackend && (
                <div className='px-3 pb-3 pt-3 space-y-3 border-t border-border/40'>

                  {aiBackendStatus === "ollama_offline" && (
                    <div className='flex items-center gap-2 px-3 py-2 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[12px]'>
                      Запусти застосунок Ollama на цьому комп'ютері
                    </div>
                  )}

                  {/* URL + Model */}
                  <div className='grid grid-cols-[1fr_auto] gap-2 items-end'>
                    <div className='space-y-1.5'>
                      <Label className='text-xs text-muted-foreground'>Ollama URL</Label>
                      <Input className='h-8 text-xs font-mono' value={ollamaHost}
                        onChange={(e) => setOllamaHost(e.target.value)}
                        placeholder='http://localhost:11434' />
                    </div>
                    <button onClick={handleTestModel} disabled={testStatus === "testing" || aiBackendStatus === "ollama_offline"}
                      className='h-8 px-3 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent transition-all disabled:opacity-40 whitespace-nowrap'>
                      {testStatus === "testing" ? "..." : "Тест"}
                    </button>
                  </div>

                  <div className='flex gap-2'>
                    <Select value={ollamaModel} onValueChange={setOllamaModel}>
                      <SelectTrigger className='h-8 text-xs flex-1'>
                        <SelectValue placeholder='Виберіть модель' />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.length > 0
                          ? availableModels.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)
                          : <SelectItem value={ollamaModel}>{ollamaModel}</SelectItem>}
                      </SelectContent>
                    </Select>
                    <button onClick={fetchModelsAndSettings} title='Оновити список'
                      className='h-8 w-8 text-sm rounded-md border border-input bg-background hover:bg-accent transition-all shrink-0'>
                      ↻
                    </button>
                  </div>

                  {testResult && (
                    <div className={`px-2.5 py-2 rounded-md text-[11px] font-mono border ${testResult.success ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400" : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"}`}>
                      {testResult.success
                        ? <><span className='font-bold'>OK</span> · {testResult.latency_ms}ms — <span className='opacity-70'>{testResult.response}</span></>
                        : <><span className='font-bold'>Помилка:</span> {testResult.error}</>}
                    </div>
                  )}

                  {/* Generation params */}
                  <button onClick={() => setShowModelParams((v) => !v)}
                    className='flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full pt-1'>
                    <span>{showModelParams ? "▾" : "▸"}</span> Параметри генерації
                  </button>
                  {showModelParams && (
                    <div className='space-y-3 pl-3 border-l-2 border-border/30'>
                      <div className='space-y-1.5'>
                        <div className='flex justify-between'>
                          <Label className='text-xs'>Temperature</Label>
                          <span className='text-xs text-muted-foreground'>{ollamaSettings.temperature.toFixed(2)}</span>
                        </div>
                        <Slider min={0} max={1} step={0.01} value={[ollamaSettings.temperature]}
                          onValueChange={([v]) => setOllamaSettings((p) => ({ ...p, temperature: v }))} />
                        <p className='text-[10px] text-muted-foreground'>0 = стабільно, 1 = творчо</p>
                      </div>
                      <div className='grid grid-cols-2 gap-3'>
                        <div className='space-y-1.5'>
                          <div className='flex justify-between'>
                            <Label className='text-xs'>Max tokens</Label>
                            <span className='text-xs text-muted-foreground'>{ollamaSettings.num_predict}</span>
                          </div>
                          <Slider min={16} max={512} step={8} value={[ollamaSettings.num_predict]}
                            onValueChange={([v]) => setOllamaSettings((p) => ({ ...p, num_predict: v }))} />
                        </div>
                        <div className='space-y-1.5'>
                          <div className='flex justify-between'>
                            <Label className='text-xs'>Context</Label>
                            <span className='text-xs text-muted-foreground'>{ollamaSettings.num_ctx}</span>
                          </div>
                          <Slider min={512} max={8192} step={256} value={[ollamaSettings.num_ctx]}
                            onValueChange={([v]) => setOllamaSettings((p) => ({ ...p, num_ctx: v }))} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Prompt editor */}
                  <button onClick={() => setShowPromptEditor((v) => !v)}
                    className='flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full'>
                    <span>{showPromptEditor ? "▾" : "▸"}</span> Системний промпт
                  </button>
                  {showPromptEditor && (
                    <div className='space-y-2'>
                      <textarea
                        className='w-full h-28 text-[11px] font-mono rounded-md border border-input bg-background px-2.5 py-2 resize-y focus:outline-none focus:ring-1 focus:ring-ring'
                        value={ollamaSettings.prompt}
                        onChange={(e) => setOllamaSettings((p) => ({ ...p, prompt: e.target.value }))}
                        placeholder={ollamaSettings.default_prompt}
                        spellCheck={false}
                      />
                      <button onClick={() => setOllamaSettings((p) => ({ ...p, prompt: p.default_prompt }))}
                        className='text-[11px] text-muted-foreground hover:text-foreground underline transition-colors'>
                        Скинути до стандартного
                      </button>
                    </div>
                  )}

                  {/* Save */}
                  <button onClick={handleSaveOllamaSettings} disabled={ollamaSaveStatus === "saving"}
                    className='w-full h-8 text-xs font-semibold rounded-md border border-input bg-background hover:bg-accent transition-all disabled:opacity-50 mt-1'>
                    {ollamaSaveStatus === "saving" ? "Збереження..." : ollamaSaveStatus === "ok" ? "✓ Збережено" : ollamaSaveStatus === "error" ? "✗ Помилка" : "Зберегти налаштування Ollama"}
                  </button>

                </div>
              )}

              {!imageAnalysis.useAiBackend && (
                <p className='px-3 pb-2.5 text-[11px] text-muted-foreground'>Генерація ALT-тексту і назв через локальну LLM</p>
              )}
            </div>

            {/* ── Кеш ─────────────────────────────────────────────────────── */}
            <div className='flex items-center justify-between pt-1'>
              <span className='text-xs text-muted-foreground'>Кеш аналізу</span>
              <button id='clearCacheBtn' onClick={handleClearCache}
                className='text-xs text-muted-foreground hover:text-foreground underline transition-colors'>
                Очистити
              </button>
            </div>

          </div>
        )}
      </section>

    </div>
  );
};
