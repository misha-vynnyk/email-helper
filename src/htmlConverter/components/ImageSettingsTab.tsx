import React, { Dispatch, SetStateAction } from "react";
import { Box, Typography, Divider, FormGroup, FormControlLabel, Switch, Checkbox, Stack, FormControl, TextField, MenuItem, Alert, Slider, Tooltip } from "@mui/material";
import { spacingMUI, borderRadius } from "../../theme/tokens";
import { STORAGE_KEYS } from "../constants";
import type { ImageAnalysisSettings } from "../types";
import type { UiSettings } from "../hooks/useHtmlConverterSettings";
import { OCR_PRESETS } from "../ocrPresets";

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
  const handleAutoProcessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setAutoProcess(newValue);
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.IMAGE_SETTINGS);
      const settings = stored ? JSON.parse(stored) : {};
      settings.autoProcess = newValue;
      localStorage.setItem(STORAGE_KEYS.IMAGE_SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  };

  return (
    <>
      <Typography variant='subtitle2' fontWeight={600} mb={spacingMUI.sm}>
        Зображення
      </Typography>

      <FormGroup>
        <FormControlLabel control={<Checkbox checked={autoProcess} onChange={handleAutoProcessChange} size='small' />} label={<Typography variant='body2'>Автообробка зображень</Typography>} />
      </FormGroup>

      <Divider sx={{ my: spacingMUI.base }} />

      <Typography variant='subtitle2' fontWeight={600} mb={spacingMUI.sm}>
        Розпізнавання тексту на зображеннях (ALT/назви)
      </Typography>
      <Typography variant='caption' color='text.secondary' display='block' mb={spacingMUI.base}>
        Працює в діалозі «Upload to Storage». Якщо не хочеш думати — вибери режим нижче.
      </Typography>

      <Stack spacing={spacingMUI.base}>
        <FormControlLabel control={<Switch size='small' checked={imageAnalysis.enabled} onChange={(e) => setImageAnalysis((prev) => ({ ...prev, enabled: e.target.checked }))} />} label={<Typography variant='body2'>Увімкнути розпізнавання тексту</Typography>} />

        <FormControl fullWidth disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}>
          <TextField
            select
            size='small'
            label='Режим (простий вибір)'
            value={ui.ocrSimpleMode}
            onChange={(e) => {
              const v = e.target.value;
              setUi((prev) => ({ ...prev, ocrSimpleMode: v as UiSettings["ocrSimpleMode"] }));
              if (v !== "custom" && OCR_PRESETS[v]) {
                setImageAnalysis((prev) => ({ ...prev, ...OCR_PRESETS[v] }));
              }
            }}
            helperText='Швидко = легше для ноутбука. Банер = найкраще для картинок з великим текстом. Максимально = повільніше.'>
            <MenuItem value='custom'>Не вибрано</MenuItem>
            <MenuItem value='fast'>Швидко (економно)</MenuItem>
            <MenuItem value='balanced'>Звичайно (рекомендовано)</MenuItem>
            <MenuItem value='banner'>Банер з текстом (найкраще)</MenuItem>
            <MenuItem value='max'>Максимальна якість (повільно)</MenuItem>
          </TextField>
        </FormControl>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={spacingMUI.base}>
          <FormControl sx={{ flex: 1 }}>
            <TextField
              select
              size='small'
              label='Інструмент аналізу'
              value={imageAnalysis.engine}
              onChange={(e) =>
                setImageAnalysis((prev) => ({
                  ...prev,
                  engine: e.target.value as ImageAnalysisSettings["engine"],
                }))
              }
              disabled={!imageAnalysis.enabled}>
              <MenuItem value='off'>Вимкнено</MenuItem>
              <MenuItem value='ocr'>Tesseract.js (Browser)</MenuItem>
            </TextField>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={imageAnalysis.useAiBackend || false}
                onChange={(e) =>
                  setImageAnalysis((prev) => ({
                    ...prev,
                    useAiBackend: e.target.checked,
                  }))
                }
                color='secondary'
              />
            }
            label={
              <Box>
                <Stack direction='row' alignItems='center' spacing={0.5}>
                  <Typography variant='body2' fontWeight={600}>
                    AI Backend 🐍
                  </Typography>
                  {imageAnalysis.useAiBackend && (
                    <Tooltip title={aiBackendStatus === "online" ? "Сервер працює" : aiBackendStatus === "checking" ? "Перевірка..." : "Сервер не доступний"}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: aiBackendStatus === "online" ? "#4caf50" : aiBackendStatus === "checking" ? "#ff9800" : "#f44336",
                          animation: aiBackendStatus === "checking" ? "pulse 1s infinite" : "none",
                          "@keyframes pulse": {
                            "0%, 100%": { opacity: 1 },
                            "50%": { opacity: 0.4 },
                          },
                        }}
                      />
                    </Tooltip>
                  )}
                </Stack>
                <Typography variant='caption' color='text.secondary'>
                  PaddleOCR + BLIP + CLIP
                </Typography>
              </Box>
            }
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={spacingMUI.base}>
          <FormControl sx={{ flex: 1 }}>
            <TextField
              select
              size='small'
              label='Запуск'
              value={imageAnalysis.runMode}
              onChange={(e) =>
                setImageAnalysis((prev) => ({
                  ...prev,
                  runMode: e.target.value as ImageAnalysisSettings["runMode"],
                }))
              }
              disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}>
              <MenuItem value='manual'>Тільки вручну</MenuItem>
              <MenuItem value='auto'>Автоматично (обережно)</MenuItem>
            </TextField>
          </FormControl>
        </Stack>

        <Alert severity='info' sx={{ borderRadius: `${borderRadius.md}px` }}>
          Підстановка ALT та назв файлів виконується лише вручну.
        </Alert>

        <FormControlLabel control={<Switch size='small' checked={ui.showAdvancedOcrSettings} onChange={(e) => setUi((prev) => ({ ...prev, showAdvancedOcrSettings: e.target.checked }))} disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} />} label={<Typography variant='body2'>Показати розширені налаштування</Typography>} />

        {!ui.showAdvancedOcrSettings && (
          <Alert severity='info' sx={{ borderRadius: `${borderRadius.md}px` }}>
            Якщо щось розпізнається погано — вибери «Банер з текстом». Якщо ноут слабкий — «Швидко».
          </Alert>
        )}

        {ui.showAdvancedOcrSettings && (
          <>
            <Box>
              <Typography variant='body2' fontWeight={600} mb={0.5}>
                OCR min width: {imageAnalysis.ocrMinWidth}px
              </Typography>
              <Typography variant='caption' color='text.secondary' display='block' mb={1}>
                Якщо картинка маленька — збільшимо перед OCR (часто сильно покращує точність).
              </Typography>
              <Slider size='small' value={imageAnalysis.ocrMinWidth} onChange={(_, v) => setImageAnalysis((prev) => ({ ...prev, ocrMinWidth: v as number }))} min={0} max={1600} step={50} disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} />
            </Box>

            <Box>
              <Typography variant='body2' fontWeight={600} mb={0.5}>
                OCR max width: {imageAnalysis.ocrMaxWidth}px
              </Typography>
              <Slider size='small' value={imageAnalysis.ocrMaxWidth} onChange={(_, v) => setImageAnalysis((prev) => ({ ...prev, ocrMaxWidth: v as number }))} min={600} max={2000} step={50} disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} />
            </Box>

            <Divider />

            <FormControlLabel control={<Switch size='small' checked={imageAnalysis.smartPrecheck} onChange={(e) => setImageAnalysis((prev) => ({ ...prev, smartPrecheck: e.target.checked }))} disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} />} label={<Typography variant='body2'>Smart precheck (пропускати OCR якщо текст малоймовірний)</Typography>} />

            {imageAnalysis.smartPrecheck && (
              <>
                <Box>
                  <Typography variant='body2' fontWeight={600} mb={0.5}>
                    Text likelihood threshold: {imageAnalysis.textLikelihoodThreshold.toFixed(3)}
                  </Typography>
                  <Typography variant='caption' color='text.secondary' display='block' mb={1}>
                    Нижче = OCR запускається частіше. Вище = економить CPU, але може пропускати текст.
                  </Typography>
                  <Slider
                    size='small'
                    value={imageAnalysis.textLikelihoodThreshold}
                    onChange={(_, v) =>
                      setImageAnalysis((prev) => ({
                        ...prev,
                        textLikelihoodThreshold: v as number,
                      }))
                    }
                    min={0.02}
                    max={0.18}
                    step={0.005}
                    disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                  />
                </Box>

                <Box>
                  <Typography variant='body2' fontWeight={600} mb={0.5}>
                    Precheck edge threshold: {imageAnalysis.precheckEdgeThreshold}
                  </Typography>
                  <Typography variant='caption' color='text.secondary' display='block' mb={1}>
                    Чутливість до дрібних контрастних контурів (текст).
                  </Typography>
                  <Slider
                    size='small'
                    value={imageAnalysis.precheckEdgeThreshold}
                    onChange={(_, v) =>
                      setImageAnalysis((prev) => ({
                        ...prev,
                        precheckEdgeThreshold: v as number,
                      }))
                    }
                    min={30}
                    max={140}
                    step={5}
                    disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                  />
                </Box>
              </>
            )}

            <Divider />

            <FormControlLabel control={<Switch size='small' checked={imageAnalysis.preprocess} onChange={(e) => setImageAnalysis((prev) => ({ ...prev, preprocess: e.target.checked }))} disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} />} label={<Typography variant='body2'>Preprocess перед OCR (grayscale/contrast/threshold)</Typography>} />

            {imageAnalysis.preprocess && (
              <>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={spacingMUI.base}>
                  <FormControl sx={{ flex: 1 }}>
                    <TextField
                      select
                      size='small'
                      label='PSM (page segmentation)'
                      value={imageAnalysis.ocrPsm}
                      onChange={(e) =>
                        setImageAnalysis((prev) => ({
                          ...prev,
                          ocrPsm: e.target.value as ImageAnalysisSettings["ocrPsm"],
                        }))
                      }
                      disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}>
                      <MenuItem value='11'>11 — Sparse text (банери/UI)</MenuItem>
                      <MenuItem value='6'>6 — Single block</MenuItem>
                      <MenuItem value='7'>7 — Single line</MenuItem>
                      <MenuItem value='8'>8 — Single word</MenuItem>
                      <MenuItem value='4'>4 — Single column</MenuItem>
                      <MenuItem value='3'>3 — Auto</MenuItem>
                    </TextField>
                  </FormControl>

                  <FormControl sx={{ flex: 1 }}>
                    <TextField
                      select
                      size='small'
                      label='Scale factor'
                      value={imageAnalysis.ocrScaleFactor}
                      onChange={(e) =>
                        setImageAnalysis((prev) => ({
                          ...prev,
                          ocrScaleFactor: Number(e.target.value),
                        }))
                      }
                      disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                      helperText='2× часто дає +точність, але важче для CPU'>
                      <MenuItem value={1}>1×</MenuItem>
                      <MenuItem value={2}>2×</MenuItem>
                      <MenuItem value={3}>3×</MenuItem>
                    </TextField>
                  </FormControl>
                </Stack>

                <Box>
                  <Typography variant='body2' fontWeight={600} mb={0.5}>
                    Contrast: {imageAnalysis.preprocessContrast.toFixed(1)}×
                  </Typography>
                  <Slider
                    size='small'
                    value={imageAnalysis.preprocessContrast}
                    onChange={(_, v) =>
                      setImageAnalysis((prev) => ({
                        ...prev,
                        preprocessContrast: v as number,
                      }))
                    }
                    min={1}
                    max={3}
                    step={0.1}
                    disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                  />
                </Box>

                <Box>
                  <Typography variant='body2' fontWeight={600} mb={0.5}>
                    Brightness: {imageAnalysis.preprocessBrightness.toFixed(2)}×
                  </Typography>
                  <Slider
                    size='small'
                    value={imageAnalysis.preprocessBrightness}
                    onChange={(_, v) =>
                      setImageAnalysis((prev) => ({
                        ...prev,
                        preprocessBrightness: v as number,
                      }))
                    }
                    min={0.8}
                    max={1.4}
                    step={0.02}
                    disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                  />
                </Box>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={imageAnalysis.preprocessUseThreshold}
                      onChange={(e) =>
                        setImageAnalysis((prev) => ({
                          ...prev,
                          preprocessUseThreshold: e.target.checked,
                        }))
                      }
                      size='small'
                      disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                    />
                  }
                  label={<Typography variant='body2'>Threshold (binarize)</Typography>}
                />

                {imageAnalysis.preprocessUseThreshold && (
                  <Box>
                    <Typography variant='body2' fontWeight={600} mb={0.5}>
                      Threshold: {imageAnalysis.preprocessThreshold}
                    </Typography>
                    <Slider
                      size='small'
                      value={imageAnalysis.preprocessThreshold}
                      onChange={(_, v) =>
                        setImageAnalysis((prev) => ({
                          ...prev,
                          preprocessThreshold: v as number,
                        }))
                      }
                      min={0}
                      max={255}
                      step={5}
                      disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                    />
                  </Box>
                )}

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={imageAnalysis.preprocessBlur}
                      onChange={(e) =>
                        setImageAnalysis((prev) => ({
                          ...prev,
                          preprocessBlur: e.target.checked,
                        }))
                      }
                      size='small'
                      disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                    />
                  }
                  label={<Typography variant='body2'>Blur background (reduce noise)</Typography>}
                />

                {imageAnalysis.preprocessBlur && (
                  <Box>
                    <Typography variant='body2' fontWeight={600} mb={0.5}>
                      Blur radius: {imageAnalysis.preprocessBlurRadius}
                    </Typography>
                    <Slider
                      size='small'
                      value={imageAnalysis.preprocessBlurRadius}
                      onChange={(_, v) =>
                        setImageAnalysis((prev) => ({
                          ...prev,
                          preprocessBlurRadius: v as number,
                        }))
                      }
                      min={1}
                      max={3}
                      step={1}
                      disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                    />
                  </Box>
                )}

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={imageAnalysis.preprocessSharpen}
                      onChange={(e) =>
                        setImageAnalysis((prev) => ({
                          ...prev,
                          preprocessSharpen: e.target.checked,
                        }))
                      }
                      size='small'
                      disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                    />
                  }
                  label={<Typography variant='body2'>Sharpen (edge enhance)</Typography>}
                />

                <TextField size='small' label='Whitelist (optional)' value={imageAnalysis.ocrWhitelist} onChange={(e) => setImageAnalysis((prev) => ({ ...prev, ocrWhitelist: e.target.value }))} disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"} placeholder='Напр: ABCDEFGHIJKLMNOPQRSTUVWXYZ' helperText='Задай, якщо знаєш формат (наприклад тільки A–Z/0–9). Порожньо = без whitelist.' />

                <FormControl sx={{ minWidth: 240 }}>
                  <TextField
                    select
                    size='small'
                    label='Text area (crop)'
                    value={imageAnalysis.roiPreset}
                    onChange={(e) => {
                      const p = e.target.value as ImageAnalysisSettings["roiPreset"];
                      setImageAnalysis((prev) => {
                        if (p === "full") {
                          return { ...prev, roiEnabled: false, roiPreset: p, roiX: 0, roiY: 0, roiW: 1, roiH: 1 };
                        }
                        if (p === "auto") {
                          return { ...prev, roiEnabled: true, roiPreset: p, roiX: 0, roiY: 0, roiW: 1, roiH: 1 };
                        }
                        if (p === "top60") {
                          return { ...prev, roiEnabled: true, roiPreset: p, roiX: 0, roiY: 0, roiW: 1, roiH: 0.6 };
                        }
                        if (p === "top60_left70") {
                          return { ...prev, roiEnabled: true, roiPreset: p, roiX: 0, roiY: 0, roiW: 0.7, roiH: 0.6 };
                        }
                        return { ...prev, roiEnabled: true, roiPreset: p };
                      });
                    }}
                    disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                    helperText='Для банерів часто допомагає відрізати праву частину/низ.'>
                    <MenuItem value='full'>Full image</MenuItem>
                    <MenuItem value='auto'>Auto (detect text area)</MenuItem>
                    <MenuItem value='top60'>Top 60% (full width)</MenuItem>
                    <MenuItem value='top60_left70'>Top 60% + Left 70% (remove right)</MenuItem>
                    <MenuItem value='custom'>Custom (manual)</MenuItem>
                  </TextField>
                </FormControl>

                {imageAnalysis.roiPreset === "custom" && imageAnalysis.roiEnabled && (
                  <Stack spacing={spacingMUI.sm}>
                    <Typography variant='caption' color='text.secondary'>
                      ROI fractions (0..1): X/Y (start), W/H (size)
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={spacingMUI.base}>
                      <TextField size='small' type='number' label='X' value={imageAnalysis.roiX} onChange={(e) => setImageAnalysis((prev) => ({ ...prev, roiX: Number(e.target.value) }))} inputProps={{ min: 0, max: 1, step: 0.05 }} />
                      <TextField size='small' type='number' label='Y' value={imageAnalysis.roiY} onChange={(e) => setImageAnalysis((prev) => ({ ...prev, roiY: Number(e.target.value) }))} inputProps={{ min: 0, max: 1, step: 0.05 }} />
                      <TextField size='small' type='number' label='W' value={imageAnalysis.roiW} onChange={(e) => setImageAnalysis((prev) => ({ ...prev, roiW: Number(e.target.value) }))} inputProps={{ min: 0.1, max: 1, step: 0.05 }} />
                      <TextField size='small' type='number' label='H' value={imageAnalysis.roiH} onChange={(e) => setImageAnalysis((prev) => ({ ...prev, roiH: Number(e.target.value) }))} inputProps={{ min: 0.1, max: 1, step: 0.05 }} />
                    </Stack>
                  </Stack>
                )}

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={imageAnalysis.spellCorrectionBanner}
                      onChange={(e) =>
                        setImageAnalysis((prev) => ({
                          ...prev,
                          spellCorrectionBanner: e.target.checked,
                        }))
                      }
                      size='small'
                      disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off"}
                    />
                  }
                  label={<Typography variant='body2'>Spell correction (banner/CTA)</Typography>}
                />
              </>
            )}

            <TextField
              size='small'
              type='number'
              label='Ліміт авто-аналізу (файлів)'
              value={imageAnalysis.autoAnalyzeMaxFiles}
              onChange={(e) => {
                const n = Number(e.target.value || 0);
                setImageAnalysis((prev) => ({
                  ...prev,
                  autoAnalyzeMaxFiles: Number.isFinite(n) ? Math.max(0, Math.min(50, n)) : 0,
                }));
              }}
              disabled={!imageAnalysis.enabled || imageAnalysis.engine === "off" || imageAnalysis.runMode !== "auto"}
              inputProps={{ min: 0, max: 50 }}
              helperText='0 = не запускати автоматично'
            />
          </>
        )}
      </Stack>
    </>
  );
};
