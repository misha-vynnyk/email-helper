import React, { Dispatch, SetStateAction } from "react";
import { STORAGE_KEYS } from "../constants";
import type { ImageAnalysisSettings } from "../types";
import type { UiSettings } from "../hooks/useHtmlConverterSettings";
import { OCR_PRESETS } from "../ocrPresets";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ImageSettingsTabProps = {
  ui: UiSettings;
  setUi: Dispatch<SetStateAction<UiSettings>>;
  imageAnalysis: ImageAnalysisSettings;
  setImageAnalysis: Dispatch<SetStateAction<ImageAnalysisSettings>>;
  autoProcess: boolean;
  setAutoProcess: Dispatch<SetStateAction<boolean>>;
  aiBackendStatus: "checking" | "online" | "offline";
};

export const ImageSettingsTab: React.FC<ImageSettingsTabProps> = ({ ui, setUi, imageAnalysis, setImageAnalysis, autoProcess, setAutoProcess, aiBackendStatus }) => {
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

  return (
    <div className='flex flex-col gap-6'>
      <div className='space-y-4'>
        <h3 className='text-sm font-semibold tracking-tight'>Зображення</h3>
        <div className='flex items-center space-x-2'>
          <Checkbox id='autoProcess' checked={autoProcess} onCheckedChange={handleAutoProcessChange} />
          <Label htmlFor='autoProcess' className='text-sm font-medium leading-none'>
            Автообробка зображень
          </Label>
        </div>
      </div>

      <div className='h-px bg-border my-2' />

      <div className='space-y-4'>
        <div>
          <h3 className='text-sm font-semibold tracking-tight mb-1'>Розпізнавання тексту на зображеннях (ALT/назви)</h3>
          <p className='text-[13px] text-muted-foreground'>Працює в діалозі «Upload to Storage». Якщо не хочеш думати — вибери режим нижче.</p>
        </div>

        <div className='flex items-center justify-between'>
          <Label htmlFor='enableOcr' className='text-sm font-medium leading-none'>
            Увімкнути розпізнавання тексту
          </Label>
          <Switch id='enableOcr' checked={imageAnalysis.enabled} onCheckedChange={(c) => setImageAnalysis((prev) => ({ ...prev, enabled: c }))} />
        </div>

        <div className='space-y-2'>
          <Label>Режим (простий вибір)</Label>
          <Select
            disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
            value={ui.ocrSimpleMode}
            onValueChange={(v) => {
              setUi((prev) => ({ ...prev, ocrSimpleMode: v as UiSettings["ocrSimpleMode"] }));
              if (v !== "custom" && OCR_PRESETS[v]) {
                setImageAnalysis((prev) => ({ ...prev, ...OCR_PRESETS[v] }));
              }
            }}>
            <SelectTrigger>
              <SelectValue placeholder='Виберіть режим' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='custom'>Не вибрано</SelectItem>
              <SelectItem value='fast'>Швидко (економно)</SelectItem>
              <SelectItem value='balanced'>Звичайно (рекомендовано)</SelectItem>
              <SelectItem value='banner'>Банер з текстом (найкраще)</SelectItem>
              <SelectItem value='max'>Максимальна якість (повільно)</SelectItem>
            </SelectContent>
          </Select>
          <p className='text-[12px] text-muted-foreground'>Швидко = легше для ноутбука. Банер = найкраще для картинок з великим текстом. Максимально = повільніше.</p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label>Інструмент аналізу</Label>
            <Select disabled={!imageAnalysis.enabled} value={imageAnalysis.engine} onValueChange={(v) => setImageAnalysis((prev) => ({ ...prev, engine: v as ImageAnalysisSettings["engine"] }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='off'>Вимкнено</SelectItem>
                <SelectItem value='ocr'>Tesseract.js (Browser)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-col justify-center gap-1.5 p-3 rounded-xl border border-border/50 bg-muted/20'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='useAiBackend' className='text-sm font-bold flex items-center gap-2 cursor-pointer'>
                AI Backend 🐍
                {imageAnalysis.useAiBackend && (
                  <div
                    title={aiBackendStatus === "online" ? "Сервер працює" : aiBackendStatus === "checking" ? "Перевірка..." : "Сервер не доступний"}
                    className='w-2 h-2 rounded-full'
                    style={{
                      backgroundColor: aiBackendStatus === "online" ? "#10B981" : aiBackendStatus === "checking" ? "#F59E0B" : "#EF4444",
                      animation: aiBackendStatus === "checking" ? "pulse 1s infinite" : "none",
                    }}
                  />
                )}
              </Label>
              <Switch id='useAiBackend' checked={imageAnalysis.useAiBackend || false} onCheckedChange={(c) => setImageAnalysis((prev) => ({ ...prev, useAiBackend: c }))} />
            </div>
            <p className='text-[11px] text-muted-foreground'>PaddleOCR + BLIP + CLIP</p>
          </div>
        </div>

        <div className='space-y-2'>
          <Label>Запуск</Label>
          <Select disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} value={imageAnalysis.runMode} onValueChange={(v) => setImageAnalysis((prev) => ({ ...prev, runMode: v as ImageAnalysisSettings["runMode"] }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='manual'>Тільки вручну</SelectItem>
              <SelectItem value='auto'>Автоматично (обережно)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Alert className='bg-primary/5 border-primary/20 text-foreground'>
          <AlertDescription>Підстановка ALT та назв файлів виконується лише вручну.</AlertDescription>
        </Alert>

        <div className='flex items-center space-x-2 mt-2'>
          <Checkbox id='advancedOcrSettings' disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} checked={ui.showAdvancedOcrSettings} onCheckedChange={(c) => setUi((prev) => ({ ...prev, showAdvancedOcrSettings: !!c }))} />
          <Label htmlFor='advancedOcrSettings' className='text-sm font-medium leading-none'>
            Показати розширені налаштування
          </Label>
        </div>

        {!ui.showAdvancedOcrSettings && (
          <Alert className='bg-muted border-border/50 text-muted-foreground mt-2'>
            <AlertDescription>Якщо щось розпізнається погано — вибери «Банер з текстом». Якщо ноут слабкий — «Швидко».</AlertDescription>
          </Alert>
        )}

        {ui.showAdvancedOcrSettings && (
          <div className='mt-4 space-y-6 pt-4 border-t border-border/50'>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label className='font-semibold'>OCR min width: {imageAnalysis.ocrMinWidth}px</Label>
              </div>
              <p className='text-[12px] text-muted-foreground -mt-1'>Якщо картинка маленька — збільшимо перед OCR (часто сильно покращує точність).</p>
              <div className='pt-2'>
                <Slider disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} min={0} max={1600} step={50} value={[imageAnalysis.ocrMinWidth]} onValueChange={([v]) => setImageAnalysis((prev) => ({ ...prev, ocrMinWidth: v }))} />
              </div>
            </div>

            <div className='space-y-3'>
              <Label className='font-semibold'>OCR max width: {imageAnalysis.ocrMaxWidth}px</Label>
              <div className='pt-2'>
                <Slider disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} min={600} max={2000} step={50} value={[imageAnalysis.ocrMaxWidth]} onValueChange={([v]) => setImageAnalysis((prev) => ({ ...prev, ocrMaxWidth: v }))} />
              </div>
            </div>

            <div className='h-px bg-border my-2' />

            <div className='flex items-center space-x-2'>
              <Checkbox id='smartPrecheck' disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} checked={imageAnalysis.smartPrecheck} onCheckedChange={(c) => setImageAnalysis((prev) => ({ ...prev, smartPrecheck: !!c }))} />
              <Label htmlFor='smartPrecheck' className='text-sm font-medium leading-none'>
                Smart precheck (пропускати OCR якщо текст малоймовірний)
              </Label>
            </div>

            {imageAnalysis.smartPrecheck && (
              <div className='pl-6 space-y-6 border-l-2 border-border/30 ml-2'>
                <div className='space-y-3'>
                  <Label className='font-semibold'>Text likelihood threshold: {imageAnalysis.textLikelihoodThreshold.toFixed(3)}</Label>
                  <p className='text-[12px] text-muted-foreground -mt-1'>Нижче = OCR запускається частіше. Вище = економить CPU, але може пропускати текст.</p>
                  <div className='pt-2'>
                    <Slider disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} min={0.02} max={0.18} step={0.005} value={[imageAnalysis.textLikelihoodThreshold]} onValueChange={([v]) => setImageAnalysis((prev) => ({ ...prev, textLikelihoodThreshold: v }))} />
                  </div>
                </div>
                <div className='space-y-3'>
                  <Label className='font-semibold'>Precheck edge threshold: {imageAnalysis.precheckEdgeThreshold}</Label>
                  <p className='text-[12px] text-muted-foreground -mt-1'>Чутливість до дрібних контрастних контурів (текст).</p>
                  <div className='pt-2'>
                    <Slider disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} min={30} max={140} step={5} value={[imageAnalysis.precheckEdgeThreshold]} onValueChange={([v]) => setImageAnalysis((prev) => ({ ...prev, precheckEdgeThreshold: v }))} />
                  </div>
                </div>
              </div>
            )}

            <div className='h-px bg-border my-2' />

            <div className='flex items-center space-x-2'>
              <Checkbox id='preprocess' disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} checked={imageAnalysis.preprocess} onCheckedChange={(c) => setImageAnalysis((prev) => ({ ...prev, preprocess: !!c }))} />
              <Label htmlFor='preprocess' className='text-sm font-medium leading-none'>
                Preprocess перед OCR (grayscale/contrast/threshold)
              </Label>
            </div>

            {imageAnalysis.preprocess && (
              <div className='pl-6 space-y-6 border-l-2 border-border/30 ml-2'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>PSM (page segmentation)</Label>
                    <Select disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} value={imageAnalysis.ocrPsm} onValueChange={(v) => setImageAnalysis((prev) => ({ ...prev, ocrPsm: v as ImageAnalysisSettings["ocrPsm"] }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='11'>11 — Sparse text (банери/UI)</SelectItem>
                        <SelectItem value='6'>6 — Single block</SelectItem>
                        <SelectItem value='7'>7 — Single line</SelectItem>
                        <SelectItem value='8'>8 — Single word</SelectItem>
                        <SelectItem value='4'>4 — Single column</SelectItem>
                        <SelectItem value='3'>3 — Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label>Scale factor</Label>
                    <Select disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} value={String(imageAnalysis.ocrScaleFactor)} onValueChange={(v) => setImageAnalysis((prev) => ({ ...prev, ocrScaleFactor: Number(v) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='1'>1×</SelectItem>
                        <SelectItem value='2'>2×</SelectItem>
                        <SelectItem value='3'>3×</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className='text-[11px] text-muted-foreground'>2× часто дає +точність, але важче для CPU</p>
                  </div>
                </div>

                <div className='space-y-3'>
                  <Label className='font-semibold'>Contrast: {imageAnalysis.preprocessContrast.toFixed(1)}×</Label>
                  <div className='pt-2'>
                    <Slider disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} min={1} max={3} step={0.1} value={[imageAnalysis.preprocessContrast]} onValueChange={([v]) => setImageAnalysis((prev) => ({ ...prev, preprocessContrast: v }))} />
                  </div>
                </div>

                <div className='space-y-3'>
                  <Label className='font-semibold'>Brightness: {imageAnalysis.preprocessBrightness.toFixed(2)}×</Label>
                  <div className='pt-2'>
                    <Slider disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} min={0.8} max={1.4} step={0.02} value={[imageAnalysis.preprocessBrightness]} onValueChange={([v]) => setImageAnalysis((prev) => ({ ...prev, preprocessBrightness: v }))} />
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  <Checkbox id='useThreshold' disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} checked={imageAnalysis.preprocessUseThreshold} onCheckedChange={(c) => setImageAnalysis((prev) => ({ ...prev, preprocessUseThreshold: !!c }))} />
                  <Label htmlFor='useThreshold' className='text-sm font-medium'>
                    Threshold (binarize)
                  </Label>
                </div>

                {imageAnalysis.preprocessUseThreshold && (
                  <div className='pl-6 space-y-3 border-l-2 border-border/30 ml-2'>
                    <Label className='font-semibold'>Threshold: {imageAnalysis.preprocessThreshold}</Label>
                    <div className='pt-2'>
                      <Slider disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} min={0} max={255} step={5} value={[imageAnalysis.preprocessThreshold]} onValueChange={([v]) => setImageAnalysis((prev) => ({ ...prev, preprocessThreshold: v }))} />
                    </div>
                  </div>
                )}

                <div className='flex items-center space-x-2'>
                  <Checkbox id='blur' disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} checked={imageAnalysis.preprocessBlur} onCheckedChange={(c) => setImageAnalysis((prev) => ({ ...prev, preprocessBlur: !!c }))} />
                  <Label htmlFor='blur' className='text-sm font-medium'>
                    Blur background (reduce noise)
                  </Label>
                </div>

                {imageAnalysis.preprocessBlur && (
                  <div className='pl-6 space-y-3 border-l-2 border-border/30 ml-2'>
                    <Label className='font-semibold'>Blur radius: {imageAnalysis.preprocessBlurRadius}</Label>
                    <div className='pt-2'>
                      <Slider disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} min={1} max={3} step={1} value={[imageAnalysis.preprocessBlurRadius]} onValueChange={([v]) => setImageAnalysis((prev) => ({ ...prev, preprocessBlurRadius: v }))} />
                    </div>
                  </div>
                )}

                <div className='flex items-center space-x-2'>
                  <Checkbox id='sharpen' disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} checked={imageAnalysis.preprocessSharpen} onCheckedChange={(c) => setImageAnalysis((prev) => ({ ...prev, preprocessSharpen: !!c }))} />
                  <Label htmlFor='sharpen' className='text-sm font-medium'>
                    Sharpen (edge enhance)
                  </Label>
                </div>

                <div className='space-y-2'>
                  <Label>Whitelist (optional)</Label>
                  <Input disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} placeholder='Напр: ABCDEFGHIJKLMNOPQRSTUVWXYZ' value={imageAnalysis.ocrWhitelist} onChange={(e) => setImageAnalysis((prev) => ({ ...prev, ocrWhitelist: e.target.value }))} />
                  <p className='text-[11px] text-muted-foreground'>Задай, якщо знаєш формат (наприклад тільки A–Z/0–9). Порожньо = без whitelist.</p>
                </div>

                <div className='space-y-2'>
                  <Label>Text area (crop)</Label>
                  <Select
                    disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                    value={imageAnalysis.roiPreset}
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='full'>Full image</SelectItem>
                      <SelectItem value='auto'>Auto (detect text area)</SelectItem>
                      <SelectItem value='top60'>Top 60% (full width)</SelectItem>
                      <SelectItem value='top60_left70'>Top 60% + Left 70% (remove right)</SelectItem>
                      <SelectItem value='custom'>Custom (manual)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className='text-[11px] text-muted-foreground'>Для банерів часто допомагає відрізати праву частину/низ.</p>
                </div>

                {imageAnalysis.roiPreset === "custom" && imageAnalysis.roiEnabled && (
                  <div className='space-y-2 pl-6 border-l-2 border-border/30 ml-2'>
                    <p className='text-[11px] text-muted-foreground'>ROI fractions (0..1): X/Y (start), W/H (size)</p>
                    <div className='grid grid-cols-4 gap-2'>
                      <Input type='number' step='0.05' min='0' max='1' placeholder='X' value={imageAnalysis.roiX} onChange={(e) => setImageAnalysis((prev) => ({ ...prev, roiX: Number(e.target.value) }))} />
                      <Input type='number' step='0.05' min='0' max='1' placeholder='Y' value={imageAnalysis.roiY} onChange={(e) => setImageAnalysis((prev) => ({ ...prev, roiY: Number(e.target.value) }))} />
                      <Input type='number' step='0.05' min='0.1' max='1' placeholder='W' value={imageAnalysis.roiW} onChange={(e) => setImageAnalysis((prev) => ({ ...prev, roiW: Number(e.target.value) }))} />
                      <Input type='number' step='0.05' min='0.1' max='1' placeholder='H' value={imageAnalysis.roiH} onChange={(e) => setImageAnalysis((prev) => ({ ...prev, roiH: Number(e.target.value) }))} />
                    </div>
                  </div>
                )}

                <div className='flex items-center space-x-2'>
                  <Checkbox id='spellCorrection' disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} checked={imageAnalysis.spellCorrectionBanner} onCheckedChange={(c) => setImageAnalysis((prev) => ({ ...prev, spellCorrectionBanner: !!c }))} />
                  <Label htmlFor='spellCorrection' className='text-sm font-medium'>
                    Spell correction (banner/CTA)
                  </Label>
                </div>
              </div>
            )}

            <div className='space-y-2'>
              <Label>Ліміт авто-аналізу (файлів)</Label>
              <Input
                type='number'
                min='0'
                max='50'
                disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off" || imageAnalysis.runMode !== "auto"}
                value={imageAnalysis.autoAnalyzeMaxFiles}
                onChange={(e) => {
                  const n = Number(e.target.value || 0);
                  setImageAnalysis((prev) => ({ ...prev, autoAnalyzeMaxFiles: Number.isFinite(n) ? Math.max(0, Math.min(50, n)) : 0 }));
                }}
              />
              <p className='text-[11px] text-muted-foreground'>0 = не запускати автоматично</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
