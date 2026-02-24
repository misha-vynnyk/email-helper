import React, { Dispatch, SetStateAction } from "react";
import { Typography, FormGroup, FormControlLabel, Switch, Stack, TextField } from "@mui/material";
import { spacingMUI } from "../../theme/tokens";
import type { UiSettings } from "../hooks/useHtmlConverterSettings";

type UiSettingsTabProps = {
  ui: UiSettings;
  setUi: Dispatch<SetStateAction<UiSettings>>;
};

export const UiSettingsTab: React.FC<UiSettingsTabProps> = ({ ui, setUi }) => {
  return (
    <>
      <Typography variant='subtitle2' fontWeight={600} mb={spacingMUI.sm}>
        Інтерфейс
      </Typography>
      <FormGroup>
        <FormControlLabel control={<Switch size='small' checked={ui.showLogsPanel} onChange={(e) => setUi((prev) => ({ ...prev, showLogsPanel: e.target.checked }))} />} label={<Typography variant='body2'>Показувати лог</Typography>} />
        <FormControlLabel control={<Switch size='small' checked={ui.showInputHtml} onChange={(e) => setUi((prev) => ({ ...prev, showInputHtml: e.target.checked }))} />} label={<Typography variant='body2'>Показувати вхідний HTML</Typography>} />
        <FormControlLabel control={<Switch size='small' checked={ui.showUploadHistory} onChange={(e) => setUi((prev) => ({ ...prev, showUploadHistory: e.target.checked }))} />} label={<Typography variant='body2'>Показувати історію завантажень</Typography>} />
        <FormControlLabel control={<Switch size='small' checked={ui.rememberUiLayout} onChange={(e) => setUi((prev) => ({ ...prev, rememberUiLayout: e.target.checked }))} />} label={<Typography variant='body2'>Запамʼятовувати вигляд (layout)</Typography>} />
        <FormControlLabel control={<Switch size='small' checked={ui.compactMode} onChange={(e) => setUi((prev) => ({ ...prev, compactMode: e.target.checked }))} />} label={<Typography variant='body2'>Компактний режим</Typography>} />
        <FormControlLabel control={<Switch size='small' checked={ui.stickyActions} onChange={(e) => setUi((prev) => ({ ...prev, stickyActions: e.target.checked }))} />} label={<Typography variant='body2'>Закріпити кнопки зверху</Typography>} />
        <FormControlLabel control={<Switch size='small' checked={ui.showApproveNeeded} onChange={(e) => setUi((prev) => ({ ...prev, showApproveNeeded: e.target.checked }))} />} label={<Typography variant='body2'>Показувати "Approve Needed"</Typography>} />
        <FormControlLabel control={<Switch size='small' checked={ui.autoCloseUploadDialog} onChange={(e) => setUi((prev) => ({ ...prev, autoCloseUploadDialog: e.target.checked }))} />} label={<Typography variant='body2'>Авто-закриття після завантаження</Typography>} />
      </FormGroup>

      <Stack direction='row' alignItems='center' spacing={2} mt={spacingMUI.base} mb={spacingMUI.base}>
        <Typography variant='body2' sx={{ minWidth: 200 }}>
          Попередження про μέγεθος файлу (KB):
        </Typography>
        <TextField
          size='small'
          type='number'
          value={ui.warningFileSizeKB}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val)) setUi((prev) => ({ ...prev, warningFileSizeKB: val }));
          }}
          inputProps={{ min: 0, step: 100 }}
          sx={{ width: 120 }}
        />
      </Stack>

      <Typography variant='caption' color='text.secondary' display='block' mt={spacingMUI.sm}>
        Якщо вимкнути «Запамʼятовувати вигляд» — ці налаштування не збережуться після перезавантаження.
      </Typography>
    </>
  );
};
